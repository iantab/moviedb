import { useState } from "react";
import { COUNTRY_NAMES } from "../utils/countryNames";
import {
  CONTINENT_NAMES,
  CONTINENT_ORDER,
  getContinent,
} from "../utils/continents";

interface Props {
  availableCountries: string[];
  selected: string | null;
  onSelect: (code: string) => void;
  netflixCountries?: string[];
}

export function CountrySelector({
  availableCountries,
  selected,
  onSelect,
  netflixCountries = [],
}: Props) {
  // Group countries by continent
  const groups: Record<string, string[]> = {};
  for (const code of availableCountries) {
    const continent = getContinent(code);
    if (!groups[continent]) groups[continent] = [];
    groups[continent].push(code);
  }

  // Sort each group alphabetically
  for (const continent of Object.keys(groups)) {
    groups[continent].sort((a, b) =>
      (COUNTRY_NAMES[a] ?? a).localeCompare(COUNTRY_NAMES[b] ?? b),
    );
  }

  // Sort continents by defined order, OTHER always last
  const sortedContinents = Object.keys(groups).sort((a, b) => {
    return (CONTINENT_ORDER[a] ?? 98) - (CONTINENT_ORDER[b] ?? 98);
  });

  // Track which continents are manually opened/closed
  const [openContinents, setOpenContinents] = useState<Set<string>>(
    () => new Set(),
  );

  // Always ensure the selected country's continent is open
  const effectiveOpen = new Set(openContinents);
  if (selected) effectiveOpen.add(getContinent(selected));

  const toggleContinent = (continent: string) => {
    setOpenContinents((prev) => {
      const next = new Set(prev);
      if (next.has(continent)) {
        next.delete(continent);
      } else {
        next.add(continent);
      }
      return next;
    });
  };

  const expandAll = () => setOpenContinents(new Set(sortedContinents));
  const collapseAll = () => setOpenContinents(new Set());
  return (
    <div className="country-selector">
      <div className="country-selector__header">
        <h3 className="country-selector__title">
          Available in {availableCountries.length}{" "}
          {availableCountries.length === 1 ? "country" : "countries"}
        </h3>
        <div className="country-selector__actions">
          <button className="continent-action-btn" onClick={expandAll}>
            Expand all
          </button>
          <button className="continent-action-btn" onClick={collapseAll}>
            Collapse all
          </button>
        </div>
      </div>
      <div className="continent-list">
        {sortedContinents.map((continent) => {
          const codes = groups[continent];
          const isOpen = effectiveOpen.has(continent);
          const netflixCount = codes.filter((c) =>
            netflixCountries.includes(c),
          ).length;

          return (
            <div key={continent} className="continent-group">
              <button
                className="continent-group__summary"
                onClick={() => toggleContinent(continent)}
                aria-expanded={isOpen}
              >
                <span
                  className="continent-group__arrow"
                  style={{ transform: isOpen ? "rotate(90deg)" : undefined }}
                >
                  ▶
                </span>
                <span className="continent-group__name">
                  {CONTINENT_NAMES[continent] ?? continent}
                </span>
                <span className="continent-group__count">
                  {codes.length} {codes.length === 1 ? "country" : "countries"}
                </span>
                {netflixCount > 0 && (
                  <span className="continent-group__netflix-badge">
                    <span className="netflix-filter-btn__n">N</span>
                    {netflixCount}
                  </span>
                )}
              </button>
              {isOpen && (
                <div className="country-selector__grid">
                  {codes.map((code) => {
                    const isNetflix = netflixCountries.includes(code);
                    return (
                      <button
                        key={code}
                        className={[
                          "country-btn",
                          selected === code ? "country-btn--selected" : "",
                          isNetflix ? "country-btn--netflix" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => onSelect(code)}
                        title={`${COUNTRY_NAMES[code] ?? code}${isNetflix ? " — on Netflix" : ""}`}
                      >
                        <span className="country-btn__name">
                          {COUNTRY_NAMES[code] ?? code}
                        </span>
                        {isNetflix && (
                          <span className="country-btn__netflix-dot" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
