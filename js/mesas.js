

// Puerto ms-reservas: 3020

 
const URL_MESAS = `${API.reservas}/mesas`;
 


// Llamado desde app.js al navegar a mesas

 
function renderMesas(contenedor) {
  contenedor.innerHTML = `
    <div class="modulo-header">
      <h2 class="modulo-titulo"> Gestión de Mesas</h2>
      <button class="btn btn-primary" id="btn-nueva-mesa">+ Nueva Mesa</button>
    </div>
 
    <div id="msg-mesas"></div>
 
    <!-- Listado de mesas -->
    <div id="lista-mesas" class="cards-grid">
      <p class="placeholder-text">Cargando mesas...</p>
    </div>
 
    <!-- Modal editar mesa -->
    <div id="modal-editar-mesa" class="modal-overlay hidden">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Editar Mesa</h3>
          <button class="modal-close" id="btn-cerrar-modal-mesa">&times;</button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="edit-mesa-id" />
          <div class="form-group">
            <label>Capacidad</label>
            <input type="number" id="edit-mesa-capacidad" min="1" />
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select id="edit-mesa-estado">
              <option value="disponible">Disponible</option>
              <option value="reservada">Reservada</option>
              <option value="ocupada">Ocupada</option>
              <option value="fuera_de_servicio">Fuera de servicio</option>
            </select>
          </div>
          <div id="msg-mesa-edit"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="btn-cancelar-modal-mesa">Cancelar</button>
          <button class="btn btn-primary" id="btn-guardar-mesa">Guardar</button>
        </div>
      </div>
    </div>
  `;
 
  // Eventos del módulo
  document.getElementById('btn-nueva-mesa').addEventListener('click', abrirModalNuevaMesa);
  document.getElementById('btn-cerrar-modal-mesa').addEventListener('click', cerrarModalMesa);
  document.getElementById('btn-cancelar-modal-mesa').addEventListener('click', cerrarModalMesa);
  document.getElementById('btn-guardar-mesa').addEventListener('click', guardarEditarMesa);
 
  // Cargar datos
  cargarMesas();
}
 
// ============================================
// CARGAR Y RENDERIZAR MESAS
// ============================================
 
async function cargarMesas() {
  try {
    const res = await fetchAuth(URL_MESAS);
    const data = await res.json();
 
    if (!res.ok) {
      mostrarMsgMesas(data.message || 'Error al cargar mesas.', 'error');
      return;
    }
 
    renderizarMesas(Array.isArray(data) ? data : (data.data ?? []));
  } catch (e) {
    mostrarMsgMesas('No se pudo conectar con el servidor de reservas.', 'error');
  }
}
 
function renderizarMesas(mesas) {
  const contenedor = document.getElementById('lista-mesas');
  if (!contenedor) return;
 
  if (!mesas.length) {
    contenedor.innerHTML = '<p class="placeholder-text">No hay mesas registradas.</p>';
    return;
  }
 
  contenedor.innerHTML = mesas.map(mesa => `
    <div class="mesa-card estado-borde-${mesa.estado}" id="mesa-card-${mesa.id}">
      <div class="mesa-card-header">
        <span class="mesa-numero">Mesa #${mesa.numero}</span>
        <span class="badge badge-${mesa.estado}">${formatearEstado(mesa.estado)}</span>
      </div>
      <div class="mesa-card-body">
        <p><strong>Capacidad:</strong> ${mesa.capacidad} personas</p>
      </div>
      <div class="mesa-card-footer">
        <button class="btn btn-sm btn-outline" onclick="abrirEditarMesa(${mesa.id})">Editar</button>
        <select class="select-estado" onchange="cambiarEstadoMesa(${mesa.id}, this.value)">
          <option value="">Cambiar estado...</option>
          <option value="disponible">Disponible</option>
          <option value="reservada">Reservada</option>
          <option value="ocupada">Ocupada</option>
          <option value="fuera_de_servicio">Fuera de servicio</option>
        </select>
      </div>
    </div>
  `).join('');
}
 
function formatearEstado(estado) {
  const map = {
    disponible: 'Disponible',
    reservada: 'Reservada',
    ocupada: 'Ocupada',
    fuera_de_servicio: 'Fuera de servicio',
  };
  return map[estado] ?? estado;
}
 
// ============================================
// CREAR MESA (modal genérico de app.js)
// ============================================
 
