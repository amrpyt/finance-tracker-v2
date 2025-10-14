/**
 * Message Storage Mutation
 * 
 * Stores conversation messages between user and bot in the messages table.
 * Used for debugging, AI context, and conversation history.
 * 
 * AC10: Message History - All /start commands and bot responses logged
 * 
 * Performance: Target < 50ms for message insert
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new message record
 * 
 * @param userId - User ID (foreign key to users table)
 * @param role - Message role: "user" | "assistant" | "system"
 * @param content - Message text content
 * @param intent - Optional AI-detected intent (Epic 3+)
 * @param entities - Optional extracted entities (Epic 3+)
 * 
 * @returns { messageId } - ID of created message
 * 
 * Message Roles:
 * - "user": User's message to the bot (e.g., /start command, text input)
 * - "assistant": Bot's response to the user
 * - "system": System-generated messages (e.g., onboarding prompts)
 */
export const create = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    intent: v.optional(v.string()),
    entities: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { userId, role, content, intent, entities } = args;

    // Insert message with timestamp
    const messageId = await ctx.db.insert("messages", {
      userId,
      role,
      content,
      intent,
      entities,
      createdAt: Date.now(),
    });

    return { messageId };
  },
});
