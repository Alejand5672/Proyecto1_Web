/**
 * ui.js
 * ------
 * Módulo de interfaz de usuario. Solo manipula DOM y renderiza.
 * NO hace fetch. Recibe datos como parámetros desde main.js.
 *
 * Autor (Persona 2): Luis Hernández — 241424
 */

// ─── Favoritos ───────

const FAV_KEY = 'blogapp_favorites';

/** Devuelve el Set de IDs favoritos guardados. */
const getFavIds = () => {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};

/** Persiste el Set de IDs en localStorage. */
const saveFavIds = (set) => {
  localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
};

/** Alterna favorito. Devuelve true si quedó marcado. */
export const toggleFavorite = (postId) => {
  const favs = getFavIds();
  const id   = String(postId);
  if (favs.has(id)) {
    favs.delete(id);
  } else {
    favs.add(id);
  }
  saveFavIds(favs);
  return favs.has(id);
};

export const isFavorite  = (postId) => getFavIds().has(String(postId));
export const getFavorites = () => [...getFavIds()];
export const clearFavorites = () => localStorage.removeItem(FAV_KEY);

// ─── Toast ─────

const TOAST_ICONS = { success: '✓', error: '✕', info: 'ℹ' };

/**
 * Muestra un toast flotante.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 * @param {number} [duration=3200]
 */
export const showToast = (message, type = 'info', duration = 3200) => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] ?? 'ℹ'}</span>
    <span class="toast-msg">${message}</span>
  `;

  container.appendChild(toast);

  const remove = () => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  setTimeout(remove, duration);
};

// ─── Modal de confirmación ─────

/**
 * Muestra un modal de confirmación personalizado.
 * @param {string} message - Texto de la pregunta
 * @param {string} [confirmLabel='Eliminar']
 * @returns {Promise<boolean>} - true si el usuario confirma
 */
export const showConfirmModal = (message, confirmLabel = 'Eliminar') => {
  return new Promise((resolve) => {
    // Eliminamos modal previo si existe
    document.getElementById('modal-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="Confirmación">
        <div class="modal-icon">🗑️</div>
        <h3>¿Estás seguro?</h3>
        <p>${message}</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" id="modal-cancel">Cancelar</button>
          <button class="btn btn-danger"    id="modal-confirm">${confirmLabel}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = (result) => {
      overlay.querySelector('.modal').style.animation = 'modalIn 200ms ease reverse both';
      setTimeout(() => overlay.remove(), 200);
      resolve(result);
    };

    overlay.querySelector('#modal-confirm').addEventListener('click', () => cleanup(true));
    overlay.querySelector('#modal-cancel').addEventListener('click',  () => cleanup(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) cleanup(false); });

    // Foco accesible
    overlay.querySelector('#modal-cancel').focus();
  });
};

// ─── Spinner / Loading ───────

/**
 * Inserta un spinner de carga en el contenedor indicado.
 * @param {string|HTMLElement} containerOrId
 * @param {string} [label='Cargando…']
 */
export const showLoading = (containerOrId, label = 'Cargando…') => {
  const el = typeof containerOrId === 'string'
    ? document.getElementById(containerOrId)
    : containerOrId;
  if (!el) return;

  el.innerHTML = `
    <div class="spinner-wrapper">
      <div class="spinner" aria-hidden="true"></div>
      <span>${label}</span>
    </div>
  `;
};

// ─── Estado vacío ──────

/**
 * Muestra un estado vacío con icono y mensaje.
 * @param {string|HTMLElement} containerOrId
 * @param {string} [message='No hay resultados.']
 * @param {string} [icon='📭']
 */
export const showEmpty = (containerOrId, message = 'No hay resultados.', icon = '📭') => {
  const el = typeof containerOrId === 'string'
    ? document.getElementById(containerOrId)
    : containerOrId;
  if (!el) return;

  el.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3>Sin publicaciones</h3>
      <p>${message}</p>
    </div>
  `;
};

// ─── Estado de error ─────

/**
 * Muestra un mensaje de error visual en un contenedor.
 * @param {string|HTMLElement} containerOrId
 * @param {string} message
 */
export const showError = (containerOrId, message) => {
  const el = typeof containerOrId === 'string'
    ? document.getElementById(containerOrId)
    : containerOrId;
  if (!el) return;

  el.innerHTML = `
    <div class="error-state">
      <div class="error-state-icon">⚠️</div>
      <strong>Ocurrió un error</strong>
      <p>${message}</p>
    </div>
  `;
};

// ─── Feedback de formularios ─────────

/**
 * Aplica clase y texto al div de feedback de un formulario.
 * @param {string} elementId
 * @param {string} message
 * @param {'success'|'error'|'loading'|''} type
 */
