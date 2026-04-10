import { useState, useCallback, useRef } from "react";
import tmdbClient from "../services/tmdb";
import type { MediaItem, MediaType } from "../types/tmdb";
import { getCached, setCached } from "../utils/cache";

type Corpus = Record<MediaType, MediaItem[]>;

export function mergeIntoCorpus(
  prev: Corpus,
  mediaType: MediaType,
  items: MediaItem[],
): Corpus {
  const existingIds = new Set(prev[mediaType].map((i) => i.id));
  const newItems = items.filter((i) => !existingIds.has(i.id));
  if (!newItems.length) return prev;
  return { ...prev, [mediaType]: [...prev[mediaType], ...newItems] };
}

export function useMovieSearch() {
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Corpus is split by media type so movie and TV results never mix
  const [corpus, setCorpus] = useState<Corpus>({ movie: [], tv: [] });
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
      setCorpus((prev) => mergeIntoCorpus(prev, mediaType, cached));
      return;
    }
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    const endpoint = mediaType === "tv" ? "/search/tv" : "/search/movie";
    console.log(
      `[TMDB API] search/${mediaType === "tv" ? "tv" : "movie"} — query: "${query}"`,
    );
    tmdbClient
      .get(endpoint, {
        params: { query, include_adult: false, language: "en-US", page: 1 },
      })
      .then((res) => {
        if (!cancelledRef.current) {
          const items: MediaItem[] = res.data.results;
          setCached(cacheKey, items);
          setResults(items);
          setCorpus((prev) => mergeIntoCorpus(prev, mediaType, items));
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

  // Silently fetches into the correct corpus slice — does not touch results/loading/error.
  const populateCorpus = useCallback((query: string, mediaType: MediaType) => {
    if (!query.trim()) return;
    const cacheKey = `search:${mediaType}:${query.trim().toLowerCase()}`;
    const cached = getCached<MediaItem[]>(cacheKey);
    if (cached) {
      setCorpus((prev) => mergeIntoCorpus(prev, mediaType, cached));
      return;
    }
    const endpoint = mediaType === "tv" ? "/search/tv" : "/search/movie";
    console.log(
      `[TMDB API] populateCorpus/${mediaType === "tv" ? "tv" : "movie"} — query: "${query}"`,
    );
    tmdbClient
      .get(endpoint, {
        params: { query, include_adult: false, language: "en-US", page: 1 },
      })
      .then((res) => {
        const items: MediaItem[] = res.data.results;
        setCached(cacheKey, items);
        setCorpus((prev) => mergeIntoCorpus(prev, mediaType, items));
      })
      .catch(() => {
        // silently ignore — this is just suggestion pre-fetching
      });
  }, []);

  // Return the corpus slice for the given media type
  const getCorpusFor = useCallback(
    (mediaType: MediaType) => corpus[mediaType],
    [corpus],
  );

  return {
    results,
    loading,
    error,
    getCorpusFor,
    search,
    populateCorpus,
    clear,
    cancel,
  };
}
