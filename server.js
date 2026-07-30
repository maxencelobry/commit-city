import express from "express";
const app = express(), port = process.env.PORT || 3000;
const colors = { lime: "#c6f432", purple: "#b57bff", blue: "#54a8ff", orange: "#ff9542", pink: "#ff6bb5", cyan: "#3fe0da" };
const githubHeaders = { Accept: "application/vnd.github+json", "User-Agent": "commit-city", ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) };
app.use(express.static("public"));
app.get("/api/city/:username.svg", async (req, res) => {
  const username = req.params.username.replace(/\.svg$/i, ""), theme = req.query.theme === "day" ? "day" : "night", color = colors[req.query.color] || colors.lime;
  if (!/^[a-z\d-]{1,39}$/i.test(username)) return sendSvg(res, errorSvg("Invalid GitHub username", theme), 400);
  try { const city = await getCity(username); res.set("Cache-Control", "public, max-age=1800"); sendSvg(res, citySvg(city, theme, color)); }
  catch (error) { sendSvg(res, errorSvg(error.message || "Unable to load GitHub profile", theme), 404); }
});
function sendSvg(res, svg, status = 200) { res.status(status).type("image/svg+xml").set("Access-Control-Allow-Origin", "*").send(svg); }
async function getCity(username) {
  const [userResponse, repoResponse] = await Promise.all([fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers: githubHeaders }), fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100`, { headers: githubHeaders })]);
  if (userResponse.status === 404) throw new Error(`No GitHub user named ${username}`); if (!userResponse.ok) throw new Error("GitHub is temporarily unavailable");
  const user = await userResponse.json(), repos = repoResponse.ok ? await repoResponse.json() : [], months = await contributions(username).catch(emptyMonths);
  return { username: user.login, repos: user.public_repos, followers: user.followers, stars: repos.filter((repo) => !repo.fork).reduce((sum, repo) => sum + repo.stargazers_count, 0), months };
}
async function contributions(username) {
  const months = emptyMonths(), response = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, { headers: { "User-Agent": "commit-city" } }); if (!response.ok) return months;
  const html = await response.text(); for (const match of html.matchAll(/data-date="(\d{4}-\d{2})-\d{2}"[^>]*data-level="(\d)"/g)) { const month = months.find((item) => item.key === match[1]); if (month) month.commits += Number(match[2]); } return months;
}
function emptyMonths() { const names = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"], now = new Date(); return Array.from({ length: 12 }, (_, index) => { const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + index, 1)); return { key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`, label: names[date.getUTCMonth()], commits: 0 }; }); }
function citySvg(city, theme, accent) {
  const night = theme === "night", background = night ? "#101217" : "#f4f0e7", foreground = night ? "#f4f1e8" : "#20231e", muted = night ? "#8c94a1" : "#77746c", wall = night ? "#242933" : "#d9d7ce", total = city.months.reduce((sum, month) => sum + month.commits, 0), maximum = Math.max(1, ...city.months.map((month) => month.commits));
  const buildings = city.months.map((month, index) => { const height = 45 + Math.round(month.commits / maximum * 220), x = 55 + index * 74, y = 410 - height, windows = Array.from({ length: Math.max(1, Math.floor(height / 28)) }, (_, row) => Array.from({ length: 3 }, (_, column) => `<rect x="${x + 13 + column * 17}" y="${y + 18 + row * 25}" width="7" height="7" fill="${(row + column + index) % 3 ? muted : accent}"/>`).join("")).join(""); return `<g><rect x="${x}" y="${y}" width="58" height="${height}" fill="${wall}" stroke="${accent}" stroke-width="2"/><rect x="${x}" y="${y}" width="58" height="7" fill="${accent}"/>${windows}<text x="${x + 29}" y="438" text-anchor="middle" font-size="11" fill="${muted}">${month.label}</text></g>`; }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 560" role="img" aria-label="Commit City for ${escape(city.username)}"><rect width="1000" height="560" fill="${background}"/><text x="50" y="65" fill="${foreground}" font-family="monospace" font-size="34" font-weight="bold">COMMIT <tspan fill="${accent}">CITY</tspan></text><text x="52" y="92" fill="${muted}" font-family="monospace" font-size="14">@${escape(city.username)} · LAST 12 MONTHS</text><path d="M0 411H1000" stroke="${accent}" stroke-width="3"/>${buildings}<g font-family="monospace" text-anchor="middle"><text x="160" y="500" fill="${accent}" font-size="24">${total}</text><text x="160" y="520" fill="${muted}" font-size="11">ACTIVITY</text><text x="400" y="500" fill="${accent}" font-size="24">${city.repos}</text><text x="400" y="520" fill="${muted}" font-size="11">REPOSITORIES</text><text x="640" y="500" fill="${accent}" font-size="24">${city.stars}</text><text x="640" y="520" fill="${muted}" font-size="11">STARS</text><text x="850" y="500" fill="${accent}" font-size="24">${city.followers}</text><text x="850" y="520" fill="${muted}" font-size="11">FOLLOWERS</text></g></svg>`;
}
function errorSvg(message, theme) { const bg = theme === "night" ? "#101217" : "#f4f0e7"; return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 180"><rect width="800" height="180" fill="${bg}"/><text x="45" y="80" fill="#c6f432" font-family="monospace" font-size="30">COMMIT CITY</text><text x="45" y="120" fill="#aaa" font-family="monospace" font-size="16">${escape(message)}</text></svg>`; }
function escape(value) { return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]); }
app.listen(port, () => console.log(`Commit City running on http://localhost:${port}`));