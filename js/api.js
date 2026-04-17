/**
 * api.js
 * -------
 * Capa de acceso a datos. Todo con DummyJSON vive aquí.
 *
 * Autores:
 *   Persona 1: Diego Guevara — 24128
 *   Persona 2: Luis Hernández — 241424
 * API: https://dummyjson.com/docs/posts
 */

// ─── Configuración base ────────────────────────────────────────────────────

const BASE_URL = 'https://dummyjson.com';

const buildUrl = (path) => `${BASE_URL}${path}`;

const handleResponse = async (response) => {
  if (!response.ok) {
    let message = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.message) message = errorBody.message;
    } catch { /* body no es JSON */ }
    throw new Error(message);
  }
  return response.json();
};

// ─── Publicaciones (Posts) ─────────────────────────────────────────────────

export const getPosts = async (limit = 10, skip = 0) => {
  const url = buildUrl(`/posts?limit=${limit}&skip=${skip}`);
  const response = await fetch(url);
  return handleResponse(response);
};

export const getPostById = async (id) => {
  const url = buildUrl(`/posts/${id}`);
  const response = await fetch(url);
  return handleResponse(response);
};

export const createPost = async (data) => {
  const url = buildUrl('/posts/add');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updatePost = async (id, data) => {
  const url = buildUrl(`/posts/${id}`);
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deletePost = async (id) => {
  const url = buildUrl(`/posts/${id}`);
  const response = await fetch(url, { method: 'DELETE' });
  return handleResponse(response);
};

// ─── Usuarios ──────────────────────────────────────────────────────────────

export const getUserById = async (userId) => {
  const url = buildUrl(`/users/${userId}`);
  const response = await fetch(url);
  return handleResponse(response);
};

/**
 * Obtiene múltiples usuarios en paralelo dado un array de IDs únicos.
 * Devuelve un Map de { userId -> { firstName, lastName, username } }
 * para lookup O(1) al renderizar cards.
 *
 * @param {number[]} userIds
 * @returns {Promise<Map<number, Object>>}
 */
export const getUsersByIds = async (userIds) => {
  const unique = [...new Set(userIds)];
  const results = await Promise.allSettled(unique.map((id) => getUserById(id)));
  const map = new Map();
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') map.set(unique[i], r.value);
  });
  return map;
};
