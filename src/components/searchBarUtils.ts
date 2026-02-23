import type { MediaItem } from "../types/tmdb";
import { getReleaseYear } from "../types/tmdb";

export function getSuggestionMeta(item: MediaItem): string {
  const year = getReleaseYear(item);
  const countries = item.origin_country ?? [];
  const country =
    countries.length > 0
      ? countries[0]
      : (item.original_language?.toUpperCase() ?? "");
  const parts: string[] = [];
  if (year && year !== "N/A") parts.push(year);
  if (country) parts.push(country);
  return parts.join(" · ");
}
