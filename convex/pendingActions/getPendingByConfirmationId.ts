/**
 * Get Pending Action by Confirmation ID
 * 
 * Story 3.1: AI Expense Logging
 * Task 14.4: Create getPendingExpense() query
 * 
 * Retrieves pending expense confirmation by unique confirmation ID.
 * Used during edit and confirmation flows.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";

/**
 * Get pending action by confirmation ID
 * 
 * Task 14.4: Retrieve pending expense data for edit/confirm workflows
 * AC17: Conversation Context - Maintains state during confirmation flow
 * 
 * @param confirmationId - Unique confirmation ID (stored in callback data)
 * @returns Pending action or null if not found/expired
 */
export const getPendingByConfirmationId = query({
  args: {
    confirmationId: v.string(),
  },
  handler: async (ctx, args) => {
    const { confirmationId } = args;

    // Find pending action with matching confirmation ID in actionData
    const allPending = await ctx.db
      .query("pendingActions")
      .collect();

    const pending = allPending.find((p) => {
      if (p.actionType === "log_expense" || p.actionType === "log_income") {
        return p.actionData?.confirmationId === confirmationId;
      }
      return false;
    });

    if (!pending) {
      return null;
    }

    // Check if expired (Task 14.2: 5 minute TTL)
    if (pending.expiresAt < Date.now()) {
      return null; // Treat expired actions as not found
    }

    return pending;
  },
});
