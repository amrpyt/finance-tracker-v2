/**
 * User Registration Mutation
 * 
 * Creates a new user and their profile atomically in a single transaction.
 * This is the entry point for /start command flow.
 * 
 * AC3: User Registration - Creates user + userProfile with Telegram data and defaults
 * AC9: Atomic Registration - Both succeed or both fail (Convex OCC guarantees)
 * 
 * Performance: Target < 100ms for user creation
 * Idempotency: Returns existing user if telegramId already exists
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Register a new user with their profile
 * 
 * @param telegramId - Unique Telegram user ID (required)
 * @param username - Telegram @username (optional)
 * @param firstName - User's first name from Telegram (optional)
 * @param lastName - User's last name from Telegram (optional)
 * 
 * @returns { userId, profileId, isNewUser } - IDs of created/existing records
 * 
 * Default Profile Values:
 * - language: "ar" (Arabic - target user base)
 * - currency: "EGP" (Egyptian Pound)
 * - timezone: "Africa/Cairo"
 * - All notification preferences: true
 */
export const register = mutation({
  args: {
    telegramId: v.string(),
    username: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { telegramId, username, firstName, lastName } = args;

    // Check for existing user (idempotent behavior - AC9)
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_telegram_id", (q) => q.eq("telegramId", telegramId))
      .first();

    if (existingUser) {
      // Return existing user without creating duplicates
      const existingProfile = await ctx.db
        .query("userProfiles")
        .withIndex("by_user", (q) => q.eq("userId", existingUser._id))
        .first();

      return {
        userId: existingUser._id,
        profileId: existingProfile?._id,
        isNewUser: false,
      };
    }

    // Create new user record (AC3)
    const userId = await ctx.db.insert("users", {
      telegramId,
      username,
      firstName,
      lastName,
      createdAt: Date.now(),
    });

    // Create user profile with defaults (AC3)
    // Default language: Arabic (target user base in Egypt/MENA)
    // Default currency: EGP (Egyptian Pound)
    // Default timezone: Africa/Cairo
    // All notifications enabled by default (user can disable later)
    const profileId = await ctx.db.insert("userProfiles", {
      userId,
      language: "ar", // Arabic default for MENA users
      currency: "EGP", // Egyptian Pound
      timezone: "Africa/Cairo",
      notificationPreferences: {
        dailySummary: true,
        budgetAlerts: true,
        accountUpdates: true,
        systemMessages: true,
        voiceConfirmations: true,
      },
      updatedAt: Date.now(),
    });

    // Both user and profile created successfully (atomic transaction via Convex OCC)
    return {
      userId,
      profileId,
      isNewUser: true,
    };
  },
});
