/**
 * Soft Delete Account Mutation
 * 
 * Marks an account as deleted without removing it from the database.
 * Preserves transaction history and referential integrity.
 * 
 * Story 2.5 - Task 5:
 * AC4: Soft Delete Strategy - Sets isDeleted=true, keeps account in database
 * AC5: Transaction Preservation - Transactions remain intact
 * AC15: No Cascade Delete - Only account record is marked as deleted
 * AC16: Audit Trail - Updates deletedAt timestamp and isDeleted flag
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { validateAccountDeletion } from "../lib/validateAccountDeletion";

/**
 * Soft delete an account
 * 
 * @param userId - User ID attempting deletion
 * @param accountId - Account ID to delete
 * @returns Deleted account object with isDeleted=true
 * @throws Error if validation fails
 */
export const softDelete = mutation({
  args: {
    userId: v.id("users"),
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const { userId, accountId } = args;

    // Task 5.5: Run pre-deletion validation
    const validation = await validateAccountDeletion(ctx, userId, accountId);

    // Task 5.6: If validation fails, throw error with specific message
    if (!validation.valid) {
      throw new Error(validation.error || "VALIDATION_FAILED");
    }

    const account = validation.account;

    // Task 5.7: Update account record - set isDeleted=true, deletedAt=Date.now()
    // Task 5.8: NEVER update: balance, currency, name, type, createdAt, updatedAt
    // Task 5.11: Transaction wrapper for atomicity (Convex handles this automatically)
    await ctx.db.patch(accountId, {
      isDeleted: true,
      deletedAt: Date.now(),
    });

    // Task 5.9: NEVER delete transactions or cascade to related entities (AC15)
    // Transactions remain untouched in the database

    // Task 5.10: Return deleted account object with isDeleted=true
    const deletedAccount = await ctx.db.get(accountId);
    
    return deletedAccount;
  },
});
