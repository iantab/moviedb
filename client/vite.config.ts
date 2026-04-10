import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "fs";
import { load } from "js-yaml";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files so they're available at config time.
  const env = loadEnv(mode, process.cwd());

  // Load config.yaml for local dev; fall back to env vars in CI/production.
  const configPath = resolve(__dirname, "config.yaml");
  const yamlConfig = existsSync(configPath)
    ? (load(readFileSync(configPath, "utf8")) as {
        tmdb: { api_key: string; base_url: string; image_base_url: string };
      })
    : null;

  const imageBaseUrl =
    yamlConfig?.tmdb.image_base_url ??
    env.VITE_TMDB_IMAGE_BASE_URL ??
    "https://image.tmdb.org/t/p";

  const proxyBaseUrl = env.VITE_PROXY_BASE_URL ?? "";

  return {
    base: "/moviedb/",
    plugins: [react()],
    define: {
      "import.meta.env.VITE_TMDB_IMAGE_BASE_URL": JSON.stringify(imageBaseUrl),
      "import.meta.env.VITE_PROXY_BASE_URL": JSON.stringify(proxyBaseUrl),
    },
    server: {
      proxy: {
        "/api/tmdb": {
          target: "http://localhost:8080",
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on("proxyReq", (_proxyReq, req) => {
              console.log(`\x1b[35m[PROXY] ▶ ${req.method} ${req.url}\x1b[0m`);
            });
            proxy.on("proxyRes", (proxyRes, req) => {
              const ok = proxyRes.statusCode && proxyRes.statusCode < 400;
              const color = ok ? "\x1b[32m" : "\x1b[31m";
              console.log(
                `${color}[PROXY] ${proxyRes.statusCode} ${req.url}\x1b[0m`,
              );
            });
            proxy.on("error", (err, req) => {
              console.error(
                `\x1b[31m[PROXY] ❌ ERROR ${req.url} — ${err.message}\x1b[0m`,
              );
            });
          },
        },
      },
    },
  };
});
