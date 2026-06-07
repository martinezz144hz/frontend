// ============================================
// MÓDULO DE RESERVAS
// Puerto ms-reservas: 3020
// ============================================

const URL_RESERVAS = `${API.reservas}/reservas`;
const URL_MESAS_RES = `${API.reservas}/mesas`;

// ============================================
// RENDER PRINCIPAL DEL MÓDULO
// ============================================

function renderReservas(contenedor) {
  contenedor.innerHTML = `
    <div class="modulo-header">
      <h2 class="modulo-titulo">📅 Gestión de Reservas</h2>
      <button class="btn btn-primary" id="btn-nueva-reserva">+ Nueva Reserva</button>
    </div>

    <!-- Filtros -->
    <div class="filtros-bar">
      <input type="date" id="filtro-fecha" class="input-sm" placeholder="Filtrar por fecha" />
      <input type="text" id="filtro-cliente" class="input-sm" placeholder="Buscar cliente..." />
      <select id="filtro-estado" class="input-sm">
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="confirmada">Confirmada</option>
        <option value="cancelada">Cancelada</option>
        <option value="finalizada">Finalizada</option>
      </select>
      <button class="btn btn-outline btn-sm" id="btn-filtrar">Buscar</button>
      <button class="btn btn-ghost btn-sm" id="btn-limpiar-filtros">Limpiar</button>
    </div>

    <div id="msg-reservas"></div>

    <!-- Tabla de reservas -->
    <div id="lista-reservas">
      <p class="placeholder-text">Cargando reservas...</p>
    </div>

    <!-- Modal editar reserva -->
    <div id="modal-editar-reserva" class="modal-overlay hidden">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Editar Reserva</h3>
          <button class="modal-close" id="btn-cerrar-modal-reserva">&times;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="edit-reserva-id" />
          <div class="form-group">
            <label>Fecha</label>
            <input type="date" id="edit-reserva-fecha" />
          </div>
          <div class="form-group">
            <label>Hora</label>
            <input type="time" id="edit-reserva-hora" />
          </div>
          <div class="form-group">
            <label>Mesa</label>
            <select id="edit-reserva-mesa"></select>
          </div>
          <div class="form-group">
            <label>Cantidad de personas</label>
            <input type="number" id="edit-reserva-personas" min="1" />
          </div>
          <div class="form-group">
            <label>Observaciones</label>
            <textarea id="edit-reserva-obs" rows="3"></textarea>
          </div>
          <div id="msg-reserva-edit"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="btn-cancelar-modal-reserva">Cancelar</button>
          <button class="btn btn-primary" id="btn-guardar-reserva">Guardar</button>
        </div>
      </div>
    </div>
  `;

  // Eventos
  document.getElementById('btn-nueva-reserva').addEventListener('click', abrirModalNuevaReserva);
  document.getElementById('btn-filtrar').addEventListener('click', aplicarFiltros);
  document.getElementById('btn-limpiar-filtros').addEventListener('click', limpiarFiltros);
  document.getElementById('btn-cerrar-modal-reserva').addEventListener('click', cerrarModalReserva);
  document.getElementById('btn-cancelar-modal-reserva').addEventListener('click', cerrarModalReserva);
  document.getElementById('btn-guardar-reserva').addEventListener('click', guardarEditarReserva);

  cargarReservas();
}

// ============================================
// CARGAR RESERVAS
// ============================================

