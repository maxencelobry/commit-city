import assert from "node:assert/strict";
import test from "node:test";

import { generateCitySvg, parseContributionCalendar, parseOptions } from "../src/city.js";

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

test("contribution calendar is grouped by month", () => {
  const html = '<tool-tip for="contribution-day-component-0-1">4 contributions on Jan 2</tool-tip><td data-date="2026-01-02" id="contribution-day-component-0-1"></td>';
  assert.equal(parseContributionCalendar(html).get("2026-01"), 4);
});

test("full city exposes the total contributions in the SVG", () => {
  const svg = generateCitySvg(
    { username: "maxencelobry", followers: 0, repos: 0, stars: 0, months: [{ label: "JAN", commits: 103 }] },
    parseOptions(new URL("http://localhost/?view=full")),
  );

  assert.match(svg, /COMMITS \/ 12M:.*>103</);
});


