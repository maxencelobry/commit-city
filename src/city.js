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
    view: ["full", "months", "city"].includes(url.searchParams.get("view")) ? url.searchParams.get("view") : "full",
  };
}

const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const compact = (number) => number == null ? "—" : number >= 1000 ? `${(number / 1000).toFixed(1).replace(".0", "")}k` : String(number);

export function calculateBadges(city) {
  const total = city.months.reduce((sum, month) => sum + month.commits, 0);
  const peak = Math.max(0, ...city.months.map((month) => month.commits));
  const active = city.months.filter((month) => month.commits > 0).length;
  return [
    ...(peak >= 20 ? [{ id: "night-owl", label: "Night Owl", detail: "A peak month above 20 commits" }] : []),
    ...(total >= 100 ? [{ id: "mayor", label: "Open Source Mayor", detail: "100+ contributions in the last year" }] : []),
    ...(city.streak >= 100 ? [{ id: "streak", label: "100-day streak", detail: `${city.streak} consecutive active days` }] : []),
  ];
}

function metrics(city) {
  const total = city.months.reduce((sum, month) => sum + month.commits, 0);
  const best = city.months.reduce((top, month) => month.commits > top.commits ? month : top, city.months[0] || { label: "—", commits: 0 });
  const active = city.months.filter((month) => month.commits > 0).length;
  return { total, best, active, average: Math.round(total / Math.max(1, city.months.length)), peak: best.commits };
}

export function generateCitySvg(city, options) {
  const day = options.theme === "day";
  const palette = day
    ? { bg: "#f4f0e8", building: "#d8d3c6", text: "#24231f", dim: "#706d65" }
    : { bg: "#101116", building: "#20232c", text: "#f4f0e8", dim: "#969ba8" };
  const accent = colors[options.color];
  const accents = ["#c6f432", "#54a8ff", "#b57bff", "#ff6bb5", "#3fe0da"];
  const max = Math.max(1, ...city.months.map((month) => month.commits));
  const ground = options.view === "city" ? 480 : 405;
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
        if ((row + col + index * 11) % 3 !== 0) windows.push(`<rect x="${col}" y="${row}" width="6" height="6" fill="${towerAccent}" opacity="${hot ? ".95" : ".62"}"/>`);
      }
    }
    const label = options.view !== "city" ? `<text x="${x + width / 2}" y="${ground + 28}" text-anchor="middle" font-size="10" fill="${hot ? towerAccent : palette.dim}">${month.label}</text>` : "";
    return `<g><title>${escape(month.label)}: ${month.commits} commits</title><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${palette.building}" stroke="${hot ? towerAccent : palette.dim}" stroke-width="2"/>${windows.join("")}</g>${label}`;
  }).join("");
  const header = options.view === "full" ? `<text x="500" y="62" text-anchor="middle" font-size="34" font-weight="700" letter-spacing="7" fill="${palette.text}">COMMIT <tspan fill="${accent}">CITY</tspan></text><text x="500" y="88" text-anchor="middle" font-size="11" letter-spacing="3" fill="${palette.dim}">LAST 12 MONTHS · @${escape(city.username).toUpperCase()}</text>` : "";
  const { total, best, active, average, peak } = metrics(city);
  const stats = options.view === "full" ? [["COMMITS", compact(total)], ["BEST MONTH", best.label], ["PEAK", compact(peak)], ["AVG / MONTH", compact(average)], ["ACTIVE MONTHS", compact(active)]].map(([label, value], index) => `<text x="${100 + index * 200}" y="530" text-anchor="middle" font-size="10" fill="${palette.dim}">${label}: <tspan fill="${accent}">${value}</tspan></text>`).join("") : "";
  const stars = day ? "" : Array.from({ length: 30 }, (_, index) => `<circle cx="${30 + (index * 83) % 940}" cy="${18 + (index * 47) % 250}" r="1" fill="${accent}" opacity=".35"><animate attributeName="opacity" values=".12;.7;.12" dur="${2 + index % 3}s" begin="${index / 8}s" repeatCount="indefinite"/></circle>`).join("");
  const crop = options.view === "city" ? { y: 120, h: 400 } : options.view === "months" ? { y: 80, h: 450 } : { y: 0, h: 560 };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${crop.y} 1000 ${crop.h}" width="1000" height="${crop.h}" role="img" aria-label="Commit City for ${escape(city.username)}"><rect y="${crop.y}" width="1000" height="${crop.h}" fill="${palette.bg}"/>${stars}${header}${towers}<path d="M0 ${ground}H1000" stroke="${accent}" stroke-width="3"/>${stats}</svg>`;
}

export function parseContributionCalendar(html) {
  const tips = new Map();
  for (const match of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)) {
    const id = match[1].match(/\bfor="(contribution-day-[^"]+)"/i)?.[1];
    if (!id) continue;
    const count = match[2].replace(/<[^>]+>/g, "").match(/([\d,]+)\s+contribution/i);
    tips.set(id, count ? Number(count[1].replace(/,/g, "")) : 0);
  }
  const months = new Map();
  for (const match of html.matchAll(/<[^>]*\bdata-date="(\d{4}-\d{2})-\d{2}"[^>]*>/g)) {
    const id = match[0].match(/\bid="(contribution-day-[^"]+)"/i)?.[1];
    if (!id) continue;
    months.set(match[1], (months.get(match[1]) || 0) + (tips.get(id) || 0));
  }
  return months;
}

