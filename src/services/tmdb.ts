import axios from "axios";

const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL as string;
const API_KEY = import.meta.env.VITE_TMDB_API_KEY as string;
export const IMAGE_BASE_URL = import.meta.env
  .VITE_TMDB_IMAGE_BASE_URL as string;

const tmdbClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    Accept: "application/json",
  },
});

export default tmdbClient;
