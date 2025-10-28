/**
 * Get Accounts Overview Query
 * 
 * Retrieves all non-deleted accounts for a user with proper ordering.
 * Extends the list.ts query with specific ordering for overview display.
 * 
 * Story 2.2:
 * AC2: Account Retrieval - Retrieves all non-deleted accounts ordered by isDefault DESC, createdAt ASC
 * AC6: Default Account Indicator - Default account comes first
 * AC10: Account Count - Returns account count
 * 
 * Performance: Uses by_user index for O(log n) lookup
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get accounts overview for a user
 * 
 * Returns all active (non-deleted) accounts sorted by:
 * 1. Default account first (isDefault DESC)
 * 2. Then by creation date (createdAt ASC)
 * 
 * @param userId - User ID to fetch accounts for
 * @returns Array of accounts with proper ordering
 */
export const getOverview = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("accounts"),
      _creationTime: v.number(),
      userId: v.id("users"),
      name: v.string(),
      type: v.union(
        v.literal("bank"),
        v.literal("cash"),
        v.literal("credit_card"),
        v.literal("digital_wallet")
      ),
      balance: v.number(),
      currency: v.string(),
      isDefault: v.boolean(),
      isDeleted: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const { userId } = args;

    // Query accounts by user using index (AC2)
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter out deleted accounts (AC2)
    const activeAccounts = accounts.filter((acc) => !acc.isDeleted);

    // Sort by default first, then by creation date (AC6)
    activeAccounts.sort((a, b) => {
      // Default account comes first
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      
      // Then sort by creation date (oldest first)
      return a.createdAt - b.createdAt;
    });

    return activeAccounts;
  },
});
