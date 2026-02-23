import { useRef, useEffect } from "react";

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  loading: boolean;
  placeholder: string;
}

export function SearchBar({
  query,
  onQueryChange,
  loading,
  placeholder,
}: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onQueryChange(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, onQueryChange]);

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="search-input"
      />
      {loading && <span className="search-spinner" />}
    </div>
  );
}
