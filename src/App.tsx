import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Fuse from "fuse.js";
import { useMovieSearch } from "./hooks/useMovieSearch";
import { SearchBar } from "./components/SearchBar";
import { MovieCard } from "./components/MovieCard";
import { MovieDetail } from "./components/MovieDetail";
import { MediaToggle } from "./components/MediaToggle";
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
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [query, setQuery] = useState("");
  // When false, the suggestions dropdown is suppressed (e.g. right after a selection)
  const [suggestionsEnabled, setSuggestionsEnabled] = useState(true);

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
        clear();
      }
    },
    [clear],
  );

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      setSelectedItem(null);
      search(query, mediaType);
    }
  }, [query, mediaType, search]);

  // When user picks a suggestion, jump straight to that item's detail
  const handleSuggestionSelect = useCallback((item: MediaItem) => {
    setSuggestionsEnabled(false); // suppress dropdown after selection
    setQuery(getTitle(item));
    setSelectedItem(item);
  }, []);

  const handleTypeChange = useCallback(
    (type: MediaType) => {
      setMediaType(type);
      setSelectedItem(null);
      setQuery("");
      clear();
    },
    [clear],
  );

  const handleClose = useCallback(() => setSelectedItem(null), []);

  const placeholder =
    mediaType === "movie" ? "Search for a movie..." : "Search for a TV show...";
  const emptyLabel =
    mediaType === "movie"
      ? "🔍 Search for a movie above to get started"
      : "🔍 Search for a TV show above to get started";

  const selectedId = selectedItem?.id ?? null;

  return (
    <div className="app">
      <header className="app__header">
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
        {error && <p className="error-text">Error: {error}</p>}

        {!selectedItem && results.length > 0 && (
          <div className="movie-grid">
            {results.map((item: MediaItem) => (
              <MovieCard
                key={item.id}
                item={item}
                onClick={setSelectedItem}
                selected={selectedId === item.id}
              />
            ))}
          </div>
        )}

        {!selectedItem && !loading && results.length === 0 && (
          <div className="app__empty">
            <p>{emptyLabel}</p>
          </div>
        )}

        {selectedItem && (
          <MovieDetail
            item={selectedItem}
            mediaType={mediaType}
            onClose={handleClose}
          />
        )}
      </main>
    </div>
  );
}

export default App;
