# Commit City

A tiny Express application that turns a public GitHub profile into a shareable SVG skyline.

## Run it

```sh
npm install
npm run dev
```

Then open `http://localhost:3000`.

## API

`GET /api/city/:username.svg?theme=night&color=lime`

Available themes: `night`, `day`.

Available colors: `lime`, `purple`, `blue`, `orange`, `pink`, `cyan`.

Set `GITHUB_TOKEN` to increase GitHub API rate limits.