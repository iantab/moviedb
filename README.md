# 🎬 MovieStream

A React + TypeScript app that lets you search for movies and find where to stream them around the world, powered by the [TMDB API](https://www.themoviedb.org/).

## Features

- 🔍 **Movie search** — search for any movie with live debounced results
- 🌍 **Streaming availability** — see every country where a movie is available to stream
- 📺 **Provider breakdown** — click a country to see which streaming services carry it (Netflix, Disney+, etc.), grouped by Stream / Free / Free with Ads
- 🔴 **Netflix filter** — one-click button to highlight (or filter to) only the countries where the movie is on Netflix

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for bundling and dev server
- [Axios](https://axios-http.com/) for API requests
- [TMDB API](https://developer.themoviedb.org/docs) for movie data and streaming providers

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Add your TMDB API key

Create a `config.yaml` file in the project root (it is gitignored):

```yaml
tmdb:
  api_key: "your_tmdb_bearer_token"
  base_url: "https://api.themoviedb.org/3"
  image_base_url: "https://image.tmdb.org/t/p"
```

You can get a free API read access token from [TMDB settings](https://www.themoviedb.org/settings/api).

### 3. Run the dev server

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Code Quality

- **ESLint** for linting
- **Prettier** for formatting (default settings)
- **Husky** + **lint-staged** pre-commit hook — staged files are automatically formatted before every commit
