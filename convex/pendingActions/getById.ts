/**
 * Get Pending Action by ID
 * 
 * Retrieves a pending action by its ID.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get pending action by ID
 * 
 * @param pendingId - Pending action ID
 * @returns Pending action or null if not found/expired
 */
export const getById = query({
  args: {
    pendingId: v.id("pendingActions"),
  },
  handler: async (ctx, args) => {
    const { pendingId } = args;

    const pending = await ctx.db.get(pendingId);

    // Check if expired
    if (pending && pending.expiresAt < Date.now()) {
      return null; // Treat expired actions as not found
    }

    return pending;
  },
});
