const API_BASE = 'http://localhost:3001';

// Key used to store the JWT in localStorage.
const TOKEN_KEY = 'bb_jwt';
// Small profile blob (email only for now) so Account and other UI can show the current user.
const USER_KEY = 'bb_user';

/**
 * Save who is logged in (runs after successful login/register).
 * Kept in sync with the token so refresh and Account page stay consistent.
 */
export function setUserProfile({ email }) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify({ email: email || '' }));
  } catch {
    // Same as token: don't crash if storage fails
  }
}

/**
 * Read the stored user profile, or null if missing / invalid.
 */
export function getUserProfile() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.email === 'string') {
      return { email: parsed.email };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Safely read the saved JWT token from localStorage.
 * Returns the token string or null if it is not set.
 */
export function getToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    return token || null;
  } catch {
    // If localStorage is not available (for some reason), just act as logged out.
    return null;
  }
}

/**
 * Persist the JWT token in localStorage.
 * This is called after a successful login or register.
 */
export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Failing to persist should not crash the app; user will just not stay logged in.
  }
}

/**
 * Remove the JWT token from localStorage.
 * This is called when the user logs out.
 */
export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore storage errors.
  }
}

/**
 * Helper to check if the user is currently "logged in"
 * based on whether we have a token stored.
 */
export function isLoggedIn() {
  return !!getToken();
}

/**
 * Call the backend login endpoint.
 * Expects the API to return JSON with a `token` field on success,
 * or an error message we can surface to the user on failure.
 */
export async function login({ email, password }) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // Try to show a helpful error message from the backend if it exists.
    const message = data?.message || 'Invalid email or password';
    throw new Error(message);
  }

  if (!data.token) {
    throw new Error('Login successful but no token returned from server.');
  }

  setToken(data.token);
  setUserProfile({ email });
  return data.token;
}

/**
 * Call the backend register endpoint.
 * Expects JSON with a `token` field on success, similar to login.
 */
export async function register({ email, password }) {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.message || 'Could not create account';
    throw new Error(message);
  }

  if (!data.token) {
    throw new Error('Registration successful but no token returned from server.');
  }

  setToken(data.token);
  setUserProfile({ email });
  return data.token;
}

