/**
 * validation.js
 * Autores:
 *   Persona 1: Diego Guevara — 24128
 *   Persona 2: Luis Hernández — 241424
 */

const RULES = {
  title: { required: true,  minLength: 5,  maxLength: 150,  label: 'El título' },
  body:  { required: true,  minLength: 20, maxLength: 5000, label: 'El contenido' },
  tags:  { required: false, label: 'Las etiquetas' },
};

export const showFieldError = (spanId, message) => {
  const span = document.getElementById(spanId);
  if (span) span.textContent = message;
  const inputId = spanId.replace(/^error-/, '');
  const input   = document.getElementById(inputId);
  if (input) input.classList.add('input-error');
};

export const clearFieldError = (spanId) => {
  const span = document.getElementById(spanId);
  if (span) span.textContent = '';
  const inputId = spanId.replace(/^error-/, '');
  const input   = document.getElementById(inputId);
  if (input) input.classList.remove('input-error');
};

export const clearFormErrors = (formType) => {
  ['title', 'body'].forEach((field) => clearFieldError(`error-${formType}-${field}`));
};

const validateField = (field, value) => {
  const rule    = RULES[field];
  if (!rule) return null;
  const trimmed = value?.trim() ?? '';
  if (rule.required && !trimmed) return `${rule.label} es obligatorio.`;
  if (rule.minLength && trimmed.length > 0 && trimmed.length < rule.minLength)
    return `${rule.label} debe tener al menos ${rule.minLength} caracteres.`;
  if (rule.maxLength && trimmed.length > rule.maxLength)
    return `${rule.label} no puede superar los ${rule.maxLength} caracteres.`;
  return null;
};

export const validateCreateForm = (data) => {
  clearFormErrors('create');
  let valid = true;
  const titleError = validateField('title', data.title);
  if (titleError) { showFieldError('error-create-title', titleError); valid = false; }
  const bodyError = validateField('body', data.body);
  if (bodyError)  { showFieldError('error-create-body',  bodyError);  valid = false; }
  return valid;
};

export const validateEditForm = (data) => {
  clearFormErrors('edit');
  let valid = true;
  const titleError = validateField('title', data.title);
  if (titleError) { showFieldError('error-edit-title', titleError); valid = false; }
  const bodyError = validateField('body', data.body);
  if (bodyError)  { showFieldError('error-edit-body',  bodyError);  valid = false; }
  return valid;
};

export const parseTags = (rawTags = '') => {
  if (!rawTags.trim()) return [];
  return rawTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
};

export const attachLiveValidation = (inputId, field, spanId) => {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.addEventListener('blur', () => {
    const error = validateField(field, el.value);
    error ? showFieldError(spanId, error) : clearFieldError(spanId);
  });
  el.addEventListener('input', () => {
    if (el.classList.contains('input-error')) {
      const error = validateField(field, el.value);
      if (!error) clearFieldError(spanId);
    }
  });
};
