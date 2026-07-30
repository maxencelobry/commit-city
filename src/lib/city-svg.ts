/**
 * Commit City — pure SVG city generator.
 * No DOM, no Node APIs: safe on the edge runtime and in the browser.
 */

export type Theme = "day" | "night";

export type Accent = "purple" | "green" | "blue" | "orange" | "pink" | "cyan" | "yellow";

export interface RepoInput {
  name: string;
  language: string | null;
  stars: number;
  size: number;
  commits: number;
}

export interface CityInput {
  username: string;
  name?: string | null;
  followers: number;
  following: number;
  publicRepos: number;
  totalStars: number;
  totalCommits: number;
  repos: RepoInput[];
}

export interface CityOptions {
  theme: Theme;
  color: Accent;
}

const ACCENTS: Record<Accent, string> = {
  purple: "#a06bff",
  green: "#3fb950",
  blue: "#4c9aff",
  orange: "#ff8a3d",
  pink: "#ff6bb5",
  cyan: "#37d5d3",
  yellow: "#f0c000",
};

export const ACCENT_NAMES = Object.keys(ACCENTS) as Accent[];

export function parseTheme(v: string | null): Theme {
  return v === "day" ? "day" : "night";
}

export function parseAccent(v: string | null): Accent {
  return (ACCENT_NAMES as string[]).includes(v ?? "") ? (v as Accent) : "purple";
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572a5",
  Go: "#00add8",
  Rust: "#dea584",
  Java: "#b07219",
  Ruby: "#c8443c",
  "C++": "#f34b7d",
  C: "#8b8b8b",
  "C#": "#178600",
  PHP: "#7a86b8",
  Swift: "#f05138",
  Kotlin: "#a97bff",
  Dart: "#00b4ab",
  HTML: "#e34c26",
  CSS: "#8a6ac0",
  Shell: "#89e051",
  Vue: "#41b883",
  Elixir: "#9b6fb0",
  Haskell: "#8877c0",
  Lua: "#4f6fd0",
  Zig: "#ec915c",
  Other: "#8892a8",
};

function langColor(lang: string) {
  if (LANG_COLORS[lang]) return LANG_COLORS[lang];
  let h = 0;
  for (let i = 0; i < lang.length; i++) h = (h * 31 + lang.charCodeAt(i)) % 360;
  return "hsl(" + h + " 62% 55%)";
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;",
  );
}

export function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function rng(seed: string) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 131 + seed.charCodeAt(i)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface Palette {
  skyTop: string;
  skyBottom: string;
  ground: string;
  road: string;
  panelLine: string;
  text: string;
  dim: string;
  shade: string;
  window: string;
  windowOff: string;
}

function palette(theme: Theme): Palette {
  return theme === "night"
    ? {
        skyTop: "#080a18",
        skyBottom: "#1d1540",
        ground: "#14162a",
        road: "#0d0f1d",
        panelLine: "#ffffff1f",
        text: "#eef1ff",
        dim: "#9aa3c7",
        shade: "#00000055",
        window: "#ffe9a8",
        windowOff: "#ffffff14",
      }
    : {
        skyTop: "#a8dcff",
        skyBottom: "#eef8ff",
        ground: "#dbe7d4",
        road: "#c6d2c4",
        panelLine: "#0b204018",
        text: "#12203a",
        dim: "#5a6b86",
        shade: "#00000022",
        window: "#ffffffdd",
        windowOff: "#0b204014",
      };
}

const W = 900;
const H = 500;
const GROUND_Y = 360;

