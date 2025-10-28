/**
 * Set Conversation State Mutation
 * 
 * Creates or updates conversation state for multi-step flows.
 * Used when user enters a multi-step workflow (e.g., editing account name).
 * 
 * Story 2.3 - Task 8.3
 * AC6: Name Edit Flow - Stores conversation state when awaiting name input
 * AC7: Type Edit Flow - Stores conversation state when awaiting type selection
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Set conversation state for a user
 * 
 * @param userId - User ID
 * @param stateType - Type of state (e.g., "awaiting_account_name")
 * @param stateData - JSON data for the state (accountId, editType, etc.)
 * @param expirationMinutes - Minutes until state expires (default: 10)
 * @returns Conversation state ID
 */
export const set = mutation({
  args: {
    userId: v.id("users"),
    stateType: v.string(),
    stateData: v.any(),
    expirationMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, stateType, stateData, expirationMinutes = 10 } = args;

    // Clear any existing state for this user (only one active state per user)
    const existingState = await ctx.db
      .query("conversationStates")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingState) {
      await ctx.db.delete(existingState._id);
    }

    // Create new state with expiration
    const now = Date.now();
    const expiresAt = now + expirationMinutes * 60 * 1000;

    const stateId = await ctx.db.insert("conversationStates", {
      userId,
      stateType,
      stateData,
      expiresAt,
      createdAt: now,
    });

    return stateId;
  },
});
