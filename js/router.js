/**
 * router.js
 * ----------
 * Enrutador basado en hash (#).
 * Se encarga de mostrar la vista correcta y notificar a main.js qué hacer.
 *
 * Rutas disponibles:
 *   #/           → vista listado
 *   #/post/:id   → vista detalle
 *   #/crear      → vista crear
 *   #/editar/:id → vista editar
 *
 * Autor (Persona 1): Diego Guevara — 24128
 */

// ─── IDs de las secciones del DOM (deben coincidir con index.html) ─────────

const VIEWS = {
  list:   'view-list',
  detail: 'view-detail',
  create: 'view-create',
  edit:   'view-edit',
  favorites: 'view-favorites',
};

// ─── Estado interno del router ─────────────────────────────────────────────

/** Guarda los handlers registrados por main.js para cada ruta */
const routeHandlers = {};

// ─── Utilidades ────────────────────────────────────────────────────────────

/**
 * Muestra únicamente la vista indicada y oculta el resto.
 * @param {string} viewId - ID del elemento <section> a mostrar
 */
const showView = (viewId) => {
  Object.values(VIEWS).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    if (id === viewId) {
      el.classList.remove('hidden');
      el.removeAttribute('aria-hidden');
    } else {
      el.classList.add('hidden');
      el.setAttribute('aria-hidden', 'true');
    }
  });
};

/**
 * Parsea el hash actual de la URL y extrae nombre de ruta + parámetros.
 * Ejemplos:
 *   '#/'           → { route: '/',        params: {} }
 *   '#/post/5'     → { route: '/post/:id', params: { id: '5' } }
 *   '#/editar/12'  → { route: '/editar/:id', params: { id: '12' } }
 *
 * @returns {{ route: string, params: Object }}
 */
const parseHash = () => {
  // Obtenemos el hash sin el '#' inicial; si no hay hash, tratamos como '/'
  const raw = window.location.hash.slice(1) || '/';
  const segments = raw.split('/').filter(Boolean); // ['post', '5'] o []

  // Rutas con parámetro numérico: /post/:id y /editar/:id
  if (segments[0] === 'post' && segments[1]) {
    return { route: '/post/:id', params: { id: segments[1] } };
  }
  if (segments[0] === 'editar' && segments[1]) {
    return { route: '/editar/:id', params: { id: segments[1] } };
  }
  if (segments[0] === 'crear') {
    return { route: '/crear', params: {} };
  }
  if (segments[0] === 'favoritos') {
    return { route: '/favoritos', params: {} };
  }

  // Cualquier otra cosa → listado
  return { route: '/', params: {} };
};

// ─── API pública del router ────────────────────────────────────────────────

/**
 * Registra un handler para una ruta específica.
 * main.js llama a esto para suscribirse a cambios de ruta.
 *
 * @param {string}   route   - Ruta a escuchar, ej: '/post/:id'
 * @param {Function} handler - Función a ejecutar cuando se active esa ruta.
 *                             Recibe `params` como argumento.
 *
 * @example
 * router.on('/post/:id', ({ id }) => cargarDetalle(id));
 */
export const on = (route, handler) => {
  routeHandlers[route] = handler;
};

/**
 * Navega a una nueva ruta actualizando el hash.
 * Esto dispara automáticamente el evento 'hashchange'.
 *
 * @param {string} path - Ruta destino, ej: '/post/5' o '/crear'
 *
 * @example
 * router.navigate('/post/3');
 * router.navigate('/');
 */
export const navigate = (path) => {
  window.location.hash = path;
};

/**
 * Procesa el hash actual y ejecuta el handler correspondiente.
 * Se llama en cada cambio de ruta y al iniciar la app.
 */
export const resolve = () => {
  const { route, params } = parseHash();

  // Mostrar la vista correcta
  switch (route) {
    case '/':          showView(VIEWS.list);   break;
    case '/post/:id':  showView(VIEWS.detail); break;
    case '/crear':     showView(VIEWS.create); break;
    case '/editar/:id':showView(VIEWS.edit);   break;
    case '/favoritos': showView(VIEWS.favorites); break;
    default:           showView(VIEWS.list);  
  }

  // Ejecutar el handler registrado (si existe)
  const handler = routeHandlers[route];
  if (typeof handler === 'function') {
    handler(params);
  }
};

/**
 * Inicializa el router: escucha cambios de hash y resuelve la ruta inicial.
 * Debe llamarse una sola vez desde main.js.
 */
export const init = () => {
  window.addEventListener('hashchange', resolve);
  // Resolver la ruta que ya está en la URL al cargar la página
  resolve();
};
