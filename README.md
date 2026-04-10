# 🎬 StreamScout

[![Deploy to GitHub Pages](https://github.com/iantab/moviedb/actions/workflows/deploy.yml/badge.svg?branch=master)](https://github.com/iantab/moviedb/actions/workflows/deploy.yml)
[![Backend on Render](https://img.shields.io/badge/backend-Render-46E3B7?logo=render)](https://streamscout-api.onrender.com)

🌐 **Live demo:** [iantab.github.io/moviedb](https://iantab.github.io/moviedb)

A React + TypeScript app backed by a Spring Boot proxy server that lets you search for movies and TV shows and find where to stream them around the world, powered by the [TMDB API](https://www.themoviedb.org/).

## Features

- 🔥 **Trending & Popular** — homepage displays trending and popular movies/TV shows powered by TMDB, updated weekly
- 🔍 **Movie & TV search** — search for any movie or TV show with live debounced results
- 🔎 **Fuzzy search suggestions** — typo-tolerant autocomplete powered by Fuse.js
- 🎬📺 **Media type toggle** — switch between Movies and TV Shows mode; trending, popular, and search all follow the toggle
- 🌍 **Streaming availability** — see every country where a title is available to stream (rent/buy excluded)
- 📺 **Provider breakdown** — click a country to see which streaming services carry it (Netflix, Disney+, etc.), grouped by Stream / Free / Free with Ads
- 🔴 **Netflix filter** — one-click button to highlight or filter to only the countries where the title is on Netflix
- 🧠 **Recommendations** — view similar titles when viewing a movie or show's details
- 🕐 **Recently Viewed** — quickly access your last-viewed titles (stored locally)
- 🔗 **Shareable URLs** — hash-based routing lets you share or bookmark a specific title

## Architecture

All TMDB API calls are routed through a Spring Boot proxy server rather than calling TMDB directly from the browser. The proxy adds **response caching** (Caffeine, with TTLs from 30 min to 24 hrs depending on endpoint), **rate limiting** (Bucket4j, 40 req/sec per IP), and **automatic retries** with exponential backoff on rate-limit responses.

```
React (GitHub Pages)  →  Spring Boot Proxy (Render)  →  TMDB API
```

## Tech Stack

### Frontend

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for bundling and dev server
- [Axios](https://axios-http.com/) for API requests
- [Fuse.js](https://www.fusejs.io/) for fuzzy search suggestions

### Backend

- Java 25 + [Spring Boot 4.0.5](https://spring.io/projects/spring-boot) (Gradle)
- [Caffeine](https://github.com/ben-manes/caffeine) for response caching
- [Bucket4j](https://bucket4j.com/) for rate limiting
- [Spring Retry](https://github.com/spring-projects/spring-retry) for retry with exponential backoff
- Docker for containerized deployment

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (frontend)
- Java 25+ (backend)
- A free TMDB API read access token from [TMDB settings](https://www.themoviedb.org/settings/api) — use the **Bearer token** (JWT), not the short v3 API key

### 1. Start the backend

```bash
cd server
```

Create `src/main/resources/application-local.yaml` (gitignored):

```yaml
tmdb:
  api-key: "your_tmdb_bearer_token"
```

Then run:

```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

The server starts on `http://localhost:8080`.

### 2. Start the frontend

```bash
cd client
bun install
bun run dev
```

Then open [http://localhost:5173](http://localhost:5173). Vite automatically proxies `/api/tmdb` requests to the local backend.

## Code Quality

- **ESLint** + **Prettier** for frontend linting and formatting
- **Husky** + **lint-staged** pre-commit hook — staged files are automatically formatted before every commit
- **Spotless** for backend Java formatting (`./gradlew spotlessApply`)
