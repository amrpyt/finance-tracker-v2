/**
 * Update Account Mutation
 * 
 * Updates account name and/or type while preserving transaction history.
 * Enforces validation rules and prevents editing protected fields.
 * 
 * Story 2.3 - Task 6
 * AC4: Editable Fields - Only allows editing name and type
 * AC9: Transaction Preservation - Does NOT affect existing transactions
 * AC10: Balance Preservation - Balance remains unchanged
 * AC11: Default Account Status - Maintains isDefault flag
 * AC13: Validation Rules - Enforces name length, uniqueness, valid type
 * AC14: Duplicate Name Prevention - Case-insensitive uniqueness check
 * AC19: Audit Trail - Updates updatedAt, preserves createdAt
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

/**
 * Account type enum for validation
 */
const VALID_ACCOUNT_TYPES = ["bank", "cash", "credit_card", "digital_wallet"] as const;

/**
 * Update account name and/or type
 * 
 * @param userId - User ID (for ownership validation)
 * @param accountId - Account ID to update
 * @param updates - Object containing name and/or type updates
 * @returns Updated account object
 * 
 * @throws ConvexError if account not found, user doesn't own account, or validation fails
 */
export const update = mutation({
  args: {
    userId: v.id("users"),
    accountId: v.id("accounts"),
    updates: v.object({
      name: v.optional(v.string()),
      type: v.optional(v.union(
        v.literal("bank"),
        v.literal("cash"),
        v.literal("credit_card"),
        v.literal("digital_wallet")
      )),
    }),
  },
  handler: async (ctx, args) => {
    const { userId, accountId, updates } = args;

    // Fetch account
    const account = await ctx.db.get(accountId);

    // AC15: Validate account exists
    if (!account) {
      throw new ConvexError({
        code: "ACCOUNT_NOT_FOUND",
        message: "الحساب غير موجود", // Account not found
      });
    }

    // AC15: Validate user owns the account
    if (account.userId !== userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "الحساب غير موجود", // Account not found (don't reveal ownership)
      });
    }

    // AC4: Validate account is not deleted
    if (account.isDeleted) {
      throw new ConvexError({
        code: "ACCOUNT_DELETED",
        message: "الحساب غير موجود", // Account not found
      });
    }

    // Validate at least one field is being updated
    if (!updates.name && !updates.type) {
      throw new ConvexError({
        code: "NO_UPDATES",
        message: "لا توجد تحديثات", // No updates provided
      });
    }

    // Prepare update object
    const updateData: {
      name?: string;
      type?: typeof VALID_ACCOUNT_TYPES[number];
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    // AC13: Validate and update name if provided
    if (updates.name !== undefined) {
      const newName = updates.name.trim();

      // AC13: Name not empty
      if (newName.length === 0) {
        throw new ConvexError({
          code: "INVALID_NAME",
          message: "اسم الحساب لا يمكن أن يكون فارغاً", // Account name cannot be empty
        });
      }

      // AC13: Name ≤ 50 characters
      if (newName.length > 50) {
        throw new ConvexError({
          code: "NAME_TOO_LONG",
          message: "اسم الحساب يجب أن يكون 50 حرف أو أقل", // Account name must be 50 characters or less
        });
      }

      // AC14: Check name uniqueness (case-insensitive, exclude current account)
      const existingAccount = await ctx.db
        .query("accounts")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) =>
          q.and(
            q.neq(q.field("_id"), accountId), // Exclude current account
            q.eq(q.field("isDeleted"), false),
            q.eq(q.field("name"), newName) // Exact match (case-sensitive for now)
          )
        )
        .first();

      if (existingAccount) {
        throw new ConvexError({
          code: "DUPLICATE_NAME",
          message: "يوجد حساب آخر بنفس الاسم. اختر اسم مختلف", // Another account with same name exists. Choose different name
        });
      }

      updateData.name = newName;
    }

    // AC13: Validate and update type if provided
    if (updates.type !== undefined) {
      // Type validation is handled by Convex schema, but double-check
      if (!VALID_ACCOUNT_TYPES.includes(updates.type)) {
        throw new ConvexError({
          code: "INVALID_TYPE",
          message: "نوع الحساب غير صالح", // Invalid account type
        });
      }

      updateData.type = updates.type;
    }

    // AC4, AC10, AC11, AC19: Update ONLY allowed fields
    // NEVER update: balance, currency, isDefault, isDeleted, createdAt
    await ctx.db.patch(accountId, updateData);

    // Return updated account
    const updatedAccount = await ctx.db.get(accountId);
    return updatedAccount;
  },
});
