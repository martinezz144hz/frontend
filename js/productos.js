// ============================================
// MÓDULO DE PRODUCTOS
// Puerto ms-productos: 3030
// ============================================
 
const URL_PRODUCTOS = `${API.productos}/productos`;
 
const CATEGORIAS = ['Entradas', 'Platos fuertes', 'Bebidas', 'Postres'];
 
// ============================================
// RENDER PRINCIPAL DEL MÓDULO
// ============================================
 
function renderProductos(contenedor) {
  contenedor.innerHTML = `
    <div class="modulo-header">
      <h2 class="modulo-titulo">🍕 Gestión de Productos</h2>
      <button class="btn btn-primary" id="btn-nuevo-producto">+ Nuevo Producto</button>
    </div>
 
    <!-- Filtros -->
    <div class="filtros-bar">
      <select id="filtro-categoria" class="input-sm">
        <option value="">Todas las categorías</option>
        ${CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
      <select id="filtro-disponibilidad" class="input-sm">
        <option value="">Disponibilidad</option>
        <option value="1">Disponible</option>
        <option value="0">No disponible</option>
      </select>
      <button class="btn btn-outline btn-sm" id="btn-filtrar-prod">Buscar</button>
      <button class="btn btn-ghost btn-sm" id="btn-limpiar-prod">Limpiar</button>
    </div>
 
    <div id="msg-productos"></div>
 
    <!-- Cards de productos -->
    <div id="lista-productos" class="cards-grid">
      <p class="placeholder-text">Cargando productos...</p>
    </div>
 
    <!-- Modal editar producto -->
    <div id="modal-editar-producto" class="modal-overlay hidden">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Editar Producto</h3>
          <button class="modal-close" id="btn-cerrar-modal-prod">&times;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="edit-prod-id" />
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" id="edit-prod-nombre" />
          </div>
          <div class="form-group">
            <label>Categoría</label>
            <select id="edit-prod-categoria">
              ${CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Precio</label>
            <input type="number" id="edit-prod-precio" min="0.01" step="0.01" />
          </div>
          <div class="form-group">
            <label>Disponibilidad</label>
            <select id="edit-prod-disponible">
              <option value="1">Disponible</option>
              <option value="0">No disponible</option>
            </select>
          </div>
          <div id="msg-prod-edit"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="btn-cancelar-modal-prod">Cancelar</button>
          <button class="btn btn-primary" id="btn-guardar-producto">Guardar</button>
        </div>
      </div>
    </div>
  `;
 
  // Eventos
  document.getElementById('btn-nuevo-producto').addEventListener('click', abrirModalNuevoProducto);
  document.getElementById('btn-filtrar-prod').addEventListener('click', aplicarFiltrosProductos);
  document.getElementById('btn-limpiar-prod').addEventListener('click', limpiarFiltrosProductos);
  document.getElementById('btn-cerrar-modal-prod').addEventListener('click', cerrarModalProducto);
  document.getElementById('btn-cancelar-modal-prod').addEventListener('click', cerrarModalProducto);
  document.getElementById('btn-guardar-producto').addEventListener('click', guardarEditarProducto);
 
  cargarProductos();
}
 
// ============================================
// CARGAR PRODUCTOS
// ============================================
 
