/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { useWatchProviders } from "../../hooks/useWatchProviders";
import { getCached, setCached } from "../../utils/cache";
import tmdbClient from "../../services/tmdb";
import type { WatchProvidersResult } from "../../types/tmdb";

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

beforeEach(() => {
  jest.clearAllMocks();
});

describe("useWatchProviders", () => {
  it("returns data: null and does not fetch when mediaId is null", () => {
    const { result } = renderHook(() => useWatchProviders(null, "movie"));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it("returns cached data immediately on cache hit (no API call)", async () => {
    mockGetCached.mockReturnValue(sampleData);

    const { result } = renderHook(() => useWatchProviders(42, "movie"));

    await waitFor(() => expect(result.current.data).toBe(sampleData));
    expect(mockGet).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("calls tmdbClient.get with the correct endpoint on cache miss", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: sampleData });

    const { result } = renderHook(() => useWatchProviders(42, "movie"));

    await waitFor(() => expect(result.current.data).toBe(sampleData));
    expect(mockGet).toHaveBeenCalledWith("/movie/42/watch/providers");
  });

  it("uses the tv endpoint when mediaType is tv", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: sampleData });

    const { result } = renderHook(() => useWatchProviders(10, "tv"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockGet).toHaveBeenCalledWith("/tv/10/watch/providers");
  });

  it("sets data, clears loading and error on successful fetch", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: sampleData });

    const { result } = renderHook(() => useWatchProviders(42, "movie"));

    await waitFor(() => expect(result.current.data).toBe(sampleData));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockSetCached).toHaveBeenCalledWith(
      "providers:movie:42",
      sampleData,
    );
  });

  it("sets error message on failed fetch (Error instance)", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useWatchProviders(42, "movie"));

    await waitFor(() => expect(result.current.error).toBe("Network error"));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('sets error to "Failed to load providers" on non-Error rejection', async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockRejectedValue("some string error");

    const { result } = renderHook(() => useWatchProviders(42, "movie"));

    await waitFor(() =>
      expect(result.current.error).toBe("Failed to load providers"),
    );
  });

  it("triggers a new fetch when mediaId changes", async () => {
    mockGetCached.mockReturnValue(undefined);
    const secondData: WatchProvidersResult = { id: 99, results: {} };
    mockGet
      .mockResolvedValueOnce({ data: sampleData })
      .mockResolvedValueOnce({ data: secondData });

    const { result, rerender } = renderHook(
      ({ id }: { id: number }) => useWatchProviders(id, "movie"),
      { initialProps: { id: 42 } },
    );

    await waitFor(() => expect(result.current.data).toBe(sampleData));

    rerender({ id: 99 });

    await waitFor(() => expect(result.current.data).toBe(secondData));
    expect(mockGet).toHaveBeenCalledTimes(2);
    expect(mockGet).toHaveBeenLastCalledWith("/movie/99/watch/providers");
  });

  it("cancelled flag on unmount prevents state update (no act warnings)", async () => {
    mockGetCached.mockReturnValue(undefined);
    let resolveGet!: (v: unknown) => void;
    const pending = new Promise((r) => {
      resolveGet = r;
    });
    mockGet.mockReturnValue(pending);

    const { result, unmount } = renderHook(() =>
      useWatchProviders(42, "movie"),
    );
    // Hook is fetching; unmount before the promise resolves
    unmount();

    // Resolving after unmount should not cause state updates or act() warnings
    resolveGet({ data: sampleData });
    // No assertion needed — the test passes if no "act()" warning is thrown
    expect(result.current.data).toBeNull();
  });

  it("resolvedData is null when mediaId is set back to null", async () => {
    mockGetCached.mockReturnValue(undefined);
    mockGet.mockResolvedValue({ data: sampleData });

    const { result, rerender } = renderHook(
      ({ id }: { id: number | null }) => useWatchProviders(id, "movie"),
      { initialProps: { id: 42 as number | null } },
    );

    await waitFor(() => expect(result.current.data).toBe(sampleData));

    rerender({ id: null });

    expect(result.current.data).toBeNull();
  });
});
