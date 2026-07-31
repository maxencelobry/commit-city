# Commit City

Turn a GitHub contribution calendar into a living pixel-art skyline.

Commit City is a lightweight, share-first project: one public profile becomes a city, an embeddable SVG and a compact README badge. No account, database or build pipeline is required.

## What you get

- Three export layouts: complete, city + months, and city only.
- Night/day themes, six accents and a mixed palette.
- Building height driven by monthly contributions.
- Mostly dark windows with more colored windows as activity increases.
- Animated stars and subtle window pulses in the SVG.
- Public profile pages at `/u/<username>` with automatically calculated badges.
- Compact README badges at `/api/badge/<username>.svg`.
- Responsive vanilla UI that works on small screens and respects reduced-motion preferences.

## Try it locally

```sh
npm install
npm run dev
```

Open <http://localhost:3000>.

The GitHub token is optional. To raise API limits, copy `.env.example` to `.env`, add a fine-grained token, and restart the server:

```env
GITHUB_TOKEN=github_pat_your_token_here
```

`.env` is ignored by Git. Never paste a real token into source code, SVG URLs or the browser. If a token is exposed, revoke it and create a new one.

## Share your city

Profile page:

```text
http://localhost:3000/u/octocat
```

Full SVG:

```text
http://localhost:3000/api/city/octocat.svg?theme=night&color=lime&view=full
```

Compact README badge:

```md
[![Commit City for @octocat](https://your-domain.example/api/badge/octocat.svg)](https://your-domain.example/u/octocat)
```

The SVG endpoint accepts `theme=night|day`, `color=lime|purple|blue|orange|pink|cyan|mix`, and `view=full|months|city`.

## Project structure

```text
server.js                 # loads local env and starts Express
src/app.js                # Express app
src/routes/city.route.js  # HTTP route adapter
src/services/city.service.js # GitHub data, parsing and SVG generation
public/                   # small vanilla frontend
test/                     # Node test suite
```

## Quality checks

```sh
npm test
node --check server.js
node --check public/app.js
```

The project intentionally stays small: Express on the server, browser-native JavaScript and SVG for the visual output.

## Credits

Built by [@maxencelobry](https://github.com/maxencelobry). Inspired by the idea of making open-source activity visible, playful and easy to share.
