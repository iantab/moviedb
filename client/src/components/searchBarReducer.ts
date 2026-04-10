import type { MediaItem } from "../types/tmdb";

export interface SearchBarState {
  activeIndex: number;
  dismissed: boolean;
  justSelected: boolean;
  lastSuggestions: MediaItem[];
}

export type SearchBarAction =
  | { type: "NEW_SUGGESTIONS"; suggestions: MediaItem[] }
  | { type: "DISMISS" }
  | { type: "FOCUS" }
  | { type: "ARROW_DOWN"; max: number }
  | { type: "ARROW_UP" }
  | { type: "SELECT" };

export function searchBarReducer(
  state: SearchBarState,
  action: SearchBarAction,
): SearchBarState {
  switch (action.type) {
    case "NEW_SUGGESTIONS":
      if (action.suggestions === state.lastSuggestions) return state;
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
