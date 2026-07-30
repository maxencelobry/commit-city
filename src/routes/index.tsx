import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Building2, Copy, Check, Github, Loader2, Moon, Sun, Sparkles } from "lucide-react";
import {
  ACCENT_HEX,
  ACCENT_NAMES,
  generateCitySvg,
  type Accent,
  type CityInput,
  type Theme,
} from "@/lib/city-svg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Commit City — Turn your GitHub profile into a 2D city" },
      {
        name: "description",
        content:
          "Commit City renders your last 12 months of GitHub activity as a pixel-art SVG skyline: one building per month, height driven by commits. Day/night themes and shareable URLs.",
      },
      { property: "og:title", content: "Commit City — Your GitHub profile as a 2D city" },
      {
        property: "og:description",
        content:
          "One pixel tower per month, height driven by your commits. Generate your shareable SVG city.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const DEMO: CityInput = {
  username: "octocat",
  name: "Demo Citizen",
  followers: 4210,
  following: 12,
  publicRepos: 34,
  totalStars: 8730,
  totalCommits: 1842,
  bestMonth: "MAR",
  streak: 11,
  months: [
    { label: "AUG", commits: 96 },
    { label: "SEP", commits: 142 },
    { label: "OCT", commits: 74 },
    { label: "NOV", commits: 188 },
    { label: "DEC", commits: 41 },
    { label: "JAN", commits: 133 },
    { label: "FEB", commits: 219 },
    { label: "MAR", commits: 264 },
    { label: "APR", commits: 88 },
    { label: "MAY", commits: 176 },
    { label: "JUN", commits: 205 },
    { label: "JUL", commits: 216 },
  ],
};

function Home() {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("night");
  const [color, setColor] = useState<Accent>("lime");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const query = `?theme=${theme}&color=${color}`;
  const path = submitted ? `/api/public/city/${submitted}.svg${query}` : "";
  const shareUrl = submitted
    ? `${typeof window !== "undefined" ? window.location.host : "commit.city"}/api/public/city/${submitted}.svg${query}`
    : "";

  const demoSvg = useMemo(
    () => encodeURIComponent(generateCitySvg(DEMO, { theme, color })),
    [theme, color],
  );

  function generate(e: React.FormEvent) {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, "");
    if (!clean) return;
    setLoading(true);
    setSubmitted(clean);
  }

  function copy() {
    navigator.clipboard.writeText(`https://${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          <Building2 className="size-5 text-primary" />
          <span>
            commit<span className="text-primary">.city</span>
          </span>
        </div>
        <a
          href="https://github.com"
          className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Github className="size-4" /> GitHub
        </a>
      </header>

      <section className="mx-auto max-w-5xl px-6 pt-6 pb-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs tracking-wide text-muted-foreground uppercase">
          <Sparkles className="size-3.5 text-primary" /> Pixel skyline generator
        </span>
        <h1
          className="mx-auto mt-6 max-w-3xl text-3xl leading-tight tracking-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          YOUR LAST 12 MONTHS,
          <br />
          <span className="text-primary">AS A CITY</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
          One building per month over the last 12 months. The more you commit, the taller the tower
          and the more windows light up on your pixel skyline.
        </p>

        <form
          onSubmit={generate}
          className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-3 sm:flex-row"
        >
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
            <Github className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-github-username"
              aria-label="GitHub username"
              className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[0_0_30px_-8px_var(--color-primary)] transition-transform hover:scale-[1.02] active:scale-100"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Building2 className="size-4" />}
            Generate my city
          </button>
        </form>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
            {(["night", "day"] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
                  theme === t
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "night" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
            {ACCENT_NAMES.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={c}
                title={c}
                style={{ backgroundColor: ACCENT_HEX[c] }}
                className={`size-5 rounded-full transition-transform ${
                  color === c ? "ring-foreground scale-110 ring-2 ring-offset-2 ring-offset-card" : ""
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-14">
        <div className="grid-floor rounded-3xl border border-border bg-card/50 p-3 sm:p-5">
          {submitted ? (
            <img
              key={path}
              src={path}
              alt={`Commit City skyline generated for ${submitted}`}
              className="w-full rounded-2xl"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          ) : (
            <img
              src={`data:image/svg+xml;utf8,${demoSvg}`}
              alt="Example Commit City pixel skyline with one building per month of commits"
              className="w-full rounded-2xl"
            />
          )}
        </div>

        {submitted && (
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
            <code className="w-full flex-1 truncate rounded-xl border border-border bg-card px-4 py-3 font-mono text-xs text-muted-foreground">
              {shareUrl}
            </code>
            <button
              onClick={copy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-5 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy URL"}
            </button>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "12 buildings = 12 months",
              body: "One tower per month over the last year. Height and lit windows scale with the commits you pushed that month.",
            },
            {
              title: "Pixel skyline",
              body: "Flat pixel-art rendering: your busiest months glow in the accent color, quiet months stay grey on the grid.",
            },
            {
              title: "Shareable SVG",
              body: "One URL, always fresh, embeddable in any README. Add ?theme=day|night and ?color= to restyle it.",
            },
          ].map((f) => (
            <article key={f.title} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold tracking-wide uppercase">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-10 text-center font-mono text-xs text-muted-foreground">
          commit.city/username.svg?theme=night&amp;color=lime
        </p>
      </section>
    </main>
  );
}
