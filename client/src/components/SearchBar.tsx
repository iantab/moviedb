import { useReducer, useRef, useEffect } from "react";
import type { KeyboardEvent } from "react";
import type { MediaItem } from "../types/tmdb";
import { getTitle } from "../types/tmdb";
import { getSuggestionMeta } from "./searchBarUtils";
import {
  searchBarReducer,
  type SearchBarState,
  type SearchBarAction,
} from "./searchBarReducer";

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  onSuggestionSelect: (item: MediaItem) => void;
  suggestions: MediaItem[];
  loading: boolean;
  placeholder: string;
}

export function SearchBar({
  query,
  onQueryChange,
  onSearch,
  onSuggestionSelect,
  suggestions,
  loading,
  placeholder,
}: Props) {
  const [state, dispatch] = useReducer(searchBarReducer, {
    activeIndex: -1,
    dismissed: false,
    justSelected: false,
    lastSuggestions: suggestions,
  } satisfies SearchBarState);

  const containerRef = useRef<HTMLDivElement>(null);

  if (suggestions !== state.lastSuggestions) {
    dispatch({
      type: "NEW_SUGGESTIONS",
      suggestions,
    } satisfies SearchBarAction);
  }

  const open =
    !state.dismissed && suggestions.length > 0 && query.trim().length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        dispatch({ type: "DISMISS" });
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (item: MediaItem) => {
    dispatch({ type: "SELECT" });
    onSuggestionSelect(item);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (open && state.activeIndex >= 0 && suggestions[state.activeIndex]) {
        select(suggestions[state.activeIndex]);
      } else {
        onSearch();
        dispatch({ type: "DISMISS" });
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      dispatch({ type: "ARROW_DOWN", max: suggestions.length - 1 });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      dispatch({ type: "ARROW_UP" });
    } else if (e.key === "Escape") {
      dispatch({ type: "DISMISS" });
    }
  };

  return (
    <div className="search-bar" ref={containerRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          dispatch({ type: "FOCUS" });
          onQueryChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => dispatch({ type: "FOCUS" })}
        className="search-input"
        autoComplete="off"
      />
      <button
        className="search-btn"
        onClick={() => {
          onSearch();
          dispatch({ type: "DISMISS" });
        }}
        disabled={!query.trim() || loading}
        aria-label="Search"
      >
        {loading ? <span className="search-spinner" /> : "Search"}
      </button>

      {open && (
        <ul className="search-suggestions">
          {suggestions.map((item, idx) => (
            <li
              key={item.id}
              className={
                "search-suggestion-item" +
                (idx === state.activeIndex ? " active" : "")
              }
              onMouseDown={() => select(item)}
              onMouseEnter={() => {
                dispatch({ type: "ARROW_DOWN", max: idx });
              }}
            >
              <span className="search-suggestion-title">{getTitle(item)}</span>
              {getSuggestionMeta(item) && (
                <span className="search-suggestion-meta">
                  {getSuggestionMeta(item)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
