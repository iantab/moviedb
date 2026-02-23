import { useState, useEffect } from "react";
import tmdbClient from "../services/tmdb";
import type { WatchProvidersResult } from "../types/tmdb";

export function useWatchProviders(movieId: number | null) {
  const [data, setData] = useState<WatchProvidersResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (movieId === null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    tmdbClient
      .get(`/movie/${movieId}/watch/providers`)
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load providers",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [movieId]);

  // Reset data when movieId is cleared
  const resolvedData = movieId === null ? null : data;

  return { data: resolvedData, loading, error };
}
