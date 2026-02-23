export type MediaType = "movie" | "tv";

export interface Movie {
  id: number;
  media_type?: MediaType;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
  original_language?: string;
  origin_country?: string[];
}

export interface TvShow {
  id: number;
  media_type?: MediaType;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  genre_ids: number[];
  original_language?: string;
  origin_country?: string[];
}

export type MediaItem = Movie | TvShow;

export function isTvShow(item: MediaItem): item is TvShow {
  return "name" in item;
}

export function getTitle(item: MediaItem): string {
  return isTvShow(item) ? item.name : item.title;
}

export function getReleaseYear(item: MediaItem): string {
  const date = isTvShow(item) ? item.first_air_date : item.release_date;
  return date ? date.slice(0, 4) : "N/A";
}

export interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface CountryProviders {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  free?: WatchProvider[];
  ads?: WatchProvider[];
}

export interface WatchProvidersResult {
  id: number;
  results: Record<string, CountryProviders>;
}