async function cargarProductos(params = {}) {
  const contenedor = document.getElementById('lista-productos');
  if (!contenedor) return;
  contenedor.innerHTML = '<p class="placeholder-text">Cargando...</p>';
 
  try {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${URL_PRODUCTOS}?${query}` : URL_PRODUCTOS;
 
    const res = await fetchAuth(url);
    const data = await res.json();
 
    if (!res.ok) {
      mostrarMsgProductos(data.message || 'Error al cargar productos.', 'error');
      contenedor.innerHTML = '';
      return;
    }
 
    const productos = Array.isArray(data) ? data : (data.data ?? []);
    renderizarProductos(productos);
  } catch (e) {
    mostrarMsgProductos('No se pudo conectar con el servidor de productos.', 'error');
    contenedor.innerHTML = '';
  }
}
 
function renderizarProductos(productos) {
  const contenedor = document.getElementById('lista-productos');
  if (!contenedor) return;
 
  if (!productos.length) {
    contenedor.innerHTML = '<p class="placeholder-text">No hay productos registrados.</p>';
    return;
  }
 
  contenedor.innerHTML = productos.map(p => {
    const disponible = p.disponible == 1 || p.disponible === true || p.disponibilidad == 1;
    return `
      <div class="producto-card ${!disponible ? 'producto-no-disponible' : ''}">
        <div class="producto-card-header">
          <span class="producto-categoria">${p.categoria ?? '—'}</span>
          <span class="badge ${disponible ? 'badge-disponible' : 'badge-fuera_de_servicio'}">
            ${disponible ? 'Disponible' : 'No disponible'}
          </span>
        </div>
        <div class="producto-card-body">
          <h3 class="producto-nombre">${p.nombre}</h3>
          <p class="producto-precio">$${formatearPrecio(p.precio)}</p>
        </div>
        <div class="producto-card-footer">
          <button class="btn btn-sm btn-outline" onclick="abrirEditarProducto(${p.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarProducto(${p.id}, '${p.nombre}')">Eliminar</button>
        </div>
      </div>
    `;
  }).join('');
}
 
// ============================================
// FILTROS
// ============================================
 
function aplicarFiltrosProductos() {
  const categoria     = document.getElementById('filtro-categoria').value;
  const disponibilidad = document.getElementById('filtro-disponibilidad').value;
 
  const params = {};
  if (categoria)      params.categoria     = categoria;
  if (disponibilidad !== '') params.disponible = disponibilidad;
 
  cargarProductos(params);
}
 
function limpiarFiltrosProductos() {
  document.getElementById('filtro-categoria').value      = '';
  document.getElementById('filtro-disponibilidad').value = '';
  cargarProductos();
}
 
// ============================================
// CREAR PRODUCTO
// ============================================
 
function abrirModalNuevoProducto() {
  abrirModal('Nuevo Producto', `
    <div class="form-group">
      <label>Nombre</label>
      <input type="text" id="nueva-prod-nombre" placeholder="Ej: Bandeja Paisa" />
    </div>
    <div class="form-group">
      <label>Categoría</label>
      <select id="nueva-prod-categoria">
        ${CATEGORIAS.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>Precio</label>
      <input type="number" id="nueva-prod-precio" min="0.01" step="0.01" placeholder="Ej: 25000" />
    </div>
    <div class="form-group">
      <label>Disponibilidad</label>
      <select id="nueva-prod-disponible">
        <option value="1">Disponible</option>
        <option value="0">No disponible</option>
      </select>
    </div>
    <div id="msg-nuevo-producto"></div>
  `, crearProducto);
}
 
async function crearProducto() {
  const nombre     = document.getElementById('nueva-prod-nombre').value.trim();
  const categoria  = document.getElementById('nueva-prod-categoria').value;
  const precio     = parseFloat(document.getElementById('nueva-prod-precio').value);
  const disponible = document.getElementById('nueva-prod-disponible').value;
 
  if (!nombre) {
    mostrarMsgModal('msg-nuevo-producto', 'El nombre es requerido.', 'error');
    return;
  }
  if (!precio || precio <= 0) {
    mostrarMsgModal('msg-nuevo-producto', 'El precio debe ser mayor a cero.', 'error');
    return;
  }
 
  try {
    const res = await fetchAuth(URL_PRODUCTOS, {
      method: 'POST',
      body: JSON.stringify({ nombre, categoria, precio, disponible: parseInt(disponible) }),
    });
    const data = await res.json();
 
    if (res.ok) {
      cerrarModal();
      mostrarMsgProductos(data.message || 'Producto creado correctamente.', 'success');
      cargarProductos();
    } else {
      mostrarMsgModal('msg-nuevo-producto', data.message || 'Error al crear producto.', 'error');
    }
  } catch (e) {
    mostrarMsgModal('msg-nuevo-producto', 'Error de conexión.', 'error');
  }
}
 
// ============================================
// EDITAR PRODUCTO
// ============================================
 
async function abrirEditarProducto(id) {
  try {
    const res = await fetchAuth(`${URL_PRODUCTOS}/${id}`);
    const data = await res.json();
    const p = data.data ?? data;
 
    document.getElementById('edit-prod-id').value         = p.id;
    document.getElementById('edit-prod-nombre').value     = p.nombre;
    document.getElementById('edit-prod-categoria').value  = p.categoria;
    document.getElementById('edit-prod-precio').value     = p.precio;
    document.getElementById('edit-prod-disponible').value = (p.disponible == 1 || p.disponible === true) ? '1' : '0';
 
    document.getElementById('modal-editar-producto').classList.remove('hidden');
  } catch (e) {
    mostrarMsgProductos('Error al cargar datos del producto.', 'error');
  }
}
 
async function guardarEditarProducto() {
  const id         = document.getElementById('edit-prod-id').value;
  const nombre     = document.getElementById('edit-prod-nombre').value.trim();
  const categoria  = document.getElementById('edit-prod-categoria').value;
  const precio     = parseFloat(document.getElementById('edit-prod-precio').value);
  const disponible = document.getElementById('edit-prod-disponible').value;
 
  if (!nombre) {
    mostrarMsgModal('msg-prod-edit', 'El nombre es requerido.', 'error');
    return;
  }
  if (!precio || precio <= 0) {
    mostrarMsgModal('msg-prod-edit', 'El precio debe ser mayor a cero.', 'error');
    return;
  }
 
  try {
    const res = await fetchAuth(`${URL_PRODUCTOS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ nombre, categoria, precio, disponible: parseInt(disponible) }),
    });
    const data = await res.json();
 
    if (res.ok) {
      cerrarModalProducto();
      mostrarMsgProductos(data.message || 'Producto actualizado.', 'success');
      cargarProductos();
    } else {
      mostrarMsgModal('msg-prod-edit', data.message || 'Error al actualizar.', 'error');
    }
  } catch (e) {
    mostrarMsgModal('msg-prod-edit', 'Error de conexión.', 'error');
  }
}
 
