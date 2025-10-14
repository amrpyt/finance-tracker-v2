/**
 * HTTP Action Router
 * 
 * Routes incoming HTTP requests to appropriate handlers.
 * Required for Convex HTTP Actions to work.
 */

import { httpRouter } from "convex/server";
import { webhook } from "./telegram/webhook";
import { setWebhook } from "./telegram/setWebhook";

const http = httpRouter();

// Telegram webhook endpoint - receives POST requests from Telegram Bot API
http.route({
  path: "/telegram/webhook",
  method: "POST",
  handler: webhook,
});

// Telegram webhook registration endpoint - registers webhook URL with Telegram
http.route({
  path: "/telegram/setWebhook",
  method: "POST",
  handler: setWebhook,
});

// Also support GET for easy browser testing of setWebhook
http.route({
  path: "/telegram/setWebhook",
  method: "GET",
  handler: setWebhook,
});

// Export the HTTP router
export default http;
