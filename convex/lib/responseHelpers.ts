/**
 * Response Helpers
 * 
 * Utility functions for generating and sending response messages.
 * 
 * Story 2.1:
 * AC7: Success Response - Sends success message with account overview
 * AC12: Message History - Stores all messages
 */

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { ACCOUNT_MESSAGES, ACCOUNT_TYPES } from "./constants";

/**
 * Account data interface
 */
interface Account {
  _id: Id<"accounts">;
  userId: Id<"users">;
  name: string;
  type: "bank" | "cash" | "credit_card" | "digital_wallet";
  balance: number;
  currency: string;
  isDefault: boolean;
  isDeleted: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Send account creation success message with overview
 * 
 * Generates success message for newly created account and appends
 * overview of all user accounts with total balance.
 * 
 * @param ctx - Action context for database and Telegram operations
 * @param account - Newly created account object
 * @param userId - User ID
 * @param language - User's preferred language
 * @param chatId - Telegram chat ID
 */
export async function sendAccountSuccessMessage(
  ctx: any,
  {
    account,
    userId,
    language,
    chatId,
  }: {
    account: Account;
    userId: Id<"users">;
    language: "ar" | "en";
    chatId: number;
  }
): Promise<void> {
  // Generate success message
  let successText = ACCOUNT_MESSAGES.SUCCESS[language](
    account.type,
    account.name,
    account.balance,
    account.currency
  );

  // Query all user accounts for overview (AC7)
  const allAccounts = await ctx.runQuery(api.accounts.list.list, {
    userId,
    includeDeleted: false,
  });

  if (allAccounts.length > 0) {
    // Add accounts overview header
    successText += ACCOUNT_MESSAGES.OVERVIEW_HEADER[language];

    // List each account with emoji and balance
    for (const acc of allAccounts) {
      const emoji = ACCOUNT_TYPES[acc.type as keyof typeof ACCOUNT_TYPES]?.emoji || "💼";
      const defaultMarker = acc.isDefault ? " ⭐" : "";
      successText += `\n${emoji} ${acc.name}${defaultMarker}: ${acc.balance} ${acc.currency}`;
    }

    // Calculate and show total balance (only for accounts with same currency)
    const primaryCurrency = account.currency;
    const sameCurrencyAccounts = allAccounts.filter(
      (acc) => acc.currency === primaryCurrency
    );
    
    if (sameCurrencyAccounts.length > 0) {
      const totalBalance = sameCurrencyAccounts.reduce(
        (sum, acc) => sum + acc.balance,
        0
      );
      successText += ACCOUNT_MESSAGES.OVERVIEW_TOTAL[language](
        totalBalance,
        primaryCurrency
      );
    }
  }

  // Send success message
  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: successText,
    parseMode: "Markdown",
  });

  // Store success message in history (AC12)
  await ctx.runMutation(api.messages.create.create, {
    userId,
    role: "assistant",
    content: successText,
  });
}
