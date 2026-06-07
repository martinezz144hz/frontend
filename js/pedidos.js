// ============================================
// MÓDULO DE PEDIDOS
// Puerto ms-pedidos: 3040
// ============================================
 
const URL_PEDIDOS   = `${API.pedidos}/pedidos`;
const URL_MESAS_PED = `${API.reservas}/mesas`;
const URL_PROD_PED  = `${API.productos}/productos`;
 
// Estado temporal del carrito al crear pedido
let carritoItems = [];
 
// ============================================
// RENDER PRINCIPAL DEL MÓDULO
// ============================================
 
function renderPedidos(contenedor) {
  contenedor.innerHTML = `
    <div class="modulo-header">
      <h2 class="modulo-titulo">📋 Gestión de Pedidos</h2>
      <button class="btn btn-primary" id="btn-nuevo-pedido">+ Nuevo Pedido</button>
    </div>
 
    <!-- Filtros -->
    <div class="filtros-bar">
      <select id="filtro-estado-ped" class="input-sm">
        <option value="">Todos los estados</option>
        <option value="pendiente">Pendiente</option>
        <option value="en_preparacion">En preparación</option>
        <option value="entregado">Entregado</option>
        <option value="pagado">Pagado</option>
        <option value="cancelado">Cancelado</option>
      </select>
      <button class="btn btn-outline btn-sm" id="btn-filtrar-ped">Buscar</button>
      <button class="btn btn-ghost btn-sm" id="btn-limpiar-ped">Limpiar</button>
    </div>
 
    <div id="msg-pedidos"></div>
 
    <!-- Lista de pedidos -->
    <div id="lista-pedidos">
      <p class="placeholder-text">Cargando pedidos...</p>
    </div>
 
    <!-- Modal detalle pedido -->
    <div id="modal-detalle-pedido" class="modal-overlay hidden">
      <div class="modal-box modal-box-lg">
        <div class="modal-header">
          <h3 id="detalle-pedido-titulo">Detalle del Pedido</h3>
          <button class="modal-close" id="btn-cerrar-detalle">&times;</button>
        </div>
        <div class="modal-body" id="detalle-pedido-body">
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="btn-cancelar-detalle">Cerrar</button>
        </div>
      </div>
    </div>
  `;
 
  // Eventos
  document.getElementById('btn-nuevo-pedido').addEventListener('click', abrirModalNuevoPedido);
  document.getElementById('btn-filtrar-ped').addEventListener('click', aplicarFiltrosPedidos);
  document.getElementById('btn-limpiar-ped').addEventListener('click', limpiarFiltrosPedidos);
  document.getElementById('btn-cerrar-detalle').addEventListener('click', cerrarModalDetalle);
  document.getElementById('btn-cancelar-detalle').addEventListener('click', cerrarModalDetalle);
 
  cargarPedidos();
}
 
// ============================================
// CARGAR PEDIDOS
// ============================================
 
