import { useState, useCallback, useEffect } from "react";
import { useMovieSearch } from "./hooks/useMovieSearch";
import { SearchBar } from "./components/SearchBar";
import { MovieCard } from "./components/MovieCard";
import { MovieDetail } from "./components/MovieDetail";
import { MediaToggle } from "./components/MediaToggle";
import type { MediaItem, MediaType } from "./types/tmdb";
import "./App.css";

function App() {
  const { results, loading, error, search, clear } = useMovieSearch();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("movie");
  const [query, setQuery] = useState("");

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
    if (!q.trim()) setSelectedItem(null);
  }, []);

  // Trigger search whenever query or mediaType changes
  useEffect(() => {
    if (query.trim()) {
      search(query, mediaType);
    }
  }, [query, mediaType, search]);

  const handleTypeChange = (type: MediaType) => {
    setMediaType(type);
    setSelectedItem(null);
    setQuery("");
    clear();
  };

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
        <h1 className="app__title">🎬 MovieStream</h1>
        <p className="app__subtitle">
          Search movies and TV shows and find where to watch them worldwide
        </p>
        <MediaToggle value={mediaType} onChange={handleTypeChange} />
        <SearchBar
          query={query}
          onQueryChange={handleQueryChange}
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
            onClose={() => setSelectedItem(null)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
