export const IMAGE_BASE_URL = import.meta.env
  .PUBLIC_TMDB_IMAGE_BASE_URL as string

export async function tmdbClientFetch<T = unknown>(
  path: string,
  params?: Record<string, string | number | boolean>
): Promise<T> {
  const url = new URL(`/api/tmdb${path}`, window.location.origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value))
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  })

  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}
