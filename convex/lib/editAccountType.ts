/**
 * Edit Account Type Handler
 * 
 * Handles the type edit flow: type selection → confirmation.
 * 
 * Story 2.3 - Task 5
 * AC7: Type Edit Flow - Shows type selection keyboard, validates, confirms
 * AC13: Validation Rules - Validates type is valid enum
 */

import type { Id } from "../_generated/dataModel";
import { ACCOUNT_TYPES } from "./constants";
import type { InlineKeyboardMarkup } from "./keyboards";

/**
 * Account type enum
 */
export type AccountType = "bank" | "cash" | "credit_card" | "digital_wallet";

/**
 * Account data for type editing
 */
export interface AccountForTypeEdit {
  _id: Id<"accounts">;
  name: string;
  type: AccountType;
}

/**
 * Type selection result
 */
export interface TypeSelectionResult {
  message: string;
  keyboard: InlineKeyboardMarkup;
}

/**
 * Type confirmation result
 */
export interface TypeConfirmationResult {
  message: string;
  keyboard: InlineKeyboardMarkup;
}

/**
 * Create type selection keyboard
 * 
 * AC7: Type Edit Flow - Shows type selection keyboard with all account types
 * 
 * @param account - Account to edit
 * @param language - User's preferred language
 * @returns Message and keyboard with type options
 */
export function createTypeSelectionKeyboard(
  account: AccountForTypeEdit,
  language: "ar" | "en"
): TypeSelectionResult {
  const currentTypeLabel = ACCOUNT_TYPES[account.type][language];

  const message = language === "ar"
    ? `🔄 *تغيير نوع الحساب*\n\n` +
      `الحساب: *${account.name}*\n` +
      `النوع الحالي: ${ACCOUNT_TYPES[account.type].emoji} ${currentTypeLabel}\n\n` +
      `اختر النوع الجديد:`
    : `🔄 *Change Account Type*\n\n` +
      `Account: *${account.name}*\n` +
      `Current type: ${ACCOUNT_TYPES[account.type].emoji} ${currentTypeLabel}\n\n` +
      `Select new type:`;

  // AC7: Create type selection keyboard (2x2 grid)
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: `${ACCOUNT_TYPES.bank.emoji} ${ACCOUNT_TYPES.bank[language]}`,
          callback_data: `select_type_bank_${account._id}`,
        },
        {
          text: `${ACCOUNT_TYPES.cash.emoji} ${ACCOUNT_TYPES.cash[language]}`,
          callback_data: `select_type_cash_${account._id}`,
        },
      ],
      [
        {
          text: `${ACCOUNT_TYPES.credit_card.emoji} ${ACCOUNT_TYPES.credit_card[language]}`,
          callback_data: `select_type_credit_card_${account._id}`,
        },
        {
          text: `${ACCOUNT_TYPES.digital_wallet.emoji} ${ACCOUNT_TYPES.digital_wallet[language]}`,
          callback_data: `select_type_digital_wallet_${account._id}`,
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
 * Create type change confirmation message
 * 
 * AC8: Confirmation Workflow - Shows old → new type with confirm/cancel buttons
 * 
 * @param accountName - Account name
 * @param oldType - Current account type
 * @param newType - New account type
 * @param accountId - Account ID
 * @param language - User's preferred language
 * @returns Confirmation message and keyboard
 */
export function createTypeConfirmation(
  accountName: string,
  oldType: AccountType,
  newType: AccountType,
  accountId: Id<"accounts">,
  language: "ar" | "en"
): TypeConfirmationResult {
  const oldTypeLabel = `${ACCOUNT_TYPES[oldType].emoji} ${ACCOUNT_TYPES[oldType][language]}`;
  const newTypeLabel = `${ACCOUNT_TYPES[newType].emoji} ${ACCOUNT_TYPES[newType][language]}`;

  const message = language === "ar"
    ? `✅ *تأكيد تغيير النوع*\n\n` +
      `الحساب: *${accountName}*\n\n` +
      `النوع القديم: ${oldTypeLabel}\n` +
      `النوع الجديد: *${newTypeLabel}*\n\n` +
      `هل تريد تأكيد التغيير؟`
    : `✅ *Confirm Type Change*\n\n` +
      `Account: *${accountName}*\n\n` +
      `Old type: ${oldTypeLabel}\n` +
      `New type: *${newTypeLabel}*\n\n` +
      `Do you want to confirm this change?`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: language === "ar" ? "تأكيد ✅" : "Confirm ✅",
          callback_data: `confirm_type_${accountId}`,
        },
        {
          text: language === "ar" ? "إلغاء ❌" : "Cancel ❌",
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
 * Validate account type
 * 
 * AC13: Validation Rules - Type must be valid enum value
 * 
 * @param type - Type string to validate
 * @returns True if valid account type
 */
export function isValidAccountType(type: string): type is AccountType {
  return ["bank", "cash", "credit_card", "digital_wallet"].includes(type);
}
