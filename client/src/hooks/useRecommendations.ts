import { useReducer, useEffect } from "react";
import tmdbClient from "../services/tmdb";
import type { MediaItem, MediaType } from "../types/tmdb";

type State = {
  items: MediaItem[];
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: MediaItem[] }
  | { type: "FETCH_ERROR"; payload: string };

const initialState: State = { items: [], loading: false, error: null };

export function reducer(_state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { items: [], loading: true, error: null };
    case "FETCH_SUCCESS":
      return { items: action.payload, loading: false, error: null };
    case "FETCH_ERROR":
      return { items: [], loading: false, error: action.payload };
  }
}

export function useRecommendations(mediaId: number, mediaType: MediaType) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "FETCH_START" });
    tmdbClient
      .get(`/${mediaType}/${mediaId}/recommendations`)
      .then((res) => {
        if (!cancelled) {
          dispatch({ type: "FETCH_SUCCESS", payload: res.data.results });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled)
          dispatch({
            type: "FETCH_ERROR",
            payload:
              err instanceof Error
                ? err.message
                : "Failed to load recommendations",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [mediaId, mediaType]);

  return state;
}
