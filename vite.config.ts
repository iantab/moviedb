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
});
