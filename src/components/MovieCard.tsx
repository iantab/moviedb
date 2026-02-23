import { memo, useCallback } from "react";
import type { MediaItem } from "../types/tmdb";
import { getTitle, getReleaseYear } from "../types/tmdb";
import { IMAGE_BASE_URL } from "../services/tmdb";

interface Props {
  item: MediaItem;
  onClick: (item: MediaItem) => void;
  selected: boolean;
}

export const MovieCard = memo(function MovieCard({
  item,
  onClick,
  selected,
}: Props) {
  const posterUrl = item.poster_path
    ? `${IMAGE_BASE_URL}/w185${item.poster_path}`
    : null;

  const title = getTitle(item);
  const year = getReleaseYear(item);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "?";

  const handleClick = useCallback(() => onClick(item), [item, onClick]);

  return (
    <div
      className={`movie-card ${selected ? "movie-card--selected" : ""}`}
      onClick={handleClick}
    >
      <div className="movie-card__poster">
        {posterUrl ? (
          <img src={posterUrl} alt={title} loading="lazy" />
        ) : (
          <div className="movie-card__no-poster">🎬</div>
        )}
      </div>
      <div className="movie-card__info">
        <h3 className="movie-card__title">{title}</h3>
        <div className="movie-card__meta">
          <span className="movie-card__year">{year}</span>
          <span className="movie-card__rating">⭐ {rating}</span>
        </div>
      </div>
    </div>
  );
});
