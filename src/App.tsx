import { useState, useCallback } from "react";
import { useMovieSearch } from "./hooks/useMovieSearch";
import { SearchBar } from "./components/SearchBar";
import { MovieCard } from "./components/MovieCard";
import { MovieDetail } from "./components/MovieDetail";
import type { Movie } from "./types/tmdb";
import "./App.css";

function App() {
  const { results, loading, error, search } = useMovieSearch();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const handleSearch = useCallback(
    (query: string) => {
      setSelectedMovie(null);
      search(query);
    },
    [search],
  );

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">🎬 MovieStream</h1>
        <p className="app__subtitle">
          Search movies and find where to watch them worldwide
        </p>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </header>

      <main className="app__main">
        {error && <p className="error-text">Error: {error}</p>}

        {!selectedMovie && results.length > 0 && (
          <div className="movie-grid">
            {results.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={setSelectedMovie}
                selected={
                  selectedMovie !== null &&
                  (selectedMovie as Movie).id === movie.id
                }
              />
            ))}
          </div>
        )}

        {!selectedMovie && !loading && results.length === 0 && (
          <div className="app__empty">
            <p>🔍 Search for a movie above to get started</p>
          </div>
        )}

        {selectedMovie && (
          <MovieDetail
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
