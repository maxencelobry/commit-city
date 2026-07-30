import assert from "node:assert/strict";
import test from "node:test";

import { calculateBadges, generateBadgeSvg, generateCitySvg, parseContributionCalendar, parseContributionStreak, parseOptions } from "../src/city.js";

test("buildings view hides the header and statistics", () => {
  const svg = generateCitySvg(
    {
      username: "octocat",
      followers: 1,
      repos: 2,
      stars: 3,
      months: Array.from({ length: 12 }, (_, index) => ({ label: `M${index}`, commits: index + 1 })),
    },
    parseOptions(new URL("http://localhost/?view=city")),
  );

  assert.match(svg, /<svg/);
  assert.doesNotMatch(svg, /COMMIT CITY|COMMITS \/ 12M|LAST 12 MONTHS/);
});

test("windows mix dark gray and accent colors", () => {
  const city = { username: "octocat", months: [{ label: "JAN", commits: 1 }, { label: "FEB", commits: 4 }] };
  const svg = generateCitySvg(city, parseOptions(new URL("http://localhost/?color=purple")));
  assert.match(svg, /fill="#b57bff" opacity=".95"/);
  assert.match(svg, /fill="#969ba8" opacity=".72"/);
  assert.match(svg, /fill="#20232c" stroke="#969ba8"/);
});

test("activity changes the ratio of colored windows, not buildings", () => {
  const city = { username: "octocat", months: [{ label: "LOW", commits: 1 }, { label: "HIGH", commits: 10 }] };
  const svg = generateCitySvg(city, parseOptions(new URL("http://localhost/?color=purple")));
  assert.doesNotMatch(svg, /fill="#b57bff" opacity=".28"/);
  assert.match(svg, /fill="#20232c" stroke="#969ba8"/);
});

test("contribution calendar is grouped by month", () => {
  const html = '<tool-tip aria-label="4 contributions" for="contribution-day-component-0-1"><span>4 contributions on Jan 2</span></tool-tip><td id="contribution-day-component-0-1" data-date="2026-01-02"></td>';
  assert.equal(parseContributionCalendar(html).get("2026-01"), 4);
});

test("contribution streak uses consecutive active days", () => {
  const html = [1, 2, 3].map((day) => `<tool-tip for="contribution-day-${day}">${day} contributions</tool-tip><td data-date="2026-01-0${day}" id="contribution-day-${day}"></td>`).join("");
  assert.equal(parseContributionStreak(html), 3);
});

test("full city exposes the total contributions in the SVG", () => {
  const svg = generateCitySvg(
    { username: "maxencelobry", followers: 0, repos: 0, stars: 0, months: [{ label: "JAN", commits: 103 }] },
    parseOptions(new URL("http://localhost/?view=full")),
  );

  assert.match(svg, /COMMITS:.*>103</);
});

test("badges and README badge are derived from contribution metrics", () => {
  const city = { username: "builder", streak: 100, months: Array.from({ length: 12 }, (_, index) => ({ label: `M${index}`, commits: index === 11 ? 40 : 10 })) };
  assert.deepEqual(calculateBadges(city).map((badge) => badge.id), ["night-owl", "mayor", "streak"]);
  assert.match(generateBadgeSvg(city), /Open Source Mayor/);
});


