import React from "react";
import ReactDOM from "react-dom/client";
import App from "./Pizza/Pizza.tsx";
import Coridor from "./Coridor/Coridor.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {/* <App /> */}
    <Coridor />
  </React.StrictMode>
);
