const URL_PEDIDOS = 'http://127.0.0.1:3040/pedidos';
const URL_PRODUCTOS_PEDIDO = 'http://127.0.0.1:3030/productos';

async function cargarPedidos(contenedor) {
    contenedor.innerHTML = `
        <div class="modulo-header">
            <h2>Pedidos</h2>
            <button class="btn btn-primary" onclick="mostrarFormCrearPedido()">+ Nuevo Pedido</button>
        </div>

        <div class="filtros">
            <select id="filtro-estado-pedido" onchange="filtrarPedidos()">
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en preparacion">En preparación</option>
                <option value="listo">Listo</option>
                <option value="entregado">Entregado</option>
                <option value="cancelado">Cancelado</option>
            </select>
            <input type="text" id="filtro-mesa-pedido" placeholder="Buscar por mesa..." oninput="filtrarPedidos()">
        </div>

        <div id="tabla-pedidos"></div>
    `;

    await renderPedidos();
}

async function renderPedidos() {
    const res  = await fetchAuth(URL_PEDIDOS);
    const data = await res.json();

    window._pedidos = data;
    filtrarPedidos();
}

function filtrarPedidos() {
    const estado = document.getElementById('filtro-estado-pedido').value.toLowerCase();
    const mesa   = document.getElementById('filtro-mesa-pedido').value.toLowerCase();

    const filtrados = window._pedidos.filter(p => {
        const coincideEstado = estado === '' || p.estado.toLowerCase() === estado;
        const coincideMesa   = mesa === '' || String(p.mesa_id).includes(mesa);
        return coincideEstado && coincideMesa;
    });

    const contenedor = document.getElementById('tabla-pedidos');

    if (filtrados.length === 0) {
        contenedor.innerHTML = '<p>No se encontraron pedidos.</p>';
        return;
    }

    const tabla = crearTabla(
        ['ID', 'Mesa', 'Total', 'Estado', 'Acciones'],
        filtrados.map(p => [
            p.id,
            'Mesa ' + p.mesa_id,
            '$' + parseFloat(p.total).toFixed(2),
            p.estado,
            `<button class="btn btn-sm btn-primary" onclick="verDetallePedido(${p.id})">Ver detalle</button>
             <button class="btn btn-sm btn-outline" onclick="mostrarFormCambiarEstado(${p.id}, '${p.estado}')">Cambiar estado</button>`
        ])
    );

    contenedor.innerHTML = '';
    contenedor.appendChild(tabla);
}

async function verDetallePedido(id) {
    const res  = await fetchAuth(`${URL_PEDIDOS}/${id}`);
    const data = await res.json();

    const filas = data.detalles.map(d => `
        <tr>
            <td>${d.producto_nombre}</td>
            <td>${d.cantidad}</td>
            <td>$${parseFloat(d.precio_unitario).toFixed(2)}</td>
            <td>$${parseFloat(d.subtotal).toFixed(2)}</td>
        </tr>
    `).join('');

    abrirModal(`Detalle Pedido #${id}`, `
        <table>
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio unitario</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${filas}
            </tbody>
        </table>
        <p><strong>Total: $${parseFloat(data.pedido.total).toFixed(2)}</strong></p>
        <p><strong>Estado: ${data.pedido.estado}</strong></p>
    `);
}

function mostrarFormCambiarEstado(id, estadoActual) {
    abrirModal('Cambiar Estado', `
        <p>Pedido #${id}</p>
        <select id="nuevo-estado">
            <option value="pendiente"      ${estadoActual === 'pendiente'      ? 'selected' : ''}>Pendiente</option>
            <option value="en preparacion" ${estadoActual === 'en preparacion' ? 'selected' : ''}>En preparación</option>
            <option value="listo"          ${estadoActual === 'listo'          ? 'selected' : ''}>Listo</option>
            <option value="entregado"      ${estadoActual === 'entregado'      ? 'selected' : ''}>Entregado</option>
            <option value="cancelado"      ${estadoActual === 'cancelado'      ? 'selected' : ''}>Cancelado</option>
        </select>
        <button class="btn btn-primary" onclick="cambiarEstadoPedido(${id})">Guardar</button>
    `);
}

