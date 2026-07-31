import { existsSync, readFileSync } from "node:fs";
import app from "./src/app.js";

if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Commit City: http://localhost:${port}`);
});
