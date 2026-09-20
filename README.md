# Commit City

Turn a GitHub contribution history into a living pixel-art city.

> [!IMPORTANT]
> **This project is no longer hosted.** The instance that used to run at
> `maxencelobry.tech/commit-city` has been taken down, so every
> `maxencelobry.tech/commit-city/...` link and image below is dead — including
> the badges and share URLs. The source here is complete and still runs
> locally: see [Quick start](#quick-start).

<p align="center">
  <a href="https://github.com/maxencelobry/commit-city"><strong>View source</strong></a>
  ·
  <a href="https://githubcity.blog/"><strong>Inspired by GitHub City</strong></a>
</p>

## Features

- 12-month contribution skyline with animated SVG output
- Complete, city + months, and city-only layouts
- Night/day themes, six accents and a mixed palette
- Public profile pages: `/u/<username>`
- Compact README badge: `/api/badge/<username>.svg`
- Contribution-based badges and shareable URLs
- Responsive vanilla frontend with no heavy UI framework

## Quick start

```sh
npm install
npm run dev
```

Open `http://localhost:3000`, enter a public GitHub username and generate a city.

Optional GitHub API token (`.env`, never commit it):

```env
GITHUB_TOKEN=github_pat_your_token_here
```

## Share

```md
[![Commit City for @maxencelobry](https://maxencelobry.tech/commit-city/api/city/maxencelobry.svg?theme=night&color=mix&view=full)](https://maxencelobry.tech/commit-city/u/maxencelobry)
```

Those URLs 404 since the instance was taken down — they are kept to document
the shape of the API. Point them at your own instance to use them.

SVG options: `theme=night|day`, `color=lime|purple|blue|orange|pink|cyan|mix`, `view=full|months|city`.

## Hosting (retired)

Commit City used to run at `maxencelobry.tech/commit-city`, behind Cloudflare
and Nginx, under PM2 on port 3001. That deployment is gone: the process, the
Nginx route and the project directory have all been removed from the server.
Nothing points at this app any more.

Running it yourself needs nothing more than `npm install && npm run dev` — the
app builds share links from the current request origin, so no production domain
is hardcoded in application code. The `deploy/` directory keeps the old systemd
unit and Nginx snippets for reference only; they describe a setup that no
longer exists.

## Inspiration

Inspired by [GitHub City](https://githubcity.blog/). Commit City explores the same playful idea through a lightweight 2D pixel skyline, animated SVGs and README-first sharing.

## Stack

Express · vanilla JavaScript · SVG · Node test runner

```sh
npm test
```

Part of a broader collection of small projects built to demonstrate practical product design and engineering work.
