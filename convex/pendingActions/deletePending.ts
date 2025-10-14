/**
 * Delete Pending Action Mutation
 * 
 * Removes a pending action after it's been processed or cancelled.
 * 
 * Story 2.1:
 * AC4: Confirmation Workflow - Cleanup after action completed
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";

/**
 * Delete a pending action
 * 
 * @param pendingId - ID of pending action to delete
 */
export const deletePending = mutation({
  args: {
    pendingId: v.id("pendingActions"),
  },
  handler: async (ctx, args) => {
    const { pendingId } = args;

    await ctx.db.delete(pendingId);
  },
});
