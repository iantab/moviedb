/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useDiscovery } from "../../hooks/useDiscovery";
import { getCached, setCached } from "../../utils/cache";
import tmdbClient from "../../services/tmdb";
import type { Movie, MediaType } from "../../types/tmdb";

jest.mock("../../services/tmdb", () => ({
  __esModule: true,
  default: { get: jest.fn() },
  IMAGE_BASE_URL: "https://img.tmdb.org",
}));

jest.mock("../../utils/cache", () => ({
  getCached: jest.fn(),
  setCached: jest.fn(),
}));

const mockGet = tmdbClient.get as jest.Mock;
const mockGetCached = getCached as jest.Mock;
const mockSetCached = setCached as jest.Mock;

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
  it("returns cached trending data without API call on cache hit", async () => {
    mockGetCached.mockImplementation((key: string) => {
      if (key === "trending:movie:week") return trendingMovies;
      return undefined;
    });
    mockGet.mockResolvedValue({ data: { results: popularMovies } });

    const { result } = renderHook(() => useDiscovery("movie"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.trending).toBe(trendingMovies);
    // Only popular endpoint should have been called
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith("/movie/popular");
  });

  it("returns cached popular data without API call on cache hit", async () => {
    mockGetCached.mockImplementation((key: string) => {
      if (key === "popular:movie") return popularMovies;
      return undefined;
    });
    mockGet.mockResolvedValue({ data: { results: trendingMovies } });

    const { result } = renderHook(() => useDiscovery("movie"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.popular).toBe(popularMovies);
    // Only trending endpoint should have been called
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockGet).toHaveBeenCalledWith("/trending/movie/week");
  });

  it("calls correct endpoints for movie mediaType", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: { results: [] } });

    renderHook(() => useDiscovery("movie"));

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(mockGet).toHaveBeenCalledWith("/trending/movie/week");
    expect(mockGet).toHaveBeenCalledWith("/movie/popular");
  });

  it("calls correct endpoints for tv mediaType", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: { results: [] } });

    renderHook(() => useDiscovery("tv"));

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(mockGet).toHaveBeenCalledWith("/trending/tv/week");
    expect(mockGet).toHaveBeenCalledWith("/tv/popular");
  });

  it("sets loading: true while fetching, false when done", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: { results: [] } });

    const { result } = renderHook(() => useDiscovery("movie"));

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("stores results via setCached with correct cache keys", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockImplementation((url: string) => {
      if (url.includes("trending"))
        return Promise.resolve({ data: { results: trendingMovies } });
      return Promise.resolve({ data: { results: popularMovies } });
    });

    const { result } = renderHook(() => useDiscovery("movie"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSetCached).toHaveBeenCalledWith(
      "trending:movie:week",
      trendingMovies,
    );
    expect(mockSetCached).toHaveBeenCalledWith("popular:movie", popularMovies);
  });

  it("sets error on trending API failure", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockImplementation((url: string) => {
      if (url.includes("trending"))
        return Promise.reject(new Error("Trending failed"));
      return Promise.resolve({ data: { results: popularMovies } });
    });

    const { result } = renderHook(() => useDiscovery("movie"));

    await waitFor(() => expect(result.current.error).toBe("Trending failed"));
  });

  it("sets error on popular API failure", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockImplementation((url: string) => {
      if (url.includes("popular"))
        return Promise.reject(new Error("Popular failed"));
      return Promise.resolve({ data: { results: trendingMovies } });
    });

    const { result } = renderHook(() => useDiscovery("movie"));

    await waitFor(() => expect(result.current.error).toBe("Popular failed"));
  });

  it("sets fallback error message on non-Error rejection", async () => {
    mockGetCached.mockReturnValue(undefined);
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
    mockGetCached.mockReturnValue(undefined);
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
    mockGetCached.mockReturnValue(undefined);
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
