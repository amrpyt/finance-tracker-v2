/**
 * Account Selector Utility
 * 
 * Handles account selection flow for various operations.
 * Creates numbered list with inline keyboard for multi-account scenarios.
 * 
 * Story 2.3 - Task 2: Edit account selection
 * Story 2.4 - Task 4: Set default account selection  
 * Story 2.5 - Task 11: Delete account selection
 * Story 3.1 - Task 4: Expense account selection
 * 
 * AC2: Account Selection - Displays numbered list for multiple accounts
 * AC20: Cancel Anytime - Includes cancel button
 */

import type { Id } from "../_generated/dataModel";
import { ACCOUNT_TYPES } from "./constants";
import type { InlineKeyboardMarkup } from "./keyboards";

/**
 * Account data for selection
 */
export interface SelectableAccount {
  _id: Id<"accounts">;
  name: string;
  type: "bank" | "cash" | "credit_card" | "digital_wallet";
  balance: number;
  currency: string;
  isDefault?: boolean; // Story 2.4: Default account indicator
  transactionCount?: number; // Story 2.5: Transaction count for delete action
}

/**
 * Account selection result
 */
export interface AccountSelectionResult {
  message: string;
  keyboard: InlineKeyboardMarkup;
  shouldAutoSelect: boolean;
  selectedAccountId?: Id<"accounts">;
}

/**
 * Create account selection UI for various operations
 * 
 * @param accounts - List of user's accounts
 * @param language - User's preferred language
 * @param action - Action type (e.g., "edit", "delete", "set_default", "expense")
 * @param confirmationId - Optional confirmation ID for expense logging (Task 4.8)
 * @returns Selection message and keyboard, or auto-selection if single account
 */
