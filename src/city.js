import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const colors = { lime: "#c6f432", purple: "#b57bff", blue: "#54a8ff", orange: "#ff9542", pink: "#ff6bb5", cyan: "#3fe0da", mix: "#c6f432" };

export function parseOptions(url) {
  return {
    theme: url.searchParams.get("theme") === "day" ? "day" : "night",
    color: colors[url.searchParams.get("color")] ? url.searchParams.get("color") : "lime",
    view: url.searchParams.get("view") === "buildings" ? "buildings" : "full",
  };
}

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const compact = (number) => number == null ? "—" : number >= 1000 ? `${(number / 1000).toFixed(1).replace(".0", "")}k` : String(number);

export function generateCitySvg(city, options) {
  const day = options.theme === "day";
  const palette = day
    ? { bg: "#f4f0e8", building: "#d8d3c6", text: "#24231f", dim: "#706d65" }
    : { bg: "#101116", building: "#20232c", text: "#f4f0e8", dim: "#969ba8" };
  const accent = colors[options.color];
  const accents = ["#c6f432", "#54a8ff", "#b57bff", "#ff6bb5", "#3fe0da"];
  const max = Math.max(1, ...city.months.map((month) => month.commits));
  const ground = options.view === "buildings" ? 480 : 405;
  const towers = city.months.map((month, index) => {
    const width = 52;
    const x = 46 + index * 76;
    const height = 48 + Math.round((month.commits / max) * 220);
    const y = ground - height;
    const hot = month.commits / max >= 0.45;
    const towerAccent = options.color === "mix" ? accents[index % accents.length] : accent;
    const windows = [];
    for (let row = y + 16; row < ground - 10; row += 18) {
      for (let col = x + 12; col < x + width - 8; col += 16) {
        if ((row + col + index * 11) % 3 !== 0) windows.push(`<rect x="${col}" y="${row}" width="6" height="6" fill="${hot ? towerAccent : palette.dim}" opacity=".85"/>`);
      }
    }
    const label = options.view === "full" ? `<text x="${x + width / 2}" y="${ground + 28}" text-anchor="middle" font-size="10" fill="${hot ? towerAccent : palette.dim}">${month.label}</text>` : "";
    return `<g><title>${escape(month.label)}: ${month.commits} commits</title><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${palette.building}" stroke="${hot ? towerAccent : palette.dim}" stroke-width="2"/>${windows.join("")}</g>${label}`;
  }).join("");
  const header = options.view === "full" ? `<text x="500" y="62" text-anchor="middle" font-size="34" font-weight="700" letter-spacing="7" fill="${palette.text}">COMMIT <tspan fill="${accent}">CITY</tspan></text><text x="500" y="88" text-anchor="middle" font-size="11" letter-spacing="3" fill="${palette.dim}">LAST 12 MONTHS · @${escape(city.username).toUpperCase()}</text>` : "";
  const active = city.months.filter((month) => month.commits > 0).length;
  const best = city.months.reduce((top, month) => month.commits > top.commits ? month : top, city.months[0]);
  const stats = options.view === "full" ? [["COMMITS / 12M", compact(city.months.reduce((total, month) => total + month.commits, 0))], ["BEST MONTH", best.label], ["ACTIVE MONTHS", compact(active)]].map(([label, value], index) => `<text x="${250 + index * 250}" y="530" text-anchor="middle" font-size="11" fill="${palette.dim}">${label}: <tspan fill="${accent}">${value}</tspan></text>`).join("") : "";
  const stars = day ? "" : Array.from({ length: 30 }, (_, index) => `<circle cx="${30 + (index * 83) % 940}" cy="${18 + (index * 47) % 250}" r="1" fill="${accent}" opacity=".35"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560" width="1000" height="560" role="img" aria-label="Commit City for ${escape(city.username)}"><rect width="1000" height="560" rx="16" fill="${palette.bg}"/>${stars}${header}${towers}<path d="M0 ${ground}H1000" stroke="${accent}" stroke-width="3"/>${stats}</svg>`;
}

export function parseContributionCalendar(html) {
  const tips = new Map();
  for (const match of html.matchAll(/<tool-tip[^>]*for="(contribution-day-[^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const count = match[2].match(/^([\d,]+)\s+contribution/);
    tips.set(match[1], count ? Number(count[1].replace(/,/g, "")) : 0);
  }
  const months = new Map();
  for (const match of html.matchAll(/data-date="(\d{4}-\d{2})-\d{2}"[^>]*id="(contribution-day-[^"]+)"/g)) {
    months.set(match[1], (months.get(match[1]) || 0) + (tips.get(match[2]) || 0));
  }
  return months;
}

async function getCity(username) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "commit-city" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const [profileResponse, reposResponse, contributionsResponse] = await Promise.all([
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers }),
    fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100`, { headers }),
    fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, { headers: { "User-Agent": "commit-city" } }),
  ]);
  if (profileResponse.status === 404) throw new Error("GitHub user not found");
  const profile = profileResponse.ok
    ? await profileResponse.json()
    : { login: username, followers: null, public_repos: null };
  const repos = reposResponse.ok ? await reposResponse.json() : [];
  const contributions = contributionsResponse.ok ? parseContributionCalendar(await contributionsResponse.text()) : new Map();
  const now = new Date();
  return {
    username: profile.login,
    followers: profile.followers ?? null,
    repos: profile.public_repos ?? null,
    stars: reposResponse.ok ? repos.filter((repo) => !repo.fork).reduce((total, repo) => total + (repo.stargazers_count || 0), 0) : null,
    months: Array.from({ length: 12 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      return { label: MONTHS[date.getUTCMonth()], commits: contributions.get(key) || 0 };
    }),
  };
}

function send(response, status, type, body) { response.writeHead(status, { "content-type": type, "cache-control": type.includes("svg") ? "public, max-age=1800" : "no-cache" }); response.end(body); }

export async function handler(request, response) {
  const url = new URL(request.url, "http://localhost");
  const match = url.pathname.match(/^\/api\/city\/([A-Za-z0-9-]{1,39})\.svg$/);
  if (match) {
    const options = parseOptions(url);
    try { send(response, 200, "image/svg+xml; charset=utf-8", generateCitySvg(await getCity(match[1]), options)); }
    catch (error) { send(response, 404, "image/svg+xml; charset=utf-8", `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="160"><rect width="100%" height="100%" fill="#101116"/><text x="40" y="90" fill="#f4f0e8" font-family="monospace" font-size="20">${escape(error.message)}</text></svg>`); }
    return;
  }
  const file = url.pathname === "/" ? "public/index.html" : `public${url.pathname}`;
  const safe = normalize(join(root, file));
  if (!safe.startsWith(root)) return send(response, 403, "text/plain", "Forbidden");
  try {
    const body = await readFile(safe);
    const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".ico": "image/x-icon" };
    send(response, 200, types[extname(safe)] || "application/octet-stream", body);
  } catch { send(response, 404, "text/plain", "Not found"); }
}