async function cargarPedidos(params = {}) {
  const contenedor = document.getElementById('lista-pedidos');
  if (!contenedor) return;
  contenedor.innerHTML = '<p class="placeholder-text">Cargando...</p>';
 
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${URL_PEDIDOS}?${query}` : URL_PEDIDOS;
 
    const res = await fetchAuth(url);
    const data = await res.json();
 
    if (!res.ok) {
      mostrarMsgPedidos(data.message || 'Error al cargar pedidos.', 'error');
      contenedor.innerHTML = '';
      return;
    }
 
    const pedidos = Array.isArray(data) ? data : (data.data ?? []);
    renderizarPedidos(pedidos);
  } catch (e) {
    mostrarMsgPedidos('No se pudo conectar con el servidor de pedidos.', 'error');
    contenedor.innerHTML = '';
  }
}
 
function renderizarPedidos(pedidos) {
  const contenedor = document.getElementById('lista-pedidos');
  if (!contenedor) return;
 
  if (!pedidos.length) {
    contenedor.innerHTML = '<p class="placeholder-text">No hay pedidos registrados.</p>';
    return;
  }
 
  contenedor.innerHTML = `
    <div class="tabla-wrapper">
      <table class="tabla">
        <thead>
          <tr>
            <th>#</th>
            <th>Mesa</th>
            <th>Productos</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Fecha</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${pedidos.map(p => `
            <tr>
              <td>${p.id}</td>
              <td>Mesa #${p.mesa_id ?? p.numero_mesa ?? '—'}</td>
              <td>${p.cantidad_productos ?? p.total_productos ?? '—'}</td>
              <td>$${formatearPrecio(p.total ?? p.total_precio ?? 0)}</td>
              <td><span class="badge badge-ped-${p.estado}">${formatearEstadoPedido(p.estado)}</span></td>
              <td>${formatearFecha(p.created_at ?? p.fecha)}</td>
              <td class="acciones-td">
                <button class="btn btn-sm btn-outline" onclick="verDetallePedido(${p.id})">Ver</button>
                ${accionesCambioEstado(p)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}
 
function accionesCambioEstado(p) {
  const transiciones = {
    pendiente:       ['en_preparacion', 'cancelado'],
    en_preparacion:  ['entregado', 'cancelado'],
    entregado:       ['pagado'],
    pagado:          [],
    cancelado:       [],
  };
 
  const estados = transiciones[p.estado] ?? [];
  if (!estados.length) return '';
 
  return `
    <select class="select-estado" onchange="cambiarEstadoPedido(${p.id}, this.value)">
      <option value="">Estado...</option>
      ${estados.map(e => `<option value="${e}">${formatearEstadoPedido(e)}</option>`).join('')}
    </select>
  `;
}
 
// ============================================
// FILTROS
// ============================================
 
function aplicarFiltrosPedidos() {
  const estado = document.getElementById('filtro-estado-ped').value;
  const params = {};
  if (estado) params.estado = estado;
  cargarPedidos(params);
}
 
function limpiarFiltrosPedidos() {
  document.getElementById('filtro-estado-ped').value = '';
  cargarPedidos();
}
 
// ============================================
// DETALLE DEL PEDIDO
// ============================================
 
async function verDetallePedido(id) {
  try {
    const res = await fetchAuth(`${URL_PEDIDOS}/${id}`);
    const data = await res.json();
    const p = data.data ?? data;
 
    const items = p.items ?? p.productos ?? p.detalles ?? [];
    const subtotal = items.reduce((acc, i) => acc + ((i.precio_unitario ?? i.precio ?? 0) * (i.cantidad ?? 1)), 0);
 
    document.getElementById('detalle-pedido-titulo').textContent = `Pedido #${p.id} — Mesa #${p.mesa_id ?? '—'}`;
    document.getElementById('detalle-pedido-body').innerHTML = `
      <div class="detalle-info">
        <span><strong>Estado:</strong> <span class="badge badge-ped-${p.estado}">${formatearEstadoPedido(p.estado)}</span></span>
        <span><strong>Fecha:</strong> ${formatearFecha(p.created_at ?? p.fecha)}</span>
      </div>
 
      <table class="tabla" style="margin-top:1rem">
        <thead>
          <tr><th>Producto</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          ${items.length
            ? items.map(i => `
                <tr>
                  <td>${i.nombre ?? i.producto_nombre ?? '—'}</td>
                  <td>${i.cantidad ?? 1}</td>
                  <td>$${formatearPrecio(i.precio_unitario ?? i.precio ?? 0)}</td>
                  <td>$${formatearPrecio((i.precio_unitario ?? i.precio ?? 0) * (i.cantidad ?? 1))}</td>
                </tr>
              `).join('')
            : '<tr><td colspan="4" style="text-align:center">Sin productos.</td></tr>'
          }
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align:right"><strong>Total</strong></td>
            <td><strong>$${formatearPrecio(p.total ?? subtotal)}</strong></td>
          </tr>
        </tfoot>
      </table>
    `;
 
    document.getElementById('modal-detalle-pedido').classList.remove('hidden');
  } catch (e) {
    mostrarMsgPedidos('Error al cargar detalle del pedido.', 'error');
  }
}
 
function cerrarModalDetalle() {
  document.getElementById('modal-detalle-pedido').classList.add('hidden');
}
 
// ============================================
// CREAR PEDIDO
// ============================================
 
async function abrirModalNuevoPedido() {
  carritoItems = [];
 
  // Cargar mesas y productos en paralelo
  let mesas = [], productos = [];
  try {
    const [resMesas, resProd] = await Promise.all([
      fetchAuth(URL_MESAS_PED),
      fetchAuth(URL_PROD_PED),
    ]);
    const dataMesas = await resMesas.json();
    const dataProd  = await resProd.json();
 
    mesas     = Array.isArray(dataMesas) ? dataMesas : (dataMesas.data ?? []);
    productos = Array.isArray(dataProd)  ? dataProd  : (dataProd.data ?? []);
  } catch (e) {
    mostrarMsgPedidos('Error al cargar mesas o productos.', 'error');
    return;
  }
 
  // Solo mesas ocupadas (con pedido activo)
  const mesasOcupadas = mesas.filter(m => m.estado === 'ocupada');
  const prodDisponibles = productos.filter(p => p.disponible == 1 || p.disponible === true);
 
  const opcionesMesas = mesasOcupadas.length
    ? mesasOcupadas.map(m => `<option value="${m.id}">Mesa #${m.numero}</option>`).join('')
    : '<option value="">No hay mesas ocupadas</option>';
 
  const opcionesProd = prodDisponibles.length
    ? prodDisponibles.map(p => `<option value="${p.id}" data-precio="${p.precio}" data-nombre="${p.nombre}">
        ${p.nombre} — $${formatearPrecio(p.precio)}
      </option>`).join('')
    : '<option value="">No hay productos disponibles</option>';
 
  abrirModal('Nuevo Pedido', `
    <div class="form-group">
      <label>Mesa</label>
      <select id="nuevo-ped-mesa">${opcionesMesas}</select>
    </div>
 
    <hr style="margin:1rem 0" />
 
    <div class="form-group">
      <label>Agregar producto</label>
      <div class="add-producto-row">
        <select id="nuevo-ped-prod-select">${opcionesProd}</select>
        <input type="number" id="nuevo-ped-prod-cant" min="1" value="1" style="width:70px" />
        <button type="button" class="btn btn-outline btn-sm" id="btn-agregar-item">+ Agregar</button>
      </div>
    </div>
 
    <div id="carrito-container">
      <p class="placeholder-text" style="font-size:.85rem">Sin productos agregados.</p>
    </div>
 
    <div id="carrito-total" style="text-align:right;font-weight:600;margin-top:.5rem"></div>
    <div id="msg-nuevo-pedido"></div>
  `, crearPedido);
 
  // Evento agregar item al carrito
  document.getElementById('btn-agregar-item').addEventListener('click', agregarItemCarrito);
}
 
function agregarItemCarrito() {
  const select   = document.getElementById('nuevo-ped-prod-select');
  const cantidad = parseInt(document.getElementById('nuevo-ped-prod-cant').value);
  const opt      = select.options[select.selectedIndex];
 
  if (!opt || !opt.value) return;
  if (!cantidad || cantidad < 1) {
    mostrarMsgModal('msg-nuevo-pedido', 'La cantidad debe ser al menos 1.', 'error');
    return;
  }
 
  const id     = parseInt(opt.value);
  const nombre = opt.dataset.nombre;
  const precio = parseFloat(opt.dataset.precio);
 
  // Si ya existe, sumar cantidad
  const existente = carritoItems.find(i => i.producto_id === id);
  if (existente) {
    existente.cantidad += cantidad;
  } else {
    carritoItems.push({ producto_id: id, nombre, precio, cantidad });
  }
 
  renderizarCarrito();
}
 
function renderizarCarrito() {
  const cont = document.getElementById('carrito-container');
  const totalEl = document.getElementById('carrito-total');
  if (!cont) return;
 
  if (!carritoItems.length) {
    cont.innerHTML = '<p class="placeholder-text" style="font-size:.85rem">Sin productos agregados.</p>';
    if (totalEl) totalEl.textContent = '';
    return;
  }
 
  cont.innerHTML = `
    <table class="tabla" style="font-size:.85rem">
      <thead>
        <tr><th>Producto</th><th>Cant.</th><th>Subtotal</th><th></th></tr>
      </thead>
      <tbody>
        ${carritoItems.map((item, idx) => `
          <tr>
            <td>${item.nombre}</td>
            <td>
              <input type="number" min="1" value="${item.cantidad}"
                style="width:55px"
                onchange="actualizarCantidadCarrito(${idx}, this.value)" />
            </td>
            <td>$${formatearPrecio(item.precio * item.cantidad)}</td>
            <td><button class="btn btn-sm btn-danger" onclick="eliminarItemCarrito(${idx})">✕</button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
 
  const total = carritoItems.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  if (totalEl) totalEl.textContent = `Total: $${formatearPrecio(total)}`;
}
 
function actualizarCantidadCarrito(idx, valor) {
  const cant = parseInt(valor);
  if (!cant || cant < 1) return;
  carritoItems[idx].cantidad = cant;
  renderizarCarrito();
}
 
function eliminarItemCarrito(idx) {
  carritoItems.splice(idx, 1);
  renderizarCarrito();
}
 
async function crearPedido() {
  const mesa_id = document.getElementById('nuevo-ped-mesa').value;
 
  if (!mesa_id) {
    mostrarMsgModal('msg-nuevo-pedido', 'Selecciona una mesa.', 'error');
    return;
  }
  if (!carritoItems.length) {
    mostrarMsgModal('msg-nuevo-pedido', 'Agrega al menos un producto al pedido.', 'error');
    return;
  }
 
  const items = carritoItems.map(i => ({
    producto_id: i.producto_id,
    cantidad: i.cantidad,
  }));
 
  try {
    const res = await fetchAuth(URL_PEDIDOS, {
      method: 'POST',
      body: JSON.stringify({ mesa_id: parseInt(mesa_id), items }),
    });
    const data = await res.json();
 
    if (res.ok) {
      cerrarModal();
      carritoItems = [];
      mostrarMsgPedidos(data.message || 'Pedido creado correctamente.', 'success');
      cargarPedidos();
    } else {
      mostrarMsgModal('msg-nuevo-pedido', data.message || 'Error al crear pedido.', 'error');
    }
  } catch (e) {
    mostrarMsgModal('msg-nuevo-pedido', 'Error de conexión.', 'error');
  }
}
 
// ============================================
// CAMBIAR ESTADO DEL PEDIDO
// ============================================
 
async function cambiarEstadoPedido(id, nuevoEstado) {
  if (!nuevoEstado) return;
 
  try {
    const res = await fetchAuth(`${URL_PEDIDOS}/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    const data = await res.json();
 
    mostrarMsgPedidos(
      data.message || (res.ok ? 'Estado actualizado.' : 'Error al cambiar estado.'),
      res.ok ? 'success' : 'error'
    );
    if (res.ok) cargarPedidos();
  } catch (e) {
    mostrarMsgPedidos('Error de conexión.', 'error');
  }
}
 
// ============================================
// HELPERS
// ============================================
 
function mostrarMsgPedidos(texto, tipo = 'error') {
  const el = document.getElementById('msg-pedidos');
  if (!el) return;
  el.textContent = texto;
  el.className = `alert alert-${tipo}`;
  el.classList.remove('hidden');
  setTimeout(() => { el.textContent = ''; el.className = 'hidden'; }, 4000);
}
 
function formatearEstadoPedido(estado) {
  const map = {
    pendiente:       'Pendiente',
    en_preparacion:  'En preparación',
    entregado:       'Entregado',
    pagado:          'Pagado',
    cancelado:       'Cancelado',
  };
  return map[estado] ?? estado;
}