import test from "node:test";
import assert from "node:assert/strict";
import { LOCAL_KEY, SESSION_KEY, clearStoredAuth, isPersistentSession, persistAuth, readStoredAuth } from "./authStorage.js";

function createMemoryStorage() {
  const local = new Map();
  const session = new Map();
  const build = (bucket) => ({
    getItem: (key) => bucket.get(key) ?? null,
    setItem: (key, value) => bucket.set(key, value),
    removeItem: (key) => bucket.delete(key)
  });

  return {
    localStorage: build(local),
    sessionStorage: build(session)
  };
}

test("persistAuth stores remembered sessions in localStorage", () => {
  const storage = createMemoryStorage();
  persistAuth({ token: "abc", user: { id: 1 } }, true, storage);

  assert.equal(storage.localStorage.getItem(LOCAL_KEY) !== null, true);
  assert.equal(storage.sessionStorage.getItem(SESSION_KEY), null);
  assert.equal(isPersistentSession(storage), true);
});

test("persistAuth stores temporary sessions in sessionStorage", () => {
  const storage = createMemoryStorage();
  persistAuth({ token: "abc", user: { id: 1 } }, false, storage);

  assert.equal(storage.sessionStorage.getItem(SESSION_KEY) !== null, true);
  assert.equal(storage.localStorage.getItem(LOCAL_KEY), null);
  assert.equal(isPersistentSession(storage), false);
});

test("readStoredAuth clears malformed auth payloads", () => {
  const storage = createMemoryStorage();
  storage.localStorage.setItem(LOCAL_KEY, "{broken");

  const auth = readStoredAuth(storage);
  assert.deepEqual(auth, { token: null, user: null });
  assert.equal(storage.localStorage.getItem(LOCAL_KEY), null);
});

test("clearStoredAuth removes both session buckets", () => {
  const storage = createMemoryStorage();
  persistAuth({ token: "abc", user: { id: 1 } }, true, storage);
  persistAuth({ token: "xyz", user: { id: 2 } }, false, storage);

  clearStoredAuth(storage);
  assert.equal(storage.localStorage.getItem(LOCAL_KEY), null);
  assert.equal(storage.sessionStorage.getItem(SESSION_KEY), null);
});
