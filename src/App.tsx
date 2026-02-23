import { useState, useCallback } from "react";
import { useMovieSearch } from "./hooks/useMovieSearch";
import { SearchBar } from "./components/SearchBar";
import { MovieCard } from "./components/MovieCard";
import { MovieDetail } from "./components/MovieDetail";
import { MediaToggle } from "./components/MediaToggle";
import type { MediaItem, MediaType } from "./types/tmdb";
import "./App.css";

function App() {
  const { results, loading, error, search } = useMovieSearch();
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("movie");

  const handleSearch = useCallback(
    (query: string) => {
      setSelectedItem(null);
      search(query, mediaType);
    },
    [search, mediaType],
  );

  const handleTypeChange = (type: MediaType) => {
    setMediaType(type);
    setSelectedItem(null);
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
          onSearch={handleSearch}
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
