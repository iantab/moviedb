import { isTvShow, getTitle, getReleaseYear } from "../types/tmdb";
import type { Movie, TvShow } from "../types/tmdb";

const baseMovie: Movie = {
  id: 1,
  title: "Inception",
  overview: "A thief who steals corporate secrets through dreams.",
  poster_path: "/inception.jpg",
  backdrop_path: "/backdrop.jpg",
  release_date: "2010-07-16",
  vote_average: 8.8,
  genre_ids: [28, 878],
};

const baseTvShow: TvShow = {
  id: 2,
  name: "Breaking Bad",
  overview: "A high school chemistry teacher turned drug kingpin.",
  poster_path: "/breaking-bad.jpg",
  backdrop_path: null,
  first_air_date: "2008-01-20",
  vote_average: 9.5,
  genre_ids: [18, 80],
};

describe("isTvShow", () => {
  it("returns true for a TvShow (has name property)", () => {
    expect(isTvShow(baseTvShow)).toBe(true);
  });

  it("returns false for a Movie (has title, not name)", () => {
    expect(isTvShow(baseMovie)).toBe(false);
  });

  it("returns true for a TvShow with media_type set", () => {
    expect(isTvShow({ ...baseTvShow, media_type: "tv" })).toBe(true);
  });

  it("returns false for a Movie with media_type set", () => {
    expect(isTvShow({ ...baseMovie, media_type: "movie" })).toBe(false);
  });
});

describe("getTitle", () => {
  it("returns .name for a TvShow", () => {
    expect(getTitle(baseTvShow)).toBe("Breaking Bad");
  });

  it("returns .title for a Movie", () => {
    expect(getTitle(baseMovie)).toBe("Inception");
  });

  it("returns the correct name when TvShow name changes", () => {
    expect(getTitle({ ...baseTvShow, name: "The Wire" })).toBe("The Wire");
  });

  it("returns the correct title when Movie title changes", () => {
    expect(getTitle({ ...baseMovie, title: "Interstellar" })).toBe(
      "Interstellar",
    );
  });
});

describe("getReleaseYear", () => {
  it("extracts the year from a Movie release_date", () => {
    expect(getReleaseYear(baseMovie)).toBe("2010");
  });

  it("extracts the year from a TvShow first_air_date", () => {
    expect(getReleaseYear(baseTvShow)).toBe("2008");
  });

  it('returns "N/A" when Movie release_date is empty', () => {
    expect(getReleaseYear({ ...baseMovie, release_date: "" })).toBe("N/A");
  });

  it('returns "N/A" when TvShow first_air_date is empty', () => {
    expect(getReleaseYear({ ...baseTvShow, first_air_date: "" })).toBe("N/A");
  });

  it("only returns the 4-digit year, not the full date", () => {
    const result = getReleaseYear({ ...baseMovie, release_date: "2024-12-25" });
    expect(result).toBe("2024");
    expect(result).toHaveLength(4);
  });

  it("works for a recent year", () => {
    expect(
      getReleaseYear({ ...baseTvShow, first_air_date: "2023-09-01" }),
    ).toBe("2023");
  });
});
