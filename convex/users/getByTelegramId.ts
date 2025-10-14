/**
 * Get User by Telegram ID Query
 * 
 * Authenticates user by looking up their Telegram ID.
 * This is the primary authentication mechanism for every webhook request.
 * 
 * AC2: New User Detection - Returns null for new users
 * AC8: Returning User Handling - Returns user object for existing users
 * 
 * Performance: Target < 100ms using by_telegram_id index (O(log n))
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Find user by their Telegram ID
 * 
 * @param telegramId - Telegram user ID (unique identifier)
 * 
 * @returns User object or null if not found
 * 
 * Index: Uses by_telegram_id for fast O(log n) lookup
 */
export const getByTelegramId = query({
  args: {
    telegramId: v.string(),
  },
  handler: async (ctx, args) => {
    const { telegramId } = args;

    // Query users table using by_telegram_id index for fast authentication
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", telegramId))
      .first();

    // Returns null for new users (triggers registration flow)
    // Returns user object for existing users
    return user;
  },
});
