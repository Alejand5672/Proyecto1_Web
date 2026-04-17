/**
 * main.js
 * --------
 * Punto de entrada de la aplicación.
 * Orquesta router, api, ui y validation. Contiene solo lógica de control.
 *
 * Autores:
 *   Persona 1: Diego Guevara — 24128
 *   Persona 2: Luis Hernández — 241424
 */

import * as api        from './api.js';
import * as router     from './router.js';
import * as ui         from './ui.js';
import * as validation from './validation.js';

// ─── Estado global ─────────────────────────────────────────────────────────

const state = {
  posts:        [],
  allPosts:     [],
  authorsMap:   new Map(),   // Map<userId, author> para el listado actual
  currentPage:  0,
  postsPerPage: 10,
  totalPosts:   0,
  filters:      { search: '', tag: '', userId: '' },

  // Estado de la vista de favoritos
  favPosts:     [],          // todos los posts favoritos cargados
  favFilters:   { search: '', tag: '' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Filtra state.allPosts según state.filters y re-renderiza el listado. */
const applyFilters = () => {
  const { search, tag, userId } = state.filters;

  const filtered = state.allPosts.filter((post) => {
    const matchSearch = !search ||
      post.title.toLowerCase().includes(search) ||
      post.body.toLowerCase().includes(search);
    const matchTag    = !tag ||
      (post.tags || []).some((t) => t.toLowerCase().includes(tag));
    const matchUser   = !userId || String(post.userId) === userId;
    return matchSearch && matchTag && matchUser;
  });

  ui.renderPostList(filtered, state.authorsMap, handleDeletePost, handleToggleFav);
};

/** Filtra state.favPosts según state.favFilters y re-renderiza favoritos. */
const applyFavFilters = () => {
  const { search, tag } = state.favFilters;

  const filtered = state.favPosts.filter((post) => {
    const matchSearch = !search ||
      post.title.toLowerCase().includes(search) ||
      post.body.toLowerCase().includes(search);
    const matchTag = !tag ||
      (post.tags || []).some((t) => t.toLowerCase().includes(tag));
    return matchSearch && matchTag;
  });

  ui.renderFavoritesView(filtered, handleRemoveFav);
};

// ─── Carga de datos ────────────────────────────────────────────────────────

const loadPage = async (page = 0) => {
  ui.showLoading('posts-container', 'Cargando publicaciones…');

  try {
    const skip             = page * state.postsPerPage;
    const { posts, total } = await api.getPosts(state.postsPerPage, skip);

    state.posts       = posts;
    state.allPosts    = posts;
    state.currentPage = page;
    state.totalPosts  = total;
    state.filters     = { search: '', tag: '', userId: '' };

    // ── Carga de autores en paralelo para las cards ──
    const userIds = posts.map((p) => p.userId);
    state.authorsMap = await api.getUsersByIds(userIds);

    ui.renderFilters(
      (values) => { state.filters = values; applyFilters(); },
      ()       => { state.filters = { search: '', tag: '', userId: '' }; applyFilters(); }
    );

    ui.renderPostList(posts, state.authorsMap, handleDeletePost, handleToggleFav);

    const totalPages = Math.ceil(total / state.postsPerPage);
    ui.renderPagination(
      page, totalPages,
      () => loadPage(page - 1),
      () => loadPage(page + 1)
    );
  } catch (error) {
    ui.showError('posts-container', error.message);
  }
};

const loadPostDetail = async (id) => {
  ui.showLoading('post-detail', 'Cargando publicación…');

  try {
    const post = await api.getPostById(id);

    let author = null;
    try { author = await api.getUserById(post.userId); } catch { /* no crítico */ }

    ui.renderPostDetail(post, author, handleDeletePost, handleToggleFav);
  } catch (error) {
    ui.showError('post-detail', error.message);
  }
};

const loadEditForm = async (id) => {
  ui.setFormFeedback('form-edit-feedback', 'Cargando datos…', 'loading');

  try {
    const post = await api.getPostById(id);
    populateEditForm(post);
    ui.clearFeedback('form-edit-feedback');
  } catch (error) {
    ui.setFormFeedback('form-edit-feedback', `Error: ${error.message}`, 'error');
  }
};

const populateEditForm = (post) => {
  const idField    = document.getElementById('edit-post-id');
  const titleField = document.getElementById('edit-title');
  const bodyField  = document.getElementById('edit-body');
  if (idField)    idField.value    = post.id;
  if (titleField) titleField.value = post.title;
  if (bodyField)  bodyField.value  = post.body;
};

// ─── Favoritos ─────────────────────────────────────────────────────────────

const handleToggleFav = (postId, btn) => {
  const isFav = ui.toggleFavorite(postId);
  ui.updateFavBtn(btn, isFav);
  ui.showToast(isFav ? 'Añadido a favoritos ⭐' : 'Quitado de favoritos', isFav ? 'success' : 'info');
};

/** Quita favorito desde la vista de favoritos y re-aplica filtros. */
const handleRemoveFav = (id) => {
  ui.toggleFavorite(id);
  state.favPosts = state.favPosts.filter((p) => String(p.id) !== String(id));
  ui.showToast('Quitado de favoritos', 'info');
  applyFavFilters();
};

const loadFavoritesView = async () => {
  const favIds = ui.getFavorites();

  // Resetear filtros al entrar a la vista
  state.favFilters = { search: '', tag: '' };

  // Renderizar barra de filtros
  ui.renderFavFilters(
    (values) => { state.favFilters = values; applyFavFilters(); },
    ()       => { state.favFilters = { search: '', tag: '' }; applyFavFilters(); }
  );

  if (!favIds.length) {
    state.favPosts = [];
    ui.showEmpty('favorites-container', 'Aún no tienes favoritos guardados.', '⭐');
    return;
  }

  ui.showLoading('favorites-container', 'Cargando favoritos…');

  try {
    const results = await Promise.allSettled(favIds.map((id) => api.getPostById(id)));
    state.favPosts = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);

    applyFavFilters();
  } catch (error) {
    ui.showError('favorites-container', error.message);
  }
};

// ─── Manejadores de formularios ────────────────────────────────────────────

const handleCreatePost = async (event) => {
  event.preventDefault();

  const title   = document.getElementById('create-title')?.value ?? '';
  const body    = document.getElementById('create-body')?.value  ?? '';
  const tagsRaw = document.getElementById('create-tags')?.value  ?? '';

  const isValid = validation.validateCreateForm({ title, body });
  if (!isValid) return;

  const tags = validation.parseTags(tagsRaw);
  ui.setFormFeedback('form-create-feedback', 'Publicando…', 'loading');

  try {
    const newPost = await api.createPost({ title: title.trim(), body: body.trim(), tags, userId: 1 });

    ui.setFormFeedback('form-create-feedback', `Publicación creada (ID: ${newPost.id})`, 'success');
    ui.showToast('¡Publicación creada exitosamente!', 'success');
    document.getElementById('form-create')?.reset();
    validation.clearFormErrors('create');

    setTimeout(() => router.navigate('/'), 1500);
  } catch (error) {
    ui.setFormFeedback('form-create-feedback', `Error al crear: ${error.message}`, 'error');
    ui.showToast(`Error: ${error.message}`, 'error');
  }
};

const handleEditPost = async (event) => {
  event.preventDefault();

  const id    = document.getElementById('edit-post-id')?.value  ?? '';
  const title = document.getElementById('edit-title')?.value    ?? '';
  const body  = document.getElementById('edit-body')?.value     ?? '';

  const isValid = validation.validateEditForm({ title, body });
  if (!isValid) return;

  ui.setFormFeedback('form-edit-feedback', 'Guardando cambios…', 'loading');

  try {
    const updated = await api.updatePost(id, { title: title.trim(), body: body.trim() });

    ui.setFormFeedback('form-edit-feedback', `"${updated.title}" actualizado.`, 'success');
    ui.showToast('¡Publicación actualizada!', 'success');

    setTimeout(() => router.navigate(`/post/${id}`), 1500);
  } catch (error) {
    ui.setFormFeedback('form-edit-feedback', `Error: ${error.message}`, 'error');
    ui.showToast(`Error: ${error.message}`, 'error');
  }
};

const handleDeletePost = async (id) => {
  if (!id) return;

  const confirmed = await ui.showConfirmModal(
    'Esta acción no se puede deshacer. ¿Deseas continuar?'
  );
  if (!confirmed) return;

  try {
    const result = await api.deletePost(id);

    if (result.isDeleted) {
      ui.showToast('Publicación eliminada.', 'info');

      if (window.location.hash.startsWith('#/post/')) {
        router.navigate('/');
      } else {
        state.posts    = state.posts.filter((p) => String(p.id) !== String(id));
        state.allPosts = state.allPosts.filter((p) => String(p.id) !== String(id));
        applyFilters();
        ui.renderPagination(
          state.currentPage,
          Math.ceil(state.totalPosts / state.postsPerPage),
          () => loadPage(state.currentPage - 1),
          () => loadPage(state.currentPage + 1)
        );
      }
    }
  } catch (error) {
    ui.showToast(`Error al eliminar: ${error.message}`, 'error');
  }
};

// ─── Registro de rutas ─────────────────────────────────────────────────────

const registerRoutes = () => {
  router.on('/', () => loadPage(state.currentPage));
  router.on('/post/:id',   ({ id }) => loadPostDetail(id));
  router.on('/crear',      () => {
    document.getElementById('form-create')?.reset();
    validation.clearFormErrors('create');
    ui.clearFeedback('form-create-feedback');
  });
  router.on('/editar/:id', ({ id }) => loadEditForm(id));
  router.on('/favoritos',  () => loadFavoritesView());
};

// ─── Eventos globales ──────────────────────────────────────────────────────

const attachGlobalEvents = () => {
  document.getElementById('form-create')?.addEventListener('submit', handleCreatePost);
  document.getElementById('form-edit')?.addEventListener('submit', handleEditPost);
  document.getElementById('btn-create-cancel')?.addEventListener('click', () => router.navigate('/'));
  document.getElementById('btn-edit-cancel')?.addEventListener('click',   () => router.navigate('/'));

  validation.attachLiveValidation('create-title', 'title', 'error-create-title');
  validation.attachLiveValidation('create-body',  'body',  'error-create-body');
  validation.attachLiveValidation('edit-title',   'title', 'error-edit-title');
  validation.attachLiveValidation('edit-body',    'body',  'error-edit-body');
};

// ─── Inicialización ────────────────────────────────────────────────────────

const init = () => {
  registerRoutes();
  attachGlobalEvents();
  router.init();
};

document.addEventListener('DOMContentLoaded', init);
