import { discoveryReducer } from "../hooks/useDiscovery";
import type { Movie } from "../types/tmdb";

// useDiscovery imports from services/tmdb which uses import.meta.env — mock it.
jest.mock("../services/tmdb", () => ({
  __esModule: true,
  default: { get: jest.fn() },
  IMAGE_BASE_URL: "https://img.tmdb.org",
}));

const sampleItems: Movie[] = [
  {
    id: 1,
    title: "Test Movie",
    overview: "",
    poster_path: null,
    backdrop_path: null,
    release_date: "2024-01-01",
    vote_average: 7.5,
    genre_ids: [],
  },
];

const initialState = {
  trending: [],
  popular: [],
  trendingLoading: false,
  popularLoading: false,
  error: null,
};

describe("discoveryReducer", () => {
  describe("TRENDING_START", () => {
    it("sets trendingLoading: true", () => {
      const result = discoveryReducer(initialState, { type: "TRENDING_START" });
      expect(result.trendingLoading).toBe(true);
    });

    it("clears error", () => {
      const state = { ...initialState, error: "previous error" };
      const result = discoveryReducer(state, { type: "TRENDING_START" });
      expect(result.error).toBeNull();
    });
  });

  describe("TRENDING_SUCCESS", () => {
    it("sets trending to payload", () => {
      const result = discoveryReducer(initialState, {
        type: "TRENDING_SUCCESS",
        payload: sampleItems,
      });
      expect(result.trending).toBe(sampleItems);
    });

    it("sets trendingLoading: false", () => {
      const state = { ...initialState, trendingLoading: true };
      const result = discoveryReducer(state, {
        type: "TRENDING_SUCCESS",
        payload: sampleItems,
      });
      expect(result.trendingLoading).toBe(false);
    });
  });

  describe("TRENDING_ERROR", () => {
    it("sets error message", () => {
      const result = discoveryReducer(initialState, {
        type: "TRENDING_ERROR",
        payload: "Network error",
      });
      expect(result.error).toBe("Network error");
    });

    it("sets trendingLoading: false", () => {
      const state = { ...initialState, trendingLoading: true };
      const result = discoveryReducer(state, {
        type: "TRENDING_ERROR",
        payload: "Failed",
      });
      expect(result.trendingLoading).toBe(false);
    });
  });

  describe("POPULAR_START", () => {
    it("sets popularLoading: true", () => {
      const result = discoveryReducer(initialState, { type: "POPULAR_START" });
      expect(result.popularLoading).toBe(true);
    });

    it("clears error", () => {
      const state = { ...initialState, error: "previous error" };
      const result = discoveryReducer(state, { type: "POPULAR_START" });
      expect(result.error).toBeNull();
    });
  });

  describe("POPULAR_SUCCESS", () => {
    it("sets popular to payload", () => {
      const result = discoveryReducer(initialState, {
        type: "POPULAR_SUCCESS",
        payload: sampleItems,
      });
      expect(result.popular).toBe(sampleItems);
    });

    it("sets popularLoading: false", () => {
      const state = { ...initialState, popularLoading: true };
      const result = discoveryReducer(state, {
        type: "POPULAR_SUCCESS",
        payload: sampleItems,
      });
      expect(result.popularLoading).toBe(false);
    });
  });

  describe("POPULAR_ERROR", () => {
    it("sets error message", () => {
      const result = discoveryReducer(initialState, {
        type: "POPULAR_ERROR",
        payload: "Network error",
      });
      expect(result.error).toBe("Network error");
    });

    it("sets popularLoading: false", () => {
      const state = { ...initialState, popularLoading: true };
      const result = discoveryReducer(state, {
        type: "POPULAR_ERROR",
        payload: "Failed",
      });
      expect(result.popularLoading).toBe(false);
    });
  });
});
