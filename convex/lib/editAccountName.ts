/**
 * Edit Account Name Handler
 * 
 * Handles the name edit flow: prompt → input → validation → confirmation.
 * 
 * Story 2.3 - Task 4
 * AC6: Name Edit Flow - Prompts for name, validates, shows confirmation
 * AC13: Validation Rules - Enforces name constraints
 * AC14: Duplicate Name Prevention - Checks uniqueness
 */

import type { Id } from "../_generated/dataModel";
import type { InlineKeyboardMarkup } from "./keyboards";

/**
 * Account data for name editing
 */
export interface AccountForNameEdit {
  _id: Id<"accounts">;
  name: string;
  type: "bank" | "cash" | "credit_card" | "digital_wallet";
}

/**
 * Name edit prompt result
 */
export interface NameEditPromptResult {
  message: string;
  stateData: {
    accountId: Id<"accounts">;
    editType: "name";
    oldName: string;
  };
}

/**
 * Name validation result
 */
export interface NameValidationResult {
  isValid: boolean;
  error?: string;
  trimmedName?: string;
}

/**
 * Name confirmation result
 */
export interface NameConfirmationResult {
  message: string;
  keyboard: InlineKeyboardMarkup;
}

/**
 * Create name edit prompt
 * 
 * @param account - Account to edit
 * @param language - User's preferred language
 * @returns Prompt message and state data
 */
export function createNameEditPrompt(
  account: AccountForNameEdit,
  language: "ar" | "en"
): NameEditPromptResult {
  const message = language === "ar"
    ? `✏️ *تعديل اسم الحساب*\n\n` +
      `الاسم الحالي: *${account.name}*\n\n` +
      `أدخل الاسم الجديد للحساب:`
    : `✏️ *Edit Account Name*\n\n` +
      `Current name: *${account.name}*\n\n` +
      `Enter the new account name:`;

  return {
    message,
    stateData: {
      accountId: account._id,
      editType: "name",
      oldName: account.name,
    },
  };
}

/**
 * Validate new account name
 * 
 * AC13: Validation Rules - name not empty, ≤50 chars
 * 
 * @param newName - New name input from user
 * @param language - User's preferred language
 * @returns Validation result
 */
export function validateAccountName(
  newName: string,
  language: "ar" | "en"
): NameValidationResult {
  const trimmedName = newName.trim();

  // AC13: Name not empty
  if (trimmedName.length === 0) {
    return {
      isValid: false,
      error: language === "ar"
        ? "❌ اسم الحساب لا يمكن أن يكون فارغاً.\n\nالرجاء إدخال اسم صحيح:"
        : "❌ Account name cannot be empty.\n\nPlease enter a valid name:",
    };
  }

  // AC13: Name ≤ 50 characters
  if (trimmedName.length > 50) {
    return {
      isValid: false,
      error: language === "ar"
        ? `❌ اسم الحساب طويل جداً (${trimmedName.length} حرف).\n\nالحد الأقصى 50 حرف. الرجاء إدخال اسم أقصر:`
        : `❌ Account name is too long (${trimmedName.length} characters).\n\nMaximum 50 characters. Please enter a shorter name:`,
    };
  }

  return {
    isValid: true,
    trimmedName,
  };
}

/**
 * Create name change confirmation message
 * 
 * AC8: Confirmation Workflow - Shows old → new name with confirm/cancel buttons
 * 
 * @param oldName - Current account name
 * @param newName - New account name
 * @param accountId - Account ID
 * @param language - User's preferred language
 * @returns Confirmation message and keyboard
 */
export function createNameConfirmation(
  oldName: string,
  newName: string,
  accountId: Id<"accounts">,
  language: "ar" | "en"
): NameConfirmationResult {
  const message = language === "ar"
    ? `✅ *تأكيد تعديل الاسم*\n\n` +
      `الاسم القديم: ${oldName}\n` +
      `الاسم الجديد: *${newName}*\n\n` +
      `هل تريد تأكيد التغيير؟`
    : `✅ *Confirm Name Change*\n\n` +
      `Old name: ${oldName}\n` +
      `New name: *${newName}*\n\n` +
      `Do you want to confirm this change?`;

  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: language === "ar" ? "تأكيد ✅" : "Confirm ✅",
          callback_data: `confirm_name_${accountId}`,
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
 * Create duplicate name error message
 * 
 * AC14: Duplicate Name Prevention - Error message with retry prompt
 * 
 * @param duplicateName - Name that already exists
 * @param language - User's preferred language
 * @returns Error message
 */
export function createDuplicateNameError(
  duplicateName: string,
  language: "ar" | "en"
): string {
  return language === "ar"
    ? `❌ يوجد حساب آخر بنفس الاسم "${duplicateName}".\n\nاختر اسم مختلف:`
    : `❌ Another account with the name "${duplicateName}" already exists.\n\nChoose a different name:`;
}