async function cambiarEstadoPedido(id) {
    const estado = document.getElementById('nuevo-estado').value;

    const res = await fetchAuth(`${URL_PEDIDOS}/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado })
    });

    const data = await res.json();

    if (res.ok) {
        cerrarModal();
        await renderPedidos();
    } else {
        alert(data.message);
    }
}

async function mostrarFormCrearPedido() {
    const resMesas     = await fetchAuth('http://127.0.0.1:3020/mesas');
    const mesas        = await resMesas.json();
    const resProductos = await fetchAuth(URL_PRODUCTOS_PEDIDO);
    const productos    = await resProductos.json();

    window._carrito = [];

    const opcionesMesas = mesas
        .filter(m => m.estado === 'disponible')
        .map(m => `<option value="${m.id}">Mesa ${m.numero} (${m.capacidad} personas)</option>`)
        .join('');

    const opcionesProductos = productos
        .filter(p => p.disponible == 1)
        .map(p => `<option value="${p.id}" data-precio="${p.precio}" data-nombre="${p.nombre}">
            ${p.nombre} - $${parseFloat(p.precio).toFixed(2)}
        </option>`)
        .join('');

    abrirModal('Nuevo Pedido', `
        <select id="pedido-mesa">
            <option value="">Seleccione una mesa *</option>
            ${opcionesMesas}
        </select>

        <hr>
        <h4>Agregar productos</h4>
        <div style="display:flex; gap:8px; align-items:center;">
            <select id="pedido-producto" style="flex:1">
                <option value="">Seleccione un producto</option>
                ${opcionesProductos}
            </select>
            <input type="number" id="pedido-cantidad" value="1" min="1" style="width:60px;">
            <button class="btn btn-outline" onclick="agregarAlCarrito()">Agregar</button>
        </div>

        <hr>
        <h4>Carrito</h4>
        <div id="carrito-lista"></div>
        <p><strong>Total: $<span id="carrito-total">0.00</span></strong></p>

        <button class="btn btn-primary" onclick="crearPedido()">Confirmar Pedido</button>
    `);
}

function agregarAlCarrito() {
    const select   = document.getElementById('pedido-producto');
    const cantidad = parseInt(document.getElementById('pedido-cantidad').value);
    const id       = select.value;
    const nombre   = select.options[select.selectedIndex].dataset.nombre;
    const precio   = parseFloat(select.options[select.selectedIndex].dataset.precio);

    if (!id) {
        alert('Seleccione un producto.');
        return;
    }

    if (cantidad < 1) {
        alert('La cantidad debe ser mayor a 0.');
        return;
    }

    // Si ya está en el carrito sumar cantidad
    const existe = window._carrito.find(item => item.producto_id == id);
    if (existe) {
        existe.cantidad += cantidad;
        existe.subtotal  = existe.cantidad * existe.precio_unitario;
    } else {
        // Producto nuevo — agregar al carrito
        window._carrito.push({
            producto_id:     id,
            producto_nombre: nombre,
            cantidad:        cantidad,
            precio_unitario: precio,
            subtotal:        cantidad * precio
        });
    }

    // Resetear selección para poder agregar otro producto diferente
    select.value = '';
    document.getElementById('pedido-cantidad').value = 1;

    renderCarrito();
}

function renderCarrito() {
    const lista = document.getElementById('carrito-lista');

    if (window._carrito.length === 0) {
        lista.innerHTML = '<p>No hay productos en el carrito.</p>';
        document.getElementById('carrito-total').textContent = '0.00';
        return;
    }

    lista.innerHTML = window._carrito.map((item, index) => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span>${item.producto_nombre} x${item.cantidad} = $${item.subtotal.toFixed(2)}</span>
            <button onclick="quitarDelCarrito(${index})">X</button>
        </div>
    `).join('');

    const total = window._carrito.reduce((acc, item) => acc + item.subtotal, 0);
    document.getElementById('carrito-total').textContent = total.toFixed(2);
}

function quitarDelCarrito(index) {
    window._carrito.splice(index, 1);
    renderCarrito();
}

async function crearPedido() {
    const mesa_id = document.getElementById('pedido-mesa').value;

    if (!mesa_id) {
        alert('Seleccione una mesa.');
        return;
    }

    if (window._carrito.length === 0) {
        alert('Agregue al menos un producto al carrito.');
        return;
    }

    const res = await fetchAuth(URL_PEDIDOS, {
        method: 'POST',
        body: JSON.stringify({
            mesa_id,
            productos: window._carrito
        })
    });

    const data = await res.json();

    if (res.ok) {
        cerrarModal();
        await renderPedidos();
    } else {
        alert(data.message);
    }
}