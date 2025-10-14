/**
 * User Profile Update Mutation
 * 
 * Updates user profile fields, primarily used for language selection during onboarding.
 * 
 * AC6: Callback Query Handling - Updates userProfile.language field after button click
 * 
 * Performance: Target < 50ms for profile update
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Update user profile language preference
 * 
 * @param userId - User ID (foreign key to users table)
 * @param language - Selected language: "ar" (Arabic) or "en" (English)
 * 
 * @returns { success: boolean, profileId } - Update status and profile ID
 */
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    language: v.union(v.literal("ar"), v.literal("en")),
  },
  handler: async (ctx, args) => {
    const { userId, language } = args;

    // Find user profile by userId using by_user index (O(log n))
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error(`Profile not found for userId: ${userId}`);
    }

    // Update language preference and timestamp
    await ctx.db.patch(profile._id, {
      language,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      profileId: profile._id,
    };
  },
});
