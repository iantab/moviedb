import axios from "axios";

// In dev, route through the Vite proxy so requests are logged in the terminal.
// In production, call TMDB directly.
const BASE_URL = import.meta.env.DEV
  ? "/api/tmdb"
  : (import.meta.env.VITE_TMDB_BASE_URL as string);

const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string;
export const IMAGE_BASE_URL = import.meta.env
  .VITE_TMDB_IMAGE_BASE_URL as string;

const tmdbClient = axios.create({
  baseURL: BASE_URL,
  // Only send the Authorization header in production — the proxy injects it in dev.
  headers: import.meta.env.DEV
    ? { Accept: "application/json" }
    : { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
});

export default tmdbClient;
