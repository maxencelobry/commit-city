import { handler } from "../services/city.service.js";

/**
 * Single HTTP entry point for SVG, profile and static routes.
 * Keeping this adapter here makes the Express app easy to extend later.
 */
export function cityRoute(request, response) {
  return handler(request, response);
}
