/**
 * Clear Conversation State Mutation
 * 
 * Clears conversation state after flow completion or cancellation.
 * 
 * Story 2.3 - Task 8.5
 * AC20: Cancel Anytime - Clears state when user cancels
 * AC6: Name Edit Flow - Clears state after name update completes
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Clear conversation state for a user
 * 
 * @param userId - User ID
 */
export const clear = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Find and delete active state for user
    const state = await ctx.db
      .query("conversationStates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (state) {
      await ctx.db.delete(state._id);
    }
  },
});