export function generateCitySvg(city: CityInput, opts: CityOptions): string {
  const p = palette(opts.theme);
  const accent = ACCENTS[opts.color];
  const rand = rng(city.username || "city");

  const byLang = new Map<string, RepoInput[]>();
  for (const r of city.repos) {
    const key = r.language ?? "Other";
    if (!byLang.has(key)) byLang.set(key, []);
    byLang.get(key)!.push(r);
  }
  const districts = [...byLang.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .map(([lang, repos]) => ({
      lang,
      color: langColor(lang),
      repos: [...repos].sort((a, b) => b.commits - a.commits).slice(0, 8),
    }));

  const shown = districts.flatMap((d) => d.repos);
  const maxCommits = Math.max(1, ...shown.map((r) => r.commits));
  const maxSize = Math.max(1, ...shown.map((r) => r.size));

  const padX = 34;
  const usable = W - padX * 2;
  const totalBuildings = shown.length || 1;
  const gap = 7;
  const districtGap = 26;
  const availWidth =
    usable - districtGap * Math.max(0, districts.length - 1) - gap * (totalBuildings - 1);
  const unit = Math.max(14, availWidth / totalBuildings);

  let x = padX;
  const buildings: string[] = [];
  const labels: string[] = [];

  districts.forEach((d, di) => {
    const startX = x;
    d.repos.forEach((r) => {
      const wRatio = Math.sqrt(Math.min(1, r.size / maxSize));
      const bw = Math.max(18, Math.min(70, unit * (0.72 + wRatio * 0.7)));
      const hRatio = Math.pow(r.commits / maxCommits, 0.6);
      const bh = 28 + hRatio * 225;
      buildings.push(building(x, GROUND_Y - bh, bw, bh, r, d.color, p, accent, rand));
      x += bw + gap;
    });
    const districtW = Math.max(10, x - gap - startX);
    labels.push(districtLabel(startX, districtW, d.lang, d.color, p));
    if (di < districts.length - 1) {
      buildings.push(
        '<rect x="' +
          (x - gap + 4).toFixed(1) +
          '" y="' +
          GROUND_Y +
          '" width="' +
          (districtGap - 8) +
          '" height="30" fill="' +
          p.road +
          '"/>',
      );
      x += districtGap;
    }
  });

  const scale = x - gap > W - padX ? (usable / (x - gap - padX)).toFixed(4) : "1";

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    W +
    '" height="' +
    H +
    '" viewBox="0 0 ' +
    W +
    " " +
    H +
    '" role="img" aria-label="Commit City for ' +
    esc(city.username) +
    "\" font-family=\"'Segoe UI',Inter,Helvetica,Arial,sans-serif\">" +
    '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' +
    p.skyTop +
    '"/><stop offset="100%" stop-color="' +
    p.skyBottom +
    '"/></linearGradient>' +
    '<linearGradient id="glow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' +
    accent +
    '" stop-opacity="0"/><stop offset="100%" stop-color="' +
    accent +
    '" stop-opacity="0.26"/></linearGradient>' +
    '<clipPath id="card"><rect x="0" y="0" width="' +
    W +
    '" height="' +
    H +
    '" rx="18"/></clipPath></defs>' +
    '<g clip-path="url(#card)">' +
    '<rect width="' +
    W +
    '" height="' +
    H +
    '" fill="url(#sky)"/>' +
    starsLayer(opts.theme, rand) +
    sun(opts.theme, p) +
    '<rect x="0" y="150" width="' +
    W +
    '" height="' +
    (GROUND_Y - 150) +
    '" fill="url(#glow)"/>' +
    skyline(p) +
    '<rect x="0" y="' +
    GROUND_Y +
    '" width="' +
    W +
    '" height="' +
    (H - GROUND_Y) +
    '" fill="' +
    p.ground +
    '"/>' +
    '<rect x="0" y="' +
    GROUND_Y +
    '" width="' +
    W +
    '" height="4" fill="' +
    accent +
    '" opacity="0.75"/>' +
    '<g transform="scale(' +
    scale +
    ',1)">' +
    buildings.join("") +
    labels.join("") +
    "</g>" +
    '<text x="34" y="42" fill="' +
    p.text +
    '" font-size="22" font-weight="700">' +
    esc(city.name || city.username) +
    '<tspan fill="' +
    accent +
    '"> · Commit City</tspan></text>' +
    '<text x="34" y="63" fill="' +
    p.dim +
    '" font-size="13">@' +
    esc(city.username) +
    " — " +
    fmt(city.publicRepos) +
    " repos across " +
    districts.length +
    " language districts</text>" +
    statsRow(city, p, accent) +
    "</g>" +
    '<rect x="0.5" y="0.5" width="' +
    (W - 1) +
    '" height="' +
    (H - 1) +
    '" rx="18" fill="none" stroke="' +
    p.panelLine +
    '"/>' +
    "</svg>"
  );
}

