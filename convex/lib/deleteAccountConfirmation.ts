/**
 * Delete Account Confirmation Message Builder
 * 
 * Creates detailed confirmation message for account deletion.
 * 
 * Story 2.5 - Task 4:
 * AC6: Balance Warning - Shows warning if account has non-zero balance
 * AC7: Transaction Count Warning - Shows transaction count with preservation notice
 * AC10: Confirmation Workflow - Displays detailed confirmation with consequences
 */

import type { Id } from "../_generated/dataModel";
import { ACCOUNT_TYPES } from "./constants";
import type { InlineKeyboardMarkup } from "./keyboards";

/**
 * Account data for confirmation
 */
interface AccountForConfirmation {
  _id: Id<"accounts">;
  name: string;
  type: "bank" | "cash" | "credit_card" | "digital_wallet";
  balance: number;
  currency: string;
}

/**
 * Confirmation result
 */
export interface DeleteConfirmationResult {
  message: string;
  keyboard: InlineKeyboardMarkup;
}

/**
 * Create delete confirmation message
 * 
 * @param account - Account to be deleted
 * @param transactionCount - Number of transactions for this account
 * @param language - User's preferred language
 * @returns Formatted confirmation message with keyboard
 */
export function createDeleteConfirmation(
  account: AccountForConfirmation,
  transactionCount: number,
  language: "ar" | "en"
): DeleteConfirmationResult {
  const emoji = ACCOUNT_TYPES[account.type].emoji;
  const typeLabel = ACCOUNT_TYPES[account.type][language];
  
  // Task 4.4: Build detailed confirmation message
  let message = language === "ar"
    ? "⚠️ *تأكيد حذف الحساب*\n\n"
    : "⚠️ *Confirm Account Deletion*\n\n";

  // Show account details
  message += language === "ar"
    ? `🗑️ *الحساب:* ${emoji} ${account.name}\n` +
      `🏦 *النوع:* ${typeLabel}\n` +
      `💰 *الرصيد:* ${account.balance.toFixed(2)} ${account.currency}\n`
    : `🗑️ *Account:* ${emoji} ${account.name}\n` +
      `🏦 *Type:* ${typeLabel}\n` +
      `💰 *Balance:* ${account.balance.toFixed(2)} ${account.currency}\n`;

  // Task 4.5: If balance !== 0, add prominent warning (AC6)
  if (account.balance !== 0) {
    message += language === "ar"
      ? `\n⚠️ *تحذير:* هذا الحساب لديه رصيد ${account.balance.toFixed(2)} ${account.currency}. هل تريد المتابعة؟\n`
      : `\n⚠️ *Warning:* This account has a balance of ${account.balance.toFixed(2)} ${account.currency}. Do you want to continue?\n`;
  }

  // Task 4.4: Show transaction count with preservation notice (AC7)
  message += language === "ar"
    ? `\n📊 *عدد المعاملات:* ${transactionCount}\n` +
      `📝 سيتم الاحتفاظ بسجل المعاملات للرجوع إليها.\n`
    : `\n📊 *Transaction Count:* ${transactionCount}\n` +
      `📝 Transaction history will be preserved for reference.\n`;

  // Task 4.4: Explain consequences
  message += language === "ar"
    ? `\n💡 *ماذا سيحدث:*\n` +
      `• سيتم إخفاء الحساب من القائمة\n` +
      `• سيتم الاحتفاظ بجميع المعاملات\n` +
      `• يمكنك رؤية المعاملات في السجل\n` +
      `• لن يؤثر على الحسابات الأخرى\n`
    : `\n💡 *What will happen:*\n` +
      `• Account will be hidden from the list\n` +
      `• All transactions will be preserved\n` +
      `• You can view transactions in history\n` +
      `• Other accounts won't be affected\n`;

  // Task 4.6: Create confirmation keyboard
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: language === "ar" ? "تأكيد الحذف 🗑️" : "Confirm Delete 🗑️",
          callback_data: `confirm_delete_${account._id}`,
        },
      ],
      [
        {
          text: language === "ar" ? "إلغاء ❌" : "Cancel ❌",
          callback_data: `cancel_delete_${account._id}`,
        },
      ],
    ],
  };

  return {
    message,
    keyboard,
  };
}
