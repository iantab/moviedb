import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Fuse from "fuse.js";
import { useMovieSearch } from "./hooks/useMovieSearch";

import { SearchBar } from "./components/SearchBar";
import { MovieCard } from "./components/MovieCard";
import { MovieDetail } from "./components/MovieDetail";
import { ErrorMessage } from "./components/ErrorMessage";
import { LoadingDots } from "./components/LoadingDots";
import { MediaToggle } from "./components/MediaToggle";
import {
  ProviderDiscoverSection,
  PROVIDERS,
} from "./components/ProviderDiscoverSection";
import { RecentlyViewedSection } from "./components/RecentlyViewedSection";
import { useRecentlyViewed } from "./hooks/useRecentlyViewed";
import { useHashRoute, setHash, clearHash } from "./hooks/useHashRouter";
import tmdbClient from "./services/tmdb";
import { detectCountry } from "./utils/detectCountry";
import type { MediaItem, MediaType } from "./types/tmdb";
import { getTitle } from "./types/tmdb";
import "./App.css";

function App() {
  const {
    results,
    loading,
    error,
    getCorpusFor,
    search,
    populateCorpus,
    clear,
    cancel,
  } = useMovieSearch();

  useEffect(() => cancel, [cancel]);
  const hashRoute = useHashRoute();
  const { recentItems, addItem: addRecentlyViewed } = useRecentlyViewed();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [hashLoading, setHashLoading] = useState(() => !!hashRoute);
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [providerId, setProviderId] = useState<number>(PROVIDERS[0].id);
  const [countryCode, setCountryCode] = useState(detectCountry);

  const [query, setQuery] = useState("");
  // When false, the suggestions dropdown is suppressed (e.g. right after a selection)
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);
  // True only after the user explicitly submits a search (Enter or button click)
  const [hasSearched, setHasSearched] = useState(false);
  const [hashError, setHashError] = useState<string | null>(null);

  // Resolve hash route to a selected item (on mount or browser back/forward)
  useEffect(() => {
    if (hashRoute) {
      setHashLoading(true);
      setHashError(null);
      tmdbClient
        .get(`/${hashRoute.mediaType}/${hashRoute.id}`)
        .then((res) => {
          setSelectedItem(res.data);
          setMediaType(hashRoute.mediaType);
        })
        .catch((err) => {
          const status = err?.response?.status;
          setHashError(
            status === 404
              ? "This title could not be found. It may have been removed."
              : "Failed to load this title. Please try again.",
          );
        })
        .finally(() => setHashLoading(false));
    } else {
      setSelectedItem(null);
      setHashError(null);
      setHashLoading(false);
    }
  }, [hashRoute]);

  // Build Fuse instance over the current media type's corpus only — no cross-type leakage
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
    [getCorpusFor, mediaType],
  );

  // Debounced background fetch — silently populates the corpus so fuzzy
  // suggestions appear while typing, without updating the results grid.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) return;
    debounceRef.current = setTimeout(() => {
      populateCorpus(query, mediaType);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, mediaType, populateCorpus]);

  // Local fuzzy suggestions — no API ping after corpus is warm
  const suggestions = useMemo(() => {
    if (!suggestionsEnabled) return [];
    if (!query.trim() || query.trim().length < 2) return [];
    return fuse
      .search(query.trim())
      .slice(0, 7)
      .map((r) => r.item);
  }, [fuse, query, suggestionsEnabled]);

  const handleQueryChange = useCallback(
    (q: string) => {
      setQuery(q);
      setSuggestionsEnabled(true); // user is typing manually — show suggestions
      if (!q.trim()) {
        setSelectedItem(null);
        setHasSearched(false);
        clear();
      }
    },
    [clear],
  );

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      setSelectedItem(null);
      setHasSearched(true);
      search(query, mediaType);
    }
  }, [query, mediaType, search]);

  const handleItemSelect = useCallback(
    (item: MediaItem, itemMediaType?: MediaType) => {
      setSelectedItem(item);
      const effectiveType = itemMediaType ?? mediaType;
      if (itemMediaType) setMediaType(itemMediaType);
      addRecentlyViewed(item, effectiveType);
      setHash(effectiveType, item.id);
    },
    [mediaType, addRecentlyViewed],
  );

  // When user picks a suggestion, jump straight to that item's detail
  const handleSuggestionSelect = useCallback(
    (item: MediaItem) => {
      setSuggestionsEnabled(false); // suppress dropdown after selection
      setQuery(getTitle(item));
      handleItemSelect(item);
    },
    [handleItemSelect],
  );

  const handleTypeChange = useCallback(
    (type: MediaType) => {
      setMediaType(type);
      setSelectedItem(null);
      setQuery("");
      setHasSearched(false);
      clear();
    },
    [clear],
  );

  const handleClose = useCallback(() => {
    setSelectedItem(null);
    clearHash();
  }, []);

  const placeholder =
    mediaType === "movie" ? "Search for a movie..." : "Search for a TV show...";
  const noResults =
    mediaType === "movie"
      ? "No movies found. Try a different search."
      : "No TV shows found. Try a different search.";

  const selectedId = selectedItem?.id ?? null;

  // Compact header when user scrolls past the sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) =>
      setCompact(!entry.isIntersecting),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="app">
      <header
        className={`app__header${compact ? " app__header--compact" : ""}`}
      >
        <h1 className="app__title">🎬 StreamScout</h1>
        <p className="app__subtitle">
          Search movies and TV shows and find where to watch them worldwide
        </p>
        <MediaToggle value={mediaType} onChange={handleTypeChange} />
        <SearchBar
          query={query}
          onQueryChange={handleQueryChange}
          onSearch={handleSearch}
          onSuggestionSelect={handleSuggestionSelect}
          suggestions={suggestions}
          loading={loading}
          placeholder={placeholder}
        />
      </header>

      <main className="app__main">
        <div ref={sentinelRef} />
        {error && <ErrorMessage message={error} onRetry={handleSearch} />}

        {!selectedItem && results.length > 0 && (
          <div className="movie-grid">
            {results.map((item: MediaItem) => (
              <MovieCard
                key={item.id}
                item={item}
                onClick={handleItemSelect}
                selected={selectedId === item.id}
              />
            ))}
          </div>
        )}

        {hashLoading && (
          <div className="app__empty">
            <LoadingDots />
          </div>
        )}

        {hashError && !selectedItem && (
          <div className="app__empty">
            <ErrorMessage
              message={hashError}
              retryLabel="Go home"
              onRetry={() => {
                clearHash();
                setHashError(null);
              }}
            />
          </div>
        )}

        {!selectedItem && !hasSearched && !hashLoading && !hashError && (
          <div className="discovery">
            <RecentlyViewedSection
              items={recentItems}
              onItemClick={handleItemSelect}
              selectedId={selectedId}
            />
            <ProviderDiscoverSection
              mediaType={mediaType}
              selectedId={selectedId}
              onItemClick={handleItemSelect}
              providerId={providerId}
              onProviderChange={setProviderId}
              countryCode={countryCode}
              onCountryChange={setCountryCode}
            />
          </div>
        )}

        {!selectedItem && hasSearched && !loading && results.length === 0 && (
          <div className="app__empty">
            <p>{noResults}</p>
          </div>
        )}

        {selectedItem && (
          <MovieDetail
            item={selectedItem}
            mediaType={mediaType}
            onClose={handleClose}
            onItemSelect={handleItemSelect}
          />
        )}
      </main>
    </div>
  );
}

export default App;
