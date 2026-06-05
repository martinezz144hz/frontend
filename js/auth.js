// ============================================
// CONFIGURACIÓN DE URLS DE MICROSERVICIOS
// ============================================
const API = {
  auth:      'http://localhost:3010',
  reservas:  'http://localhost:3020',
  productos: 'http://localhost:3030',
  pedidos:   'http://localhost:3040',
};
 
// ============================================
// MANEJO DE SESIÓN (token en localStorage)
// ============================================
 
function guardarSesion(token, usuario) {
  localStorage.setItem('token', token);
  localStorage.setItem('usuario', usuario);
}
 
function obtenerToken() {
  return localStorage.getItem('token');
}
 
function obtenerUsuario() {
  return localStorage.getItem('usuario');
}
 
function limpiarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}
 
function haySesion() {
  return obtenerToken() !== null;
}
 
// ============================================
// LOGIN
// ============================================
 
async function login() {
  const usuario  = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value.trim();
  const errorDiv = document.getElementById('login-error');
 
  // Validación básica en cliente
  if (!usuario || !password) {
    mostrarError(errorDiv, 'Por favor completa todos los campos.');
    return;
  }
 
  const btnLogin = document.getElementById('btn-login');
  btnLogin.disabled = true;
  btnLogin.textContent = 'Ingresando...';
 
  try {
    const response = await fetch(`${API.auth}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, password }),
    });
 
    const data = await response.json();
 
    if (response.ok && data.token) {
      guardarSesion(data.token, data.usuario ?? usuario);
      errorDiv.classList.add('hidden');
      mostrarPantallaMain();
    } else {
      mostrarError(errorDiv, data.message ?? 'Credenciales incorrectas.');
    }
 
  } catch (error) {
    mostrarError(errorDiv, 'No se pudo conectar con el servidor. Verifica que ms-auth esté corriendo.');
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Ingresar';
  }
}
 
// ============================================
// LOGOUT
// ============================================
 
async function logout() {
  const token = obtenerToken();
 
  try {
    await fetch(`${API.auth}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });
  } catch (error) {
    // Si el servidor falla igual limpiamos la sesión local
    console.warn('No se pudo contactar ms-auth al cerrar sesión.');
  } finally {
    limpiarSesion();
    mostrarPantallaLogin();
  }
}
 
// ============================================
// VALIDAR SESIÓN AL CARGAR LA PÁGINA
// ============================================
 
async function validarSesion() {
  if (!haySesion()) {
    mostrarPantallaLogin();
    return;
  }
 
  try {
    const response = await fetch(`${API.auth}/validate`, {
      method: 'GET',
      headers: { 'Authorization': obtenerToken() },
    });
 
    if (response.ok) {
      mostrarPantallaMain();
    } else {
      limpiarSesion();
      mostrarPantallaLogin();
    }
  } catch (error) {
    // Si no hay conexión pero hay token, dejamos pasar (modo offline básico)
    console.warn('No se pudo validar sesión con el servidor.');
    mostrarPantallaMain();
  }
}
 
// ============================================
// HELPERS DE PANTALLA
// ============================================
 
function mostrarPantallaLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('main-screen').classList.add('hidden');
  document.getElementById('main-screen').classList.remove('active');
}
 
function mostrarPantallaMain() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('main-screen').classList.remove('hidden');
  document.getElementById('main-screen').classList.add('active');
 
  // Mostrar nombre de usuario en sidebar
  const nombreEl = document.getElementById('sidebar-user');
  if (nombreEl) nombreEl.textContent = obtenerUsuario();
}
 
function mostrarError(div, mensaje) {
  div.textContent = mensaje;
  div.classList.remove('hidden');
}
 
// ============================================
// HELPER GLOBAL PARA FETCH AUTENTICADO
// Úsalo en mesas.js, reservas.js, etc.
// ============================================
 
async function fetchAuth(url, opciones = {}) {
  const token = obtenerToken();
 
  const config = {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
      ...(opciones.headers ?? {}),
    },
  };
 
  const response = await fetch(url, config);
 
  // Si el token expiró o es inválido, mandamos al login
  if (response.status === 401) {
    limpiarSesion();
    mostrarPantallaLogin();
    throw new Error('Sesión expirada.');
  }
 
  return response;
}
 
// ============================================
// EVENTOS
// ============================================
 
document.addEventListener('DOMContentLoaded', () => {
  // Botón login
  document.getElementById('btn-login').addEventListener('click', login);
 
  // Login con Enter
  document.getElementById('login-pass').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') login();
  });
 
  // Botón logout
  document.getElementById('btn-logout').addEventListener('click', logout);
 
  // Validar si ya hay sesión activa
  validarSesion();
});

//brrrrr