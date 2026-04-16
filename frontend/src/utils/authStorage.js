export const LOCAL_KEY = "trustshield-auth-persistent";
export const SESSION_KEY = "trustshield-auth-session";

export function readStoredAuth(storage = globalThis?.window) {
  if (!storage) return { token: null, user: null };

  const persistent = storage.localStorage.getItem(LOCAL_KEY);
  const session = storage.sessionStorage.getItem(SESSION_KEY);
  const raw = persistent || session;

  if (!raw) return { token: null, user: null };

  try {
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || null,
      user: parsed.user || null
    };
  } catch {
    storage.localStorage.removeItem(LOCAL_KEY);
    storage.sessionStorage.removeItem(SESSION_KEY);
    return { token: null, user: null };
  }
}

export function persistAuth(data, rememberMe, storage = globalThis?.window) {
  if (!storage) return;
  const serialized = JSON.stringify(data);
  if (rememberMe) {
    storage.localStorage.setItem(LOCAL_KEY, serialized);
    storage.sessionStorage.removeItem(SESSION_KEY);
  } else {
    storage.sessionStorage.setItem(SESSION_KEY, serialized);
    storage.localStorage.removeItem(LOCAL_KEY);
  }
}

export function clearStoredAuth(storage = globalThis?.window) {
  if (!storage) return;
  storage.localStorage.removeItem(LOCAL_KEY);
  storage.sessionStorage.removeItem(SESSION_KEY);
}

export function isPersistentSession(storage = globalThis?.window) {
  if (!storage) return false;
  return Boolean(storage.localStorage.getItem(LOCAL_KEY));
}
