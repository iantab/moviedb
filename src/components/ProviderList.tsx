import type { CountryProviders, WatchProvider } from "../types/tmdb";
import { IMAGE_BASE_URL } from "../services/tmdb";

interface Props {
  countryCode: string;
  providers: CountryProviders;
}

function ProviderGroup({
  label,
  providers,
}: {
  label: string;
  providers: WatchProvider[];
}) {
  return (
    <div className="provider-group">
      <h4 className="provider-group__label">{label}</h4>
      <div className="provider-group__list">
        {providers.map((p) => (
          <div
            key={p.provider_id}
            className="provider-chip"
            title={p.provider_name}
          >
            <img
              src={`${IMAGE_BASE_URL}/w45${p.logo_path}`}
              alt={p.provider_name}
              className="provider-chip__logo"
            />
            <span className="provider-chip__name">{p.provider_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProviderList({ countryCode, providers }: Props) {
  const hasAny =
    providers.flatrate?.length ||
    providers.rent?.length ||
    providers.buy?.length ||
    providers.free?.length ||
    providers.ads?.length;

  return (
    <div className="provider-list">
      <a
        href={providers.link}
        target="_blank"
        rel="noopener noreferrer"
        className="provider-list__tmdb-link"
      >
        View on TMDB ({countryCode})
      </a>
      {!hasAny && (
        <p className="provider-list__empty">
          No streaming data available for this country.
        </p>
      )}
      {providers.flatrate?.length ? (
        <ProviderGroup label="Stream" providers={providers.flatrate} />
      ) : null}
      {providers.free?.length ? (
        <ProviderGroup label="Free" providers={providers.free} />
      ) : null}
      {providers.ads?.length ? (
        <ProviderGroup label="Free with Ads" providers={providers.ads} />
      ) : null}
      {providers.rent?.length ? (
        <ProviderGroup label="Rent" providers={providers.rent} />
      ) : null}
      {providers.buy?.length ? (
        <ProviderGroup label="Buy" providers={providers.buy} />
      ) : null}
    </div>
  );
}
