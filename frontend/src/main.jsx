import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext";
import { AppBootstrap } from "./components/AppBootstrap";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppBootstrap />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
