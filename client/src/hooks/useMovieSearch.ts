import { useState, useCallback, useRef } from "react"
import { tmdbClientFetch } from "@/lib/tmdb-client"
import type { MediaItem, MediaType } from "@/lib/types/tmdb"

type Corpus = Record<MediaType, MediaItem[]>

export function mergeIntoCorpus(
  prev: Corpus,
  mediaType: MediaType,
  items: MediaItem[]
): Corpus {
  const existingIds = new Set(prev[mediaType].map((i) => i.id))
  const newItems = items.filter((i) => !existingIds.has(i.id))
  if (!newItems.length) return prev
  return { ...prev, [mediaType]: [...prev[mediaType], ...newItems] }
}

export function useMovieSearch() {
  const [results, setResults] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [corpus, setCorpus] = useState<Corpus>({ movie: [], tv: [] })
  const cancelledRef = useRef(false)

  const search = useCallback((query: string, mediaType: MediaType) => {
    if (!query.trim()) {
      setResults([])
      return
    }
    cancelledRef.current = false
    setLoading(true)
    setError(null)
    const endpoint = mediaType === "tv" ? "/search/tv" : "/search/movie"
    tmdbClientFetch<{ results: MediaItem[] }>(endpoint, {
      query,
      include_adult: false,
      language: "en-US",
      page: 1,
    })
      .then((data) => {
        if (!cancelledRef.current) {
          const items = data.results
          setResults(items)
          setCorpus((prev) => mergeIntoCorpus(prev, mediaType, items))
        }
      })
      .catch((err: unknown) => {
        if (!cancelledRef.current)
          setError(err instanceof Error ? err.message : "Search failed")
      })
      .finally(() => {
        if (!cancelledRef.current) setLoading(false)
      })
  }, [])

  const cancel = useCallback(() => {
    cancelledRef.current = true
  }, [])

  const clear = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  const populateCorpus = useCallback((query: string, mediaType: MediaType) => {
    if (!query.trim()) return
    const endpoint = mediaType === "tv" ? "/search/tv" : "/search/movie"
    tmdbClientFetch<{ results: MediaItem[] }>(endpoint, {
      query,
      include_adult: false,
      language: "en-US",
      page: 1,
    })
      .then((data) => {
        setCorpus((prev) => mergeIntoCorpus(prev, mediaType, data.results))
      })
      .catch(() => {
        // silently ignore — suggestion pre-fetching
      })
  }, [])

  const getCorpusFor = useCallback(
    (mediaType: MediaType) => corpus[mediaType],
    [corpus]
  )

  return {
    results,
    loading,
    error,
    getCorpusFor,
    search,
    populateCorpus,
    clear,
    cancel,
  }
}
