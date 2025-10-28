/**
 * Logger utility for structured logging
 * 
 * Provides consistent logging interface across Convex functions
 * with structured output for debugging and monitoring.
 */
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
