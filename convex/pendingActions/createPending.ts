/**
 * Create Pending Action Mutation
 * 
 * Stores a pending action that requires user confirmation.
 * 
 * Story 2.1:
 * AC4: Confirmation Workflow - Stores confirmation state
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Create a pending action
 * 
 * @param userId - User who initiated the action
 * @param actionType - Type of action (e.g., "create_account")
 * @param actionData - JSON data for the action (entities, parameters, etc.)
 * @param messageId - Telegram message ID for callback tracking
 * @param expiresAt - Unix timestamp when action expires
 * @returns Pending action ID
 */
export const createPending = mutation({
  args: {
    userId: v.id("users"),
    actionType: v.string(),
    actionData: v.any(),
    messageId: v.number(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, actionType, actionData, messageId, expiresAt } = args;

    const pendingId = await ctx.db.insert("pendingActions", {
      userId,
      actionType,
      actionData,
      messageId,
      expiresAt,
      createdAt: Date.now(),
    });

    return pendingId;
  },
});
