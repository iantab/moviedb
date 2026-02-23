import { useState, useCallback, useRef } from "react";
import tmdbClient from "../services/tmdb";
import type { MediaItem, MediaType } from "../types/tmdb";
import { getCached, setCached } from "../utils/cache";

export function useMovieSearch() {
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const search = useCallback((query: string, mediaType: MediaType) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const cacheKey = `search:${mediaType}:${query.trim().toLowerCase()}`;
    const cached = getCached<MediaItem[]>(cacheKey);
    if (cached) {
      setResults(cached);
      return;
    }
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    const endpoint = mediaType === "tv" ? "/search/tv" : "/search/movie";
    tmdbClient
      .get(endpoint, {
        params: { query, include_adult: false, language: "en-US", page: 1 },
      })
      .then((res) => {
        if (!cancelledRef.current) {
          setCached(cacheKey, res.data.results);
          setResults(res.data.results);
        }
      })
      .catch((err: unknown) => {
        if (!cancelledRef.current)
          setError(err instanceof Error ? err.message : "Search failed");
      })
      .finally(() => {
        if (!cancelledRef.current) setLoading(false);
      });
  }, []);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear, cancel };
}
