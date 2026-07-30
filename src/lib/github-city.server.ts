import type { CityInput, MonthInput } from "./city-svg";

const GH = "https://api.github.com";
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "commit-city",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

/** Scrape the public contributions calendar (daily counts for the last year). */
async function monthlyCommits(username: string): Promise<MonthInput[]> {
  const buckets = new Map<string, number>();
  const now = new Date();
  const keys: Array<{ key: string; label: string }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    keys.push({ key, label: MONTHS[d.getUTCMonth()] });
    buckets.set(key, 0);
  }

  const res = await fetch(
    `https://github.com/users/${encodeURIComponent(username)}/contributions`,
    { headers: { "User-Agent": "commit-city", Accept: "text/html" } },
  );
  if (res.ok) {
    const html = await res.text();

    // Tooltips hold the real counts: <tool-tip for="contribution-day-...">N contributions on ...
    const tips = new Map<string, number>();
    const tipRe = /<tool-tip[^>]*for="(contribution-day-[^"]+)"[^>]*>([^<]*)<\/tool-tip>/g;
    let t: RegExpExecArray | null;
    while ((t = tipRe.exec(html))) {
      const n = t[2].match(/^(\d+)\s+contribution/);
      tips.set(t[1], n ? Number(n[1]) : 0);
    }

    const dayRe = /data-date="(\d{4}-\d{2})-\d{2}"[^>]*id="(contribution-day-[^"]+)"/g;
    let d: RegExpExecArray | null;
    while ((d = dayRe.exec(html))) {
      if (!buckets.has(d[1])) continue;
      buckets.set(d[1], (buckets.get(d[1]) ?? 0) + (tips.get(d[2]) ?? 0));
    }
  }

  return keys.map(({ key, label }) => ({ label, commits: buckets.get(key) ?? 0 }));
}

export async function buildCity(username: string): Promise<CityInput> {
  const [userRes, reposRes, months] = await Promise.all([
    fetch(`${GH}/users/${encodeURIComponent(username)}`, { headers: headers() }),
    fetch(`${GH}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`, {
      headers: headers(),
    }),
    monthlyCommits(username).catch(() => [] as MonthInput[]),
  ]);

  if (userRes.status === 404) throw new Error(`No GitHub user named "${username}"`);
  if (!userRes.ok) throw new Error(`GitHub API error (${userRes.status}) — try again later`);

  const user = (await userRes.json()) as {
    login: string;
    name: string | null;
    followers: number;
    following: number;
    public_repos: number;
  };

  let totalStars = 0;
  if (reposRes.ok) {
    const repos = (await reposRes.json()) as Array<{ stargazers_count: number; fork: boolean }>;
    totalStars = repos.filter((r) => !r.fork).reduce((s, r) => s + r.stargazers_count, 0);
  }

  const safeMonths = months.length === 12 ? months : fallbackMonths();
  const best = safeMonths.reduce((a, b) => (b.commits > a.commits ? b : a), safeMonths[0]);

  return {
    username: user.login,
    name: user.name,
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    totalStars,
    totalCommits: safeMonths.reduce((s, m) => s + m.commits, 0),
    bestMonth: best.commits > 0 ? best.label : "—",
    streak: safeMonths.filter((m) => m.commits > 0).length,
    months: safeMonths,
  };
}

function fallbackMonths(): MonthInput[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1));
    return { label: MONTHS[d.getUTCMonth()], commits: 0 };
  });
}