export const setFormFeedback = (elementId, message, type = '') => {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = type ? `feedback-${type}` : '';
  el.textContent = message;
};

export const clearFeedback = (elementId) => {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = '';
  el.textContent = '';
};

// ─── Renderizado del listado ──────────

/**
 * Renderiza la cuadrícula de tarjetas de posts.
 * @param {Array}    posts     - Array de post objects
 * @param {Function} onDelete  - handler(id)
 * @param {Function} onFav     - handler(id, btn)
 */
export const renderPostList = (posts, onDelete, onFav) => {
  const container = document.getElementById('posts-container');
  if (!container) return;

  if (!posts.length) {
    showEmpty(container, 'No se encontraron publicaciones con esos criterios.', '📭');
    return;
  }

  container.innerHTML = posts.map((post, i) => `
    <article class="post-card" data-id="${post.id}" style="animation-delay:${i * 40}ms">
      <h2>
        <a href="#/post/${post.id}" class="post-title-link">${escHtml(post.title)}</a>
      </h2>
      <p class="post-excerpt">${escHtml(post.body.slice(0, 130))}…</p>
      <div class="post-tags">
        ${(post.tags || []).map((t) => `<span class="tag">${escHtml(t)}</span>`).join('')}
      </div>
      <div class="post-actions">
        <a href="#/post/${post.id}" class="btn btn-sm">Ver más</a>
        <a href="#/editar/${post.id}" class="btn btn-sm btn-secondary">Editar</a>
        <button class="btn btn-sm btn-danger  btn-delete" data-id="${post.id}">Eliminar</button>
        <button class="btn-fav btn-fav-toggle ${isFavorite(post.id) ? 'is-fav' : ''}"
                data-id="${post.id}" title="Marcar favorito">
          Favorito
        </button>
      </div>
    </article>
  `).join('');

  // Eventos
  container.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => onDelete && onDelete(btn.dataset.id));
  });

  container.querySelectorAll('.btn-fav-toggle').forEach((btn) => {
    btn.addEventListener('click', () => onFav && onFav(btn.dataset.id, btn));
  });
};

// ─── Renderizado del detalle ──────

/**
 * Renderiza el detalle completo de un post.
 * @param {Object}   post
 * @param {Object|null} author
 * @param {Function} onDelete  - handler(id)
 * @param {Function} onFav     - handler(id, btn)
 */
export const renderPostDetail = (post, author = null, onDelete, onFav) => {
  const container = document.getElementById('post-detail');
  if (!container) return;

  const authorName = author
    ? `${escHtml(author.firstName)} ${escHtml(author.lastName)} <span class="text-muted text-sm">@${escHtml(author.username)}</span>`
    : `Usuario #${post.userId}`;

  const favClass = isFavorite(post.id) ? 'is-fav' : '';

  container.innerHTML = `
    <article class="post-full">
      <header class="post-header">
        <a href="#/" class="btn btn-sm btn-secondary">← Volver</a>
        <h1>${escHtml(post.title)}</h1>
        <p class="post-meta">Por: <strong>${authorName}</strong></p>
        <div class="post-tags">
          ${(post.tags || []).map((t) => `<span class="tag">${escHtml(t)}</span>`).join('')}
        </div>
      </header>

      <div class="post-body">
        <p>${escHtml(post.body)}</p>
      </div>

      <div class="post-reactions">
        👍 <strong>${post.reactions?.likes ?? 0}</strong>
        &nbsp;&nbsp;
        👎 <strong>${post.reactions?.dislikes ?? 0}</strong>
      </div>

      <footer class="post-footer">
        <a href="#/editar/${post.id}" class="btn">Editar</a>
        <button class="btn btn-danger btn-delete" data-id="${post.id}">Eliminar</button>
        <button class="btn-fav btn-fav-toggle ${favClass}" data-id="${post.id}">Favorito</button>
      </footer>
    </article>
  `;

  container.querySelector('.btn-delete')
    ?.addEventListener('click', () => onDelete && onDelete(post.id));

  container.querySelector('.btn-fav-toggle')
    ?.addEventListener('click', (e) => onFav && onFav(post.id, e.currentTarget));
};

// ─── Renderizado de paginación ────────

/**
 * @param {number}   currentPage   - Base 0
 * @param {number}   totalPages
 * @param {Function} onPrev
 * @param {Function} onNext
 */
