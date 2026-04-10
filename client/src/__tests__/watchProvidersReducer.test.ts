import { reducer } from "../hooks/useWatchProviders";
import type { WatchProvidersResult } from "../types/tmdb";

// useWatchProviders imports from services/tmdb which uses import.meta.env — mock it.
jest.mock("../services/tmdb", () => ({
  __esModule: true,
  default: { get: jest.fn() },
  IMAGE_BASE_URL: "https://img.tmdb.org",
}));

const initialState = { data: null, loading: false, error: null };

const sampleData: WatchProvidersResult = {
  id: 42,
  results: {
    US: {
      link: "https://www.themoviedb.org/movie/42/watch",
      flatrate: [
        {
          logo_path: "/netflix.png",
          provider_id: 8,
          provider_name: "Netflix",
          display_priority: 0,
        },
      ],
    },
  },
};

describe("useWatchProviders reducer", () => {
  describe("initial state shape", () => {
    it("has data: null, loading: false, error: null", () => {
      expect(initialState).toEqual({ data: null, loading: false, error: null });
    });
  });

  describe("FETCH_START", () => {
    it("sets loading: true", () => {
      const result = reducer(initialState, { type: "FETCH_START" });
      expect(result.loading).toBe(true);
    });

    it("clears error", () => {
      const state = { ...initialState, error: "previous error" };
      const result = reducer(state, { type: "FETCH_START" });
      expect(result.error).toBeNull();
    });

    it("preserves existing data", () => {
      const state = { data: sampleData, loading: false, error: null };
      const result = reducer(state, { type: "FETCH_START" });
      expect(result.data).toBe(sampleData);
    });
  });

  describe("FETCH_SUCCESS", () => {
    it("sets data to payload", () => {
      const result = reducer(initialState, {
        type: "FETCH_SUCCESS",
        payload: sampleData,
      });
      expect(result.data).toBe(sampleData);
    });

    it("sets loading: false", () => {
      const state = { ...initialState, loading: true };
      const result = reducer(state, {
        type: "FETCH_SUCCESS",
        payload: sampleData,
      });
      expect(result.loading).toBe(false);
    });

    it("clears error", () => {
      const state = { data: null, loading: true, error: "oops" };
      const result = reducer(state, {
        type: "FETCH_SUCCESS",
        payload: sampleData,
      });
      expect(result.error).toBeNull();
    });
  });

  describe("FETCH_ERROR", () => {
    it("sets error message", () => {
      const result = reducer(initialState, {
        type: "FETCH_ERROR",
        payload: "Network error",
      });
      expect(result.error).toBe("Network error");
    });

    it("clears data", () => {
      const state = { data: sampleData, loading: true, error: null };
      const result = reducer(state, {
        type: "FETCH_ERROR",
        payload: "Failed",
      });
      expect(result.data).toBeNull();
    });

    it("sets loading: false", () => {
      const state = { data: null, loading: true, error: null };
      const result = reducer(state, {
        type: "FETCH_ERROR",
        payload: "Failed",
      });
      expect(result.loading).toBe(false);
    });
  });
});
