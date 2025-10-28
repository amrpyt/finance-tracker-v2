/**
 * Count Transactions by Account Query
 * 
 * Counts the number of transactions for a specific account.
 * Used in delete confirmation to show transaction count.
 * 
 * Story 2.5 - Supporting Query:
 * AC7: Transaction Count Warning - Shows transaction count in confirmation
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Count transactions for a specific account
 * 
 * @param accountId - Account ID to count transactions for
 * @returns Number of transactions
 */
export const countByAccount = query({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const { accountId } = args;

    // TODO: Transactions table will be added in Epic 3
    // For now, return 0 as no transactions exist yet
    return 0;
    
    // Future implementation when transactions table exists:
    // const transactions = await ctx.db
    //   .query("transactions")
    //   .filter((q) => q.eq(q.field("accountId"), accountId))
    //   .collect();
    // return transactions.length;
  },
});
