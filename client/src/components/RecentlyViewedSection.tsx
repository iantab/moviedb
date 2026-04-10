import { memo } from "react";
import type { MediaItem, MediaType } from "../types/tmdb";
import type { RecentEntry } from "../hooks/useRecentlyViewed";
import { MovieCard } from "./MovieCard";

interface Props {
  items: RecentEntry[];
  onItemClick: (item: MediaItem, mediaType: MediaType) => void;
  selectedId: number | null;
}

export const RecentlyViewedSection = memo(function RecentlyViewedSection({
  items,
  onItemClick,
  selectedId,
}: Props) {
  if (items.length === 0) return null;

  return (
    <section className="recently-viewed">
      <h2 className="discovery__heading">Recently Viewed</h2>
      <div className="scroll-row">
        {items.map((entry) => (
          <MovieCard
            key={`${entry.mediaType}-${entry.item.id}`}
            item={entry.item}
            onClick={(item) => onItemClick(item, entry.mediaType)}
            selected={selectedId === entry.item.id}
          />
        ))}
      </div>
    </section>
  );
});
