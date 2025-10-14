/**
 * Get Pending Actions by User and Type
 * 
 * Retrieves active pending actions for a user filtered by action type.
 * Used for clarification flow state management.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get pending actions by user ID and action type
 * 
 * @param userId - User ID
 * @param actionType - Action type to filter (e.g., "clarify_balance")
 * @returns Array of non-expired pending actions
 */
export const getPendingByUserAndType = query({
  args: {
    userId: v.id("users"),
    actionType: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, actionType } = args;
    const now = Date.now();

    const pendingActions = await ctx.db
      .query("pendingActions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("actionType"), actionType),
          q.gt(q.field("expiresAt"), now) // Only non-expired
        )
      )
      .collect();

    return pendingActions;
  },
});
