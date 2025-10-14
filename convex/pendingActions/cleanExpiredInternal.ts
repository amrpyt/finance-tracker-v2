/**
 * Clean Expired Pending Actions - Internal Implementation
 * 
 * Internal mutation called by scheduled job to delete expired actions.
 * 
 * Story 2.1:
 * Task 5.6: Scheduled cleanup implementation
 */

import { internalMutation } from "../_generated/server";
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

/**
 * Delete all expired pending actions
 * Called by scheduled cron job every hour
 */
export const cleanExpiredInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find all expired actions
    const expiredActions = await ctx.db
      .query("pendingActions")
      .withIndex("by_expiration")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    logger.info(
      { count: expiredActions.length },
      "Cleaning expired pending actions"
    );

    // Delete expired actions
    for (const action of expiredActions) {
      await ctx.db.delete(action._id);
    }

    logger.info(
      { deletedCount: expiredActions.length },
      "Expired pending actions cleaned successfully"
    );
  },
});
