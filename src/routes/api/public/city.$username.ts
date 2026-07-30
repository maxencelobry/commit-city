import { createFileRoute } from "@tanstack/react-router";
import { errorSvg, generateCitySvg, parseAccent, parseTheme } from "@/lib/city-svg";
import { buildCity } from "@/lib/github-city.server";

export const Route = createFileRoute("/api/public/city/$username")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url);
        const opts = {
          theme: parseTheme(url.searchParams.get("theme")),
          color: parseAccent(url.searchParams.get("color")),
        };
        const username = params.username.replace(/\.svg$/i, "").trim();

        const svgHeaders = {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Cache-Control": "public, max-age=1800, s-maxage=1800",
          "Access-Control-Allow-Origin": "*",
        };

        if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
          return new Response(errorSvg("Invalid GitHub username", opts), {
            status: 400,
            headers: svgHeaders,
          });
        }

        try {
          const city = await buildCity(username);
          return new Response(generateCitySvg(city, opts), { headers: svgHeaders });
        } catch (e) {
          const message = e instanceof Error ? e.message : "Something went wrong";
          return new Response(errorSvg(message, opts), { status: 404, headers: svgHeaders });
        }
      },
    },
  },
});
