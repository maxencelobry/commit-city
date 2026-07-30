# Commit City

Commit City turns a GitHub contribution calendar into a shareable pixel city.

## Routes

- `/` — generator with theme, palette and three layouts.
- `/u/<username>` — public profile page made for sharing.
- `/api/city/<username>.svg` — full SVG (`view=full|months|city`).
- `/api/badge/<username>.svg` — compact README badge.

## Local development

```sh
npm install
GITHUB_TOKEN=your_token npm run dev
```

`GITHUB_TOKEN` is optional. Keep it in a local `.env`/hosting secret and never commit it. The token increases GitHub API limits; contribution calendars are still read from GitHub's public calendar endpoint.

This project intentionally uses a small Express server and vanilla browser code.
