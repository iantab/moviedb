import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "fs";
import { load } from "js-yaml";
import { resolve } from "path";

// Load config.yaml for local dev; fall back to env vars in CI/production.
const configPath = resolve(__dirname, "config.yaml");
const yamlConfig = existsSync(configPath)
  ? (load(readFileSync(configPath, "utf8")) as {
      tmdb: { api_key: string; base_url: string; image_base_url: string };
    })
  : null;

const apiKey = yamlConfig?.tmdb.api_key ?? process.env.VITE_TMDB_API_KEY ?? "";
const baseUrl =
  yamlConfig?.tmdb.base_url ??
  process.env.VITE_TMDB_BASE_URL ??
  "https://api.themoviedb.org/3";
const imageBaseUrl =
  yamlConfig?.tmdb.image_base_url ??
  process.env.VITE_TMDB_IMAGE_BASE_URL ??
  "https://image.tmdb.org/t/p";

// https://vite.dev/config/
export default defineConfig({
  base: "/moviedb/",
  plugins: [react()],
  define: {
    "import.meta.env.VITE_TMDB_API_KEY": JSON.stringify(apiKey),
    "import.meta.env.VITE_TMDB_BASE_URL": JSON.stringify(baseUrl),
    "import.meta.env.VITE_TMDB_IMAGE_BASE_URL": JSON.stringify(imageBaseUrl),
  },
  server: {
    proxy: {
      "/api/tmdb": {
        target: "https://api.themoviedb.org/3",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tmdb/, ""),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        configure: (proxy) => {
          proxy.on("proxyReq", (_proxyReq, req) => {
            console.log(`\x1b[35m[TMDB] ▶ ${req.method} ${req.url}\x1b[0m`);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            const ok = proxyRes.statusCode && proxyRes.statusCode < 400;
            const color = ok ? "\x1b[32m" : "\x1b[31m";
            console.log(
              `${color}[TMDB] ${proxyRes.statusCode} ${req.url}\x1b[0m`,
            );
          });
          proxy.on("error", (err, req) => {
            console.error(
              `\x1b[31m[TMDB] ❌ ERROR ${req.url} — ${err.message}\x1b[0m`,
            );
          });
        },
      },
    },
  },
});
