/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useDiscovery } from "../../hooks/useDiscovery";
import tmdbClient from "../../services/tmdb";
import type { Movie, MediaType } from "../../types/tmdb";

jest.mock("../../services/tmdb", () => ({
  __esModule: true,
  default: { get: jest.fn() },
  IMAGE_BASE_URL: "https://img.tmdb.org",
}));

const mockGet = tmdbClient.get as jest.Mock;

const trendingMovies: Movie[] = [
  {
    id: 1,
    title: "Trending Movie",
    overview: "",
    poster_path: null,
    backdrop_path: null,
    release_date: "2024-01-01",
    vote_average: 8.0,
    genre_ids: [],
  },
];

const popularMovies: Movie[] = [
  {
    id: 2,
    title: "Popular Movie",
    overview: "",
    poster_path: null,
    backdrop_path: null,
    release_date: "2024-02-01",
    vote_average: 7.5,
    genre_ids: [],
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useDiscovery", () => {
  it("calls correct endpoints for movie mediaType", async () => {
    mockGet.mockResolvedValue({ data: { results: [] } });

    renderHook(() => useDiscovery("movie"));

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(mockGet).toHaveBeenCalledWith("/trending/movie/week");
    expect(mockGet).toHaveBeenCalledWith("/movie/popular");
  });

  it("calls correct endpoints for tv mediaType", async () => {
    mockGet.mockResolvedValue({ data: { results: [] } });

    renderHook(() => useDiscovery("tv"));

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(mockGet).toHaveBeenCalledWith("/trending/tv/week");
    expect(mockGet).toHaveBeenCalledWith("/tv/popular");
  });

  it("sets loading: true while fetching, false when done", async () => {
    mockGet.mockResolvedValue({ data: { results: [] } });

    const { result } = renderHook(() => useDiscovery("movie"));

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("populates trending and popular on success", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes("trending"))
        return Promise.resolve({ data: { results: trendingMovies } });
      return Promise.resolve({ data: { results: popularMovies } });
    });

    const { result } = renderHook(() => useDiscovery("movie"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.trending).toEqual(trendingMovies);
    expect(result.current.popular).toEqual(popularMovies);
  });

  it("sets error on trending API failure", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes("trending"))
        return Promise.reject(new Error("Trending failed"));
      return Promise.resolve({ data: { results: popularMovies } });
    });

    const { result } = renderHook(() => useDiscovery("movie"));

    await waitFor(() => expect(result.current.error).toBe("Trending failed"));
  });

  it("sets error on popular API failure", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes("popular"))
        return Promise.reject(new Error("Popular failed"));
      return Promise.resolve({ data: { results: trendingMovies } });
    });

    const { result } = renderHook(() => useDiscovery("movie"));

    await waitFor(() => expect(result.current.error).toBe("Popular failed"));
  });

  it("sets fallback error message on non-Error rejection", async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes("trending")) return Promise.reject("string error");
      return Promise.resolve({ data: { results: [] } });
    });

    const { result } = renderHook(() => useDiscovery("movie"));

    await waitFor(() =>
      expect(result.current.error).toBe("Failed to load trending"),
    );
  });

  it("re-fetches when mediaType changes", async () => {
    mockGet.mockResolvedValue({ data: { results: [] } });

    const { rerender } = renderHook(
      ({ type }: { type: MediaType }) => useDiscovery(type),
      { initialProps: { type: "movie" as MediaType } },
    );

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));

    rerender({ type: "tv" });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(4));
    expect(mockGet).toHaveBeenCalledWith("/trending/tv/week");
    expect(mockGet).toHaveBeenCalledWith("/tv/popular");
  });

  it("cancelled flag on unmount prevents state update", async () => {
    let resolveTrending!: (v: unknown) => void;
    let resolvePopular!: (v: unknown) => void;
    mockGet.mockImplementation((url: string) => {
      if (url.includes("trending"))
        return new Promise((r) => {
          resolveTrending = r;
        });
      return new Promise((r) => {
        resolvePopular = r;
      });
    });

    const { result, unmount } = renderHook(() => useDiscovery("movie"));
    unmount();

    resolveTrending({ data: { results: trendingMovies } });
    resolvePopular({ data: { results: popularMovies } });

    expect(result.current.trending).toEqual([]);
    expect(result.current.popular).toEqual([]);
  });
});
