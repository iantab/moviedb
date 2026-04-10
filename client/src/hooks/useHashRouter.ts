import { useState, useEffect } from "react";
import type { MediaType } from "../types/tmdb";

export interface HashRoute {
  mediaType: MediaType;
  id: number;
}

export function parseHash(): HashRoute | null {
  const match = window.location.hash.match(/^#\/(movie|tv)\/(\d+)$/);
  if (!match) return null;
  return { mediaType: match[1] as MediaType, id: Number(match[2]) };
}

export function setHash(mediaType: MediaType, id: number) {
  window.location.hash = `#/${mediaType}/${id}`;
}

export function clearHash() {
  // Use replaceState to avoid adding a history entry for the empty hash
  history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
}

export function useHashRoute() {
  const [route, setRoute] = useState<HashRoute | null>(parseHash);

  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return route;
}
