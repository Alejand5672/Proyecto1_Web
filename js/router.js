/**
 * router.js
 * Autores:
 *   Persona 1: Diego Guevara — 24128
 *   Persona 2: Luis Hernández — 241424
 */

const VIEWS = {
  list:      'view-list',
  detail:    'view-detail',
  create:    'view-create',
  edit:      'view-edit',
  favorites: 'view-favorites',
};

const routeHandlers = {};

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

const parseHash = () => {
  const raw      = window.location.hash.slice(1) || '/';
  const segments = raw.split('/').filter(Boolean);

  if (segments[0] === 'post'    && segments[1]) return { route: '/post/:id',    params: { id: segments[1] } };
  if (segments[0] === 'editar'  && segments[1]) return { route: '/editar/:id',  params: { id: segments[1] } };
  if (segments[0] === 'crear')                  return { route: '/crear',        params: {} };
  if (segments[0] === 'favoritos')              return { route: '/favoritos',    params: {} };
  return { route: '/', params: {} };
};

export const on = (route, handler) => { routeHandlers[route] = handler; };

export const navigate = (path) => { window.location.hash = path; };

export const resolve = () => {
  const { route, params } = parseHash();

  switch (route) {
    case '/':           showView(VIEWS.list);      break;
    case '/post/:id':   showView(VIEWS.detail);    break;
    case '/crear':      showView(VIEWS.create);    break;
    case '/editar/:id': showView(VIEWS.edit);      break;
    case '/favoritos':  showView(VIEWS.favorites); break;
    default:            showView(VIEWS.list);
  }

  const handler = routeHandlers[route];
  if (typeof handler === 'function') handler(params);
};

export const init = () => {
  window.addEventListener('hashchange', resolve);
  resolve();
};
