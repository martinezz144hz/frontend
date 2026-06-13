const URL_PRODUCTOS = 'http://127.0.0.1:3030/productos';

async function cargarProductos(contenedor) {
    contenedor.innerHTML = `
        <div class="modulo-header">
            <h2>Productos</h2>
            <button class="btn btn-primary" onclick="mostrarFormCrearProducto()">+ Nuevo Producto</button>
        </div>

        <div class="filtros">
            <input type="text" id="filtro-nombre" placeholder="Buscar por nombre..." oninput="filtrarProductos()">
            <select id="filtro-categoria" onchange="filtrarProductos()">
                <option value="">Todas las categorías</option>
                <option value="entrada">Entrada</option>
                <option value="plato principal">Plato principal</option>
                <option value="postre">Postre</option>
                <option value="bebida">Bebida</option>
            </select>
        </div>

        <div id="tabla-productos"></div>
    `;

    await renderProductos();
}

async function renderProductos() {
    const res  = await fetchAuth(URL_PRODUCTOS);
    const data = await res.json();

    window._productos = data;
    filtrarProductos();
}

function filtrarProductos() {
    const nombre    = document.getElementById('filtro-nombre').value.toLowerCase();
    const categoria = document.getElementById('filtro-categoria').value.toLowerCase();

    const filtrados = window._productos.filter(p => {
        const coincideNombre    = p.nombre.toLowerCase().includes(nombre);
        const coincideCategoria = categoria === '' || p.categoria.toLowerCase() === categoria;
        return coincideNombre && coincideCategoria;
    });

    const contenedor = document.getElementById('tabla-productos');

    if (filtrados.length === 0) {
        contenedor.innerHTML = '<p>No se encontraron productos.</p>';
        return;
    }

    const tabla = crearTabla(
        ['ID', 'Nombre', 'Descripción', 'Precio', 'Categoría', 'Disponible', 'Acciones'],
        filtrados.map(p => [
            p.id,
            p.nombre,
            p.descripcion || '-',
            '$' + parseFloat(p.precio).toFixed(2),
            p.categoria,
            p.disponible == 1 ? 'Sí' : 'No',
            `<button class="btn btn-sm btn-primary" onclick="mostrarFormEditarProducto(${p.id})">Editar</button>
 <button class="btn btn-sm btn-outline" onclick="eliminarProducto(${p.id})">Eliminar</button>`
        ])
    );

    contenedor.innerHTML = '';
    contenedor.appendChild(tabla);
}

function mostrarFormCrearProducto() {
    abrirModal('Nuevo Producto', `
        <input type="text"   id="p-nombre"      placeholder="Nombre *">
        <input type="text"   id="p-descripcion" placeholder="Descripción">
        <input type="number" id="p-precio"      placeholder="Precio *" step="0.01">
        <select id="p-categoria">
            <option value="">Seleccione categoría *</option>
            <option value="entrada">Entrada</option>
            <option value="plato principal">Plato principal</option>
            <option value="postre">Postre</option>
            <option value="bebida">Bebida</option>
        </select>
        <select id="p-disponible">
            <option value="1">Disponible</option>
            <option value="0">No disponible</option>
        </select>
        <button class="btn btn-primary" onclick="crearProducto()">Guardar</button>
    `);
}

async function crearProducto() {
    const nombre      = document.getElementById('p-nombre').value;
    const descripcion = document.getElementById('p-descripcion').value;
    const precio      = document.getElementById('p-precio').value;
    const categoria   = document.getElementById('p-categoria').value;
    const disponible  = document.getElementById('p-disponible').value;

    if (!nombre || !precio || !categoria) {
        alert('Nombre, precio y categoría son requeridos.');
        return;
    }

    const res = await fetchAuth(URL_PRODUCTOS, {
        method: 'POST',
        body: JSON.stringify({ nombre, descripcion, precio, categoria, disponible })
    });

    const data = await res.json();

    if (res.ok) {
        cerrarModal();
        await renderProductos();
    } else {
        alert(data.message);
    }
}

function mostrarFormEditarProducto(id) {
    const p = window._productos.find(p => p.id === id);

    abrirModal('Editar Producto', `
        <input type="text"   id="p-nombre"      placeholder="Nombre *"    value="${p.nombre}">
        <input type="text"   id="p-descripcion" placeholder="Descripción" value="${p.descripcion || ''}">
        <input type="number" id="p-precio"      placeholder="Precio *"    value="${p.precio}" step="0.01">
        <select id="p-categoria">
            <option value="entrada"          ${p.categoria === 'entrada'          ? 'selected' : ''}>Entrada</option>
            <option value="plato principal"  ${p.categoria === 'plato principal'  ? 'selected' : ''}>Plato principal</option>
            <option value="postre"           ${p.categoria === 'postre'           ? 'selected' : ''}>Postre</option>
            <option value="bebida"           ${p.categoria === 'bebida'           ? 'selected' : ''}>Bebida</option>
        </select>
        <select id="p-disponible">
            <option value="1" ${p.disponible == 1 ? 'selected' : ''}>Disponible</option>
            <option value="0" ${p.disponible == 0 ? 'selected' : ''}>No disponible</option>
        </select>
        <button class="btn btn-primary" onclick="editarProducto(${p.id})">Guardar</button>
    `);
}

async function editarProducto(id) {
    const nombre      = document.getElementById('p-nombre').value;
    const descripcion = document.getElementById('p-descripcion').value;
    const precio      = document.getElementById('p-precio').value;
    const categoria   = document.getElementById('p-categoria').value;
    const disponible  = document.getElementById('p-disponible').value;

    const res = await fetchAuth(`${URL_PRODUCTOS}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre, descripcion, precio, categoria, disponible })
    });

    const data = await res.json();

    if (res.ok) {
        cerrarModal();
        await renderProductos();
    } else {
        alert(data.message);
    }
}

async function eliminarProducto(id) {
    if (!confirm('¿Está seguro de eliminar este producto?')) return;

    const res  = await fetchAuth(`${URL_PRODUCTOS}/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.ok) {
        await renderProductos();
    } else {
        alert(data.message);
    }
}