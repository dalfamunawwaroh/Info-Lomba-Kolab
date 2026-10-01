// Frontend validation rules

/**
 * Validate email format
 * @param {string} email
 * @returns {string|null} error message or null
 */
export function validateEmail(email) {
  if (!email) return 'Email wajib diisi';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Format email tidak valid';
  return null;
}

/**
 * Validate password
 * @param {string} password
 * @returns {string|null}
 */
export function validatePassword(password) {
  if (!password) return 'Password wajib diisi';
  if (password.length < 8) return 'Password minimal 8 karakter';
  if (!/[A-Z]/.test(password)) return 'Password harus ada minimal 1 huruf besar';
  if (!/[0-9]/.test(password)) return 'Password harus ada minimal 1 angka';
  return null;
}

/**
 * Validate required field
 * @param {string} value
 * @param {string} fieldName
 * @returns {string|null}
 */
export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} wajib diisi`;
  }
  return null;
}

/**
 * Validate name
 * @param {string} name
 * @returns {string|null}
 */
export function validateName(name) {
  if (!name) return 'Nama wajib diisi';
  if (name.length < 2) return 'Nama minimal 2 karakter';
  if (name.length > 100) return 'Nama maksimal 100 karakter';
  return null;
}
