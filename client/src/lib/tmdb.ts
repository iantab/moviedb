import { env } from "cloudflare:workers"

const TMDB_BASE_URL = "https://api.themoviedb.org/3"

export const IMAGE_BASE_URL = import.meta.env
  .PUBLIC_TMDB_IMAGE_BASE_URL as string

export async function tmdbFetch<T = unknown>(
  path: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${env.TMDB_API_KEY}`,
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    throw new Error(`TMDB ${path} failed: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}
