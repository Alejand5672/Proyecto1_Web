/**
 * api.js
 * -------
 * Capa de acceso a datos. Toda comunicación con DummyJSON vive aquí.
 * Ningún otro archivo debe hacer fetch directamente.
 *
 * Autor (Persona 1): Diego Guevara — 24128
 * API: https://dummyjson.com/docs/posts
 */

// ─── Configuración base ────────────────────────────────────────────────────

const BASE_URL = 'https://dummyjson.com';

/**
 * Construye la URL completa para un endpoint dado.
 * @param {string} path - Ruta relativa, ej: '/posts' o '/posts/1'
 * @returns {string}
 */
const buildUrl = (path) => `${BASE_URL}${path}`;

/**
 * Maneja la respuesta HTTP: lanza error si el status no es 2xx,
 * y devuelve el JSON parseado.
 * @param {Response} response
 * @returns {Promise<any>}
 */
const handleResponse = async (response) => {
  if (!response.ok) {
    // Intentamos leer el mensaje de error del servidor si existe
    let message = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.message) message = errorBody.message;
    } catch {
      // El body no es JSON, usamos el mensaje genérico
    }
    throw new Error(message);
  }
  return response.json();
};

// ─── Publicaciones (Posts) ─────────────────────────────────────────────────

/**
 * Obtiene una lista paginada de publicaciones.
 * DummyJSON usa `limit` y `skip` para paginación.
 *
 * @param {number} [limit=10] - Cantidad de posts por página
 * @param {number} [skip=0]   - Cantidad de posts a omitir (offset)
 * @returns {Promise<{ posts: Array, total: number, skip: number, limit: number }>}
 *
 * @example
 * const { posts, total } = await getPosts(10, 0); // página 1
 * const { posts }        = await getPosts(10, 10); // página 2
 */
export const getPosts = async (limit = 10, skip = 0) => {
  const url = buildUrl(`/posts?limit=${limit}&skip=${skip}`);
  const response = await fetch(url);
  return handleResponse(response);
};

/**
 * Obtiene el detalle completo de una publicación por su ID.
 *
 * @param {number|string} id - ID del post
 * @returns {Promise<Object>} - Objeto post con: id, title, body, tags, reactions, userId
 *
 * @example
 * const post = await getPostById(1);
 */
export const getPostById = async (id) => {
  const url = buildUrl(`/posts/${id}`);
  const response = await fetch(url);
  return handleResponse(response);
};

/**
 * Crea una nueva publicación (simulado — DummyJSON no persiste el dato).
 * La API devuelve el objeto creado con un ID ficticio.
 *
 * @param {{ title: string, body: string, userId: number, tags?: string[] }} data
 * @returns {Promise<Object>} - Post creado
 *
 * @example
 * const nuevo = await createPost({ title: 'Hola', body: 'Mundo', userId: 1 });
 */
export const createPost = async (data) => {
  const url = buildUrl('/posts/add');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

/**
 * Actualiza parcialmente una publicación existente usando PATCH.
 * (DummyJSON también acepta PUT en /posts/{id} si se prefiere reemplazar todo.)
 *
 * @param {number|string} id    - ID del post a editar
 * @param {{ title?: string, body?: string, tags?: string[] }} data - Campos a actualizar
 * @returns {Promise<Object>} - Post actualizado
 *
 * @example
 * const actualizado = await updatePost(1, { title: 'Nuevo título' });
 */
export const updatePost = async (id, data) => {
  const url = buildUrl(`/posts/${id}`);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

/**
 * Elimina una publicación por ID (simulado — DummyJSON no borra realmente el dato).
 * La API devuelve el objeto eliminado con `isDeleted: true`.
 *
 * @param {number|string} id - ID del post a eliminar
 * @returns {Promise<Object>} - Objeto con `isDeleted: true` y `deletedOn`
 *
 * @example
 * const resultado = await deletePost(1);
 * console.log(resultado.isDeleted); // true
 */
export const deletePost = async (id) => {
  const url = buildUrl(`/posts/${id}`);
  const response = await fetch(url, { method: 'DELETE' });
  return handleResponse(response);
};

// ─── Usuarios (auxiliar para mostrar autor del post) ───────────────────────

/**
 * Obtiene los datos básicos de un usuario por ID.
 * Útil para mostrar el nombre del autor en la vista de detalle.
 *
 * @param {number|string} userId
 * @returns {Promise<{ id: number, firstName: string, lastName: string, username: string }>}
 */
export const getUserById = async (userId) => {
  const url = buildUrl(`/users/${userId}`);
  const response = await fetch(url);
  return handleResponse(response);
};
