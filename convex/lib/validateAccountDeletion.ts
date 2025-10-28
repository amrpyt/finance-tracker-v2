/**
 * Validate Account Deletion Utility
 * 
 * Pre-deletion validation to ensure safe account deletion.
 * 
 * Story 2.5 - Task 3:
 * AC8: Default Account Protection - Cannot delete default account
 * AC9: Last Account Protection - Cannot delete only remaining account
 * 
 * Validation checks:
 * 1. User owns the account
 * 2. Account exists and not already deleted
 * 3. Account is not the default account
 * 4. User has more than one active account
 */

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";

/**
 * Account validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  account?: any;
}

/**
 * Validate account deletion is safe
 * 
 * @param ctx - Query or Mutation context
 * @param userId - User ID attempting deletion
 * @param accountId - Account ID to delete
 * @returns Validation result with error message if invalid
 */
export async function validateAccountDeletion(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  accountId: Id<"accounts">
): Promise<ValidationResult> {
  // Task 3.3: Fetch account details
  const account = await ctx.db.get(accountId);

  // Task 3.4: Validate account exists
  if (!account) {
    return {
      valid: false,
      error: "ACCOUNT_NOT_FOUND",
    };
  }

  // Task 3.4: Validate user owns the account
  if (account.userId !== userId) {
    return {
      valid: false,
      error: "UNAUTHORIZED",
    };
  }

  // Task 3.5: Check if account is already deleted
  if (account.isDeleted) {
    return {
      valid: false,
      error: "ALREADY_DELETED",
    };
  }

  // Task 3.6: Check if account is default (AC8)
  if (account.isDefault) {
    return {
      valid: false,
      error: "CANNOT_DELETE_DEFAULT",
    };
  }

  // Task 3.7: Count total active accounts for user
  const allAccounts = await ctx.db
    .query("accounts")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  const activeAccounts = allAccounts.filter((acc: any) => !acc.isDeleted);

  // Task 3.8: Check if this is the last account (AC9)
  if (activeAccounts.length === 1) {
    return {
      valid: false,
      error: "CANNOT_DELETE_LAST_ACCOUNT",
    };
  }

  // Task 3.9: Return success with account data
  return {
    valid: true,
    account,
  };
}

/**
 * Get localized error message for validation error
 * 
 * @param errorCode - Error code from validation
 * @param language - User's preferred language
 * @returns Localized error message
 */
export function getValidationErrorMessage(
  errorCode: string,
  language: "ar" | "en"
): string {
  const messages: Record<string, Record<"ar" | "en", string>> = {
    ACCOUNT_NOT_FOUND: {
      ar: "❌ الحساب غير موجود",
      en: "❌ Account not found",
    },
    UNAUTHORIZED: {
      ar: "❌ غير مصرح لك بحذف هذا الحساب",
      en: "❌ You are not authorized to delete this account",
    },
    ALREADY_DELETED: {
      ar: "❌ هذا الحساب محذوف بالفعل",
      en: "❌ This account is already deleted",
    },
    CANNOT_DELETE_DEFAULT: {
      ar: "⚠️ هذا هو حسابك الافتراضي. يجب تعيين حساب افتراضي آخر أولاً",
      en: "⚠️ This is your default account. You must set another account as default first",
    },
    CANNOT_DELETE_LAST_ACCOUNT: {
      ar: "❌ لا يمكن حذف آخر حساب. يجب أن يكون لديك حساب واحد على الأقل",
      en: "❌ Cannot delete last account. You must have at least one active account",
    },
  };

  return messages[errorCode]?.[language] || messages.ACCOUNT_NOT_FOUND[language];
}
