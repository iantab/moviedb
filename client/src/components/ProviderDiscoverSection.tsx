import type { MediaItem, MediaType } from "../types/tmdb";
import { useProviderDiscover } from "../hooks/useProviderDiscover";
import { MovieCard } from "./MovieCard";
import { ErrorMessage } from "./ErrorMessage";
import { COUNTRY_NAMES } from "../utils/countryNames";

export const PROVIDERS = [
  { id: 8, name: "Netflix" },
  { id: 9, name: "Amazon Prime Video" },
  { id: 337, name: "Disney+" },
  { id: 15, name: "Hulu" },
  { id: 384, name: "Max" },
  { id: 350, name: "Apple TV+" },
  { id: 531, name: "Paramount+" },
  { id: 386, name: "Peacock" },
] as const;

const COMMON_COUNTRIES = [
  "US",
  "GB",
  "CA",
  "AU",
  "DE",
  "FR",
  "ES",
  "IT",
  "NL",
  "SE",
  "NO",
  "DK",
  "FI",
  "BR",
  "MX",
  "AR",
  "CO",
  "CL",
  "JP",
  "KR",
  "IN",
  "PH",
  "TH",
  "NZ",
  "IE",
  "PT",
  "PL",
  "BE",
  "CH",
  "AT",
  "ZA",
  "NG",
  "EG",
  "SA",
  "AE",
  "TR",
  "RU",
  "ID",
  "MY",
  "SG",
] as const;

interface Props {
  mediaType: MediaType;
  selectedId: number | null;
  onItemClick: (item: MediaItem) => void;
  providerId: number;
  onProviderChange: (id: number) => void;
  countryCode: string;
  onCountryChange: (code: string) => void;
}

export function ProviderDiscoverSection({
  mediaType,
  selectedId,
  onItemClick,
  providerId,
  onProviderChange,
  countryCode,
  onCountryChange,
}: Props) {
  const { items, loading, error, retry } = useProviderDiscover(
    mediaType,
    providerId,
    countryCode,
  );

  const providerName =
    PROVIDERS.find((p) => p.id === providerId)?.name ?? "Provider";
  const countryName = COUNTRY_NAMES[countryCode] ?? countryCode;

  return (
    <section className="discovery__section">
      <div className="discovery__heading-row">
        <h2 className="discovery__heading">
          Top {mediaType === "movie" ? "Movies" : "Shows"} on{" "}
          <select
            className="discovery__inline-select"
            value={providerId}
            onChange={(e) => onProviderChange(Number(e.target.value))}
            aria-label="Select streaming provider"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>{" "}
          in{" "}
          <select
            className="discovery__inline-select"
            value={countryCode}
            onChange={(e) => onCountryChange(e.target.value)}
            aria-label="Select country"
          >
            {COMMON_COUNTRIES.map((code) => (
              <option key={code} value={code}>
                {COUNTRY_NAMES[code] ?? code}
              </option>
            ))}
          </select>
        </h2>
      </div>

      {loading && <p className="loading-text">Loading...</p>}
      {error && <ErrorMessage message={error} onRetry={retry} />}

      {!loading && !error && items.length > 0 && (
        <div className="movie-grid">
          {items.map((item: MediaItem) => (
            <MovieCard
              key={item.id}
              item={item}
              onClick={onItemClick}
              selected={selectedId === item.id}
            />
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="empty-text">
          No {mediaType === "movie" ? "movies" : "shows"} found for{" "}
          {providerName} in {countryName}.
        </p>
      )}
    </section>
  );
}
