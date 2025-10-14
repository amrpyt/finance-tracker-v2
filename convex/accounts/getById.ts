/**
 * Get Account by ID
 * 
 * Retrieves an account by its ID.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get account by ID
 * 
 * @param accountId - Account ID
 * @returns Account or null if not found
 */
export const getById = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const { accountId } = args;
    return await ctx.db.get(accountId);
  },
});
