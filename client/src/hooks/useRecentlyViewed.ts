import { useState, useCallback } from "react";
import type { MediaItem, MediaType } from "../types/tmdb";

const STORAGE_KEY = "streamscout-recently-viewed";
const MAX_ITEMS = 20;

export interface RecentEntry {
  item: MediaItem;
  mediaType: MediaType;
}

function loadFromStorage(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const [recentItems, setRecentItems] =
    useState<RecentEntry[]>(loadFromStorage);

  const addItem = useCallback((item: MediaItem, mediaType: MediaType) => {
    setRecentItems((prev) => {
      const filtered = prev.filter(
        (e) => !(e.item.id === item.id && e.mediaType === mediaType),
      );
      const next = [{ item, mediaType }, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recentItems, addItem };
}
