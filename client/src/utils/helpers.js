import { format, formatDistanceToNow, isPast, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format tanggal ke format Indonesia
 * @param {string|Date} date
 * @param {string} fmt
 * @returns {string}
 */
export function formatDate(date, fmt = 'dd MMMM yyyy') {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: id });
}

/**
 * Format relative time (e.g., "3 hari yang lalu")
 * @param {string|Date} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: id });
}

/**
 * Cek apakah deadline sudah lewat
 * @param {string|Date} deadline
 * @returns {boolean}
 */
export function isDeadlinePassed(deadline) {
  if (!deadline) return false;
  const d = typeof deadline === 'string' ? parseISO(deadline) : deadline;
  return isPast(d);
}

/**
 * Truncate text dengan ellipsis
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
export function truncateText(text, maxLen = 100) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).trimEnd() + '...';
}

/**
 * Normalisasi daftar skill ke string berkoma (untuk input teks).
 * API menyimpan `skills` sebagai array, sementara form memakai string.
 * @param {string|string[]|null|undefined} skills
 * @returns {string}
 */
export function skillsToText(skills) {
  if (Array.isArray(skills)) return skills.filter(Boolean).join(', ');
  if (typeof skills === 'string') return skills;
  return '';
}

/**
 * Ubah input teks berkoma menjadi array skill yang bersih.
 * @param {string|string[]|null|undefined} text
 * @returns {string[]}
 */
export function textToSkills(text) {
  if (Array.isArray(text)) return text.filter(Boolean);
  if (typeof text !== 'string') return [];
  return text.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Get initials dari nama
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Format angka dengan separator
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num == null) return '0';
  return num.toLocaleString('id-ID');
}
