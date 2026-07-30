/**
 * Commit City — pure SVG generator (pixel / retro skyline).
 * One building per month over the last 12 months.
 * No DOM, no Node APIs: safe on the edge runtime and in the browser.
 */

export type Theme = "day" | "night";

export type Accent = "lime" | "purple" | "blue" | "orange" | "pink" | "cyan" | "yellow";

export interface MonthInput {
  /** short label, e.g. "JAN" */
  label: string;
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
  bestMonth: string;
  streak: number;
  months: MonthInput[];
}

export interface CityOptions {
  theme: Theme;
  color: Accent;
}

const ACCENTS: Record<Accent, string> = {
  lime: "#c6f432",
  purple: "#b57bff",
  blue: "#54a8ff",
  orange: "#ff9542",
  pink: "#ff6bb5",
  cyan: "#3fe0da",
  yellow: "#f5cd2f",
};

export const ACCENT_NAMES = Object.keys(ACCENTS) as Accent[];
export const ACCENT_HEX = ACCENTS;

export function parseTheme(v: string | null): Theme {
  return v === "day" ? "day" : "night";
}

export function parseAccent(v: string | null): Accent {
  return (ACCENT_NAMES as string[]).includes(v ?? "") ? (v as Accent) : "lime";
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
  bg: string;
  wallOn: string;
  wallOff: string;
  outlineOff: string;
  windowOff: string;
  text: string;
  dim: string;
  hair: string;
}

function palette(theme: Theme): Palette {
  return theme === "night"
    ? {
        bg: "#0e0e10",
        wallOn: "#14170c",
        wallOff: "#17181c",
        outlineOff: "#3b3f4a",
        windowOff: "#9aa0ad",
        text: "#ece7dc",
        dim: "#8b91a0",
        hair: "#ffffff14",
      }
    : {
        bg: "#f2efe6",
        wallOn: "#e8f2c8",
        wallOff: "#e0ddd2",
        outlineOff: "#a9a598",
        windowOff: "#9b9789",
        text: "#1c1c1a",
        dim: "#6b6counter",
        hair: "#0000000f",
      };
}

const W = 1000;
const H = 560;
const GRID = 5; // pixel unit
const GROUND_Y = 430;

export function generateCitySvg(city: CityInput, opts: CityOptions): string {
  const p = palette(opts.theme);
  if (opts.theme === "day") p.dim = "#6b6b63";
  const accent = ACCENTS[opts.color];
  const rand = rng(city.username || "city");

  const months = city.months.slice(-12);
  const maxCommits = Math.max(1, ...months.map((m) => m.commits));

  const padX = 46;
  const slot = (W - padX * 2) / months.length;
  const bw = Math.round((slot * 0.74) / GRID) * GRID;

  const buildings: string[] = [];
  const labels: string[] = [];

  months.forEach((m, i) => {
    const ratio = m.commits / maxCommits;
    const hot = ratio >= 0.45;
    const rows = Math.max(2, Math.round((26 + Math.pow(ratio, 0.75) * 190) / (GRID * 4)));
    const bh = rows * GRID * 4;
    const x = Math.round((padX + i * slot + (slot - bw) / 2) / GRID) * GRID;
    const y = GROUND_Y - bh;
    buildings.push(pixelBuilding(x, y, bw, bh, hot, ratio, m, p, accent, rand));
    labels.push(
      '<text x="' +
        (x + bw / 2).toFixed(1) +
        '" y="' +
        (GROUND_Y + 26) +
        '" text-anchor="middle" font-size="11" letter-spacing="2.5" fill="' +
        (hot ? accent : p.dim) +
        '">' +
        esc(m.label) +
        "</text>" +
        '<text x="' +
        (x + bw / 2).toFixed(1) +
        '" y="' +
        (GROUND_Y + 42) +
        '" text-anchor="middle" font-size="10" letter-spacing="1" fill="' +
        p.dim +
        '" opacity="0.7">' +
        fmt(m.commits) +
        "</text>",
    );
  });

  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
    W +
    '" height="' +
    H +
    '" viewBox="0 0 ' +
    W +
    " " +
    H +
    '" role="img" aria-label="Commit City — last 12 months for ' +
    esc(city.username) +
    '" font-family="\'Courier New\',ui-monospace,monospace" shape-rendering="crispEdges">' +
    '<defs><clipPath id="card"><rect x="0" y="0" width="' +
    W +
    '" height="' +
    H +
    '" rx="14"/></clipPath></defs>' +
    '<g clip-path="url(#card)">' +
    '<rect width="' +
    W +
    '" height="' +
    H +
    '" fill="' +
    p.bg +
    '"/>' +
    starfield(opts.theme, rand, p, accent) +
    '<text x="' +
    W / 2 +
    '" y="86" text-anchor="middle" font-size="46" font-weight="700" letter-spacing="10" fill="' +
    p.text +
    '">COMMIT<tspan fill="' +
    accent +
    '"> CITY</tspan></text>' +
    '<text x="' +
    W / 2 +
    '" y="116" text-anchor="middle" font-size="12" letter-spacing="6" fill="' +
    p.dim +
    '">LAST 12 MONTHS · <tspan fill="' +
    accent +
    '">@' +
    esc(city.username).toUpperCase() +
    "</tspan></text>" +
    buildings.join("") +
    '<rect x="0" y="' +
    GROUND_Y +
    '" width="' +
    W +
    '" height="3" fill="' +
    accent +
    '"/>' +
    labels.join("") +
    statsRow(city, p, accent) +
    "</g>" +
    "</svg>"
  );
}

