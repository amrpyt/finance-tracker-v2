/**
 * Message History Query
 * 
 * Retrieves recent conversation messages for AI context retention.
 * Supports context-aware intent detection and conversational responses.
 * 
 * Usage: Pass to AI calls for maintaining conversation context across 5-10 messages
 * 
 * Performance: Uses by_user_date index for O(log n) retrieval
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get recent conversation messages for a user
 * 
 * @param userId - User ID to fetch messages for
 * @param limit - Number of recent messages to retrieve (default: 10)
 * 
 * @returns Array of messages in chronological order (oldest first)
 * 
 * Example Usage:
 * ```typescript
 * const history = await ctx.runQuery(api.messages.getRecent, {
 *   userId,
 *   limit: 10
 * });
 * 
 * // Pass to AI for context
 * const intent = await ctx.runAction(api.ai.nlParser.parseAccountIntent, {
 *   userMessage,
 *   language,
 *   conversationHistory: history
 * });
 * ```
 */
export const getRecent = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()), // Default: 10 messages (5 user + 5 assistant typically)
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // Query messages using indexed lookup for performance
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user_date", (q) => q.eq("userId", args.userId))
      .order("desc") // Most recent first
      .take(limit);
    
    // Return in chronological order (oldest first) for AI context
    // AI models expect conversation history in temporal order
    return messages.reverse();
  },
});