export function createAccountSelection(
  accounts: SelectableAccount[],
  language: "ar" | "en",
  action: "edit" | "delete" | "set_default" | "expense" | "income" = "edit",
  confirmationId?: string
): AccountSelectionResult {
  // AC2: Zero accounts - error state
  if (accounts.length === 0) {
    let errorMsg: string;
    if (action === "set_default") {
      errorMsg = language === "ar"
        ? "❌ ليس لديك حسابات. أنشئ حساب أولاً"
        : "❌ You don't have any accounts. Create an account first";
    } else if (action === "delete") {
      errorMsg = language === "ar"
        ? "❌ ليس لديك حسابات لحذفها"
        : "❌ You don't have any accounts to delete";
    } else if (action === "expense") {
      // Story 3.1 - Task 4.5: AC5, AC18
      errorMsg = language === "ar"
        ? "❌ ليس لديك حسابات. أنشئ حساب أولاً لتسجيل المصروفات"
        : "❌ You don't have any accounts. Create an account first to log expenses";
    } else if (action === "income") {
      // Story 3.2 - Task 4.5: AC5, AC18
      errorMsg = language === "ar"
        ? "❌ ليس لديك حسابات. أنشئ حساب أولاً لتسجيل الدخل"
        : "❌ You don't have any accounts. Create an account first to log income";
    } else {
      errorMsg = language === "ar"
        ? "❌ ليس لديك حسابات لتعديلها"
        : "❌ You don't have any accounts to edit";
    }
    
    return {
      message: errorMsg,
      keyboard: { inline_keyboard: [] },
      shouldAutoSelect: false,
    };
  }

  // AC2: Single account - auto-select and skip selection
  if (accounts.length === 1) {
    return {
      message: "",
      keyboard: { inline_keyboard: [] },
      shouldAutoSelect: true,
      selectedAccountId: accounts[0]._id,
    };
  }

  // AC2: Multiple accounts - show numbered selection list
  let header: string;
  if (action === "set_default") {
    header = language === "ar"
      ? `📋 *اختر الحساب لجعله افتراضي:*\n\n`
      : `📋 *Select account to set as default:*\n\n`;
  } else if (action === "delete") {
    header = language === "ar"
      ? `📋 *اختر الحساب للحذف:*\n\n⚠️ سيتم إخفاء الحساب مع الاحتفاظ بسجل المعاملات\n\n`
      : `📋 *Select account to delete:*\n\n⚠️ Account will be hidden while preserving transaction history\n\n`;
  } else if (action === "expense") {
    // Story 3.1 - Task 4.6: AC5, AC18 - Account selection menu
    header = language === "ar"
      ? `💳 *اختر الحساب لتسجيل المصروف:*\n\n`
      : `💳 *Select account for this expense:*\n\n`;
  } else if (action === "income") {
    // Story 3.2 - Task 4.6: AC5, AC18 - Account selection menu
    header = language === "ar"
      ? `💰 *اختر الحساب لتسجيل الدخل:*\n\n`
      : `💰 *Select account for this income:*\n\n`;
  } else {
    header = language === "ar"
      ? `📋 *اختر الحساب للتعديل:*\n\n`
      : `📋 *Select account to edit:*\n\n`;
  }

  let message = header;

  // Build numbered list with account details
  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];

  accounts.forEach((account, index) => {
    const emoji = ACCOUNT_TYPES[account.type].emoji;
    const typeLabel = ACCOUNT_TYPES[account.type][language];
    const balanceStr = formatBalance(account.balance, account.currency);
    const defaultIndicator = account.isDefault ? " ⭐" : ""; // Story 2.4: AC6

    // Add to message
    message += `${index + 1}. ${emoji} *${account.name}${defaultIndicator}*\n`;
    message += `   ${typeLabel} • ${balanceStr}`;
    
    // Task 2.6: For delete action, show transaction count (AC2, AC7)
    if (action === "delete" && account.transactionCount !== undefined) {
      const txLabel = language === "ar" ? "معاملة" : "transaction";
      const txLabelPlural = language === "ar" ? "معاملات" : "transactions";
      const txCountLabel = account.transactionCount === 1 ? txLabel : txLabelPlural;
      message += ` • ${account.transactionCount} ${txCountLabel}`;
    }
    
    message += `\n\n`;

    // Add button for this account
    let callbackPrefix: string;
    let callbackData: string;
    
    if (action === "set_default") {
      callbackPrefix = "select_account_default";
      callbackData = `${callbackPrefix}_${account._id}`;
    } else if (action === "delete") {
      callbackPrefix = "select_account_delete";
      callbackData = `${callbackPrefix}_${account._id}`;
    } else if (action === "expense") {
      // Story 3.1 - Task 4.7-4.8: AC18 - Expense account selection with confirmation ID
      callbackPrefix = "select_account_expense";
      callbackData = confirmationId 
        ? `${callbackPrefix}_${account._id}_${confirmationId}`
        : `${callbackPrefix}_${account._id}`;
    } else if (action === "income") {
      // Story 3.2 - Task 4.7-4.8: AC18 - Income account selection with confirmation ID
      callbackPrefix = "select_account_income";
      callbackData = confirmationId 
        ? `${callbackPrefix}_${account._id}_${confirmationId}`
        : `${callbackPrefix}_${account._id}`;
    } else {
      callbackPrefix = "select_account_edit";
      callbackData = `${callbackPrefix}_${account._id}`;
    }
    
    buttons.push([
      {
        text: `${index + 1}️⃣ ${account.name}${defaultIndicator}`,
        callback_data: callbackData,
      },
    ]);
  });

  // AC20: Add cancel button
  let cancelCallback: string;
  if (action === "set_default") {
    cancelCallback = "cancel_set_default";
  } else if (action === "delete") {
    cancelCallback = "cancel_delete";
  } else if (action === "expense") {
    // Story 3.1 - Task 4.7: Cancel expense logging
    cancelCallback = confirmationId 
      ? `cancel_expense_${confirmationId}`
      : "cancel_expense";
  } else {
    cancelCallback = "cancel_edit";
  }
  
  buttons.push([
    {
      text: language === "ar" ? "❌ إلغاء" : "❌ Cancel",
      callback_data: cancelCallback,
    },
  ]);

  return {
    message,
    keyboard: { inline_keyboard: buttons },
    shouldAutoSelect: false,
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
