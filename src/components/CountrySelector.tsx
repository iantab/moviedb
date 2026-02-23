import { COUNTRY_NAMES } from "../utils/countryNames";

interface Props {
  availableCountries: string[];
  selected: string | null;
  onSelect: (code: string) => void;
}

export function CountrySelector({
  availableCountries,
  selected,
  onSelect,
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
        {sorted.map((code) => (
          <button
            key={code}
            className={`country-btn ${selected === code ? "country-btn--selected" : ""}`}
            onClick={() => onSelect(code)}
            title={COUNTRY_NAMES[code] ?? code}
          >
            <span className="country-btn__flag">{countryCodeToFlag(code)}</span>
            <span className="country-btn__name">
              {COUNTRY_NAMES[code] ?? code}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join("");
}
