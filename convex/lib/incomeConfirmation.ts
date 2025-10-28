/**
 * Income Confirmation Builder
 * 
 * Story 3.2: AI Income Logging
 * Task 5: Create Income Confirmation Builder (AC: #7, #10)
 * 
 * Builds formatted confirmation messages for income logging
 * with inline keyboard for user confirmation.
 */

import type { InlineKeyboardMarkup } from "./keyboards";
import { getIncomeCategoryDisplayName, getIncomeCategoryEmoji } from "./categoryMapper";
import { formatDate } from "./dateParser";

/**
 * Income confirmation data
 * Task 5.2: Accept extracted entities and language
 */
export interface IncomeConfirmationData {
  amount: number;
  category: string; // IncomeCategory type
  description?: string;
  accountName: string;
  accountType: string;
  currency: string;
  date: number; // Unix timestamp
}

/**
 * Income confirmation result
 */
export interface IncomeConfirmationResult {
  message: string;
  keyboard: InlineKeyboardMarkup;
}

/**
 * Build income confirmation message
 * 
 * Task 5.3: Format confirmation message in user's language
 * Task 5.4: Add income category emoji mapping (salary: 💼, freelance: 💻, business: 🏢, investment: 📈, gift: 🎁)
 * Task 5.5: Create inline keyboard [نعم ✅] [إلغاء ❌] (no Edit button per Story 3.1 lesson)
 * 
 * AC7: Confirmation Workflow - Display extracted details for verification
 * AC10: Income-Specific Emoji - Uses income emoji (💰) instead of expense emoji (💸)
 * 
 * @param data - Income confirmation data
 * @param language - User's language (ar or en)
 * @param confirmationId - Unique ID for this confirmation
 * @returns Formatted message and keyboard
 */
export function buildIncomeConfirmation(
  data: IncomeConfirmationData,
  language: "ar" | "en",
  confirmationId: string
): IncomeConfirmationResult {
  // Task 5.3: Format confirmation message in user's language
  const header = language === "ar"
    ? "📝 *هل هذا صحيح؟*\n\n"
    : "📝 *Is this correct?*\n\n";

  // Task 5.4: Add income category emoji (💼, 💻, 🏢, 📈, 🎁, 💰)
  const categoryEmoji = getIncomeCategoryEmoji(data.category as any);
  const categoryName = getIncomeCategoryDisplayName(data.category as any, language);

  // Format amount with proper number formatting
  const formattedAmount = formatAmount(data.amount, data.currency);

  // Format date (Task 5.3)
  const formattedDate = formatDate(data.date, language);

  // Build message sections (Task 5.3)
  // AC10: Use income emoji 💰 instead of expense emoji 💸
  let message = header;

  // Amount line (AC10: Income emoji 💰)
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

  // Task 5.5: Create inline keyboard [نعم ✅] [إلغاء ❌]
  // No Edit button per Story 3.1 lesson - better UX to cancel and re-enter
  const keyboard = createConfirmationKeyboard(language, confirmationId);

  return {
    message,
    keyboard,
  };
}

/**
 * Create confirmation keyboard
 * 
 * Task 5.5: Create inline keyboard [نعم ✅] [إلغاء ❌] (no Edit button)
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

  // Simplified 2-button workflow per Story 3.1 lesson
  return {
    inline_keyboard: [
      [
        {
          text: confirmText,
          callback_data: `confirm_income_${confirmationId}`,
        },
        {
          text: cancelText,
          callback_data: `cancel_income_${confirmationId}`,
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