// ============================================
// ELIMINAR PRODUCTO
// ============================================
 
async function eliminarProducto(id, nombre) {
  if (!confirm(`¿Eliminar el producto "${nombre}"? Esta acción no se puede deshacer.`)) return;
 
  try {
    const res = await fetchAuth(`${URL_PRODUCTOS}/${id}`, { method: 'DELETE' });
    const data = await res.json();
 
    mostrarMsgProductos(
      data.message || (res.ok ? 'Producto eliminado.' : 'Error al eliminar.'),
      res.ok ? 'success' : 'error'
    );
    if (res.ok) cargarProductos();
  } catch (e) {
    mostrarMsgProductos('Error de conexión.', 'error');
  }
}
 
// ============================================
// HELPERS
// ============================================
 
function cerrarModalProducto() {
  const modal = document.getElementById('modal-editar-producto');
  if (modal) modal.classList.add('hidden');
}
 
function mostrarMsgProductos(texto, tipo = 'error') {
  const el = document.getElementById('msg-productos');
  if (!el) return;
  el.textContent = texto;
  el.className = `alert alert-${tipo}`;
  el.classList.remove('hidden');
  setTimeout(() => { el.textContent = ''; el.className = 'hidden'; }, 4000);
}
 
function formatearPrecio(precio) {
  if (!precio) return '0';
  return Number(precio).toLocaleString('es-CO');
}