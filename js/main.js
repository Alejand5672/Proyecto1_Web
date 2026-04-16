/**
 * main.js
 * --------
 * Punto de entrada de la aplicación.
 * Conecta el router con la API y orquesta cada vista.
 *
 * Responsabilidades de este archivo:
 *  - Registrar rutas en el router
 *  - Llamar a api.js para obtener/enviar datos
 *  - Renderizar contenido mínimo (temporal) hasta que Persona 2 entregue ui.js
 *  - Manejar eventos de los formularios y botones
 *
 * Persona 2 (Luis Hernández) reemplazará las funciones render* de este archivo
 * por las de ui.js una vez las tenga listas. La lógica de datos NO cambia.
 *
 * Autor (Persona 1): Diego Guevara — 24128
 */

import * as api    from './api.js';
import * as router from './router.js';

// ─── Estado global de la app ───────────────────────────────────────────────
// Guardamos aquí datos que necesitan compartirse entre funciones.

const state = {
  posts:        [],   // lista actual de posts en memoria
  currentPage:  0,    // página actual (para paginación)
  postsPerPage: 10,   // posts por página
  totalPosts:   0,    // total reportado por la API
};

// ─── Helpers de UI mínimos (temporales) ────────────────────────────────────
// Luis (Persona 2) reemplazará estas funciones con las de ui.js.
// No mezclar lógica de negocio aquí; solo inserción de HTML básico.

/**
 * Muestra un mensaje de estado en un contenedor dado.
 * Persona 2 lo reemplazará por un spinner o skeleton screen.
 */
