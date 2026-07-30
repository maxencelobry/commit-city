import type { CityInput, RepoInput } from "./city-svg";

const GH = "https://api.github.com";

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "commit-city",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

interface GhRepo {
  name: string;
  full_name: string;
  language: string | null;
  stargazers_count: number;
  size: number;
  fork: boolean;
  pushed_at: string;
}

async function commitCount(fullName: string): Promise<number> {
  const res = await fetch(`${GH}/repos/${fullName}/commits?per_page=1`, { headers: headers() });
  if (!res.ok) return 0;
  const link = res.headers.get("link");
  const match = link?.match(/[?&]page=(\d+)>;\s*rel="last"/);
  if (match) return Number(match[1]);
  const body = (await res.json()) as unknown[];
  return Array.isArray(body) ? body.length : 0;
}

export async function buildCity(username: string): Promise<CityInput> {
  const [userRes, reposRes] = await Promise.all([
    fetch(`${GH}/users/${encodeURIComponent(username)}`, { headers: headers() }),
    fetch(`${GH}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed`, {
      headers: headers(),
    }),
  ]);

  if (userRes.status === 404) throw new Error(`No GitHub user named "${username}"`);
  if (!userRes.ok) throw new Error(`GitHub API error (${userRes.status}) — try again later`);
  if (!reposRes.ok) throw new Error(`GitHub API error (${reposRes.status}) — try again later`);

  const user = (await userRes.json()) as {
    login: string;
    name: string | null;
    followers: number;
    following: number;
    public_repos: number;
  };
  const allRepos = ((await reposRes.json()) as GhRepo[]).filter((r) => !r.fork);

  const ranked = [...allRepos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count || b.size - a.size)
    .slice(0, 24);

  const counts = await Promise.all(
    ranked.slice(0, 24).map((r) => commitCount(r.full_name).catch(() => 0)),
  );

  const repos: RepoInput[] = ranked.map((r, i) => ({
    name: r.name,
    language: r.language,
    stars: r.stargazers_count,
    size: r.size,
    commits: counts[i] || Math.max(1, Math.round(Math.sqrt(r.size) / 2)),
  }));

  return {
    username: user.login,
    name: user.name,
    followers: user.followers,
    following: user.following,
    publicRepos: user.public_repos,
    totalStars: allRepos.reduce((s, r) => s + r.stargazers_count, 0),
    totalCommits: repos.reduce((s, r) => s + r.commits, 0),
    repos,
  };
}
