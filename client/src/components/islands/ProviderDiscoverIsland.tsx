import { useState } from "react"
import { useProviderDiscover } from "@/hooks/useProviderDiscover"
import type { MediaItem, MediaType } from "@/lib/types/tmdb"
import { getTitle, getReleaseYear, isTvShow } from "@/lib/types/tmdb"
import { IMAGE_BASE_URL } from "@/lib/tmdb-client"
import { COUNTRY_NAMES } from "@/lib/utils/countryNames"
import { detectCountry } from "@/lib/utils/detectCountry"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const PROVIDERS = [
  { id: 8, name: "Netflix" },
  { id: 9, name: "Amazon Prime Video" },
  { id: 337, name: "Disney+" },
  { id: 15, name: "Hulu" },
  { id: 384, name: "Max" },
  { id: 350, name: "Apple TV+" },
  { id: 531, name: "Paramount+" },
  { id: 386, name: "Peacock" },
] as const

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
] as const

interface Props {
  mediaType: MediaType
}

export default function ProviderDiscoverIsland({ mediaType }: Props) {
  const [providerId, setProviderId] = useState<number>(PROVIDERS[0].id)
  const [countryCode, setCountryCode] = useState(detectCountry)
  const { items, loading, error, retry } = useProviderDiscover(
    mediaType,
    providerId,
    countryCode
  )

  const providerName =
    PROVIDERS.find((p) => p.id === providerId)?.name ?? "Provider"
  const countryName = COUNTRY_NAMES[countryCode] ?? countryCode

  return (
    <section>
      <div className="mb-4">
        <h2 className="inline text-xl font-bold text-foreground">
          Top {mediaType === "movie" ? "Movies" : "Shows"} on{" "}
        </h2>
        <select
          className="inline cursor-pointer appearance-none rounded-full border-[1.5px] border-primary/25 bg-primary/[0.05] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2210%22%20height=%226%22%3E%3Cpath%20d=%22M0%200l5%206%205-6z%22%20fill=%22%237c6fe0%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_0.7rem_center] bg-no-repeat py-1.5 pr-7 pl-3.5 text-[0.95em] font-semibold text-primary transition-all outline-none hover:border-primary hover:bg-primary/10 focus:border-primary focus:bg-primary/10 focus:shadow-[0_0_0_2px_rgba(124,111,224,0.2)] [&_option]:bg-card [&_option]:text-foreground"
          value={providerId}
          onChange={(e) => setProviderId(Number(e.target.value))}
          aria-label="Select streaming provider"
        >
          {PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>{" "}
        <h2 className="inline text-xl font-bold text-foreground">in </h2>
        <select
          className="inline cursor-pointer appearance-none rounded-full border-[1.5px] border-primary/25 bg-primary/[0.05] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2210%22%20height=%226%22%3E%3Cpath%20d=%22M0%200l5%206%205-6z%22%20fill=%22%237c6fe0%22/%3E%3C/svg%3E')] bg-[length:10px_6px] bg-[right_0.7rem_center] bg-no-repeat py-1.5 pr-7 pl-3.5 text-[0.95em] font-semibold text-primary transition-all outline-none hover:border-primary hover:bg-primary/10 focus:border-primary focus:bg-primary/10 focus:shadow-[0_0_0_2px_rgba(124,111,224,0.2)] [&_option]:bg-card [&_option]:text-foreground"
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          aria-label="Select country"
        >
          {COMMON_COUNTRIES.map((code) => (
            <option key={code} value={code}>
              {COUNTRY_NAMES[code] ?? code}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="grid grid-cols-5 gap-5 max-md:grid-cols-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl">
              <Skeleton className="aspect-[2/3] w-full rounded-none" />
              <div className="space-y-2 p-2.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-3 p-6">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-5 gap-5 max-md:grid-cols-2">
          {items.map((item: MediaItem) => {
            const type = isTvShow(item) ? "tv" : mediaType
            const posterUrl = item.poster_path
              ? `${IMAGE_BASE_URL}/w185${item.poster_path}`
              : null
            return (
              <a
                key={item.id}
                href={`/${type}/${item.id}`}
                className="group block overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-primary/40"
              >
                <div className="aspect-[2/3]">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={getTitle(item)}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary text-4xl text-muted-foreground">
                      🎬
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <h3 className="mb-1 line-clamp-2 text-[0.82rem] leading-tight font-semibold text-foreground">
                    {getTitle(item)}
                  </h3>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{getReleaseYear(item)}</span>
                    <span>
                      ⭐{" "}
                      {item.vote_average ? item.vote_average.toFixed(1) : "?"}
                    </span>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No {mediaType === "movie" ? "movies" : "shows"} found for{" "}
          {providerName} in {countryName}.
        </p>
      )}
    </section>
  )
}
