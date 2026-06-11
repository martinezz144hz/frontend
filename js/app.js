// APP.JS — CONTROLADOR DE NAVEGACIÓN

// Módulo activo actualmente
let moduloActivo = null;

// Mapa de módulos: nombre => función que renderiza el módulo
const MODULOS = {
  mesas:     renderMesas,
  reservas:  cargarReservas,
  productos: cargarProductos,
  pedidos:   cargarPedidos,
};

// ============================================
// NAVEGACIÓN ENTRE MÓDULOS
// ============================================

function cargarModulo(nombre) {
  if (moduloActivo === nombre) return;
  moduloActivo = nombre;

  // Marcar el nav-item activo en el sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.module === nombre);
  });

  // Limpiar contenido anterior
  const contenedor = document.getElementById('module-content');
  contenedor.innerHTML = '';

  // Llamar la función del módulo correspondiente
  const renderFn = MODULOS[nombre];
  if (renderFn) {
    renderFn(contenedor);
  } else {
    contenedor.innerHTML = `<p class="placeholder-text">Módulo "${nombre}" no encontrado.</p>`;
  }
}

// ============================================
// EVENTOS DEL SIDEBAR
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Clic en items del sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const modulo = item.dataset.module;
      if (modulo) cargarModulo(modulo);
    });
  });
});

// ============================================
// HELPER GLOBAL: mostrar mensajes en módulos
// ============================================

function mostrarAlerta(contenedor, mensaje, tipo = 'success') {
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo}`;
  alerta.textContent = mensaje;

  contenedor.prepend(alerta);

  setTimeout(() => alerta.remove(), 3000);
}

// ============================================
// HELPER GLOBAL: crear tabla genérica
// ============================================

function crearTabla(columnas, filas) {
  const table = document.createElement('table');
  table.className = 'tabla';

  // Encabezado
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  columnas.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    trHead.appendChild(th);
  });
  thead.appendChild(trHead);
  table.appendChild(thead);

  // Cuerpo
  const tbody = document.createElement('tbody');
  if (filas.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = columnas.length;
    td.textContent = 'No hay registros.';
    td.style.textAlign = 'center';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    filas.forEach(fila => {
      const tr = document.createElement('tr');
      fila.forEach(celda => {
        const td = document.createElement('td');
        td.innerHTML = celda;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }
  table.appendChild(tbody);

  return table;
}

// ============================================
// HELPER GLOBAL: crear modal genérico
// ============================================

function abrirModal(titulo, htmlContenido) {
  const modalExistente = document.getElementById('modal-global');
  if (modalExistente) modalExistente.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-global';
  modal.className = 'modal-overlay';

  modal.innerHTML = `
    <div class="modal-box">
      <div class="modal-header">
        <h3>${titulo}</h3>
        <button class="modal-close" id="modal-cerrar">&times;</button>
      </div>
      <div class="modal-body">
        ${htmlContenido}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('modal-cerrar').addEventListener('click', cerrarModal);
}

function cerrarModal() {
  const modal = document.getElementById('modal-global');
  if (modal) modal.remove();
}