async function cargarReservas(params = {}) {
  const contenedor = document.getElementById('lista-reservas');
  if (!contenedor) return;
  contenedor.innerHTML = '<p class="placeholder-text">Cargando...</p>';

  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${URL_RESERVAS}?${query}` : URL_RESERVAS;

    const res = await fetchAuth(url);
    const data = await res.json();

    if (!res.ok) {
      mostrarMsgReservas(data.message || 'Error al cargar reservas.', 'error');
      contenedor.innerHTML = '';
      return;
    }

    const reservas = Array.isArray(data) ? data : (data.data ?? []);
    renderizarReservas(reservas);
  } catch (e) {
    mostrarMsgReservas('No se pudo conectar con el servidor de reservas.', 'error');
    contenedor.innerHTML = '';
  }
}

function renderizarReservas(reservas) {
  const contenedor = document.getElementById('lista-reservas');
  if (!contenedor) return;

  if (!reservas.length) {
    contenedor.innerHTML = '<p class="placeholder-text">No hay reservas registradas.</p>';
    return;
  }

  const tabla = `
    <div class="tabla-wrapper">
      <table class="tabla">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Personas</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Mesa</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${reservas.map(r => `
            <tr>
              <td>${r.id}</td>
              <td>${r.cliente_nombre ?? r.nombre_cliente ?? '—'}</td>
              <td>${r.telefono ?? '—'}</td>
              <td>${r.cantidad_personas ?? r.personas ?? '—'}</td>
              <td>${formatearFecha(r.fecha)}</td>
              <td>${r.hora ?? '—'}</td>
              <td>${r.mesa_id ?? r.numero_mesa ?? '—'}</td>
              <td><span class="badge badge-${r.estado}">${formatearEstadoReserva(r.estado)}</span></td>
              <td class="acciones-td">
                <button class="btn btn-sm btn-outline" onclick="abrirEditarReserva(${r.id})">Editar</button>
                ${r.estado !== 'cancelada' && r.estado !== 'finalizada'
                  ? `<button class="btn btn-sm btn-danger" onclick="cancelarReserva(${r.id})">Cancelar</button>`
                  : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  contenedor.innerHTML = tabla;
}

// ============================================
// FILTROS
// ============================================

function aplicarFiltros() {
  const fecha   = document.getElementById('filtro-fecha').value;
  const cliente = document.getElementById('filtro-cliente').value.trim();
  const estado  = document.getElementById('filtro-estado').value;

  const params = {};
  if (fecha)   params.fecha   = fecha;
  if (cliente) params.cliente = cliente;
  if (estado)  params.estado  = estado;

  cargarReservas(params);
}

function limpiarFiltros() {
  document.getElementById('filtro-fecha').value    = '';
  document.getElementById('filtro-cliente').value  = '';
  document.getElementById('filtro-estado').value   = '';
  cargarReservas();
}

// ============================================
// CREAR RESERVA
// ============================================

async function abrirModalNuevaReserva() {
  // Cargar mesas disponibles primero
  let opcionesMesas = '<option value="">Cargando mesas...</option>';
  try {
    const res = await fetchAuth(URL_MESAS_RES);
    const data = await res.json();
    const mesas = Array.isArray(data) ? data : (data.data ?? []);
    const disponibles = mesas.filter(m => m.estado === 'disponible');
    opcionesMesas = disponibles.length
      ? disponibles.map(m => `<option value="${m.id}">Mesa #${m.numero} (cap. ${m.capacidad})</option>`).join('')
      : '<option value="">No hay mesas disponibles</option>';
  } catch (e) {
    opcionesMesas = '<option value="">Error al cargar mesas</option>';
  }

  const hoy = new Date().toISOString().split('T')[0];

  abrirModal('Nueva Reserva', `
    <div class="form-group">
      <label>Nombre del cliente</label>
      <input type="text" id="nueva-res-nombre" placeholder="Nombre completo" />
    </div>
    <div class="form-group">
      <label>Teléfono</label>
      <input type="text" id="nueva-res-telefono" placeholder="Ej: 3001234567" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Fecha</label>
        <input type="date" id="nueva-res-fecha" min="${hoy}" />
      </div>
      <div class="form-group">
        <label>Hora</label>
        <input type="time" id="nueva-res-hora" />
      </div>
    </div>
    <div class="form-group">
      <label>Mesa</label>
      <select id="nueva-res-mesa">${opcionesMesas}</select>
    </div>
    <div class="form-group">
      <label>Cantidad de personas</label>
      <input type="number" id="nueva-res-personas" min="1" placeholder="Ej: 4" />
    </div>
    <div class="form-group">
      <label>Observaciones</label>
      <textarea id="nueva-res-obs" rows="2" placeholder="Notas adicionales..."></textarea>
    </div>
    <div id="msg-nueva-reserva"></div>
  `, crearReserva);
}

async function crearReserva() {
  const nombre   = document.getElementById('nueva-res-nombre').value.trim();
  const telefono = document.getElementById('nueva-res-telefono').value.trim();
  const fecha    = document.getElementById('nueva-res-fecha').value;
  const hora     = document.getElementById('nueva-res-hora').value;
  const mesa_id  = document.getElementById('nueva-res-mesa').value;
  const personas = parseInt(document.getElementById('nueva-res-personas').value);
  const obs      = document.getElementById('nueva-res-obs').value.trim();

  if (!nombre || !fecha || !hora || !mesa_id || !personas) {
    mostrarMsgModal('msg-nueva-reserva', 'Nombre, fecha, hora, mesa y personas son requeridos.', 'error');
    return;
  }

  // Validar fecha no pasada
  const hoy = new Date().toISOString().split('T')[0];
  if (fecha < hoy) {
    mostrarMsgModal('msg-nueva-reserva', 'No se pueden registrar reservas en fechas pasadas.', 'error');
    return;
  }

  try {
    const res = await fetchAuth(URL_RESERVAS, {
      method: 'POST',
      body: JSON.stringify({
        cliente_nombre: nombre,
        telefono,
        fecha,
        hora,
        mesa_id: parseInt(mesa_id),
        cantidad_personas: personas,
        observaciones: obs,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      cerrarModal();
      mostrarMsgReservas(data.message || 'Reserva creada correctamente.', 'success');
      cargarReservas();
    } else {
      mostrarMsgModal('msg-nueva-reserva', data.message || 'Error al crear reserva.', 'error');
    }
  } catch (e) {
    mostrarMsgModal('msg-nueva-reserva', 'Error de conexión.', 'error');
  }
}

// ============================================
// EDITAR RESERVA
// ============================================

async function abrirEditarReserva(id) {
  try {
    const [resReserva, resMesas] = await Promise.all([
      fetchAuth(`${URL_RESERVAS}/${id}`),
      fetchAuth(URL_MESAS_RES),
    ]);

    const reservaData = await resReserva.json();
    const mesasData   = await resMesas.json();

    const r     = reservaData.data ?? reservaData;
    const mesas = Array.isArray(mesasData) ? mesasData : (mesasData.data ?? []);

    // Poblar select de mesas
    const selectMesa = document.getElementById('edit-reserva-mesa');
    selectMesa.innerHTML = mesas
      .filter(m => m.estado === 'disponible' || m.id == r.mesa_id)
      .map(m => `<option value="${m.id}" ${m.id == r.mesa_id ? 'selected' : ''}>Mesa #${m.numero} (cap. ${m.capacidad})</option>`)
      .join('');

    document.getElementById('edit-reserva-id').value       = r.id;
    document.getElementById('edit-reserva-fecha').value    = r.fecha?.split('T')[0] ?? r.fecha;
    document.getElementById('edit-reserva-hora').value     = r.hora?.substring(0, 5) ?? r.hora;
    document.getElementById('edit-reserva-personas').value = r.cantidad_personas ?? r.personas;
    document.getElementById('edit-reserva-obs').value      = r.observaciones ?? '';

    document.getElementById('modal-editar-reserva').classList.remove('hidden');
  } catch (e) {
    mostrarMsgReservas('Error al cargar datos de la reserva.', 'error');
  }
}

async function guardarEditarReserva() {
  const id      = document.getElementById('edit-reserva-id').value;
  const fecha   = document.getElementById('edit-reserva-fecha').value;
  const hora    = document.getElementById('edit-reserva-hora').value;
  const mesa_id = document.getElementById('edit-reserva-mesa').value;
  const personas = parseInt(document.getElementById('edit-reserva-personas').value);
  const obs     = document.getElementById('edit-reserva-obs').value.trim();

  if (!fecha || !hora || !mesa_id || !personas) {
    mostrarMsgModalReserva('Todos los campos son requeridos.', 'error');
    return;
  }

  try {
    const res = await fetchAuth(`${URL_RESERVAS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        fecha,
        hora,
        mesa_id: parseInt(mesa_id),
        cantidad_personas: personas,
        observaciones: obs,
      }),
    });
    const data = await res.json();

    if (res.ok) {
      cerrarModalReserva();
      mostrarMsgReservas(data.message || 'Reserva actualizada.', 'success');
      cargarReservas();
    } else {
      mostrarMsgModalReserva(data.message || 'Error al actualizar.', 'error');
    }
  } catch (e) {
    mostrarMsgModalReserva('Error de conexión.', 'error');
  }
}

// ============================================
// CANCELAR RESERVA
// ============================================

async function cancelarReserva(id) {
  if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;

  try {
    const res = await fetchAuth(`${URL_RESERVAS}/${id}/cancelar`, {
      method: 'PUT',
    });
    const data = await res.json();

    mostrarMsgReservas(
      data.message || (res.ok ? 'Reserva cancelada.' : 'Error al cancelar.'),
      res.ok ? 'success' : 'error'
    );
    if (res.ok) cargarReservas();
  } catch (e) {
    mostrarMsgReservas('Error de conexión.', 'error');
  }
}

// ============================================
// HELPERS
// ============================================

function cerrarModalReserva() {
  const modal = document.getElementById('modal-editar-reserva');
  if (modal) modal.classList.add('hidden');
}

function mostrarMsgReservas(texto, tipo = 'error') {
  const el = document.getElementById('msg-reservas');
  if (!el) return;
  el.textContent = texto;
  el.className = `alert alert-${tipo}`;
  el.classList.remove('hidden');
  setTimeout(() => { el.textContent = ''; el.className = 'hidden'; }, 4000);
}

function mostrarMsgModalReserva(texto, tipo = 'error') {
  mostrarMsgModal('msg-reserva-edit', texto, tipo);
}

function formatearFecha(fecha) {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (isNaN(d)) return fecha;
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatearEstadoReserva(estado) {
  const map = {
    pendiente:  'Pendiente',
    confirmada: 'Confirmada',
    cancelada:  'Cancelada',
    finalizada: 'Finalizada',
  };
  return map[estado] ?? estado;
}