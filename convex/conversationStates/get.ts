/**
 * Get Conversation State Query
 * 
 * Retrieves active conversation state for a user.
 * Returns null if no state exists or state has expired.
 * 
 * Story 2.3 - Task 8.4
 * AC6: Name Edit Flow - Retrieves state to determine if user is providing name
 * AC9: Update Webhook Text Message Handler - Checks for active state
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get active conversation state for a user
 * 
 * @param userId - User ID
 * @returns Conversation state or null if none/expired
 */
export const get = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Find active state for user
    const state = await ctx.db
      .query("conversationStates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!state) {
      return null;
    }

    // Check if state has expired
    const now = Date.now();
    if (state.expiresAt < now) {
      // State expired - return null (cleanup will happen via scheduled function or next set)
      return null;
    }

    return state;
  },
});
