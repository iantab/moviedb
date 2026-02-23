import type { KeyboardEvent } from "react";

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  loading: boolean;
  placeholder: string;
}

export function SearchBar({
  query,
  onQueryChange,
  onSearch,
  loading,
  placeholder,
}: Props) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch();
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="search-input"
      />
      <button
        className="search-btn"
        onClick={onSearch}
        disabled={!query.trim() || loading}
        aria-label="Search"
      >
        {loading ? <span className="search-spinner" /> : "Search"}
      </button>
    </div>
  );
}
