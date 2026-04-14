import { useRecentlyViewed } from "@/hooks/useRecentlyViewed"
import { getTitle, getReleaseYear, isTvShow } from "@/lib/types/tmdb"
import { IMAGE_BASE_URL } from "@/lib/tmdb-client"

export default function RecentlyViewedIsland() {
  const { recentItems } = useRecentlyViewed()

  if (recentItems.length === 0) return null

  return (
    <section className="mb-2">
      <h2 className="mb-4 text-xl font-bold text-foreground">
        Recently Viewed
      </h2>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {recentItems.map((entry) => {
          const { item, mediaType } = entry
          const type = isTvShow(item) ? "tv" : mediaType
          const posterUrl = item.poster_path
            ? `${IMAGE_BASE_URL}/w185${item.poster_path}`
            : null
          return (
            <a
              key={`${mediaType}-${item.id}`}
              href={`/${type}/${item.id}`}
              className="block w-[140px] flex-none snap-start overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 transition-all hover:-translate-y-1 hover:shadow-lg hover:ring-primary/40"
            >
              <div className="aspect-[2/3]">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={getTitle(item)}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-secondary text-4xl text-muted-foreground">
                    🎬
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <h3 className="mb-1 line-clamp-2 text-[0.82rem] leading-tight font-semibold text-foreground">
                  {getTitle(item)}
                </h3>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{getReleaseYear(item)}</span>
                  <span>
                    ⭐ {item.vote_average ? item.vote_average.toFixed(1) : "?"}
                  </span>
                </div>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}