function starfield(theme: Theme, rand: () => number, p: Palette, accent: string) {
  if (theme === "day") return "";
  let out = "";
  for (let i = 0; i < 42; i++) {
    const x = Math.round((rand() * W) / GRID) * GRID;
    const y = Math.round((rand() * 300) / GRID) * GRID;
    out +=
      '<rect x="' +
      x +
      '" y="' +
      y +
      '" width="2" height="2" fill="' +
      (rand() > 0.85 ? accent : p.windowOff) +
      '" opacity="' +
      (0.15 + rand() * 0.35).toFixed(2) +
      '"/>';
  }
  return out;
}

function pixelBuilding(
  x: number,
  y: number,
  w: number,
  h: number,
  hot: boolean,
  ratio: number,
  m: MonthInput,
  p: Palette,
  accent: string,
  rand: () => number,
) {
  const stroke = hot ? accent : p.outlineOff;
  const parts: string[] = [];
  parts.push(
    '<rect x="' +
      x +
      '" y="' +
      y +
      '" width="' +
      w +
      '" height="' +
      h +
      '" fill="' +
      (hot ? p.wallOn : p.wallOff) +
      '" stroke="' +
      stroke +
      '" stroke-width="2"/>',
  );
  // roof cap
  parts.push(
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + GRID + '" fill="' + stroke + '"/>',
  );

  // pixel windows grid
  const cell = GRID * 4;
  const cols = Math.max(1, Math.floor((w - GRID * 3) / cell));
  const rows = Math.max(1, Math.floor((h - GRID * 5) / cell));
  const offX = x + Math.round((w - cols * cell + GRID * 2) / 2);
  const density = 0.35 + ratio * 0.55;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (rand() > density) continue;
      parts.push(
        '<rect x="' +
          (offX + c * cell) +
          '" y="' +
          (y + GRID * 3 + r * cell) +
          '" width="' +
          GRID * 2 +
          '" height="' +
          GRID * 2 +
          '" fill="' +
          (hot ? accent : p.windowOff) +
          '"/>',
      );
    }
  }
  parts.push("<title>" + esc(m.label) + " — " + fmt(m.commits) + " commits</title>");
  return "<g>" + parts.join("") + "</g>";
}

function statsRow(city: CityInput, p: Palette, accent: string) {
  const items: Array<[string, string]> = [
    ["COMMITS / 12M", fmt(city.totalCommits)],
    ["BEST MONTH", city.bestMonth],
    ["ACTIVE MONTHS", fmt(city.streak)],
    ["STARS", fmt(city.totalStars)],
    ["REPOS", fmt(city.publicRepos)],
    ["FOLLOWERS", fmt(city.followers)],
  ];
  const y = 486;
  const boxW = (W - 92 - 10 * (items.length - 1)) / items.length;
  return items
    .map(([label, value], i) => {
      const bx = 46 + i * (boxW + 10);
      return (
        '<g><rect x="' +
        bx.toFixed(1) +
        '" y="' +
        y +
        '" width="' +
        boxW.toFixed(1) +
        '" height="44" fill="none" stroke="' +
        p.hair +
        '" stroke-width="2"/><text x="' +
        (bx + boxW / 2).toFixed(1) +
        '" y="' +
        (y + 21) +
        '" text-anchor="middle" font-size="16" font-weight="700" letter-spacing="1" fill="' +
        accent +
        '">' +
        esc(value) +
        '</text><text x="' +
        (bx + boxW / 2).toFixed(1) +
        '" y="' +
        (y + 36) +
        '" text-anchor="middle" font-size="8" letter-spacing="1.6" fill="' +
        p.dim +
        '">' +
        label +
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
    ' 180" font-family="\'Courier New\',ui-monospace,monospace" shape-rendering="crispEdges"><rect width="' +
    W +
    '" height="180" rx="14" fill="' +
    p.bg +
    '"/><text x="46" y="82" font-size="24" font-weight="700" letter-spacing="6" fill="' +
    p.text +
    '">COMMIT CITY</text><text x="46" y="112" font-size="13" letter-spacing="2" fill="' +
    p.dim +
    '">' +
    esc(message).toUpperCase() +
    "</text></svg>"
  );
}
