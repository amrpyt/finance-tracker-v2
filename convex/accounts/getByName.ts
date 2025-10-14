/**
 * Get Account By Name Query
 * 
 * Finds an account by exact name match for a user.
 * Used for duplicate name checking.
 * 
 * Story 2.1:
 * AC11: Duplicate Prevention - Checks for existing account names
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get account by exact name match
 * 
 * @param userId - User ID to search within
 * @param accountName - Exact account name to match
 * @returns Account document or null if not found
 */
export const getByName = query({
  args: {
    userId: v.id("users"),
    accountName: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, accountName } = args;

    const account = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) =>
        q.and(
          q.eq(q.field("name"), accountName),
          q.eq(q.field("isDeleted"), false)
        )
      )
      .first();

    return account;
  },
});
