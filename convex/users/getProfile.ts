/**
 * Get User Profile Query
 * 
 * Retrieves user profile by userId to get language preference and other settings.
 * Used after authentication to determine response language.
 * 
 * AC8: Returning User Handling - Fetches language preference for welcome-back message
 * 
 * Performance: Target < 50ms using by_user index (O(log n))
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get user profile by userId
 * 
 * @param userId - User ID (foreign key to users table)
 * 
 * @returns UserProfile object or null if not found
 * 
 * Index: Uses by_user for fast O(log n) lookup
 */
export const getProfile = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { userId } = args;

    // Query userProfiles table using by_user index
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    // Returns null if profile not found (should not happen after registration)
    return profile;
  },
});
