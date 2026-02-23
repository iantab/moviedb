import { useState, useCallback } from "react";
import tmdbClient from "../services/tmdb";
import type { Movie } from "../types/tmdb";

export function useMovieSearch() {
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback((query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    tmdbClient
      .get("/search/movie", {
        params: { query, include_adult: false, language: "en-US", page: 1 },
      })
      .then((res) => {
        setResults(res.data.results);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Search failed");
      })
      .finally(() => setLoading(false));
  }, []);

  return { results, loading, error, search };
}