export const renderPagination = (currentPage, totalPages, onPrev, onNext) => {
  const container = document.getElementById('pagination-controls');
  if (!container) return;

  if (totalPages <= 1) { container.innerHTML = ''; return; }

  container.innerHTML = `
    <nav class="pagination" aria-label="Paginación">
      <button class="btn btn-sm btn-secondary" id="btn-prev"
              ${currentPage === 0 ? 'disabled' : ''}>← Anterior</button>
      <span class="pagination-info">Página ${currentPage + 1} de ${totalPages}</span>
      <button class="btn btn-sm btn-secondary" id="btn-next"
              ${currentPage + 1 >= totalPages ? 'disabled' : ''}>Siguiente →</button>
    </nav>
  `;

  document.getElementById('btn-prev')?.addEventListener('click', onPrev);
  document.getElementById('btn-next')?.addEventListener('click', onNext);
};

// ─── Filtros ───────

/**
 * Renderiza la barra de filtros en #list-controls.
 * @param {Function} onChange - Se llama con { search, tag, userId } al cambiar cualquier filtro
 * @param {Function} onClear  - Limpia filtros
 */
export const renderFilters = (onChange, onClear) => {
  const container = document.getElementById('list-controls');
  if (!container) return;

  container.innerHTML = `
    <div class="filter-bar">
      <div class="filter-group">
        <label for="filter-search">Buscar</label>
        <input type="search" id="filter-search" placeholder="Título o contenido…" autocomplete="off" />
      </div>
      <div class="filter-group">
        <label for="filter-tag">Etiqueta</label>
        <input type="text" id="filter-tag" placeholder="ej: history" autocomplete="off" />
      </div>
      <div class="filter-group">
        <label for="filter-user">Usuario ID</label>
        <input type="number" id="filter-user" placeholder="ej: 5" min="1" style="max-width:100px" />
      </div>
      <div class="filter-actions">
        <button class="btn btn-sm" id="btn-apply-filters">Filtrar</button>
        <button class="btn btn-sm btn-secondary" id="btn-clear-filters">Limpiar</button>
      </div>
    </div>
  `;

  const getValues = () => ({
    search: document.getElementById('filter-search')?.value.trim().toLowerCase() ?? '',
    tag:    document.getElementById('filter-tag')?.value.trim().toLowerCase()    ?? '',
    userId: document.getElementById('filter-user')?.value.trim()                 ?? '',
  });

  document.getElementById('btn-apply-filters')?.addEventListener('click', () => onChange(getValues()));
  document.getElementById('btn-clear-filters')?.addEventListener('click', () => {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-tag').value    = '';
    document.getElementById('filter-user').value   = '';
    onClear();
  });

  // Filtro al presionar Enter
  ['filter-search', 'filter-tag', 'filter-user'].forEach((id) => {
    document.getElementById(id)?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') onChange(getValues());
    });
  });
};

// ─── Vista de Favoritos ─────────

/**
 * Renderiza la vista de favoritos a partir de un array de post objects.
 * @param {Array}    posts    - Posts que están en favoritos
 * @param {Function} onRemove - handler(id)
 */
export const renderFavoritesView = (posts, onRemove) => {
  const container = document.getElementById('favorites-container');
  if (!container) return;

  if (!posts.length) {
    showEmpty(container, 'Aún no has guardado ninguna publicación como favorita.', '⭐');
    return;
  }

  container.innerHTML = posts.map((post, i) => `
    <article class="post-card" data-id="${post.id}" style="animation-delay:${i * 40}ms">
      <h2>
        <a href="#/post/${post.id}" class="post-title-link">${escHtml(post.title)}</a>
      </h2>
      <p class="post-excerpt">${escHtml(post.body.slice(0, 130))}…</p>
      <div class="post-tags">
        ${(post.tags || []).map((t) => `<span class="tag">${escHtml(t)}</span>`).join('')}
      </div>
      <div class="post-actions">
        <a href="#/post/${post.id}" class="btn btn-sm">Ver más</a>
        <button class="btn btn-sm btn-secondary btn-remove-fav" data-id="${post.id}">
          ★ Quitar favorito
        </button>
      </div>
    </article>
  `).join('');

  container.querySelectorAll('.btn-remove-fav').forEach((btn) => {
    btn.addEventListener('click', () => onRemove && onRemove(btn.dataset.id));
  });
};

// ─── Actualizar botón de favorito sin re-render ───────

/**
 * Actualiza visualmente el botón de favorito tras togglearlo.
 */
export const updateFavBtn = (btn, isFav) => {
  if (!btn) return;
  btn.classList.toggle('is-fav', isFav);
  btn.title = isFav ? 'Quitar de favoritos' : 'Marcar como favorito';
};

// ─── Utilidad interna ───────

/** Escapa HTML para evitar XSS al renderizar datos externos. */
const escHtml = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};