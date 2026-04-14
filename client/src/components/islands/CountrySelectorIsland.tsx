import { useState, useRef } from "react"
import type { CountryProviders, WatchProvider } from "@/lib/types/tmdb"
import { IMAGE_BASE_URL } from "@/lib/tmdb-client"
import { COUNTRY_NAMES } from "@/lib/utils/countryNames"
import {
  CONTINENT_NAMES,
  CONTINENT_ORDER,
  getContinent,
} from "@/lib/utils/continents"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface Props {
  availableCountries: string[]
  netflixCountries: string[]
  providers: Record<string, CountryProviders>
  defaultCountry: string
}

function ProviderGroup({
  label,
  providers,
}: {
  label: string
  providers: WatchProvider[]
}) {
  return (
    <div className="mb-5">
      <h4 className="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </h4>
      <div className="flex flex-wrap gap-3">
        {providers.map((p) => (
          <div
            key={p.provider_id}
            className="flex w-[72px] flex-col items-center gap-1"
            title={p.provider_name}
          >
            <img
              src={`${IMAGE_BASE_URL}/w45${p.logo_path}`}
              alt={p.provider_name}
              className="h-12 w-12 rounded-[10px] object-cover shadow-md"
            />
            <span className="text-center text-[0.68rem] leading-tight break-words text-muted-foreground">
              {p.provider_name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CountrySelectorIsland({
  availableCountries,
  netflixCountries,
  providers,
  defaultCountry,
}: Props) {
  const [selected, setSelected] = useState<string>(
    availableCountries.includes(defaultCountry)
      ? defaultCountry
      : availableCountries[0] || "US"
  )
  const [netflixOnly, setNetflixOnly] = useState(false)
  const providerListRef = useRef<HTMLDivElement>(null)

  // Group countries by continent
  const filteredCountries = netflixOnly
    ? availableCountries.filter((c) => netflixCountries.includes(c))
    : availableCountries

  const groups: Record<string, string[]> = {}
  for (const code of filteredCountries) {
    const continent = getContinent(code)
    if (!groups[continent]) groups[continent] = []
    groups[continent].push(code)
  }

  for (const continent of Object.keys(groups)) {
    groups[continent].sort((a, b) =>
      (COUNTRY_NAMES[a] ?? a).localeCompare(COUNTRY_NAMES[b] ?? b)
    )
  }

  const sortedContinents = Object.keys(groups).sort(
    (a, b) => (CONTINENT_ORDER[a] ?? 98) - (CONTINENT_ORDER[b] ?? 98)
  )

  const [openContinents, setOpenContinents] = useState<Set<string>>(
    () => new Set(sortedContinents)
  )

  const effectiveOpen = new Set(openContinents)
  if (selected) effectiveOpen.add(getContinent(selected))

  const toggleContinent = (continent: string) => {
    setOpenContinents((prev) => {
      const next = new Set(prev)
      if (next.has(continent)) next.delete(continent)
      else next.add(continent)
      return next
    })
  }

  const expandAll = () => setOpenContinents(new Set(sortedContinents))
  const collapseAll = () => setOpenContinents(new Set())

  const currentProviders = providers[selected]

  return (
    <div className="flex flex-col gap-6">
      {/* Header: title + Netflix filter */}
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-[#c0b8f0]">
          Where to Watch
        </h3>
        {netflixCountries.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1.5",
              netflixOnly
                ? "border-[#e50008] bg-[#e50008]/15 text-[#e50008] hover:bg-[#e50008]/20 hover:text-[#e50008]"
                : "hover:border-[#e50008]/40 hover:bg-[#e50008]/10 hover:text-[#e50008]"
            )}
            onClick={() => setNetflixOnly((v) => !v)}
          >
            <span className="text-base leading-none font-black text-[#e50008] italic">
              N
            </span>
            <span className="text-[0.82rem]">
              {netflixOnly ? "Show all" : "Netflix only"}
            </span>
          </Button>
        )}
      </div>

      {/* Country selector */}
      <div>
        <div className="mb-3.5 flex items-center justify-between gap-4">
          <h3 className="text-sm text-muted-foreground">
            Available in {filteredCountries.length}{" "}
            {filteredCountries.length === 1 ? "country" : "countries"}
          </h3>
          <div className="flex flex-shrink-0 gap-1.5">
            <Button variant="ghost" size="xs" onClick={expandAll}>
              Expand all
            </Button>
            <Button variant="ghost" size="xs" onClick={collapseAll}>
              Collapse all
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {sortedContinents.map((continent) => {
            const codes = groups[continent]
            const isOpen = effectiveOpen.has(continent)
            const netflixCount = codes.filter((c) =>
              netflixCountries.includes(c)
            ).length

            return (
              <Collapsible
                key={continent}
                open={isOpen}
                onOpenChange={() => toggleContinent(continent)}
              >
                <CollapsibleTrigger asChild>
                  <button className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none bg-white/[0.03] px-3.5 py-2.5 text-left ring-1 ring-foreground/10 transition-colors hover:bg-white/[0.06]">
                    <span
                      className="inline-block flex-shrink-0 text-[0.6rem] text-primary transition-transform"
                      style={{
                        transform: isOpen ? "rotate(90deg)" : undefined,
                      }}
                    >
                      ▶
                    </span>
                    <span className="flex-1 text-[0.85rem] font-semibold text-foreground/90">
                      {CONTINENT_NAMES[continent] ?? continent}
                    </span>
                    <Badge variant="secondary" className="text-[0.72rem]">
                      {codes.length}
                    </Badge>
                    {netflixCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[0.72rem] font-semibold text-[#e50008]">
                        <span className="font-black text-[#e50008] italic">
                          N
                        </span>
                        {netflixCount}
                      </span>
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-wrap gap-2 px-3.5 py-3">
                    {codes.map((code) => {
                      const isNetflix = netflixCountries.includes(code)
                      return (
                        <Badge
                          key={code}
                          variant="outline"
                          className={cn(
                            "h-auto cursor-pointer px-3 py-1.5 text-[0.78rem] transition-all",
                            selected === code
                              ? isNetflix
                                ? "border-[#e50008] bg-[#e50008]/15 text-white"
                                : "border-primary bg-primary/15 text-white"
                              : isNetflix
                                ? "border-[#e50008]/35 bg-[#e50008]/[0.06] text-foreground/80 hover:border-[#e50008]/55 hover:bg-[#e50008]/[0.12] hover:text-white"
                                : "hover:border-primary/40 hover:bg-primary/10 hover:text-white"
                          )}
                          onClick={() => {
                            setSelected(code)
                            setTimeout(() => {
                              providerListRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              })
                            }, 50)
                          }}
                          title={`${COUNTRY_NAMES[code] ?? code}${isNetflix ? " — on Netflix" : ""}`}
                        >
                          {COUNTRY_NAMES[code] ?? code}
                          {isNetflix && (
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#e50008]" />
                          )}
                        </Badge>
                      )
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </div>

      {/* Separator between countries and providers */}
      <Separator />

      {/* Provider list for selected country */}
      {currentProviders && (
        <div ref={providerListRef}>
          <a
            href={currentProviders.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-block text-sm text-primary hover:underline"
          >
            View on TMDB ({selected})
          </a>
          {!currentProviders.flatrate?.length &&
          !currentProviders.free?.length &&
          !currentProviders.ads?.length ? (
            <p className="text-sm text-muted-foreground">
              No streaming data available for this country.
            </p>
          ) : (
            <>
              {currentProviders.flatrate?.length ? (
                <ProviderGroup
                  label="Stream"
                  providers={currentProviders.flatrate}
                />
              ) : null}
              {currentProviders.free?.length ? (
                <ProviderGroup label="Free" providers={currentProviders.free} />
              ) : null}
              {currentProviders.ads?.length ? (
                <ProviderGroup
                  label="Free with Ads"
                  providers={currentProviders.ads}
                />
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}
