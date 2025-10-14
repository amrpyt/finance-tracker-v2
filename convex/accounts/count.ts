/**
 * Count Accounts Query
 * 
 * Returns the number of active accounts for a user.
 * Used for determining default account logic.
 * 
 * Story 2.1:
 * AC6: Default Account Handling - Checks if user has existing accounts
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Count active accounts for a user
 * 
 * @param userId - User ID to count accounts for
 * @returns Number of active (non-deleted) accounts
 */
export const count = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    return accounts.length;
  },
});
