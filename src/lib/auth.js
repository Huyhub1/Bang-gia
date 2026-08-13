import crypto from 'crypto';

const SECRET   = process.env.ADMIN_SECRET   || 'default-secret-change-me';
const PASSWORD = process.env.ADMIN_PASSWORD || 'arkserver2024';

/** Returns the static HMAC token for the current password. */
export function generateToken() {
  return crypto.createHmac('sha256', SECRET).update(PASSWORD).digest('hex');
}

/** Validates a token sent by the client. */
export function validateToken(token) {
  if (!token) return false;
  const expected = generateToken();
  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token,    'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    return false;
  }
}

/** Validates a plain-text password. */
export function validatePassword(password) {
  if (!password) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(PASSWORD);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Extracts Bearer token from an Authorization header string. */
export function extractToken(authHeader) {
  if (!authHeader) return null;
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
}
