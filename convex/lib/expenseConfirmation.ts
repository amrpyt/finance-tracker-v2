/**
 * Expense Confirmation Builder
 * 
 * Story 3.1: AI Expense Logging
 * Task 5: Create Expense Confirmation Builder (AC: #7, #10)
 * 
 * Builds formatted confirmation messages for expense logging
 * with inline keyboard for user confirmation.
 */

import type { Id } from "../_generated/dataModel";
import type { InlineKeyboardMarkup } from "./keyboards";
import { getCategoryDisplayName, getCategoryEmoji } from "./categoryMapper";
import { formatDate } from "./dateParser";

/**
 * Expense confirmation data
 * Task 5.2: Accept extracted entities and language
 */
export interface ExpenseConfirmationData {
  amount: number;
  category: string; // ExpenseCategory type
  description?: string;
  accountName: string;
  accountType: string;
  currency: string;
  date: number; // Unix timestamp
}

/**
 * Expense confirmation result
 */
export interface ExpenseConfirmationResult {
  message: string;
  keyboard: InlineKeyboardMarkup;
}

/**
 * Build expense confirmation message
 * 
 * Task 5.3: Format confirmation message in user's language
 * Task 5.4: Add category emoji mapping
 * Task 5.5: Create inline keyboard
 * 
 * AC7: Confirmation Workflow - Display extracted details for verification
 * 
 * @param data - Expense confirmation data
 * @param language - User's language (ar or en)
 * @param confirmationId - Unique ID for this confirmation
 * @returns Formatted message and keyboard
 */
export function buildExpenseConfirmation(
  data: ExpenseConfirmationData,
  language: "ar" | "en",
  confirmationId: string
): ExpenseConfirmationResult {
  // Task 5.3: Format confirmation message in user's language
  const header = language === "ar"
    ? "📝 *هل هذا صحيح؟*\n\n"
    : "📝 *Is this correct?*\n\n";

  // Task 5.4: Add category emoji
  const categoryEmoji = getCategoryEmoji(data.category as any);
  const categoryName = getCategoryDisplayName(data.category as any, language);

  // Format amount with proper number formatting
  const formattedAmount = formatAmount(data.amount, data.currency);

  // Format date (Task 5.3)
  const formattedDate = formatDate(data.date, language);

  // Build message sections (Task 5.3)
  let message = header;

  // Amount line
  const amountLabel = language === "ar" ? "💰 المبلغ" : "💰 Amount";
  message += `${amountLabel}: *${formattedAmount}*\n`;

  // Category line
  const categoryLabel = language === "ar" ? "📁 الفئة" : "📁 Category";
  message += `${categoryLabel}: ${categoryEmoji} ${categoryName}\n`;

  // Description line (if provided)
  if (data.description && data.description.trim().length > 0) {
    const descLabel = language === "ar" ? "📝 الوصف" : "📝 Description";
    message += `${descLabel}: ${data.description}\n`;
  }

  // Account line
  const accountLabel = language === "ar" ? "🏦 الحساب" : "🏦 Account";
  message += `${accountLabel}: ${data.accountName}\n`;

  // Date line
  const dateLabel = language === "ar" ? "📅 التاريخ" : "📅 Date";
  message += `${dateLabel}: ${formattedDate}\n`;

  // Task 5.5: Create inline keyboard with confirm, edit, cancel buttons
  const keyboard = createConfirmationKeyboard(language, confirmationId);

  return {
    message,
    keyboard,
  };
}

/**
 * Create confirmation keyboard
 * 
 * Task 5.5: Create inline keyboard [نعم ✅] [تعديل ✏️] [إلغاء ❌]
 * 
 * @param language - User's language
 * @param confirmationId - Unique ID for this confirmation
 * @returns Inline keyboard markup
 */
function createConfirmationKeyboard(
  language: "ar" | "en",
  confirmationId: string
): InlineKeyboardMarkup {
  const confirmText = language === "ar" ? "نعم ✅" : "Yes ✅";
  const cancelText = language === "ar" ? "إلغاء ❌" : "Cancel ❌";

  // Task 8: Edit Flow temporarily disabled to avoid UX confusion
  // Users can cancel and re-enter with correct values if needed
  return {
    inline_keyboard: [
      [
        {
          text: confirmText,
          callback_data: `confirm_expense_${confirmationId}`,
        },
        {
          text: cancelText,
          callback_data: `cancel_expense_${confirmationId}`,
        },
      ],
    ],
  };
}

/**
 * Format amount with proper number formatting
 * 
 * @param amount - Amount number
 * @param currency - Currency code
 * @returns Formatted amount string
 */
function formatAmount(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${formatted} ${currency}`;
}

/**
 * Build edit options menu
 * 
 * Task 8.2: Show edit options menu
 * AC10: Edit Flow - Allow editing extracted fields
 * 
 * @param language - User's language
 * @param confirmationId - Unique ID for this confirmation
 * @returns Edit options message and keyboard
 */
export function buildEditOptionsMenu(
  language: "ar" | "en",
  confirmationId: string
): ExpenseConfirmationResult {
  // Task 8.2: Format edit options message
  const header = language === "ar"
    ? "✏️ *ماذا تريد تعديل؟*\n\n"
    : "✏️ *What would you like to edit?*\n\n";

  const amountOption = language === "ar" ? "1️⃣ المبلغ" : "1️⃣ Amount";
  const categoryOption = language === "ar" ? "2️⃣ الفئة" : "2️⃣ Category";
  const descOption = language === "ar" ? "3️⃣ الوصف" : "3️⃣ Description";
  const accountOption = language === "ar" ? "4️⃣ الحساب" : "4️⃣ Account";

  const message = `${header}${amountOption}\n${categoryOption}\n${descOption}\n${accountOption}`;

  // Create keyboard with edit options
  const keyboard: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: amountOption,
          callback_data: `edit_expense_amount_${confirmationId}`,
        },
      ],
      [
        {
          text: categoryOption,
          callback_data: `edit_expense_category_${confirmationId}`,
        },
      ],
      [
        {
          text: descOption,
          callback_data: `edit_expense_description_${confirmationId}`,
        },
      ],
      [
        {
          text: accountOption,
          callback_data: `edit_expense_account_${confirmationId}`,
        },
      ],
      [
        {
          text: language === "ar" ? "« رجوع" : "« Back",
          callback_data: `back_to_confirmation_${confirmationId}`,
        },
      ],
    ],
  };

  return {
    message,
    keyboard,
  };
}
