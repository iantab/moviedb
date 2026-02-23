import { useState, useCallback } from "react";
import tmdbClient from "../services/tmdb";
import type { MediaItem, MediaType } from "../types/tmdb";

export function useMovieSearch() {
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback((query: string, mediaType: MediaType) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    const endpoint = mediaType === "tv" ? "/search/tv" : "/search/movie";
    tmdbClient
      .get(endpoint, {
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
