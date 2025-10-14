/**
 * List Accounts Query
 * 
 * Retrieves all accounts for a user with optional filtering.
 * 
 * Story 2.1:
 * AC6: Default Account Handling - Lists accounts sorted by default
 * AC7: Success Response - Provides account overview data
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * List all accounts for a user
 * 
 * @param userId - User ID to fetch accounts for
 * @param includeDeleted - Include soft-deleted accounts (default: false)
 * @returns Array of accounts sorted by isDefault DESC, createdAt ASC
 */
export const list = query({
  args: {
    userId: v.id("users"),
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, includeDeleted = false } = args;

    // Query accounts by user
    let accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter out deleted accounts unless requested
    if (!includeDeleted) {
      accounts = accounts.filter((acc) => !acc.isDeleted);
    }

    // Sort by default first, then by creation date
    accounts.sort((a, b) => {
      // Default account comes first
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      
      // Then sort by creation date (oldest first)
      return a.createdAt - b.createdAt;
    });

    return accounts;
  },
});
