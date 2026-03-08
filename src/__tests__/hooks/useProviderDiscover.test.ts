/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useProviderDiscover } from "../../hooks/useProviderDiscover";
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

const sampleMovies: Movie[] = [
  {
    id: 100,
    title: "Netflix Hit",
    overview: "",
    poster_path: null,
    backdrop_path: null,
    release_date: "2024-06-01",
    vote_average: 7.8,
    genre_ids: [],
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useProviderDiscover", () => {
  it("returns cached data without API call on cache hit", async () => {
    mockGetCached.mockImplementation((key: string) => {
      if (key === "discover:movie:8:US") return sampleMovies;
      return undefined;
    });

    const { result } = renderHook(() => useProviderDiscover("movie", 8, "US"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items).toBe(sampleMovies);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("calls /discover/{mediaType} with correct params on cache miss", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: { results: sampleMovies } });

    const { result } = renderHook(() => useProviderDiscover("movie", 8, "US"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith("/discover/movie", {
      params: {
        with_watch_providers: 8,
        watch_region: "US",
        sort_by: "popularity.desc",
      },
    });
    expect(result.current.items).toEqual(sampleMovies);
  });

  it("calls correct endpoint for tv mediaType", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: { results: [] } });

    renderHook(() => useProviderDiscover("tv", 337, "GB"));

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));
    expect(mockGet).toHaveBeenCalledWith("/discover/tv", {
      params: {
        with_watch_providers: 337,
        watch_region: "GB",
        sort_by: "popularity.desc",
      },
    });
  });

  it("stores results via setCached with correct key", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: { results: sampleMovies } });

    const { result } = renderHook(() => useProviderDiscover("movie", 8, "US"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSetCached).toHaveBeenCalledWith(
      "discover:movie:8:US",
      sampleMovies,
    );
  });

  it("sets loading: true while fetching, false when done", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: { results: [] } });

    const { result } = renderHook(() => useProviderDiscover("movie", 8, "US"));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets error on API failure", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useProviderDiscover("movie", 8, "US"));

    await waitFor(() => expect(result.current.error).toBe("Network error"));
  });

  it("sets fallback error message on non-Error rejection", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockRejectedValue("string error");

    const { result } = renderHook(() => useProviderDiscover("movie", 8, "US"));

    await waitFor(() =>
      expect(result.current.error).toBe("Failed to load titles"),
    );
  });

  it("re-fetches when providerId changes", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: { results: [] } });

    const { rerender } = renderHook(
      ({ providerId }: { providerId: number }) =>
        useProviderDiscover("movie", providerId, "US"),
      { initialProps: { providerId: 8 } },
    );

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

    rerender({ providerId: 337 });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(mockGet).toHaveBeenCalledWith("/discover/movie", {
      params: {
        with_watch_providers: 337,
        watch_region: "US",
        sort_by: "popularity.desc",
      },
    });
  });

  it("re-fetches when countryCode changes", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: { results: [] } });

    const { rerender } = renderHook(
      ({ country }: { country: string }) =>
        useProviderDiscover("movie", 8, country),
      { initialProps: { country: "US" } },
    );

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

    rerender({ country: "FR" });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
  });

  it("re-fetches when mediaType changes", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: { results: [] } });

    const { rerender } = renderHook(
      ({ type }: { type: MediaType }) => useProviderDiscover(type, 8, "US"),
      { initialProps: { type: "movie" as MediaType } },
    );

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(1));

    rerender({ type: "tv" });

    await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
    expect(mockGet).toHaveBeenCalledWith("/discover/tv", {
      params: {
        with_watch_providers: 8,
        watch_region: "US",
        sort_by: "popularity.desc",
      },
    });
  });

  it("cancelled flag on unmount prevents state update", async () => {
    mockGetCached.mockReturnValue(undefined);
    let resolve!: (v: unknown) => void;
    mockGet.mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );

    const { result, unmount } = renderHook(() =>
      useProviderDiscover("movie", 8, "US"),
    );
    unmount();

    resolve({ data: { results: sampleMovies } });

    expect(result.current.items).toEqual([]);
  });
});
