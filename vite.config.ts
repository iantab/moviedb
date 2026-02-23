import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import { load } from "js-yaml";
import { resolve } from "path";

// Load config.yaml
const configFile = readFileSync(resolve(__dirname, "config.yaml"), "utf8");
const config = load(configFile) as {
  tmdb: { api_key: string; base_url: string; image_base_url: string };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_TMDB_API_KEY": JSON.stringify(config.tmdb.api_key),
    "import.meta.env.VITE_TMDB_BASE_URL": JSON.stringify(config.tmdb.base_url),
    "import.meta.env.VITE_TMDB_IMAGE_BASE_URL": JSON.stringify(
      config.tmdb.image_base_url,
    ),
  },
  server: {
    proxy: {
      "/api/tmdb": {
        target: "https://api.themoviedb.org/3",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tmdb/, ""),
        headers: {
          Authorization: `Bearer ${config.tmdb.api_key}`,
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
