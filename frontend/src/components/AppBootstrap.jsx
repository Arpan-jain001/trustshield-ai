import { useEffect, useState } from "react";
import App from "../App";
import { SplashScreen } from "./SplashScreen";
import { useAuth } from "../context/AuthContext";

import { frontendEnv } from "../config/env";

function warmupRemoteApi() {
  if (frontendEnv.apiBaseUrl === "/api") {
    return;
  }

  fetch(frontendEnv.apiBaseUrl, {
    method: "GET",
    mode: "no-cors",
    cache: "no-store"
  }).catch(() => {});
}

export function AppBootstrap() {
  const { token, refreshSession, logout } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    warmupRemoteApi();
    if (token) {
      refreshSession().catch(() => {
        logout();
      });
    }
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 2100);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <SplashScreen visible={showSplash} />
      <App />
    </>
  );
}
