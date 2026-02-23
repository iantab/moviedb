import type { Movie } from "../types/tmdb";
import { IMAGE_BASE_URL } from "../services/tmdb";

interface Props {
  movie: Movie;
  onClick: (movie: Movie) => void;
  selected: boolean;
}

export function MovieCard({ movie, onClick, selected }: Props) {
  const posterUrl = movie.poster_path
    ? `${IMAGE_BASE_URL}/w185${movie.poster_path}`
    : null;

  const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "?";

  return (
    <div
      className={`movie-card ${selected ? "movie-card--selected" : ""}`}
      onClick={() => onClick(movie)}
    >
      <div className="movie-card__poster">
        {posterUrl ? (
          <img src={posterUrl} alt={movie.title} />
        ) : (
          <div className="movie-card__no-poster">🎬</div>
        )}
      </div>
      <div className="movie-card__info">
        <h3 className="movie-card__title">{movie.title}</h3>
        <div className="movie-card__meta">
          <span className="movie-card__year">{year}</span>
          <span className="movie-card__rating">⭐ {rating}</span>
        </div>
      </div>
    </div>
  );
}
