/**
 * Edit Account Menu Utility
 * 
 * Creates edit options menu for selected account.
 * Shows current account details and edit options (name, type, cancel).
 * 
 * Story 2.3 - Task 3
 * AC5: Edit Options Menu - Shows inline keyboard with edit options
 * AC20: Cancel Anytime - Includes cancel button
 */

import type { Id } from "../_generated/dataModel";
import { ACCOUNT_TYPES } from "./constants";
import type { InlineKeyboardMarkup } from "./keyboards";

/**
 * Account data for edit menu
 */
export interface EditableAccount {
  _id: Id<"accounts">;
  name: string;
  type: "bank" | "cash" | "credit_card" | "digital_wallet";
  balance: number;
  currency: string;
  isDefault: boolean;
}

/**
 * Edit menu result
 */
export interface EditMenuResult {
  message: string;
  keyboard: InlineKeyboardMarkup;
}

/**
 * Create edit options menu for an account
 * 
 * @param account - Account to edit
 * @param language - User's preferred language
 * @returns Message and keyboard with edit options
 */
export function createEditOptionsMenu(
  account: EditableAccount,
  language: "ar" | "en"
): EditMenuResult {
  const emoji = ACCOUNT_TYPES[account.type].emoji;
  const typeLabel = ACCOUNT_TYPES[account.type][language];
  const balanceStr = formatBalance(account.balance, account.currency);
  const defaultIndicator = account.isDefault ? (language === "ar" ? " ⭐" : " ⭐") : "";

  // Build message showing current account details
  const message = language === "ar"
    ? `✏️ *تعديل الحساب*\n\n` +
      `${emoji} *${account.name}*${defaultIndicator}\n` +
      `النوع: ${typeLabel}\n` +
      `الرصيد: ${balanceStr}\n\n` +
      `ماذا تريد أن تعدل؟`
    : `✏️ *Edit Account*\n\n` +
      `${emoji} *${account.name}*${defaultIndicator}\n` +
      `Type: ${typeLabel}\n` +
      `Balance: ${balanceStr}\n\n` +
      `What would you like to edit?`;

  // AC5: Create edit options keyboard
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: language === "ar" ? "✏️ تعديل الاسم" : "✏️ Edit Name",
          callback_data: `edit_name_${account._id}`,
        },
      ],
      [
        {
          text: language === "ar" ? "🔄 تغيير النوع" : "🔄 Change Type",
          callback_data: `edit_type_${account._id}`,
        },
      ],
      [
        {
          text: language === "ar" ? "❌ إلغاء" : "❌ Cancel",
          callback_data: "cancel_edit",
        },
      ],
    ],
  };

  return {
    message,
    keyboard,
  };
}

/**
 * Format balance for display
 */
function formatBalance(balance: number, currency: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);

  return `${formatted} ${currency}`;
}