function sun(theme: Theme, p: Palette) {
  return theme === "night"
    ? '<circle cx="778" cy="80" r="26" fill="#f6f1d8" opacity="0.92"/><circle cx="766" cy="70" r="26" fill="' +
        p.skyTop +
        '"/>'
    : '<circle cx="778" cy="80" r="46" fill="#fff3b0" opacity="0.35"/><circle cx="778" cy="80" r="28" fill="#ffe57a"/>';
}

function skyline(p: Palette) {
  let out = "";
  let x = -20;
  const r = rng("skyline");
  while (x < W + 40) {
    const w = 30 + r() * 50;
    const h = 40 + r() * 90;
    out +=
      '<rect x="' +
      x.toFixed(1) +
      '" y="' +
      (GROUND_Y - h).toFixed(1) +
      '" width="' +
      w.toFixed(1) +
      '" height="' +
      h.toFixed(1) +
      '" fill="' +
      p.shade +
      '"/>';
    x += w + 6;
  }
  return '<g opacity="0.5">' + out + "</g>";
}

function starsLayer(theme: Theme, rand: () => number) {
  if (theme !== "night") {
    let clouds = "";
    for (let i = 0; i < 4; i++) {
      const cx = 60 + rand() * 640;
      const cy = 46 + rand() * 90;
      clouds +=
        '<g fill="#ffffff" opacity="0.8"><ellipse cx="' +
        cx.toFixed(0) +
        '" cy="' +
        cy.toFixed(0) +
        '" rx="34" ry="14"/><ellipse cx="' +
        (cx + 26).toFixed(0) +
        '" cy="' +
        (cy + 5).toFixed(0) +
        '" rx="24" ry="11"/><ellipse cx="' +
        (cx - 24).toFixed(0) +
        '" cy="' +
        (cy + 6).toFixed(0) +
        '" rx="20" ry="10"/></g>';
    }
    return clouds;
  }
  let out = "";
  for (let i = 0; i < 70; i++) {
    out +=
      '<circle cx="' +
      (rand() * W).toFixed(1) +
      '" cy="' +
      (rand() * 250).toFixed(1) +
      '" r="' +
      (rand() * 1.4 + 0.4).toFixed(2) +
      '" fill="#ffffff" opacity="' +
      (0.25 + rand() * 0.6).toFixed(2) +
      '"/>';
  }
  return out;
}

function building(
  x: number,
  y: number,
  w: number,
  h: number,
  r: RepoInput,
  color: string,
  p: Palette,
  accent: string,
  rand: () => number,
) {
  const parts: string[] = [];
  parts.push(
    '<rect x="' +
      x.toFixed(1) +
      '" y="' +
      y.toFixed(1) +
      '" width="' +
      w.toFixed(1) +
      '" height="' +
      h.toFixed(1) +
      '" rx="3" fill="' +
      color +
      '"/>',
  );
  parts.push(
    '<rect x="' +
      (x + w * 0.74).toFixed(1) +
      '" y="' +
      y.toFixed(1) +
      '" width="' +
      (w * 0.26).toFixed(1) +
      '" height="' +
      h.toFixed(1) +
      '" fill="' +
      p.shade +
      '"/>',
  );
  parts.push(
    '<rect x="' +
      x.toFixed(1) +
      '" y="' +
      y.toFixed(1) +
      '" width="' +
      w.toFixed(1) +
      '" height="5" rx="2" fill="#ffffff" opacity="0.35"/>',
  );
  const cols = Math.max(1, Math.floor((w - 8) / 9));
  const rows = Math.max(1, Math.floor((h - 18) / 12));
  for (let c = 0; c < cols; c++) {
    for (let rw = 0; rw < rows; rw++) {
      const on = rand() > 0.45;
      parts.push(
        '<rect x="' +
          (x + 5 + c * 9).toFixed(1) +
          '" y="' +
          (y + 12 + rw * 12).toFixed(1) +
          '" width="4" height="6" fill="' +
          (on ? p.window : p.windowOff) +
          '"/>',
      );
    }
  }
  if (r.stars >= 10) {
    const antenna = Math.min(34, 8 + Math.log10(r.stars + 1) * 14);
    parts.push(
      '<rect x="' +
        (x + w / 2 - 1).toFixed(1) +
        '" y="' +
        (y - antenna).toFixed(1) +
        '" width="2" height="' +
        antenna.toFixed(1) +
        '" fill="' +
        p.dim +
        '"/>',
    );
    parts.push(star(x + w / 2, y - antenna - 5, r.stars >= 100 ? 6 : 4, accent));
  }
  if (r.stars >= 500) {
    parts.push(
      '<circle cx="' +
        (x + w / 2).toFixed(1) +
        '" cy="' +
        (y - 30).toFixed(1) +
        '" r="12" fill="' +
        accent +
        '" opacity="0.2"/>',
    );
  }
  parts.push(
    "<title>" +
      esc(r.name) +
      " — " +
      fmt(r.commits) +
      " commits · " +
      fmt(r.stars) +
      " stars · " +
      esc(r.language ?? "Other") +
      "</title>",
  );
  return "<g>" + parts.join("") + "</g>";
}

