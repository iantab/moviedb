import { type KeyboardEvent, useReducer, useRef, useEffect } from "react";
import type { MediaItem } from "../types/tmdb";
import { getTitle, getReleaseYear } from "../types/tmdb";

function getSuggestionMeta(item: MediaItem): string {
  const year = getReleaseYear(item);
  const countries = item.origin_country ?? [];
  const country =
    countries.length > 0
      ? countries[0]
      : (item.original_language?.toUpperCase() ?? "");
  const parts: string[] = [];
  if (year && year !== "N/A") parts.push(year);
  if (country) parts.push(country);
  return parts.join(" · ");
}

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: () => void;
  onSuggestionSelect: (item: MediaItem) => void;
  suggestions: MediaItem[];
  loading: boolean;
  placeholder: string;
}

interface State {
  activeIndex: number;
  dismissed: boolean;
  justSelected: boolean;
  lastSuggestions: MediaItem[];
}

type Action =
  | { type: "NEW_SUGGESTIONS"; suggestions: MediaItem[] }
  | { type: "DISMISS" }
  | { type: "FOCUS" }
  | { type: "ARROW_DOWN"; max: number }
  | { type: "ARROW_UP" }
  | { type: "SELECT" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "NEW_SUGGESTIONS":
      if (action.suggestions === state.lastSuggestions) return state;
      // If the user just selected an item, absorb the follow-up suggestions
      // change without reopening the dropdown.
      if (state.justSelected) {
        return {
          ...state,
          justSelected: false,
          lastSuggestions: action.suggestions,
        };
      }
      return {
        ...state,
        activeIndex: -1,
        dismissed: false,
        lastSuggestions: action.suggestions,
      };
    case "DISMISS":
      return { ...state, dismissed: true };
    case "FOCUS":
      return { ...state, dismissed: false, justSelected: false };
    case "ARROW_DOWN":
      return {
        ...state,
        activeIndex: Math.min(state.activeIndex + 1, action.max),
      };
    case "ARROW_UP":
      return { ...state, activeIndex: Math.max(state.activeIndex - 1, -1) };
    case "SELECT":
      return { ...state, dismissed: true, activeIndex: -1, justSelected: true };
    default:
      return state;
  }
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
  const [state, dispatch] = useReducer(reducer, {
    activeIndex: -1,
    dismissed: false,
    justSelected: false,
    lastSuggestions: suggestions,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync new suggestions into the reducer (replaces the old useEffect)
  if (suggestions !== state.lastSuggestions) {
    dispatch({ type: "NEW_SUGGESTIONS", suggestions });
  }

  const open =
    !state.dismissed && suggestions.length > 0 && query.trim().length > 0;

  // Close on outside click
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
