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
    const re = /data-date="(\d{4}-\d{2})-\d{2}"[^>]*data-level="(\d+)"/g;
    const countRe = /<td[^>]*data-date="(\d{4}-\d{2})-\d{2}"[^>]*>([\s\S]*?)<\/td>/g;
    let m: RegExpExecArray | null;
    let matched = false;
    while ((m = countRe.exec(html))) {
      const month = m[1];
      if (!buckets.has(month)) continue;
      const inner = m[2];
      const num = inner.match(/(\d+)\s+contribution/);
      const value = num ? Number(num[1]) : 0;
      buckets.set(month, (buckets.get(month) ?? 0) + value);
      matched = true;
    }
    if (!matched) {
      while ((m = re.exec(html))) {
        const month = m[1];
        if (!buckets.has(month)) continue;
        buckets.set(month, (buckets.get(month) ?? 0) + Number(m[2]) * 3);
      }
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
