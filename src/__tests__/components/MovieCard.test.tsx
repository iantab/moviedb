/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { MovieCard } from "../../components/MovieCard";
import type { Movie, TvShow } from "../../types/tmdb";

jest.mock("../../services/tmdb", () => ({
  IMAGE_BASE_URL: "https://img.tmdb.org",
}));

const baseMovie: Movie = {
  id: 1,
  title: "Inception",
  overview: "Dreams within dreams.",
  poster_path: "/inception.jpg",
  backdrop_path: null,
  release_date: "2010-07-16",
  vote_average: 8.765,
  genre_ids: [28],
};

const movieNoPoster: Movie = {
  ...baseMovie,
  id: 2,
  poster_path: null,
};

const tvShow: TvShow = {
  id: 3,
  name: "Breaking Bad",
  overview: "",
  poster_path: "/bb.jpg",
  backdrop_path: null,
  first_air_date: "2008-01-20",
  vote_average: 9.5,
  genre_ids: [18],
};

describe("MovieCard", () => {
  it("renders title and year", () => {
    render(<MovieCard item={baseMovie} onClick={jest.fn()} selected={false} />);
    expect(screen.getByText("Inception")).toBeInTheDocument();
    expect(screen.getByText("2010")).toBeInTheDocument();
  });

  it("renders title and year for a TvShow", () => {
    render(<MovieCard item={tvShow} onClick={jest.fn()} selected={false} />);
    expect(screen.getByText("Breaking Bad")).toBeInTheDocument();
    expect(screen.getByText("2008")).toBeInTheDocument();
  });

  it("renders img with correct src and loading=lazy when poster_path is present", () => {
    render(<MovieCard item={baseMovie} onClick={jest.fn()} selected={false} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute(
      "src",
      "https://img.tmdb.org/w185/inception.jpg",
    );
    expect(img).toHaveAttribute("loading", "lazy");
  });

  it("renders emoji fallback and no img when poster_path is null", () => {
    render(
      <MovieCard item={movieNoPoster} onClick={jest.fn()} selected={false} />,
    );
    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("🎬")).toBeInTheDocument();
  });

  it("adds movie-card--selected class when selected is true", () => {
    const { container } = render(
      <MovieCard item={baseMovie} onClick={jest.fn()} selected={true} />,
    );
    expect(container.firstChild).toHaveClass("movie-card--selected");
  });

  it("does not have selected class when selected is false", () => {
    const { container } = render(
      <MovieCard item={baseMovie} onClick={jest.fn()} selected={false} />,
    );
    expect(container.firstChild).not.toHaveClass("movie-card--selected");
  });

  it("calls onClick with the item when the card is clicked", () => {
    const onClick = jest.fn();
    const { container } = render(
      <MovieCard item={baseMovie} onClick={onClick} selected={false} />,
    );
    fireEvent.click(container.firstChild as Element);
    expect(onClick).toHaveBeenCalledWith(baseMovie);
  });

  it('shows "?" when vote_average is 0 (falsy)', () => {
    render(
      <MovieCard
        item={{ ...baseMovie, vote_average: 0 }}
        onClick={jest.fn()}
        selected={false}
      />,
    );
    expect(screen.getByText(/⭐ \?/)).toBeInTheDocument();
  });

  it("shows rating rounded to one decimal place", () => {
    render(<MovieCard item={baseMovie} onClick={jest.fn()} selected={false} />);
    expect(screen.getByText(/⭐ 8\.8/)).toBeInTheDocument();
  });
});
