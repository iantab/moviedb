import { useState } from "react";
import type { Movie } from "../types/tmdb";
import { IMAGE_BASE_URL } from "../services/tmdb";
import { useWatchProviders } from "../hooks/useWatchProviders";
import { CountrySelector } from "./CountrySelector";
import { ProviderList } from "./ProviderList";

interface Props {
  movie: Movie;
  onClose: () => void;
}

export function MovieDetail({ movie, onClose }: Props) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const { data, loading, error } = useWatchProviders(movie.id);

  const backdropUrl = movie.backdrop_path
    ? `${IMAGE_BASE_URL}/w780${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `${IMAGE_BASE_URL}/w342${movie.poster_path}`
    : null;

  const availableCountries = data ? Object.keys(data.results) : [];
  const countryProviders =
    selectedCountry && data ? data.results[selectedCountry] : null;

  return (
    <div className="movie-detail">
      {backdropUrl && (
        <div
          className="movie-detail__backdrop"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      )}
      <button
        className="movie-detail__close"
        onClick={onClose}
        aria-label="Close"
      >
        ✕
      </button>

      <div className="movie-detail__content">
        <div className="movie-detail__header">
          {posterUrl && (
            <img
              src={posterUrl}
              alt={movie.title}
              className="movie-detail__poster"
            />
          )}
          <div className="movie-detail__meta">
            <h2 className="movie-detail__title">{movie.title}</h2>
            <p className="movie-detail__year">
              {movie.release_date
                ? movie.release_date.slice(0, 4)
                : "Unknown year"}
            </p>
            <p className="movie-detail__rating">
              ⭐ {movie.vote_average.toFixed(1)} / 10
            </p>
            <p className="movie-detail__overview">
              {movie.overview || "No overview available."}
            </p>
          </div>
        </div>

        <div className="movie-detail__streaming">
          <h3 className="movie-detail__section-title">
            🌍 Streaming Availability
          </h3>

          {loading && <p className="loading-text">Loading streaming data...</p>}
          {error && (
            <p className="error-text">Failed to load streaming data: {error}</p>
          )}

          {!loading && !error && data && availableCountries.length === 0 && (
            <p className="empty-text">
              No streaming data available for this movie.
            </p>
          )}

          {!loading && !error && availableCountries.length > 0 && (
            <>
              <CountrySelector
                availableCountries={availableCountries}
                selected={selectedCountry}
                onSelect={setSelectedCountry}
              />
              {countryProviders && (
                <div className="movie-detail__providers">
                  <h3 className="movie-detail__section-title">
                    📺 Services in {selectedCountry}
                  </h3>
                  <ProviderList
                    countryCode={selectedCountry!}
                    providers={countryProviders}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
