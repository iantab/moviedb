/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useMovieSearch } from "../../hooks/useMovieSearch";
import tmdbClient from "../../services/tmdb";
import type { Movie } from "../../types/tmdb";

jest.mock("../../services/tmdb", () => ({
  __esModule: true,
  default: { get: jest.fn() },
  IMAGE_BASE_URL: "https://img.tmdb.org",
}));

const mockGet = tmdbClient.get as jest.Mock;

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

    it("calls API with /search/movie for mediaType movie", async () => {
      mockGet.mockResolvedValue({ data: { results: [] } });

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("inception", "movie");
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockGet).toHaveBeenCalledWith("/search/movie", expect.any(Object));
    });

    it("calls API with /search/tv for mediaType tv", async () => {
      mockGet.mockResolvedValue({ data: { results: [] } });

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("breaking", "tv");
      });

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(mockGet).toHaveBeenCalledWith("/search/tv", expect.any(Object));
    });

    it("updates results on successful API response", async () => {
      const items = [makeMovie(1), makeMovie(2)];
      mockGet.mockResolvedValue({ data: { results: items } });

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("test", "movie");
      });

      await waitFor(() => expect(result.current.results).toHaveLength(2));
      expect(result.current.results).toEqual(items);
      expect(result.current.loading).toBe(false);
    });

    it("sets error message on API error (Error instance)", async () => {
      mockGet.mockRejectedValue(new Error("Network failure"));

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("test", "movie");
      });

      await waitFor(() => expect(result.current.error).toBe("Network failure"));
      expect(result.current.loading).toBe(false);
    });

    it('sets error to "Search failed" on non-Error rejection', async () => {
      mockGet.mockRejectedValue("string error");

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("test", "movie");
      });

      await waitFor(() => expect(result.current.error).toBe("Search failed"));
    });

    it("does not update state after cancel() is called", async () => {
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
    it("calls API and merges into corpus without touching loading/error", async () => {
      const items = [makeMovie(7)];
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
      mockGet.mockResolvedValue({ data: { results: movieItems } });

      const { result } = renderHook(() => useMovieSearch());
      act(() => {
        result.current.search("test", "movie");
      });

      await waitFor(() => expect(result.current.results).toHaveLength(1));
      expect(result.current.getCorpusFor("movie")).toEqual(movieItems);
      expect(result.current.getCorpusFor("tv")).toEqual([]);
    });
  });
});
