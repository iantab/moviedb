import { mergeIntoCorpus } from "../hooks/useMovieSearch";
import type { Movie, TvShow } from "../types/tmdb";

// useMovieSearch imports from services/tmdb which uses import.meta.env — mock it.
jest.mock("../services/tmdb", () => ({
  __esModule: true,
  default: { get: jest.fn() },
  IMAGE_BASE_URL: "https://img.tmdb.org",
}));

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

const makeTvShow = (id: number): TvShow => ({
  id,
  name: `Show ${id}`,
  overview: "",
  poster_path: null,
  backdrop_path: null,
  first_air_date: "2021-01-01",
  vote_average: 8,
  genre_ids: [],
});

const emptyCorpus = { movie: [], tv: [] };

describe("mergeIntoCorpus", () => {
  it("appends new items to an empty corpus slice", () => {
    const item = makeMovie(1);
    const result = mergeIntoCorpus(emptyCorpus, "movie", [item]);
    expect(result.movie).toEqual([item]);
    expect(result.tv).toEqual([]);
  });

  it("filters out items whose id already exists (deduplication)", () => {
    const existing = makeMovie(1);
    const corpus = { movie: [existing], tv: [] };
    const duplicate = makeMovie(1);
    const result = mergeIntoCorpus(corpus, "movie", [duplicate]);
    expect(result.movie).toHaveLength(1);
    expect(result.movie[0]).toBe(existing);
  });

  it("returns the exact same reference when no new items exist", () => {
    const existing = makeMovie(1);
    const corpus = { movie: [existing], tv: [] };
    const result = mergeIntoCorpus(corpus, "movie", [existing]);
    expect(result).toBe(corpus);
  });

  it("returns same reference when items array is empty", () => {
    const corpus = { movie: [makeMovie(1)], tv: [] };
    const result = mergeIntoCorpus(corpus, "movie", []);
    expect(result).toBe(corpus);
  });

  it("does not cross-contaminate movie and tv corpus slices", () => {
    const tvItem = makeTvShow(10);
    const corpus = { movie: [], tv: [tvItem] };
    const newMovie = makeMovie(1);
    const result = mergeIntoCorpus(corpus, "movie", [newMovie]);
    expect(result.movie).toEqual([newMovie]);
    expect(result.tv).toBe(corpus.tv); // tv slice is same reference
  });

  it("appends multiple new items at once", () => {
    const items = [makeMovie(1), makeMovie(2), makeMovie(3)];
    const result = mergeIntoCorpus(emptyCorpus, "movie", items);
    expect(result.movie).toHaveLength(3);
    expect(result.movie).toEqual(items);
  });

  it("only adds items that are not already present when mixing new and duplicate ids", () => {
    const existing = makeMovie(1);
    const corpus = { movie: [existing], tv: [] };
    const newItem = makeMovie(2);
    const result = mergeIntoCorpus(corpus, "movie", [existing, newItem]);
    expect(result.movie).toHaveLength(2);
    expect(result.movie[1]).toBe(newItem);
  });

  it("works for the tv media type slice", () => {
    const show = makeTvShow(5);
    const result = mergeIntoCorpus(emptyCorpus, "tv", [show]);
    expect(result.tv).toEqual([show]);
    expect(result.movie).toEqual([]);
  });
});
