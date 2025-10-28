/**
 * Telegram Inline Keyboard Helpers
 * 
 * Creates inline keyboard markup for Telegram Bot API.
 * Used for interactive buttons in messages.
 * 
 * AC5: Language Selection UI - Inline keyboard with Arabic/English buttons
 */

import { LANGUAGE_BUTTONS, BUTTON_LABELS, ACCOUNT_TYPES, CALLBACK_PATTERNS } from "./constants";

/**
 * Telegram inline keyboard button structure
 */
export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

/**
 * Telegram inline keyboard markup structure
 */
export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

/**
 * Get language selection inline keyboard
 * 
 * Creates a 2-button keyboard for language selection during onboarding.
 * Buttons are displayed horizontally (single row).
 * 
 * @returns Inline keyboard markup with Arabic and English buttons
 * 
 * Button Layout: [العربية 🇸🇦] [English 🇬🇧]
 * 
 * Callback Data:
 * - "lang_ar" → Arabic selected
 * - "lang_en" → English selected
 */
export function getLanguageSelectionKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        LANGUAGE_BUTTONS.ARABIC,
        LANGUAGE_BUTTONS.ENGLISH,
      ],
    ],
  };
}

/**
 * Get account type selection keyboard (Story 2.1 - AC13)
 * 
 * Creates a 2x2 grid keyboard for selecting account type during clarification.
 * Used when AI confidence is low or account type is missing.
 * 
 * @param language - User's preferred language
 * @returns Inline keyboard with 4 account type buttons
 * 
 * Button Layout:
 * [🏦 Bank] [💵 Cash]
 * [💳 Credit Card] [📱 Digital Wallet]
 * 
 * Callback Data: "create_account_type_{type}"
 */
export function getAccountTypeSelectionKeyboard(language: "ar" | "en"): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: `${ACCOUNT_TYPES.bank.emoji} ${ACCOUNT_TYPES.bank[language]}`,
          callback_data: `${CALLBACK_PATTERNS.ACCOUNT_TYPE_PREFIX}bank`,
        },
        {
          text: `${ACCOUNT_TYPES.cash.emoji} ${ACCOUNT_TYPES.cash[language]}`,
          callback_data: `${CALLBACK_PATTERNS.ACCOUNT_TYPE_PREFIX}cash`,
        },
      ],
      [
        {
          text: `${ACCOUNT_TYPES.credit_card.emoji} ${ACCOUNT_TYPES.credit_card[language]}`,
          callback_data: `${CALLBACK_PATTERNS.ACCOUNT_TYPE_PREFIX}credit_card`,
        },
        {
          text: `${ACCOUNT_TYPES.digital_wallet.emoji} ${ACCOUNT_TYPES.digital_wallet[language]}`,
          callback_data: `${CALLBACK_PATTERNS.ACCOUNT_TYPE_PREFIX}digital_wallet`,
        },
      ],
    ],
  };
}

/**
 * Get confirmation keyboard (Story 2.1 - AC4)
 * 
 * Creates a horizontal 2-button keyboard for confirming actions.
 * Used for account creation confirmation.
 * 
 * @param messageId - Telegram message ID for callback tracking
 * @param language - User's preferred language
 * @returns Inline keyboard with confirm/cancel buttons
 * 
 * Button Layout: [تأكيد ✅] [إلغاء ❌] (or English equivalents)
 * 
 * Callback Data:
 * - "confirm_account_{messageId}" → Confirm action
 * - "cancel_account_{messageId}" → Cancel action
 */
export function getConfirmationKeyboard(messageId: number, language: "ar" | "en"): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: BUTTON_LABELS.CONFIRM[language],
          callback_data: `${CALLBACK_PATTERNS.CONFIRM_ACCOUNT_PREFIX}${messageId}`,
        },
        {
          text: BUTTON_LABELS.CANCEL[language],
          callback_data: `${CALLBACK_PATTERNS.CANCEL_ACCOUNT_PREFIX}${messageId}`,
        },
      ],
    ],
  };
}

/**
 * Get default account prompt keyboard (Story 2.1 - AC6)
 * 
 * Creates a horizontal 2-button keyboard for setting default account.
 * Used after creating second+ accounts to ask if it should be default.
 * 
 * @param accountId - Account ID to set as default
 * @param language - User's preferred language
 * @returns Inline keyboard with Yes/No buttons
 * 
 * Button Layout: [نعم] [لا] (or English equivalents)
 * 
 * Callback Data:
 * - "set_default_yes_{accountId}" → Set as default
 * - "set_default_no_{accountId}" → Keep current default
 */
export function getDefaultAccountPromptKeyboard(accountId: string, language: "ar" | "en"): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: BUTTON_LABELS.YES[language],
          callback_data: `${CALLBACK_PATTERNS.SET_DEFAULT_YES}${accountId}`,
        },
        {
          text: BUTTON_LABELS.NO[language],
          callback_data: `${CALLBACK_PATTERNS.SET_DEFAULT_NO}${accountId}`,
        },
      ],
    ],
  };
}

/**
 * Get accounts overview quick actions keyboard (Story 2.2 - AC11, Story 2.5)
 * 
 * Creates a 2x2 grid keyboard for common account actions.
 * Used in accounts overview display for quick access to common operations.
 * 
 * @param language - User's preferred language
 * @returns Inline keyboard with Add/Edit/Delete/Refresh buttons
 * 
 * Button Layout: 
 * [➕ إضافة حساب] [✏️ تعديل]
 * [🗑️ حذف] [🔄 تحديث]
 * 
 * Callback Data:
 * - "create_account" → Add new account
 * - "edit_account_select" → Edit existing account
 * - "delete_account_select" → Delete existing account
 * - "refresh_accounts" → Refresh accounts view
 */
export function getAccountsOverviewKeyboard(language: "ar" | "en"): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: language === "ar" ? "➕ إضافة حساب" : "➕ Add Account",
          callback_data: "create_account",
        },
        {
          text: language === "ar" ? "✏️ تعديل" : "✏️ Edit",
          callback_data: "edit_account_select",
        },
      ],
      [
        {
          text: language === "ar" ? "🗑️ حذف" : "🗑️ Delete",
          callback_data: "delete_account_select",
        },
        {
          text: language === "ar" ? "🔄 تحديث" : "🔄 Refresh",
          callback_data: "refresh_accounts",
        },
      ],
    ],
  };
}
