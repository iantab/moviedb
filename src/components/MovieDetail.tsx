import { useState } from "react";
import type { Movie } from "../types/tmdb";
import { IMAGE_BASE_URL } from "../services/tmdb";
import { useWatchProviders } from "../hooks/useWatchProviders";
import { CountrySelector } from "./CountrySelector";
import { ProviderList } from "./ProviderList";

const NETFLIX_ID = 8;

interface Props {
  movie: Movie;
  onClose: () => void;
}

export function MovieDetail({ movie, onClose }: Props) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [netflixOnly, setNetflixOnly] = useState(false);
  const { data, loading, error } = useWatchProviders(movie.id);

  const backdropUrl = movie.backdrop_path
    ? `${IMAGE_BASE_URL}/w780${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `${IMAGE_BASE_URL}/w342${movie.poster_path}`
    : null;

  const availableCountries = data
    ? Object.keys(data.results).filter((code) => {
        const p = data.results[code];
        return p.flatrate?.length || p.free?.length || p.ads?.length;
      })
    : [];

  const netflixCountries = data
    ? Object.keys(data.results).filter((code) =>
        data.results[code].flatrate?.some((p) => p.provider_id === NETFLIX_ID),
      )
    : [];

  const displayedCountries = netflixOnly
    ? availableCountries.filter((c) => netflixCountries.includes(c))
    : availableCountries;

  const countryProviders =
    selectedCountry && data ? data.results[selectedCountry] : null;

  const handleNetflixToggle = () => {
    setNetflixOnly((prev) => !prev);
    setSelectedCountry(null);
  };

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
          <div className="movie-detail__streaming-header">
            <h3 className="movie-detail__section-title">
              🌍 Streaming Availability
            </h3>
            {netflixCountries.length > 0 && (
              <button
                className={`netflix-filter-btn ${netflixOnly ? "netflix-filter-btn--active" : ""}`}
                onClick={handleNetflixToggle}
                title={
                  netflixOnly
                    ? "Show all countries"
                    : `Available on Netflix in ${netflixCountries.length} countries`
                }
              >
                <span className="netflix-filter-btn__n">N</span>
                <span className="netflix-filter-btn__label">Netflix</span>
              </button>
            )}
          </div>

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
                availableCountries={displayedCountries}
                selected={selectedCountry}
                onSelect={setSelectedCountry}
                netflixCountries={netflixCountries}
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
