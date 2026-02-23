import { useReducer, useEffect } from "react";
import tmdbClient from "../services/tmdb";
import type { WatchProvidersResult, MediaType } from "../types/tmdb";
import { getCached, setCached } from "../utils/cache";

type State = {
  data: WatchProvidersResult | null;
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: WatchProvidersResult }
  | { type: "FETCH_ERROR"; payload: string };

const initialState: State = { data: null, loading: false, error: null };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { data: state.data, loading: true, error: null };
    case "FETCH_SUCCESS":
      return { data: action.payload, loading: false, error: null };
    case "FETCH_ERROR":
      return { data: null, loading: false, error: action.payload };
  }
}

export function useWatchProviders(
  mediaId: number | null,
  mediaType: MediaType,
) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (mediaId === null) return;
    const cacheKey = `providers:${mediaType}:${mediaId}`;
    const cached = getCached<WatchProvidersResult>(cacheKey);
    if (cached) {
      dispatch({ type: "FETCH_SUCCESS", payload: cached });
      return;
    }
    let cancelled = false;
    dispatch({ type: "FETCH_START" });
    const endpoint = `/${mediaType}/${mediaId}/watch/providers`;
    tmdbClient
      .get(endpoint)
      .then((res) => {
        if (!cancelled) {
          setCached(cacheKey, res.data);
          dispatch({ type: "FETCH_SUCCESS", payload: res.data });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled)
          dispatch({
            type: "FETCH_ERROR",
            payload:
              err instanceof Error ? err.message : "Failed to load providers",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [mediaId, mediaType]);

  // Reset data when mediaId is cleared
  const resolvedData = mediaId === null ? null : state.data;

  return { data: resolvedData, loading: state.loading, error: state.error };
}
