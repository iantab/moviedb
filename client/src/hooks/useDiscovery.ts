import { useReducer, useEffect } from "react";
import tmdbClient from "../services/tmdb";
import type { MediaItem, MediaType } from "../types/tmdb";

type State = {
  trending: MediaItem[];
  popular: MediaItem[];
  trendingLoading: boolean;
  popularLoading: boolean;
  error: string | null;
};

type Action =
  | { type: "TRENDING_START" }
  | { type: "TRENDING_SUCCESS"; payload: MediaItem[] }
  | { type: "TRENDING_ERROR"; payload: string }
  | { type: "POPULAR_START" }
  | { type: "POPULAR_SUCCESS"; payload: MediaItem[] }
  | { type: "POPULAR_ERROR"; payload: string };

const initialState: State = {
  trending: [],
  popular: [],
  trendingLoading: false,
  popularLoading: false,
  error: null,
};

export function discoveryReducer(state: State, action: Action): State {
  switch (action.type) {
    case "TRENDING_START":
      return { ...state, trendingLoading: true, error: null };
    case "TRENDING_SUCCESS":
      return { ...state, trending: action.payload, trendingLoading: false };
    case "TRENDING_ERROR":
      return { ...state, trendingLoading: false, error: action.payload };
    case "POPULAR_START":
      return { ...state, popularLoading: true, error: null };
    case "POPULAR_SUCCESS":
      return { ...state, popular: action.payload, popularLoading: false };
    case "POPULAR_ERROR":
      return { ...state, popularLoading: false, error: action.payload };
  }
}

export function useDiscovery(mediaType: MediaType) {
  const [state, dispatch] = useReducer(discoveryReducer, initialState);

  // Fetch trending
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "TRENDING_START" });
    tmdbClient
      .get(`/trending/${mediaType}/week`)
      .then((res) => {
        if (!cancelled) {
          dispatch({ type: "TRENDING_SUCCESS", payload: res.data.results });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled)
          dispatch({
            type: "TRENDING_ERROR",
            payload:
              err instanceof Error ? err.message : "Failed to load trending",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [mediaType]);

  // Fetch popular
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "POPULAR_START" });
    tmdbClient
      .get(`/${mediaType}/popular`)
      .then((res) => {
        if (!cancelled) {
          dispatch({ type: "POPULAR_SUCCESS", payload: res.data.results });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled)
          dispatch({
            type: "POPULAR_ERROR",
            payload:
              err instanceof Error ? err.message : "Failed to load popular",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [mediaType]);

  return {
    trending: state.trending,
    popular: state.popular,
    loading: state.trendingLoading || state.popularLoading,
    error: state.error,
  };
}
