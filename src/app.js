import express from "express";

import { cityRoute } from "./routes/city.route.js";

const app = express();

app.use(cityRoute);

export default app;
