/**
 * Update Pending Action Mutation
 * 
 * Story 3.1: AI Expense Logging
 * Task 14.5: Create updatePendingExpense() mutation (for edits)
 * 
 * Updates pending action data during edit flows.
 * Used when user edits amount, category, description, or account.
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Update pending action data
 * 
 * Task 14.5: Update pending expense entities during edit flow
 * Task 8.9: Store updated entities in pending confirmation
 * AC10: Edit Flow - Allows editing extracted fields before confirmation
 * 
 * @param pendingId - ID of pending action to update
 * @param actionData - New action data (merged with existing)
 * @returns Updated pending action ID
 */
export const updatePending = mutation({
  args: {
    pendingId: v.id("pendingActions"),
    actionData: v.any(),
  },
  handler: async (ctx, args) => {
    const { pendingId, actionData } = args;

    // Get existing pending action
    const existing = await ctx.db.get(pendingId);
    
    if (!existing) {
      throw new Error("Pending action not found");
    }

    // Check if expired
    if (existing.expiresAt < Date.now()) {
      throw new Error("Pending action has expired");
    }

    // Merge new data with existing data
    const updatedData = {
      ...existing.actionData,
      ...actionData,
    };

    // Log for debugging type preservation issues
    if (existing.actionType === 'log_expense') {
      console.log('[updatePending] Expense data merge:', {
        existingAmount: existing.actionData.amount,
        existingAmountType: typeof existing.actionData.amount,
        updatedAmount: updatedData.amount,
        updatedAmountType: typeof updatedData.amount,
      });
    }

    // Update the pending action
    await ctx.db.patch(pendingId, {
      actionData: updatedData,
    });

    return pendingId;
  },
});
