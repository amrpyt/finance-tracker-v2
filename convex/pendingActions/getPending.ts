/**
 * Get Pending Action Query
 * 
 * Retrieves a pending action by message ID for callback handling.
 * 
 * Story 2.1:
 * AC4: Confirmation Workflow - Retrieves confirmation state on button press
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get pending action by message ID
 * 
 * @param messageId - Telegram message ID
 * @returns Pending action or null if not found/expired
 */
export const getPending = query({
  args: {
    messageId: v.number(),
  },
  handler: async (ctx, args) => {
    const { messageId } = args;

    const pending = await ctx.db
      .query("pendingActions")
      .withIndex("by_message", (q) => q.eq("messageId", messageId))
      .first();

    // Check if expired
    if (pending && pending.expiresAt < Date.now()) {
      return null; // Treat expired actions as not found
    }

    return pending;
  },
});
