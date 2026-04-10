import axios from "axios";

// In dev, the Vite proxy forwards /api/tmdb to the local Spring Boot server.
// In production, call the deployed proxy server directly.
const BASE_URL = import.meta.env.DEV
  ? "/api/tmdb"
  : `${import.meta.env.VITE_PROXY_BASE_URL as string}/api/tmdb`;

export const IMAGE_BASE_URL = import.meta.env
  .VITE_TMDB_IMAGE_BASE_URL as string;

const tmdbClient = axios.create({
  baseURL: BASE_URL,
  headers: { Accept: "application/json" },
});

export default tmdbClient;
