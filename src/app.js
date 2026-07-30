import express from "express";

import { handler } from "./city.js";

const app = express();

// The application stays tiny: Express only handles the HTTP server;
// city.js owns GitHub data, SVG rendering, and static files.
app.use((request, response) => handler(request, response));

export default app;
