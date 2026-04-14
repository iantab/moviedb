import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"

const ALLOWED_PATTERNS = [
  /^\/search\/(movie|tv)$/,
  /^\/discover\/(movie|tv)$/,
  /^\/(movie|tv)\/\d+$/,
  /^\/(movie|tv)\/\d+\/watch\/providers$/,
  /^\/(movie|tv)\/\d+\/recommendations$/,
  /^\/trending\/(movie|tv)\/week$/,
]

const TMDB_BASE_URL = "https://api.themoviedb.org/3"

export const GET: APIRoute = async ({ params, url }) => {
  const path = `/${params.path}`

  if (!ALLOWED_PATTERNS.some((p) => p.test(path))) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  const tmdbUrl = new URL(`${TMDB_BASE_URL}${path}`)
  for (const [key, value] of url.searchParams.entries()) {
    tmdbUrl.searchParams.set(key, value)
  }

  const res = await fetch(tmdbUrl.toString(), {
    headers: {
      Authorization: `Bearer ${env.TMDB_API_KEY}`,
      Accept: "application/json",
    },
  })

  const data = await res.text()

  return new Response(data, {
    status: res.status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  })
}
