import { COUNTRY_NAMES } from "../utils/countryNames";

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
  const sorted = [...availableCountries].sort((a, b) => {
    const nameA = COUNTRY_NAMES[a] ?? a;
    const nameB = COUNTRY_NAMES[b] ?? b;
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="country-selector">
      <h3 className="country-selector__title">
        Available in {availableCountries.length} countries
      </h3>
      <div className="country-selector__grid">
        {sorted.map((code) => {
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
              {isNetflix && <span className="country-btn__netflix-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
