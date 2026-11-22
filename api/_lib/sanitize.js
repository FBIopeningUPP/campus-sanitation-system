/**
 * Sanitize user input to prevent XSS attacks
 */

// HTML entities to escape
const escapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Escape HTML special characters
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/[&<>"'`=/]/g, char => escapeMap[char]);
}

/**
 * Sanitize text input - removes dangerous patterns
 */
export function sanitizeText(str, maxLength = 1000) {
  if (!str || typeof str !== 'string') return str;
  
  // Trim and limit length
  let clean = str.trim().substring(0, maxLength);
  
  // Remove null bytes
  clean = clean.replace(/\0/g, '');
  
  // Remove potentially dangerous patterns
  clean = clean
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Script tags
    .replace(/javascript:/gi, '')                  // JS URLs
    .replace(/on\w+\s*=/gi, '')                   // Event handlers
    .replace(/data:/gi, '');                       // Data URLs
  
  return clean;
}

/**
 * Validate and sanitize UUID
 */
export function sanitizeUUID(str) {
  if (!str || typeof str !== 'string') return null;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str) ? str.toLowerCase() : null;
}

/**
 * Sanitize email
 */
export function sanitizeEmail(str) {
  if (!str || typeof str !== 'string') return null;
  const email = str.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255 ? email : null;
}

/**
 * Sanitize integer
 */
export function sanitizeInt(val, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = parseInt(val, 10);
  if (isNaN(num)) return null;
  return Math.max(min, Math.min(max, num));
}