export function parseContributionStreak(html) {
  const tips = new Map();
  for (const match of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)) {
    const id = match[1].match(/\bfor="(contribution-day-[^"]+)"/i)?.[1];
    const count = match[2].replace(/<[^>]+>/g, "").match(/([\d,]+)\s+contribution/i);
    if (id) tips.set(id, count ? Number(count[1].replace(/,/g, "")) : 0);
  }
  const activeDates = [];
  for (const match of html.matchAll(/<[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g)) {
    const id = match[0].match(/\bid="(contribution-day-[^"]+)"/i)?.[1];
    if (id && (tips.get(id) || 0) > 0) activeDates.push(match[1]);
  }
  const dates = [...new Set(activeDates)].sort();
  let longest = 0;
  let run = 0;
  for (let index = 0; index < dates.length; index += 1) {
    const previous = index ? new Date(`${dates[index - 1]}T00:00:00Z`) : null;
    const current = new Date(`${dates[index]}T00:00:00Z`);
    const consecutive = previous && current - previous === 86400000;
    run = consecutive ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return longest;
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
  const contributionHtml = contributionsResponse.ok ? await contributionsResponse.text() : "";
  const contributions = contributionHtml ? parseContributionCalendar(contributionHtml) : new Map();
  const now = new Date();
  return {
    username: profile.login,
    followers: profile.followers ?? null,
    repos: profile.public_repos ?? null,
    stars: reposResponse.ok ? repos.filter((repo) => !repo.fork).reduce((total, repo) => total + (repo.stargazers_count || 0), 0) : null,
    streak: contributionHtml ? parseContributionStreak(contributionHtml) : 0,
    months: Array.from({ length: 12 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1));
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
      return { label: MONTHS[date.getUTCMonth()], commits: contributions.get(key) || 0 };
    }),
  };
}

function send(response, status, type, body) { response.writeHead(status, { "content-type": type, "cache-control": type.includes("svg") ? "public, max-age=1800" : "no-cache" }); response.end(body); }

export function generateBadgeSvg(city) {
  const { total, peak, active } = metrics(city);
  const badges = calculateBadges(city).map((badge) => badge.label).join(" · ") || "Building in public";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="620" height="96" role="img" aria-label="Commit City badge for ${escape(city.username)}"><rect width="620" height="96" rx="10" fill="#101116"/><rect x="1" y="1" width="618" height="94" rx="9" fill="none" stroke="#c6f432"/><text x="24" y="35" fill="#f4f0e8" font-family="monospace" font-size="18" font-weight="700">COMMIT <tspan fill="#c6f432">CITY</tspan></text><text x="24" y="63" fill="#969ba8" font-family="monospace" font-size="12">@${escape(city.username)} · ${compact(total)} commits · ${active}/12 active</text><text x="596" y="56" text-anchor="end" fill="#c6f432" font-family="monospace" font-size="12">${escape(badges)}</text><title>Commit City for @${escape(city.username)} — ${peak} peak commits</title></svg>`;
}

function profilePage(city, origin) {
  const badges = calculateBadges(city);
  const badgeCards = badges.length ? badges.map((badge) => `<li><strong>${escape(badge.label)}</strong><span>${escape(badge.detail)}</span></li>`).join("") : "<li><strong>Building in public</strong><span>Keep shipping to unlock badges.</span></li>";
  const username = escape(city.username);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>@${username} · Commit City</title><meta name="description" content="A living Commit City for @${username}."><meta property="og:title" content="@${username} · Commit City"><meta property="og:image" content="${origin}/api/city/${encodeURIComponent(city.username)}.svg"><link rel="stylesheet" href="/app.css"></head><body><main class="profile"><a class="back" href="/">← Build your city</a><section class="profile-head"><p class="eyebrow">GITHUB CITIZEN</p><h1>@${username}</h1><p>Your code, rendered as a city.</p></section><div class="profile-card"><img src="/api/city/${encodeURIComponent(city.username)}.svg?view=full" alt="Commit City for @${username}"></div><section class="badges"><p class="eyebrow">BADGES</p><ul>${badgeCards}</ul></section><p class="profile-links"><a href="/api/badge/${encodeURIComponent(city.username)}.svg">README badge</a> · <a href="https://github.com/${encodeURIComponent(city.username)}">GitHub profile</a></p></main></body></html>`;
}

export async function handler(request, response) {
  const url = new URL(request.url, "http://localhost");
  const profileMatch = url.pathname.match(/^\/u\/([A-Za-z0-9-]{1,39})\/?$/);
  const badgeMatch = url.pathname.match(/^\/api\/badge\/([A-Za-z0-9-]{1,39})\.svg$/);
  if (profileMatch || badgeMatch) {
    try {
      const city = await getCity(profileMatch?.[1] || badgeMatch[1]);
      send(response, 200, profileMatch ? "text/html; charset=utf-8" : "image/svg+xml; charset=utf-8", profileMatch ? profilePage(city, `${url.protocol}//${url.host}`) : generateBadgeSvg(city));
    } catch (error) {
      send(response, 404, "text/plain; charset=utf-8", error.message);
    }
    return;
  }
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
