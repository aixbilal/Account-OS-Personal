import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import type { VaultData } from "./domain/types";
import "./theme/tokens.css";

function mount(previewVault?: VaultData) {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App previewVault={previewVault} />
    </React.StrictMode>,
  );
}

/*
 * Dev-only renderer fixture. In a production build `import.meta.env.DEV` is
 * false, so this branch and the dynamic import are dropped by the bundler and
 * `mount()` runs synchronously as before. When running `npm run dev`, opening
 * `/?seed=1` renders the app against a synthetic vault
 * (see src/data/devSeedVault.ts): renderer state only -- nothing is persisted
 * and the Rust vault is never touched.
 */
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("seed") === "1") {
  import("./data/devSeedVault").then(({ devSeedVault }) => mount(devSeedVault));
} else {
  mount();
}
