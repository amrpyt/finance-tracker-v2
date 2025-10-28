/**
 * Account Display Formatter
 * 
 * Formats account overview for display with grouping, emojis, and proper formatting.
 * 
 * Story 2.2:
 * AC4: Balance Display - Shows emoji icon, name, balance, currency
 * AC5: Account Grouping - Groups by type with headers
 * AC6: Default Account Indicator - Marks default with ⭐
 * AC9: Empty State - Friendly message for zero accounts
 * AC10: Account Count - Shows total count
 * AC13: Formatting - Clean, readable with spacing and emojis
 * AC14: Account Details - Proper number formatting
 */

import { ACCOUNT_TYPES } from "./constants";
import { calculateTotalBalance, formatBalance } from "./balanceCalculator";

/**
 * Account data structure for formatting
 */
export interface AccountData {
  _id: string;
  name: string;
  type: "bank" | "cash" | "credit_card" | "digital_wallet";
  balance: number;
  currency: string;
  isDefault: boolean;
}

/**
 * Format accounts overview for display
 * 
 * Groups accounts by type, adds emojis and formatting.
 * Shows default account indicator, account count, and totals.
 * 
 * @param accounts - Array of accounts to format
 * @param language - User's preferred language
 * @param primaryCurrency - User's primary currency
 * @returns Formatted message string ready for Telegram
 */
export function formatAccountsOverview(
  accounts: AccountData[],
  language: "ar" | "en",
  primaryCurrency: string = "EGP"
): string {
  // Handle empty state (AC9)
  if (accounts.length === 0) {
    return formatEmptyAccountsState(language);
  }

  // Build header with account count (AC10, AC13)
  const header = language === "ar"
    ? `📊 *حساباتك المالية*\nلديك ${accounts.length} ${accounts.length === 1 ? "حساب" : accounts.length === 2 ? "حسابان" : "حسابات"}\n`
    : `📊 *Your Financial Accounts*\nYou have ${accounts.length} ${accounts.length === 1 ? "account" : "accounts"}\n`;

  let message = header;

  // Group accounts by type (AC5)
  const accountsByType = groupAccountsByType(accounts);

  // Type headers in order
  const typeOrder: Array<"bank" | "cash" | "credit_card" | "digital_wallet"> = [
    "bank",
    "cash",
    "credit_card",
    "digital_wallet",
  ];

  // Format each type group (AC4, AC5, AC6, AC14)
  for (const type of typeOrder) {
    const typeAccounts = accountsByType[type];
    if (!typeAccounts || typeAccounts.length === 0) {
      continue;
    }

    // Add type header
    const typeLabel = ACCOUNT_TYPES[type][language];
    message += `\n*${ACCOUNT_TYPES[type].emoji} ${typeLabel}*\n`;

    // Format each account in this type
    for (const account of typeAccounts) {
      const defaultIndicator = account.isDefault ? "⭐ " : "   ";
      const formattedBalance = formatBalance(account.balance);
      
      message += `${defaultIndicator}${account.name} - ${formattedBalance} ${account.currency}\n`;
    }
  }

  // Calculate and display totals (AC7, AC8)
  const balanceResult = calculateTotalBalance(accounts, primaryCurrency);

  message += "\n";

  if (balanceResult.hasMixedCurrencies) {
    // Show subtotals per currency (AC8)
    const subtotalLabel = language === "ar" ? "*الإجماليات:*" : "*Subtotals:*";
    message += `${subtotalLabel}\n`;

    for (const [currency, total] of Object.entries(balanceResult.totalByCurrency)) {
      const formattedTotal = formatBalance(total);
      message += `   ${formattedTotal} ${currency}\n`;
    }
  } else {
    // Single currency - show simple total (AC7)
    const totalLabel = language === "ar" ? "*المجموع الكلي:*" : "*Total Balance:*";
    const singleCurrency = Object.keys(balanceResult.totalByCurrency)[0];
    const total = balanceResult.totalByCurrency[singleCurrency];
    const formattedTotal = formatBalance(total);
    
    message += `${totalLabel} ${formattedTotal} ${singleCurrency}`;
  }

  return message;
}

/**
 * Format empty accounts state (AC9)
 * 
 * Shows friendly message when user has no accounts.
 * 
 * @param language - User's preferred language
 * @returns Formatted empty state message
 */
export function formatEmptyAccountsState(language: "ar" | "en"): string {
  if (language === "ar") {
    return `📊 *حساباتك المالية*

لا توجد حسابات بعد. 
أنشئ حسابك الأول لبدء تتبع أموالك! 💰

جرب: "أنشئ حساب محفظة برصيد 500 جنيه"`;
  } else {
    return `📊 *Your Financial Accounts*

No accounts yet.
Create your first account to start tracking your money! 💰

Try: "Create cash account with 500 EGP"`;
  }
}

/**
 * Group accounts by type
 * 
 * @param accounts - Array of accounts
 * @returns Object with accounts grouped by type
 */
function groupAccountsByType(
  accounts: AccountData[]
): Record<string, AccountData[]> {
  const grouped: Record<string, AccountData[]> = {
    bank: [],
    cash: [],
    credit_card: [],
    digital_wallet: [],
  };

  for (const account of accounts) {
    grouped[account.type].push(account);
  }

  return grouped;
}
