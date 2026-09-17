import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./lib/install";
import App from "./App.tsx";
import { publicPages } from "../shared/seo";
// Preserve shared legacy links while giving public pages their own canonical URL.
const legacyPage = publicPages.find(p => location.hash === "#" + p.path);
if (legacyPage) location.replace(legacyPage.path + location.search);


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      /* Website remains usable without offline support. */
    });
  });
}