function abrirModalNuevaMesa() {
  abrirModal('Nueva Mesa', `
    <div class="form-group">
      <label>Número / Nombre</label>
      <input type="text" id="nueva-mesa-numero" placeholder="Ej: 1, A, Terraza..." />
    </div>
    <div class="form-group">
      <label>Capacidad</label>
      <input type="number" id="nueva-mesa-capacidad" min="1" placeholder="Ej: 4" />
    </div>
    <div class="form-group">
      <label>Estado inicial</label>
      <select id="nueva-mesa-estado">
        <option value="disponible">Disponible</option>
        <option value="fuera_de_servicio">Fuera de servicio</option>
      </select>
    </div>
    <div id="msg-nueva-mesa"></div>
    <button class="btn btn-primary" onclick="crearMesa()">Guardar</button>
  `);
}
 
async function crearMesa() {
  const numero    = document.getElementById('nueva-mesa-numero').value.trim();
  const capacidad = parseInt(document.getElementById('nueva-mesa-capacidad').value);
  const estado    = document.getElementById('nueva-mesa-estado').value;

  if (!numero || !capacidad || capacidad < 1) {
    mostrarMsgModal('msg-nueva-mesa', 'Número y capacidad son requeridos.', 'error');
    return;
  }

  try {
    const res = await fetchAuth(URL_MESAS, {
      method: 'POST',
      body: JSON.stringify({ numero, capacidad, estado }),
    });
    const data = await res.json();

    if (res.ok) {
      cerrarModal();
      mostrarMsgMesas(data.message || 'Mesa creada correctamente.', 'success');
      cargarMesas();
    } else {
      mostrarMsgModal('msg-nueva-mesa', data.message || 'Error al crear mesa.', 'error');
    }
  } catch (e) {
    mostrarMsgModal('msg-nueva-mesa', 'Error de conexión.', 'error');
  }
}
 
// ============================================
// EDITAR MESA
// ============================================
 
async function abrirEditarMesa(id) {
  try {
    const res = await fetchAuth(`${URL_MESAS}/${id}`);
    const mesa = await res.json();
 
    const m = Array.isArray(mesa) ? mesa[0] : (mesa.data ?? mesa);
 
    document.getElementById('edit-mesa-id').value        = m.id;
    document.getElementById('edit-mesa-capacidad').value = m.capacidad;
    document.getElementById('edit-mesa-estado').value    = m.estado;
 
    document.getElementById('modal-editar-mesa').classList.remove('hidden');
  } catch (e) {
    mostrarMsgMesas('Error al cargar datos de la mesa.', 'error');
  }
}
 
async function guardarEditarMesa() {
  const id        = document.getElementById('edit-mesa-id').value;
  const capacidad = parseInt(document.getElementById('edit-mesa-capacidad').value);
  const estado    = document.getElementById('edit-mesa-estado').value;
 
  if (!capacidad || capacidad < 1) {
    mostrarMsgModal('msg-mesa-edit', 'La capacidad debe ser mayor a 0.', 'error');
    return;
  }
 
  try {
    const res = await fetchAuth(`${URL_MESAS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ capacidad, estado }),
    });
    const data = await res.json();
 
    if (res.ok) {
      cerrarModalMesa();
      mostrarMsgMesas(data.message || 'Mesa actualizada.', 'success');
      cargarMesas();
    } else {
      mostrarMsgModal('msg-mesa-edit', data.message || 'Error al actualizar.', 'error');
    }
  } catch (e) {
    mostrarMsgModal('msg-mesa-edit', 'Error de conexión.', 'error');
  }
}
 
// ============================================
// CAMBIAR ESTADO
// ============================================
 
async function cambiarEstadoMesa(id, nuevoEstado) {
  if (!nuevoEstado) return;
 
  try {
    const res = await fetchAuth(`${URL_MESAS}/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    const data = await res.json();
 
    mostrarMsgMesas(
      data.message || (res.ok ? 'Estado actualizado.' : 'Error al cambiar estado.'),
      res.ok ? 'success' : 'error'
    );
    if (res.ok) cargarMesas();
  } catch (e) {
    mostrarMsgMesas('Error de conexión.', 'error');
  }
}
 
// ============================================
// HELPERS LOCALES
// ============================================
 
function cerrarModalMesa() {
  const modal = document.getElementById('modal-editar-mesa');
  if (modal) modal.classList.add('hidden');
}
 
function mostrarMsgMesas(texto, tipo = 'error') {
  const el = document.getElementById('msg-mesas');
  if (!el) return;
  el.textContent = texto;
  el.className = `alert alert-${tipo}`;
  el.classList.remove('hidden');
  setTimeout(() => {
    el.textContent = '';
    el.className = '';
    el.classList.add('hidden');
  }, 4000);
}
 
function mostrarMsgModal(id, texto, tipo = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = texto;
  el.className = `alert alert-${tipo}`;
}