/**
 * Transaction Formatter Utility
 * 
 * Formats transactions for display with deleted account indicators.
 * 
 * Story 2.5 - Task 8:
 * AC14: Transaction History Access - Shows deleted account indicator
 */

import type { Id } from "../_generated/dataModel";

/**
 * Account data for transaction formatting
 */
interface AccountForTransaction {
  _id: Id<"accounts">;
  name: string;
  type: "bank" | "cash" | "credit_card" | "digital_wallet";
  isDeleted: boolean;
}

/**
 * Format account name for transaction display
 * 
 * Task 8.2-8.3: If account is deleted, append "(محذوف)" or "(Deleted)" indicator
 * 
 * @param account - Account object
 * @param language - User's preferred language
 * @returns Formatted account name with deleted indicator if applicable
 */
export function formatAccountNameForTransaction(
  account: AccountForTransaction,
  language: "ar" | "en"
): string {
  let formattedName = account.name;
  
  // Task 8.2: Check if account is deleted
  if (account.isDeleted) {
    // Task 8.3: Append deleted indicator based on language
    const deletedIndicator = language === "ar" ? "(محذوف)" : "(Deleted)";
    formattedName += ` ${deletedIndicator}`;
  }
  
  return formattedName;
}

/**
 * Format transaction for display
 * 
 * Task 8.4: Ensure transaction history remains fully accessible
 * 
 * @param transaction - Transaction object
 * @param account - Account object (may be deleted)
 * @param language - User's preferred language
 * @returns Formatted transaction string
 */
export function formatTransaction(
  transaction: any,
  account: AccountForTransaction,
  language: "ar" | "en"
): string {
  const accountName = formatAccountNameForTransaction(account, language);
  
  // Format transaction details (placeholder - will be expanded when transactions are implemented)
  const formattedTransaction = language === "ar"
    ? `${accountName}: ${transaction.amount} ${transaction.currency}`
    : `${accountName}: ${transaction.amount} ${transaction.currency}`;
  
  return formattedTransaction;
}
