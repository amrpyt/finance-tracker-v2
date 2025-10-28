/**
 * Get Default Account Query
 * 
 * Retrieves the default account for a user using optimized index.
 * 
 * Story 2.4:
 * AC7: Transaction Integration - Uses default when account not specified
 * AC19: Query Optimization - Uses by_user_default index for fast lookup
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get default account for a user
 * 
 * @param userId - User ID to fetch default account for
 * @returns Default account or null if no default set
 */
export const getDefault = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Use by_user_default index for fast lookup (AC19)
    const defaultAccount = await ctx.db
      .query("accounts")
      .withIndex("by_user_default", (q) =>
        q.eq("userId", userId).eq("isDefault", true)
      )
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .first();

    return defaultAccount ?? null;
  },
});
