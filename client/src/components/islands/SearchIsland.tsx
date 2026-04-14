import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useReducer,
} from "react"
import Fuse from "fuse.js"
import { useMovieSearch } from "@/hooks/useMovieSearch"
import type { MediaItem, MediaType } from "@/lib/types/tmdb"
import { getTitle, getReleaseYear, isTvShow } from "@/lib/types/tmdb"
import { IMAGE_BASE_URL } from "@/lib/tmdb-client"
import { getSuggestionMeta } from "./searchBarUtils"
import {
  searchBarReducer,
  type SearchBarState,
  type SearchBarAction,
} from "./searchBarReducer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Props {
  mediaType: MediaType
}

export default function SearchIsland({ mediaType }: Props) {
  const {
    results,
    loading,
    error,
    getCorpusFor,
    search,
    populateCorpus,
    clear,
    cancel,
  } = useMovieSearch()

  useEffect(() => cancel, [cancel])

  const [query, setQuery] = useState("")
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)

  // Fuse instance over current corpus
  const fuse = useMemo(
    () =>
      new Fuse(getCorpusFor(mediaType), {
        keys: [
          { name: "title", weight: 1 },
          { name: "name", weight: 1 },
        ],
        threshold: 0.4,
        minMatchCharLength: 2,
      }),
    [getCorpusFor, mediaType]
  )

  // Debounced corpus population
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) return
    debounceRef.current = setTimeout(() => {
      populateCorpus(query, mediaType)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, mediaType, populateCorpus])

  // Local fuzzy suggestions
  const suggestions = useMemo(() => {
    if (!suggestionsEnabled) return []
    if (!query.trim() || query.trim().length < 2) return []
    return fuse
      .search(query.trim())
      .slice(0, 7)
      .map((r) => r.item)
  }, [fuse, query, suggestionsEnabled])

  // SearchBar reducer for dropdown state
  const [state, dispatch] = useReducer(searchBarReducer, {
    activeIndex: -1,
    dismissed: false,
    justSelected: false,
    lastSuggestions: suggestions,
  } satisfies SearchBarState)

  const containerRef = useRef<HTMLDivElement>(null)

  if (suggestions !== state.lastSuggestions) {
    dispatch({
      type: "NEW_SUGGESTIONS",
      suggestions,
    } satisfies SearchBarAction)
  }

  const open =
    !state.dismissed && suggestions.length > 0 && query.trim().length > 0

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        dispatch({ type: "DISMISS" })
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleQueryChange = useCallback(
    (q: string) => {
      setQuery(q)
      setSuggestionsEnabled(true)
      if (!q.trim()) {
        setHasSearched(false)
        clear()
      }
    },
    [clear]
  )

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      setHasSearched(true)
      search(query, mediaType)
      dispatch({ type: "DISMISS" })
    }
  }, [query, mediaType, search])

  const navigateToItem = useCallback(
    (item: MediaItem) => {
      const type = isTvShow(item) ? "tv" : mediaType
      window.location.href = `/${type}/${item.id}`
    },
    [mediaType]
  )

  const handleSuggestionSelect = useCallback(
    (item: MediaItem) => {
      setSuggestionsEnabled(false)
      setQuery(getTitle(item))
      dispatch({ type: "SELECT" })
      navigateToItem(item)
    },
    [navigateToItem]
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (open && state.activeIndex >= 0 && suggestions[state.activeIndex]) {
        handleSuggestionSelect(suggestions[state.activeIndex])
      } else {
        handleSearch()
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      dispatch({ type: "ARROW_DOWN", max: suggestions.length - 1 })
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      dispatch({ type: "ARROW_UP" })
    } else if (e.key === "Escape") {
      dispatch({ type: "DISMISS" })
    }
  }

  const placeholder =
    mediaType === "movie" ? "Search for a movie..." : "Search for a TV show..."

  return (
    <div className="w-full min-w-0">
      {/* Search bar */}
      <div
        className="relative flex w-full max-w-[600px] gap-2"
        ref={containerRef}
      >
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            dispatch({ type: "FOCUS" })
            handleQueryChange(e.target.value)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => dispatch({ type: "FOCUS" })}
          className="h-10 flex-1 rounded-full bg-white/[0.07] px-4 text-base text-white"
          autoComplete="off"
        />
        <Button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          aria-label="Search"
          className="h-10 min-w-[80px] rounded-full px-5"
        >
          {loading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            "Search"
          )}
        </Button>

        {open && (
          <ul className="absolute top-[calc(100%+6px)] right-[90px] left-0 z-50 m-0 list-none overflow-hidden rounded-xl border-[1.5px] border-border bg-[#1e1e30] p-0 shadow-[0_8px_24px_#00000066]">
            {suggestions.map((item, idx) => (
              <li
                key={item.id}
                className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5 text-[0.95rem] text-foreground/85 transition-colors ${
                  idx === state.activeIndex
                    ? "bg-primary/20 text-white"
                    : "hover:bg-primary/20 hover:text-white"
                }`}
                onMouseDown={() => handleSuggestionSelect(item)}
                onMouseEnter={() => dispatch({ type: "ARROW_DOWN", max: idx })}
              >
                <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {getTitle(item)}
                </span>
                {getSuggestionMeta(item) && (
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {getSuggestionMeta(item)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Search results grid */}
      {error && (
        <div className="mt-8 flex flex-col items-center gap-3 p-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={handleSearch}>
            Retry
          </Button>
        </div>
      )}

      {hasSearched && !loading && !error && results.length > 0 && (
        <div className="mt-8 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-5">
          {results.map((item) => {
            const type = isTvShow(item) ? "tv" : mediaType
            const posterUrl = item.poster_path
              ? `${IMAGE_BASE_URL}/w185${item.poster_path}`
              : null
            return (
              <a
                key={item.id}
                href={`/${type}/${item.id}`}
                className="group block overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-primary/40"
              >
                <div className="aspect-[2/3]">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={getTitle(item)}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-4xl text-muted-foreground">
                      🎬
                    </div>
                  )}
                </div>
                <div className="px-3 py-2.5">
                  <h3 className="mb-1 line-clamp-2 text-[0.82rem] leading-tight font-medium text-card-foreground">
                    {getTitle(item)}
                  </h3>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{getReleaseYear(item)}</span>
                    <span>
                      ⭐{" "}
                      {item.vote_average ? item.vote_average.toFixed(1) : "?"}
                    </span>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}

      {hasSearched && !loading && !error && results.length === 0 && (
        <div className="flex h-[40vh] items-center justify-center text-base text-muted-foreground">
          No {mediaType === "movie" ? "movies" : "TV shows"} found. Try a
          different search.
        </div>
      )}
    </div>
  )
}
