import { useState, useRef, useEffect } from "react";

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
  placeholder: string;
}

export function SearchBar({ onSearch, loading, placeholder }: Props) {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onSearch(query);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, onSearch]);

  // Clear query when placeholder changes (i.e. media type toggled)
  const prevPlaceholder = useRef(placeholder);
  useEffect(() => {
    if (prevPlaceholder.current !== placeholder) {
      setQuery("");
      prevPlaceholder.current = placeholder;
    }
  }, [placeholder]);

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
      {loading && <span className="search-spinner" />}
    </div>
  );
}
