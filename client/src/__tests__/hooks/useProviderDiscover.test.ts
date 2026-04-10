/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useProviderDiscover } from "../../hooks/useProviderDiscover";
import tmdbClient from "../../services/tmdb";
import type { Movie, MediaType } from "../../types/tmdb";

jest.mock("../../services/tmdb", () => ({
  __esModule: true,
  default: { get: jest.fn() },
  IMAGE_BASE_URL: "https://img.tmdb.org",
}));

const mockGet = tmdbClient.get as jest.Mock;

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
  it("calls /discover/{mediaType} with correct params", async () => {
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

  it("sets loading: true while fetching, false when done", async () => {
    mockGet.mockResolvedValue({ data: { results: [] } });

    const { result } = renderHook(() => useProviderDiscover("movie", 8, "US"));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("sets error on API failure", async () => {
    mockGet.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useProviderDiscover("movie", 8, "US"));

    await waitFor(() => expect(result.current.error).toBe("Network error"));
  });

  it("sets fallback error message on non-Error rejection", async () => {
    mockGet.mockRejectedValue("string error");

    const { result } = renderHook(() => useProviderDiscover("movie", 8, "US"));

    await waitFor(() =>
      expect(result.current.error).toBe("Failed to load titles"),
    );
  });

  it("re-fetches when providerId changes", async () => {
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