const setStatus = (containerId, message) => {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<p class="status-msg">${message}</p>`;
};

/**
 * Renderizado mínimo del listado de posts.
 * Persona 2 reemplazará esto con tarjetas estilizadas desde ui.js.
 */
const renderPostList = (posts) => {
  const container = document.getElementById('posts-container');
  if (!container) return;

  if (!posts.length) {
    container.innerHTML = '<p>No hay publicaciones disponibles.</p>';
    return;
  }

  container.innerHTML = posts
    .map(
      (post) => `
      <article class="post-card" data-id="${post.id}">
        <h2>
          <a href="#/post/${post.id}" class="post-title-link">${post.title}</a>
        </h2>
        <p class="post-excerpt">${post.body.slice(0, 120)}…</p>
        <div class="post-tags">
          ${(post.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}
        </div>
        <div class="post-actions">
          <a href="#/post/${post.id}" class="btn btn-sm">Ver más</a>
          <a href="#/editar/${post.id}" class="btn btn-sm btn-secondary">Editar</a>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${post.id}">
            Eliminar
          </button>
        </div>
      </article>`
    )
    .join('');

  // Adjuntar eventos de eliminar a cada botón generado
  container.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', handleDeletePost);
  });
};

/**
 * Renderizado mínimo del detalle de un post.
 * Persona 2 lo enriquecerá con autor, imagen, comentarios, etc.
 */
const renderPostDetail = (post, author = null) => {
  const container = document.getElementById('post-detail');
  if (!container) return;

  const authorName = author
    ? `${author.firstName} ${author.lastName} (@${author.username})`
    : `Usuario #${post.userId}`;

  container.innerHTML = `
    <article class="post-full">
      <header class="post-header">
        <a href="#/" class="btn btn-sm btn-secondary">← Volver al listado</a>
        <h1>${post.title}</h1>
        <p class="post-meta">Por: <strong>${authorName}</strong></p>
        <div class="post-tags">
          ${(post.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}
        </div>
      </header>

      <div class="post-body">
        <p>${post.body}</p>
      </div>

      <div class="post-reactions">
        👍 ${post.reactions?.likes ?? 0} &nbsp; 👎 ${post.reactions?.dislikes ?? 0}
      </div>

      <footer class="post-footer">
        <a href="#/editar/${post.id}" class="btn">Editar</a>
        <button class="btn btn-danger btn-delete" data-id="${post.id}">
          Eliminar
        </button>
      </footer>
    </article>`;

  // Evento de eliminar en la vista de detalle
  container.querySelector('.btn-delete')
    ?.addEventListener('click', handleDeletePost);
};

/**
 * Rellena el formulario de edición con los datos actuales del post.
 */
const populateEditForm = (post) => {
  const idField    = document.getElementById('edit-post-id');
  const titleField = document.getElementById('edit-title');
  const bodyField  = document.getElementById('edit-body');

  if (idField)    idField.value    = post.id;
  if (titleField) titleField.value = post.title;
  if (bodyField)  bodyField.value  = post.body;
};

/**
 * Renderiza los controles de paginación.
 * Persona 2 puede enriquecer esto con flechas, números de página, etc.
 */
const renderPagination = () => {
  const container = document.getElementById('pagination-controls');
  if (!container) return;

  const totalPages = Math.ceil(state.totalPosts / state.postsPerPage);
  const current    = state.currentPage;

  container.innerHTML = `
    <button id="btn-prev" ${current === 0 ? 'disabled' : ''}>← Anterior</button>
    <span>Página ${current + 1} de ${totalPages}</span>
    <button id="btn-next" ${(current + 1) >= totalPages ? 'disabled' : ''}>Siguiente →</button>
  `;

  document.getElementById('btn-prev')
    ?.addEventListener('click', () => loadPage(current - 1));
  document.getElementById('btn-next')
    ?.addEventListener('click', () => loadPage(current + 1));
};

// ─── Carga de datos por vista ──────────────────────────────────────────────

/**
 * Carga y renderiza una página del listado.
 * @param {number} page - Número de página (base 0)
 */
const loadPage = async (page = 0) => {
  setStatus('posts-container', 'Cargando publicaciones…');

  try {
    const skip           = page * state.postsPerPage;
    const { posts, total } = await api.getPosts(state.postsPerPage, skip);

    state.posts       = posts;
    state.currentPage = page;
    state.totalPosts  = total;

    renderPostList(posts);
    renderPagination();
  } catch (error) {
    setStatus('posts-container', `Error al cargar publicaciones: ${error.message}`);
  }
};

/**
 * Carga y renderiza el detalle de un post.
 * También intenta cargar el autor para mostrarlo.
 * @param {string|number} id
 */
const loadPostDetail = async (id) => {
  setStatus('post-detail', 'Cargando publicación…');

  try {
    const post = await api.getPostById(id);

    // Intentamos obtener el autor; si falla no bloqueamos la vista
    let author = null;
    try {
      author = await api.getUserById(post.userId);
    } catch {
      // El autor no es crítico; continuamos sin él
    }

    renderPostDetail(post, author);
  } catch (error) {
    setStatus('post-detail', `Error al cargar la publicación: ${error.message}`);
  }
};

/**
 * Carga los datos de un post y rellena el formulario de edición.
 * @param {string|number} id
 */
const loadEditForm = async (id) => {
  const feedbackEl = document.getElementById('form-edit-feedback');
  if (feedbackEl) feedbackEl.textContent = 'Cargando datos…';

  try {
    const post = await api.getPostById(id);
    populateEditForm(post);
    if (feedbackEl) feedbackEl.textContent = '';
  } catch (error) {
    if (feedbackEl) feedbackEl.textContent = `Error: ${error.message}`;
  }
};

// ─── Manejadores de eventos de formularios ─────────────────────────────────

/**
 * Maneja el envío del formulario "Crear publicación".
 * Persona 2 añadirá validación desde validation.js antes de este handler.
 */
const handleCreatePost = async (event) => {
  event.preventDefault();

  const title    = document.getElementById('create-title')?.value.trim();
  const body     = document.getElementById('create-body')?.value.trim();
  const tagsRaw  = document.getElementById('create-tags')?.value.trim();
  const feedback = document.getElementById('form-create-feedback');

  // Validación básica mínima (Persona 2 la reemplazará con validation.js)
  if (!title || !body) {
    if (feedback) feedback.textContent = 'El título y el contenido son obligatorios.';
    return;
  }

  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  if (feedback) feedback.textContent = 'Publicando…';

  try {
    // userId 1 es el valor por defecto; Persona 2 puede integrar sesión de usuario
    const newPost = await api.createPost({ title, body, tags, userId: 1 });

    if (feedback) feedback.textContent = `✅ Publicación creada con ID ficticio: ${newPost.id}`;

    // Limpiar formulario
    document.getElementById('form-create')?.reset();

    // Redirigir al listado después de 1.5 s (Persona 2 puede usar un toast aquí)
    setTimeout(() => router.navigate('/'), 1500);
  } catch (error) {
    if (feedback) feedback.textContent = `Error al crear: ${error.message}`;
  }
};

/**
 * Maneja el envío del formulario "Editar publicación".
 * Persona 2 añadirá validación desde validation.js.
 */
const handleEditPost = async (event) => {
  event.preventDefault();

  const id       = document.getElementById('edit-post-id')?.value;
  const title    = document.getElementById('edit-title')?.value.trim();
  const body     = document.getElementById('edit-body')?.value.trim();
  const feedback = document.getElementById('form-edit-feedback');

  if (!title || !body) {
    if (feedback) feedback.textContent = 'El título y el contenido son obligatorios.';
    return;
  }

  if (feedback) feedback.textContent = 'Guardando cambios…';

  try {
    const updated = await api.updatePost(id, { title, body });

    if (feedback) feedback.textContent = `✅ Publicación actualizada: "${updated.title}"`;

    setTimeout(() => router.navigate(`/post/${id}`), 1500);
  } catch (error) {
    if (feedback) feedback.textContent = `Error al actualizar: ${error.message}`;
  }
};

/**
 * Maneja el clic en cualquier botón "Eliminar".
 * El botón debe tener `data-id` con el ID del post.
 * Persona 2 puede reemplazar el confirm() nativo por un modal personalizado.
 */
const handleDeletePost = async (event) => {
  const id = event.currentTarget.dataset.id;
  if (!id) return;

  // Modal nativo temporal; Persona 2 lo reemplaza con su componente modal
  const confirmed = window.confirm('¿Seguro que deseas eliminar esta publicación?');
  if (!confirmed) return;

  try {
    const result = await api.deletePost(id);

    if (result.isDeleted) {
      // Si estamos en el detalle, volvemos al listado
      const currentHash = window.location.hash;
      if (currentHash.startsWith('#/post/')) {
        router.navigate('/');
      } else {
        // Si estamos en el listado, recargamos la página actual
        // y eliminamos el post del estado local para respuesta inmediata
        state.posts = state.posts.filter((p) => String(p.id) !== String(id));
        renderPostList(state.posts);
        renderPagination();
      }
    }
  } catch (error) {
    // Persona 2 mostrará esto como un toast de error
    alert(`Error al eliminar: ${error.message}`);
  }
};

// ─── Registro de rutas ─────────────────────────────────────────────────────

/**
 * Suscribimos a cada ruta su función correspondiente.
 * Cuando el router detecte un cambio de hash, llamará al handler correcto.
 */
const registerRoutes = () => {
  // Listado: carga la primera página
  router.on('/', () => {
    loadPage(state.currentPage);
  });

  // Detalle: carga un post por ID
  router.on('/post/:id', ({ id }) => {
    loadPostDetail(id);
  });

  // Crear: solo limpiamos el formulario y el feedback
  router.on('/crear', () => {
    document.getElementById('form-create')?.reset();
    const feedback = document.getElementById('form-create-feedback');
    if (feedback) feedback.textContent = '';
  });

  // Editar: carga el post y rellena el formulario
  router.on('/editar/:id', ({ id }) => {
    loadEditForm(id);
  });
};

// ─── Eventos de botones de navegación y formularios ────────────────────────

const attachGlobalEvents = () => {
  // Formulario: crear
  document.getElementById('form-create')
    ?.addEventListener('submit', handleCreatePost);

  // Formulario: editar
  document.getElementById('form-edit')
    ?.addEventListener('submit', handleEditPost);

  // Botón cancelar en crear → vuelve al listado
  document.getElementById('btn-create-cancel')
    ?.addEventListener('click', () => router.navigate('/'));

  // Botón cancelar en editar → vuelve al listado
  document.getElementById('btn-edit-cancel')
    ?.addEventListener('click', () => router.navigate('/'));
};

// ─── Inicialización ────────────────────────────────────────────────────────

/**
 * Punto de entrada principal.
 * Se ejecuta cuando el DOM está listo.
 */
const init = () => {
  registerRoutes();
  attachGlobalEvents();
  router.init(); // Inicia el router y resuelve la ruta actual
};

// Esperamos que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', init);
