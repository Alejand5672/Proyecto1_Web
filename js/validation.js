/**
 * validation.js
 * --------------
 * Validación de formularios. Solo valida y manipula mensajes de error inline.
 * No hace fetch. No renderiza posts. Exporta funciones puras y helpers de DOM.
 *
 * Autor (Persona 2): Luis Hernández — 241424
 */

// ─── Reglas de validación ─────────

const RULES = {
  title: {
    required: true,
    minLength: 5,
    maxLength: 150,
    label: 'El título',
  },
  body: {
    required: true,
    minLength: 20,
    maxLength: 5000,
    label: 'El contenido',
  },
  tags: {
    required: false,
    label: 'Las etiquetas',
  },
};

// ─── Helpers de error inline ────────────

/**
 * Muestra un mensaje de error en el span correspondiente al campo.
 * También aplica clase visual al input/textarea.
 * @param {string} spanId  - ID del <span class="field-error">
 * @param {string} message
 */
export const showFieldError = (spanId, message) => {
  const span = document.getElementById(spanId);
  if (span) span.textContent = message;

  // Derivamos el input ID desde el span ID (ej: error-create-title → create-title)
  const inputId = spanId.replace(/^error-/, '');
  const input   = document.getElementById(inputId);
  if (input) input.classList.add('input-error');
};

/**
 * Limpia el error de un campo específico.
 * @param {string} spanId
 */
export const clearFieldError = (spanId) => {
  const span = document.getElementById(spanId);
  if (span) span.textContent = '';

  const inputId = spanId.replace(/^error-/, '');
  const input   = document.getElementById(inputId);
  if (input) input.classList.remove('input-error');
};

/**
 * Limpia todos los errores de un formulario.
 * @param {'create'|'edit'} formType
 */
export const clearFormErrors = (formType) => {
  ['title', 'body'].forEach((field) => {
    clearFieldError(`error-${formType}-${field}`);
  });
};

// ─── Validación de un campo individual ─────────

/**
 * Valida un valor contra las reglas de un campo.
 * @param {string} field  - 'title' | 'body' | 'tags'
 * @param {string} value
 * @returns {string|null} - Mensaje de error o null si es válido
 */
const validateField = (field, value) => {
  const rule = RULES[field];
  if (!rule) return null;

  const trimmed = value?.trim() ?? '';

  if (rule.required && !trimmed) {
    return `${rule.label} es obligatorio.`;
  }

  if (rule.minLength && trimmed.length > 0 && trimmed.length < rule.minLength) {
    return `${rule.label} debe tener al menos ${rule.minLength} caracteres.`;
  }

  if (rule.maxLength && trimmed.length > rule.maxLength) {
    return `${rule.label} no puede superar los ${rule.maxLength} caracteres.`;
  }

  return null;
};

// ─── Validación del formulario Crear ─────────

/**
 * Valida los datos del formulario de creación.
 * Muestra errores inline y devuelve true si todo es válido.
 *
 * @param {{ title: string, body: string, tags?: string }} data
 * @returns {boolean} - true = válido, false = hay errores
 */
export const validateCreateForm = (data) => {
  clearFormErrors('create');

  let valid = true;

  const titleError = validateField('title', data.title);
  if (titleError) {
    showFieldError('error-create-title', titleError);
    valid = false;
  }

  const bodyError = validateField('body', data.body);
  if (bodyError) {
    showFieldError('error-create-body', bodyError);
    valid = false;
  }

  return valid;
};

// ─── Validación del formulario Editar ───────

/**
 * Valida los datos del formulario de edición.
 * Muestra errores inline y devuelve true si todo es válido.
 *
 * @param {{ title: string, body: string }} data
 * @returns {boolean}
 */
export const validateEditForm = (data) => {
  clearFormErrors('edit');

  let valid = true;

  const titleError = validateField('title', data.title);
  if (titleError) {
    showFieldError('error-edit-title', titleError);
    valid = false;
  }

  const bodyError = validateField('body', data.body);
  if (bodyError) {
    showFieldError('error-edit-body', bodyError);
    valid = false;
  }

  return valid;
};

// ─── Limpieza de tags ─────────

/**
 * Parsea el string de tags separados por coma y devuelve un array limpio.
 * @param {string} rawTags
 * @returns {string[]}
 */
export const parseTags = (rawTags = '') => {
  if (!rawTags.trim()) return [];
  return rawTags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
};

// ─── Validación en tiempo real (blur por campo) ─────────

/**
 * Adjunta validación blur en tiempo real a un input/textarea.
 * @param {string} inputId  - ID del input
 * @param {string} field    - 'title' | 'body'
 * @param {string} spanId   - ID del span de error
 */
export const attachLiveValidation = (inputId, field, spanId) => {
  const el = document.getElementById(inputId);
  if (!el) return;

  el.addEventListener('blur', () => {
    const error = validateField(field, el.value);
    if (error) {
      showFieldError(spanId, error);
    } else {
      clearFieldError(spanId);
    }
  });

  // Limpiar el error mientras escribe
  el.addEventListener('input', () => {
    if (el.classList.contains('input-error')) {
      const error = validateField(field, el.value);
      if (!error) clearFieldError(spanId);
    }
  });
};