const URL_RESERVAS = 'http://127.0.0.1:3020/reservas';
const URL_MESAS    = 'http://127.0.0.1:3020/mesas';

// ============================================
// CARGAR MÓDULO RESERVAS
// ============================================
async function cargarReservas(contenedor) {
    contenedor.innerHTML = `
        <div class="modulo-header">
            <h2>Reservas</h2>
            <button onclick="mostrarFormCrearReserva()">+ Nueva Reserva</button>
        </div>

        <div class="filtros">
            <input type="text" id="filtro-cliente" placeholder="Buscar por cliente..." oninput="filtrarReservas()">
            <select id="filtro-estado" onchange="filtrarReservas()">
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="cancelada">Cancelada</option>
            </select>
            <input type="date" id="filtro-fecha" onchange="filtrarReservas()">
        </div>

        <div id="tabla-reservas"></div>
    `;

    await renderReservas();
}

// ============================================
// OBTENER Y RENDERIZAR RESERVAS
// ============================================
async function renderReservas() {
    const res  = await fetchAuth(URL_RESERVAS);
    const data = await res.json();

    window._reservas = data;
    filtrarReservas();
}

function filtrarReservas() {
    const cliente = document.getElementById('filtro-cliente').value.toLowerCase();
    const estado  = document.getElementById('filtro-estado').value.toLowerCase();
    const fecha   = document.getElementById('filtro-fecha').value;

    const filtrados = window._reservas.filter(r => {
        const coincideCliente = r.cliente_nombre.toLowerCase().includes(cliente);
        const coincideEstado  = estado === '' || r.estado.toLowerCase() === estado;
        const coincideFecha   = fecha === '' || r.fecha === fecha;
        return coincideCliente && coincideEstado && coincideFecha;
    });

    const contenedor = document.getElementById('tabla-reservas');

    if (filtrados.length === 0) {
        contenedor.innerHTML = '<p>No se encontraron reservas.</p>';
        return;
    }

    const tabla = crearTabla(
        ['ID', 'Mesa', 'Cliente', 'Teléfono', 'Fecha', 'Hora', 'Personas', 'Estado', 'Acciones'],
        filtrados.map(r => [
            r.id,
            r.mesa_id,
            r.cliente_nombre,
            r.cliente_telefono || '-',
            r.fecha,
            r.hora,
            r.personas,
            r.estado,
            `<button onclick="mostrarFormEditarReserva(${r.id})">Editar</button>
             <button onclick="cancelarReserva(${r.id})">Cancelar</button>`
        ])
    );

    contenedor.innerHTML = '';
    contenedor.appendChild(tabla);
}

// ============================================
// CREAR RESERVA
// ============================================
async function mostrarFormCrearReserva() {
    const resMesas = await fetchAuth(URL_MESAS);
    const mesas    = await resMesas.json();

    const opcionesMesas = mesas
        .filter(m => m.estado === 'disponible')
        .map(m => `<option value="${m.id}">Mesa ${m.numero} (${m.capacidad} personas)</option>`)
        .join('');

    abrirModal('Nueva Reserva', `
        <select id="r-mesa">
            <option value="">Seleccione una mesa *</option>
            ${opcionesMesas}
        </select>
        <input type="text"   id="r-cliente-nombre"   placeholder="Nombre del cliente *">
        <input type="text"   id="r-cliente-telefono" placeholder="Teléfono">
        <input type="date"   id="r-fecha">
        <input type="time"   id="r-hora">
        <input type="number" id="r-personas" placeholder="Número de personas *" min="1">
        <button onclick="crearReserva()">Guardar</button>
    `);
}

async function crearReserva() {
    const mesa_id          = document.getElementById('r-mesa').value;
    const cliente_nombre   = document.getElementById('r-cliente-nombre').value;
    const cliente_telefono = document.getElementById('r-cliente-telefono').value;
    const fecha            = document.getElementById('r-fecha').value;
    const hora             = document.getElementById('r-hora').value;
    const personas         = document.getElementById('r-personas').value;

    if (!mesa_id || !cliente_nombre || !fecha || !hora || !personas) {
        alert('Mesa, cliente, fecha, hora y personas son requeridos.');
        return;
    }

    const res = await fetchAuth(URL_RESERVAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesa_id, cliente_nombre, cliente_telefono, fecha, hora, personas })
    });

    const data = await res.json();

    if (res.ok) {
        document.getElementById('modal').style.display = 'none';
        await renderReservas();
    } else {
        alert(data.message);
    }
}

// ============================================
// EDITAR RESERVA
// ============================================
function mostrarFormEditarReserva(id) {
    const r = window._reservas.find(r => r.id === id);

    abrirModal('Editar Reserva', `
        <input type="text"   id="r-cliente-nombre"   placeholder="Nombre del cliente *" value="${r.cliente_nombre}">
        <input type="text"   id="r-cliente-telefono" placeholder="Teléfono"             value="${r.cliente_telefono || ''}">
        <input type="date"   id="r-fecha"            value="${r.fecha}">
        <input type="time"   id="r-hora"             value="${r.hora}">
        <input type="number" id="r-personas"         placeholder="Personas *"           value="${r.personas}" min="1">
        <select id="r-estado">
            <option value="pendiente"  ${r.estado === 'pendiente'  ? 'selected' : ''}>Pendiente</option>
            <option value="confirmada" ${r.estado === 'confirmada' ? 'selected' : ''}>Confirmada</option>
            <option value="cancelada"  ${r.estado === 'cancelada'  ? 'selected' : ''}>Cancelada</option>
        </select>
        <button onclick="editarReserva(${r.id})">Guardar</button>
    `);
}

async function editarReserva(id) {
    const cliente_nombre   = document.getElementById('r-cliente-nombre').value;
    const cliente_telefono = document.getElementById('r-cliente-telefono').value;
    const fecha            = document.getElementById('r-fecha').value;
    const hora             = document.getElementById('r-hora').value;
    const personas         = document.getElementById('r-personas').value;
    const estado           = document.getElementById('r-estado').value;

    const res = await fetchAuth(`${URL_RESERVAS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_nombre, cliente_telefono, fecha, hora, personas, estado })
    });

    const data = await res.json();

    if (res.ok) {
        document.getElementById('modal').style.display = 'none';
        await renderReservas();
    } else {
        alert(data.message);
    }
}

// ============================================
// CANCELAR RESERVA
// ============================================
async function cancelarReserva(id) {
    if (!confirm('¿Está seguro de cancelar esta reserva?')) return;

    const res  = await fetchAuth(`${URL_RESERVAS}/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.ok) {
        await renderReservas();
    } else {
        alert(data.message);
    }
}