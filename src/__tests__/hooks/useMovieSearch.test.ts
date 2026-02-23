/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMovieSearch } from "../../hooks/useMovieSearch";
import { getCached, setCached } from "../../utils/cache";
import tmdbClient from "../../services/tmdb";
import type { Movie } from "../../types/tmdb";

jest.mock("../../services/tmdb");

jest.mock("../../utils/cache", () => ({
  getCached: jest.fn(),
  setCached: jest.fn(),
}));

const mockGet = tmdbClient.get as jest.Mock;
const mockGetCached = getCached as jest.Mock;
const mockSetCached = setCached as jest.Mock;

const makeMovie = (id: number): Movie => ({
  id,
  title: `Movie ${id}`,
  overview: "",
  poster_path: null,
  backdrop_path: null,
  release_date: "2020-01-01",
  vote_average: 7,
  genre_ids: [],
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("useMovieSearch", () => {
  describe("search()", () => {
    it("clears results immediately for empty query without calling the API", () => {
      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("", "movie");
      });
      expect(result.current.results).toEqual([]);
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("clears results for whitespace-only query without calling the API", () => {
      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("   ", "movie");
      });
      expect(mockGet).not.toHaveBeenCalled();
    });

    it("returns cached results and does not call API on cache hit", async () => {
      const cached = [makeMovie(1)];
      mockGetCached.mockReturnValue(cached);

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("inception", "movie");
      });

      expect(mockGet).not.toHaveBeenCalled();
      expect(result.current.results).toEqual(cached);
    });

    it("calls API with /search/movie for mediaType movie on cache miss", async () => {
      mockGetCached.mockReturnValue(undefined);
      mockGet.mockResolvedValue({ data: { results: [] } });

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("inception", "movie");
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockGet).toHaveBeenCalledWith("/search/movie", expect.any(Object));
    });

    it("calls API with /search/tv for mediaType tv on cache miss", async () => {
      mockGetCached.mockReturnValue(undefined);
      mockGet.mockResolvedValue({ data: { results: [] } });

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("breaking", "tv");
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockGet).toHaveBeenCalledWith("/search/tv", expect.any(Object));
    });

    it("updates results and calls setCached on successful API response", async () => {
      const items = [makeMovie(1), makeMovie(2)];
      mockGetCached.mockReturnValue(undefined);
      mockGet.mockResolvedValue({ data: { results: items } });

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("test", "movie");
      });

      await waitFor(() => expect(result.current.results).toHaveLength(2));
      expect(result.current.results).toEqual(items);
      expect(result.current.loading).toBe(false);
      expect(mockSetCached).toHaveBeenCalledWith("search:movie:test", items);
    });

    it("sets error message on API error (Error instance)", async () => {
      mockGetCached.mockReturnValue(undefined);
      mockGet.mockRejectedValue(new Error("Network failure"));

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("test", "movie");
      });

      await waitFor(() => expect(result.current.error).toBe("Network failure"));
      expect(result.current.loading).toBe(false);
    });

    it('sets error to "Search failed" on non-Error rejection', async () => {
      mockGetCached.mockReturnValue(undefined);
      mockGet.mockRejectedValue("string error");

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("test", "movie");
      });

      await waitFor(() => expect(result.current.error).toBe("Search failed"));
    });

    it("does not update state after cancel() is called", async () => {
      mockGetCached.mockReturnValue(undefined);
      let resolveGet!: (v: unknown) => void;
      const pending = new Promise((r) => {
        resolveGet = r;
      });
      mockGet.mockReturnValue(pending);

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("test", "movie");
      });
      act(() => {
        result.current.cancel();
      });

      await act(async () => {
        resolveGet({ data: { results: [makeMovie(99)] } });
        await pending;
      });

      // results must not have been updated
      expect(result.current.results).toEqual([]);
    });
  });

  describe("clear()", () => {
    it("clears results and error", async () => {
      mockGetCached.mockReturnValue(undefined);
      mockGet.mockRejectedValue(new Error("oops"));

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("fail", "movie");
      });
      await waitFor(() => expect(result.current.error).not.toBeNull());

      act(() => {
        result.current.clear();
      });
      expect(result.current.results).toEqual([]);
      expect(result.current.error).toBeNull();
    });
  });

  describe("populateCorpus()", () => {
    it("cache hit → merges into corpus without touching loading/error", async () => {
      const cached = [makeMovie(5)];
      mockGetCached.mockReturnValue(cached);

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.populateCorpus("avatar", "movie");
      });

      expect(mockGet).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.getCorpusFor("movie")).toEqual(cached);
    });

    it("cache miss → calls API silently (no loading/error updates)", async () => {
      const items = [makeMovie(7)];
      mockGetCached.mockReturnValue(undefined);
      mockGet.mockResolvedValue({ data: { results: items } });

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.populateCorpus("avatar", "movie");
      });

      await waitFor(() =>
        expect(result.current.getCorpusFor("movie")).toHaveLength(1),
      );
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("getCorpusFor()", () => {
    it("returns the correct slice for the requested mediaType", async () => {
      const movieItems = [makeMovie(1)];
      mockGetCached.mockReturnValue(movieItems);

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("test", "movie");
      });

      expect(result.current.getCorpusFor("movie")).toEqual(movieItems);
      expect(result.current.getCorpusFor("tv")).toEqual([]);
    });
  });
});
