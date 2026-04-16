import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../api/client";
import { clearStoredAuth, isPersistentSession, persistAuth, readStoredAuth } from "../utils/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const initialAuth = useMemo(() => readStoredAuth(), []);
  const [token, setToken] = useState(initialAuth.token);
  const [user, setUserState] = useState(initialAuth.user);

  function setUser(nextUser) {
    setUserState((current) => {
      const resolvedUser = typeof nextUser === "function" ? nextUser(current) : nextUser;
      const persistent = isPersistentSession(typeof window !== "undefined" ? window : undefined);
      if (token && resolvedUser) {
        persistAuth({ token, user: resolvedUser }, persistent);
      } else if (!resolvedUser) {
        clearStoredAuth();
      }
      return resolvedUser;
    });
  }

  async function login(payload) {
    const { rememberMe = false, ...requestBody } = payload;
    const data = await api("/auth/login", { method: "POST", body: requestBody });
    setToken(data.token);
    setUserState(data.user);
    persistAuth({ token: data.token, user: data.user }, rememberMe);
    return data;
  }

  async function refreshSession() {
    if (!token) return null;
    const data = await api("/auth/refresh", { method: "POST", token });
    const persistent = isPersistentSession(typeof window !== "undefined" ? window : undefined);
    setToken(data.token);
    setUserState(data.user);
    persistAuth({ token: data.token, user: data.user }, persistent);
    return data;
  }

  async function signup(payload) {
    return api("/auth/signup", { method: "POST", body: payload });
  }

  function logout() {
    setToken(null);
    setUserState(null);
    clearStoredAuth();
  }

  return (
    <AuthContext.Provider value={{ token, user, setUser, login, signup, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
