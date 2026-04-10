import type { MediaType } from "../types/tmdb";

interface Props {
  value: MediaType;
  onChange: (type: MediaType) => void;
}

export function MediaToggle({ value, onChange }: Props) {
  return (
    <div className="media-toggle">
      <button
        className={`media-toggle__btn ${value === "movie" ? "media-toggle__btn--active" : ""}`}
        onClick={() => onChange("movie")}
      >
        🎬 Movies
      </button>
      <button
        className={`media-toggle__btn ${value === "tv" ? "media-toggle__btn--active" : ""}`}
        onClick={() => onChange("tv")}
      >
        📺 TV Shows
      </button>
    </div>
  );
}
