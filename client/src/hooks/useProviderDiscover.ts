import { useReducer, useEffect, useCallback, useState } from "react"
import { tmdbClientFetch } from "@/lib/tmdb-client"
import type { MediaItem, MediaType } from "@/lib/types/tmdb"

type State = {
  items: MediaItem[]
  loading: boolean
  error: string | null
}

type Action =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: MediaItem[] }
  | { type: "FETCH_ERROR"; payload: string }

const initialState: State = {
  items: [],
  loading: false,
  error: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null }
    case "FETCH_SUCCESS":
      return { ...state, items: action.payload, loading: false }
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload }
  }
}

export function useProviderDiscover(
  mediaType: MediaType,
  providerId: number,
  countryCode: string
) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [retryCount, setRetryCount] = useState(0)
  const retry = useCallback(() => setRetryCount((c) => c + 1), [])

  useEffect(() => {
    let cancelled = false
    dispatch({ type: "FETCH_START" })
    tmdbClientFetch<{ results: MediaItem[] }>(`/discover/${mediaType}`, {
      with_watch_providers: providerId,
      watch_region: countryCode,
      sort_by: "popularity.desc",
    })
      .then((data) => {
        if (!cancelled) {
          dispatch({ type: "FETCH_SUCCESS", payload: data.results })
        }
      })
      .catch((err: unknown) => {
        if (!cancelled)
          dispatch({
            type: "FETCH_ERROR",
            payload:
              err instanceof Error ? err.message : "Failed to load titles",
          })
      })
    return () => {
      cancelled = true
    }
  }, [mediaType, providerId, countryCode, retryCount])

  return { ...state, retry }
}
