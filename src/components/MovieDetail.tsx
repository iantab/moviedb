import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { MediaItem, MediaType } from "../types/tmdb";
import { getTitle, getReleaseYear, isTvShow } from "../types/tmdb";
import { IMAGE_BASE_URL } from "../services/tmdb";
import { useWatchProviders } from "../hooks/useWatchProviders";
import { CountrySelector } from "./CountrySelector";
import { ProviderList } from "./ProviderList";
import { COUNTRY_NAMES } from "../utils/countryNames";

const NETFLIX_ID = 8;

interface Props {
  item: MediaItem;
  mediaType: MediaType;
  onClose: () => void;
}

export function MovieDetail({ item, mediaType, onClose }: Props) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [netflixOnly, setNetflixOnly] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { data, loading, error } = useWatchProviders(item.id, mediaType);

  useEffect(() => {
    if (selectedCountry && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedCountry]);

  const title = getTitle(item);
  const year = getReleaseYear(item);

  const backdropUrl = item.backdrop_path
    ? `${IMAGE_BASE_URL}/w780${item.backdrop_path}`
    : null;
  const posterUrl = item.poster_path
    ? `${IMAGE_BASE_URL}/w342${item.poster_path}`
    : null;

  const availableCountries = useMemo(
    () =>
      data
        ? Object.keys(data.results).filter((code) => {
            const p = data.results[code];
            return p.flatrate?.length || p.free?.length || p.ads?.length;
          })
        : [],
    [data],
  );

  const netflixCountries = useMemo(
    () =>
      data
        ? Object.keys(data.results).filter((code) =>
            data.results[code].flatrate?.some(
              (p) => p.provider_id === NETFLIX_ID,
            ),
          )
        : [],
    [data],
  );

  const displayedCountries = useMemo(
    () =>
      netflixOnly
        ? availableCountries.filter((c) => netflixCountries.includes(c))
        : availableCountries,
    [netflixOnly, availableCountries, netflixCountries],
  );

  const countryProviders =
    selectedCountry && data ? data.results[selectedCountry] : null;

  const handleNetflixToggle = useCallback(() => {
    setNetflixOnly((prev) => !prev);
    setSelectedCountry(null);
  }, []);

  const noDataLabel = isTvShow(item)
    ? "No streaming data available for this show."
    : "No streaming data available for this movie.";

  return (
    <div className="movie-detail" ref={cardRef}>
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
              alt={title}
              className="movie-detail__poster"
              loading="lazy"
            />
          )}
          <div className="movie-detail__meta">
            <h2 className="movie-detail__title">{title}</h2>
            <p className="movie-detail__year">{year}</p>
            <p className="movie-detail__rating">
              ⭐ {item.vote_average.toFixed(1)} / 10
            </p>
            <p className="movie-detail__overview">
              {item.overview || "No overview available."}
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
            <p className="empty-text">{noDataLabel}</p>
          )}

          {!loading && !error && availableCountries.length > 0 && (
            <>
              {countryProviders && (
                <div className="movie-detail__providers">
                  <h3 className="movie-detail__section-title">
                    📺 Services in{" "}
                    {selectedCountry
                      ? (COUNTRY_NAMES[selectedCountry] ?? selectedCountry)
                      : ""}
                  </h3>
                  <ProviderList
                    countryCode={selectedCountry!}
                    providers={countryProviders}
                  />
                </div>
              )}
              <CountrySelector
                availableCountries={displayedCountries}
                selected={selectedCountry}
                onSelect={setSelectedCountry}
                netflixCountries={netflixCountries}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
