import { getSuggestionMeta, searchBarReducer } from "../components/SearchBar";
import type { Movie, TvShow, MediaItem } from "../types/tmdb";

// ── fixtures ──────────────────────────────────────────────────────────────────

const movie2010: Movie = {
  id: 1,
  title: "Inception",
  overview: "",
  poster_path: null,
  backdrop_path: null,
  release_date: "2010-07-16",
  vote_average: 8.8,
  genre_ids: [],
  origin_country: ["US"],
  original_language: "en",
};

const tvShow: TvShow = {
  id: 2,
  name: "Squid Game",
  overview: "",
  poster_path: null,
  backdrop_path: null,
  first_air_date: "2021-09-17",
  vote_average: 8.0,
  genre_ids: [],
  origin_country: ["KR"],
  original_language: "ko",
};

const noDateMovie: Movie = {
  id: 3,
  title: "Unknown",
  overview: "",
  poster_path: null,
  backdrop_path: null,
  release_date: "",
  vote_average: 0,
  genre_ids: [],
};

const suggestions: MediaItem[] = [movie2010, tvShow];

// ── getSuggestionMeta ─────────────────────────────────────────────────────────

describe("getSuggestionMeta", () => {
  it('returns "year · country" when both are present', () => {
    expect(getSuggestionMeta(movie2010)).toBe("2010 · US");
  });

  it("prefers origin_country[0] over original_language", () => {
    expect(getSuggestionMeta(tvShow)).toBe("2021 · KR");
  });

  it("falls back to uppercased original_language when origin_country is empty", () => {
    const item: Movie = {
      ...movie2010,
      origin_country: [],
      original_language: "ja",
    };
    expect(getSuggestionMeta(item)).toBe("2010 · JA");
  });

  it('omits year when release_date is empty (getReleaseYear returns "N/A")', () => {
    const item: Movie = {
      ...noDateMovie,
      origin_country: ["FR"],
    };
    expect(getSuggestionMeta(item)).toBe("FR");
  });

  it("returns empty string when no year and no country/language", () => {
    expect(getSuggestionMeta(noDateMovie)).toBe("");
  });

  it("returns just year when country is absent and language is undefined", () => {
    const item: Movie = {
      ...movie2010,
      origin_country: [],
      original_language: undefined,
    };
    expect(getSuggestionMeta(item)).toBe("2010");
  });

  it('returns just country when year is "N/A"', () => {
    const item: Movie = {
      ...noDateMovie,
      origin_country: ["DE"],
    };
    expect(getSuggestionMeta(item)).toBe("DE");
  });
});

// ── searchBarReducer ──────────────────────────────────────────────────────────

const makeState = (overrides: object = {}) => ({
  activeIndex: -1,
  dismissed: false,
  justSelected: false,
  lastSuggestions: [] as MediaItem[],
  ...overrides,
});

describe("searchBarReducer", () => {
  describe("NEW_SUGGESTIONS", () => {
    it("resets activeIndex to -1 and clears dismissed on a new ref", () => {
      const state = makeState({ activeIndex: 2, dismissed: true });
      const next = searchBarReducer(state, {
        type: "NEW_SUGGESTIONS",
        suggestions,
      });
      expect(next.activeIndex).toBe(-1);
      expect(next.dismissed).toBe(false);
      expect(next.lastSuggestions).toBe(suggestions);
    });

    it("returns the exact same state object when the ref is unchanged", () => {
      const state = makeState({ lastSuggestions: suggestions });
      const next = searchBarReducer(state, {
        type: "NEW_SUGGESTIONS",
        suggestions,
      });
      expect(next).toBe(state);
    });

    it("absorbs change when justSelected is true without reopening dropdown", () => {
      const state = makeState({
        justSelected: true,
        dismissed: true,
        lastSuggestions: [] as MediaItem[],
      });
      const next = searchBarReducer(state, {
        type: "NEW_SUGGESTIONS",
        suggestions,
      });
      expect(next.justSelected).toBe(false);
      expect(next.dismissed).toBe(true); // not cleared
      expect(next.lastSuggestions).toBe(suggestions);
      expect(next.activeIndex).toBe(-1); // unchanged from state
    });
  });

  describe("DISMISS", () => {
    it("sets dismissed: true", () => {
      const state = makeState({ dismissed: false });
      const next = searchBarReducer(state, { type: "DISMISS" });
      expect(next.dismissed).toBe(true);
    });
  });

  describe("FOCUS", () => {
    it("clears dismissed and justSelected", () => {
      const state = makeState({ dismissed: true, justSelected: true });
      const next = searchBarReducer(state, { type: "FOCUS" });
      expect(next.dismissed).toBe(false);
      expect(next.justSelected).toBe(false);
    });
  });

  describe("ARROW_DOWN", () => {
    it("increments activeIndex", () => {
      const state = makeState({ activeIndex: 0 });
      const next = searchBarReducer(state, { type: "ARROW_DOWN", max: 5 });
      expect(next.activeIndex).toBe(1);
    });

    it("caps at max", () => {
      const state = makeState({ activeIndex: 5 });
      const next = searchBarReducer(state, { type: "ARROW_DOWN", max: 5 });
      expect(next.activeIndex).toBe(5);
    });
  });

  describe("ARROW_UP", () => {
    it("decrements activeIndex", () => {
      const state = makeState({ activeIndex: 2 });
      const next = searchBarReducer(state, { type: "ARROW_UP" });
      expect(next.activeIndex).toBe(1);
    });

    it("floors at -1", () => {
      const state = makeState({ activeIndex: -1 });
      const next = searchBarReducer(state, { type: "ARROW_UP" });
      expect(next.activeIndex).toBe(-1);
    });
  });

  describe("SELECT", () => {
    it("sets dismissed: true, activeIndex: -1, justSelected: true", () => {
      const state = makeState({ activeIndex: 2, dismissed: false });
      const next = searchBarReducer(state, { type: "SELECT" });
      expect(next.dismissed).toBe(true);
      expect(next.activeIndex).toBe(-1);
      expect(next.justSelected).toBe(true);
    });
  });

  describe("unknown action (default branch)", () => {
    it("returns state unchanged", () => {
      const state = makeState();
      // @ts-expect-error testing unknown action type
      const next = searchBarReducer(state, { type: "UNKNOWN" });
      expect(next).toBe(state);
    });
  });
});