function star(cx: number, cy: number, r: number, fill: string) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r / 2.4;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push((cx + Math.cos(a) * rad).toFixed(1) + "," + (cy + Math.sin(a) * rad).toFixed(1));
  }
  return '<polygon points="' + pts.join(" ") + '" fill="' + fill + '"/>';
}

function districtLabel(x: number, w: number, lang: string, color: string, p: Palette) {
  return (
    '<g><rect x="' +
    x.toFixed(1) +
    '" y="' +
    (GROUND_Y + 12) +
    '" width="' +
    w.toFixed(1) +
    '" height="3" rx="1.5" fill="' +
    color +
    '" opacity="0.85"/><text x="' +
    (x + w / 2).toFixed(1) +
    '" y="' +
    (GROUND_Y + 32) +
    '" text-anchor="middle" font-size="11" font-weight="600" fill="' +
    p.dim +
    '">' +
    esc(lang) +
    "</text></g>"
  );
}

function statsRow(city: CityInput, p: Palette, accent: string) {
  const items: Array<[string, string]> = [
    ["commits", fmt(city.totalCommits)],
    ["stars", fmt(city.totalStars)],
    ["repos", fmt(city.publicRepos)],
    ["followers", fmt(city.followers)],
    ["following", fmt(city.following)],
  ];
  const y = 432;
  const boxW = (W - 68 - 12 * (items.length - 1)) / items.length;
  return items
    .map(([label, value], i) => {
      const bx = 34 + i * (boxW + 12);
      return (
        '<g><rect x="' +
        bx.toFixed(1) +
        '" y="' +
        y +
        '" width="' +
        boxW.toFixed(1) +
        '" height="46" rx="10" fill="' +
        p.panelLine +
        '"/><text x="' +
        (bx + boxW / 2).toFixed(1) +
        '" y="' +
        (y + 22) +
        '" text-anchor="middle" font-size="17" font-weight="700" fill="' +
        accent +
        '">' +
        value +
        '</text><text x="' +
        (bx + boxW / 2).toFixed(1) +
        '" y="' +
        (y + 38) +
        '" text-anchor="middle" font-size="10" letter-spacing="0.6" fill="' +
        p.dim +
        '">' +
        label.toUpperCase() +
        "</text></g>"
      );
    })
    .join("");
}

export function errorSvg(message: string, opts: CityOptions): string {
  const p = palette(opts.theme);
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    W +
    '" height="180" viewBox="0 0 ' +
    W +
    " 180\" font-family=\"'Segoe UI',Inter,Helvetica,Arial,sans-serif\"><rect width=\"" +
    W +
    '" height="180" rx="18" fill="' +
    p.skyBottom +
    '"/><text x="34" y="80" font-size="20" font-weight="700" fill="' +
    p.text +
    '">Commit City</text><text x="34" y="110" font-size="14" fill="' +
    p.dim +
    '">' +
    esc(message) +
    "</text></svg>"
  );
}
