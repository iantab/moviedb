# StreamScout

A movie and TV show discovery app that lets you search titles, see where they're streaming worldwide, and browse recommendations. Built with Astro for server-rendered performance and React islands for interactivity.

## Tech Stack

- **Astro 5** with SSR (Node adapter) for server-rendered pages
- **React 19** islands for interactive UI (search, country selector, provider discovery)
- **Tailwind CSS 4** + **shadcn/ui** (Radix primitives) for styling
- **Fuse.js** for client-side fuzzy search suggestions
- **TMDB API** as the data source

## Project Structure

```
client/
  src/
    pages/
      index.astro                 # Home — search, recently viewed, provider discovery
      movie/[id].astro            # Movie detail — SSR with providers & recommendations
      tv/[id].astro               # TV detail — same structure
      api/tmdb/[...path].ts       # API proxy — whitelisted TMDB proxy for React islands
    components/
      Header.astro, MovieCard.astro, MovieGrid.astro, ...   # Zero-JS display components
      islands/
        SearchIsland.tsx           # Fuzzy search with debounced corpus population
        CountrySelectorIsland.tsx  # Country/continent picker with streaming providers
        ProviderDiscoverIsland.tsx # Browse top titles by streaming service
        RecentlyViewedIsland.tsx   # localStorage-backed recent history
        RecordViewIsland.tsx       # Invisible island that records page views
    hooks/                        # React hooks for search, discover, recently viewed
    lib/
      tmdb.ts                     # Server-side TMDB fetch (API key stays on server)
      tmdb-client.ts              # Client-side fetch via /api/tmdb proxy
      types/tmdb.ts               # Shared TypeScript types
      utils/                      # Country names, continents, country detection
    layouts/main.astro            # Base HTML shell with dark theme
    styles/global.css             # Tailwind + shadcn theme overrides
```

## Architecture

**Server-side rendering** — Detail pages fetch movie data, streaming providers, and recommendations from TMDB during server rendering. The API key never reaches the client.

**React islands** — Only interactive parts ship JavaScript: search (with fuzzy suggestions), country/provider selection, and localStorage-backed recently viewed. Everything else is zero-JS Astro components.

**API proxy** — React islands that need dynamic data fetch through `/api/tmdb/[...path]`, a whitelisted catch-all route that forwards requests to TMDB with the server-side API key.

## Setup

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 18+)
- A [TMDB API](https://developer.themoviedb.org/) bearer token

### Install & Run

```bash
cd client
bun install
```

Create `client/.env`:

```
TMDB_API_KEY=<your TMDB bearer token>
PUBLIC_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
```

Start the dev server:

```bash
bun run dev
```

Open [http://localhost:4321](http://localhost:4321).

### Build for Production

```bash
bun run build
node dist/server/entry.mjs
```

### Other Commands

| Command | Description |
|---------|-------------|
| `bun run lint` | ESLint |
| `bun run format` | Prettier |
| `bun run typecheck` | Astro type checking |
