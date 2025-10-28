/**
 * Set Default Account Mutation
 * 
 * Sets an account as the default account for a user with atomic transaction.
 * Ensures only ONE default account per user at any time.
 * 
 * Story 2.4:
 * AC4: Single Default Enforcement - Only ONE account marked as default per user
 * AC10: Validation Rules - Account exists, user owns, not deleted, not already default
 * AC11: Already Default Handling - Friendly message if already default
 * AC17: Audit Trail - Updates updatedAt on both old and new default
 * AC19: Query Optimization - Uses by_user_default index, atomic transaction
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Set an account as the default account
 * 
 * @param userId - User ID who owns the account
 * @param accountId - Account ID to set as default
 * @returns Object with oldDefault (if exists) and newDefault account
 */
export const setDefault = mutation({
  args: {
    userId: v.id("users"),
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const { userId, accountId } = args;

    // 1. Validate account exists (AC10)
    const account = await ctx.db.get(accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // 2. Validate user owns the account (AC10)
    if (account.userId !== userId) {
      throw new Error("You do not own this account");
    }

    // 3. Validate account is not deleted (AC10)
    if (account.isDeleted) {
      throw new Error("Cannot set deleted account as default");
    }

    // 4. Check if account is already default (AC11)
    if (account.isDefault) {
      return {
        alreadyDefault: true,
        oldDefault: null,
        newDefault: account,
      };
    }

    // 5. Atomic transaction: Update old default and set new default (AC4, AC19)
    const now = Date.now();

    // Find current default account using by_user_default index (AC19)
    const currentDefault = await ctx.db
      .query("accounts")
      .withIndex("by_user_default", (q) =>
        q.eq("userId", userId).eq("isDefault", true)
      )
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .first();

    // If current default exists, unset it (AC4, AC17)
    if (currentDefault) {
      await ctx.db.patch(currentDefault._id, {
        isDefault: false,
        updatedAt: now,
      });
    }

    // Set new account as default (AC4, AC17)
    await ctx.db.patch(accountId, {
      isDefault: true,
      updatedAt: now,
    });

    // Fetch updated account
    const updatedAccount = await ctx.db.get(accountId);

    return {
      alreadyDefault: false,
      oldDefault: currentDefault ?? null,
      newDefault: updatedAccount,
    };
  },
});
