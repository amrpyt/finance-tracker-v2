/**
 * Response Helpers
 * 
 * Utility functions for generating and sending response messages.
 * 
 * Story 2.1:
 * AC7: Success Response - Sends success message with account overview
 * AC12: Message History - Stores all messages
 * 
 * Story 3.1:
 * Task 7: Create Success Response Handler (AC9)
 * Task 15: Create Error Recovery Messages (AC20)
 */

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { ACCOUNT_MESSAGES, ACCOUNT_TYPES } from "./constants";
import { getCategoryEmoji, getCategoryDisplayName, getIncomeCategoryEmoji, getIncomeCategoryDisplayName } from "./categoryMapper";

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
      (acc: any) => acc.currency === primaryCurrency
    );
    
    if (sameCurrencyAccounts.length > 0) {
      const totalBalance = sameCurrencyAccounts.reduce(
        (sum: number, acc: any) => sum + acc.balance,
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

/**
 * Send account update success message with overview
 * 
 * Story 2.3 - Task 10
 * AC12: Success Response - Sends confirmation with updated account details
 * 
 * @param ctx - Action context for database and Telegram operations
 * @param account - Updated account object
 * @param editType - Type of edit performed ("name" or "type")
 * @param oldValue - Old value (name or type)
 * @param newValue - New value (name or type)
 * @param userId - User ID
 * @param language - User's preferred language
 * @param chatId - Telegram chat ID
 */
export async function sendAccountUpdateSuccess(
  ctx: any,
  {
    account,
    editType,
    oldValue,
    newValue,
    userId,
    language,
    chatId,
  }: {
    account: Account;
    editType: "name" | "type";
    oldValue: string;
    newValue: string;
    userId: Id<"users">;
    language: "ar" | "en";
    chatId: number;
  }
): Promise<void> {
  // Generate success message based on edit type
  let successText = language === "ar"
    ? "✅ تم تحديث الحساب بنجاح!\n\n"
    : "✅ Account updated successfully!\n\n";

  // Show what changed
  if (editType === "name") {
    successText += language === "ar"
      ? `📝 الاسم الجديد: *${newValue}*\n`
      : `📝 New name: *${newValue}*\n`;
  } else if (editType === "type") {
    const typeEmoji = ACCOUNT_TYPES[newValue as keyof typeof ACCOUNT_TYPES]?.emoji || "💼";
    const typeLabel = ACCOUNT_TYPES[newValue as keyof typeof ACCOUNT_TYPES]?.[language] || newValue;
    successText += language === "ar"
      ? `🔄 النوع الجديد: ${typeEmoji} ${typeLabel}\n`
      : `🔄 New type: ${typeEmoji} ${typeLabel}\n`;
  }

  // Show current account details (AC12)
  const accountEmoji = ACCOUNT_TYPES[account.type]?.emoji || "💼";
  const accountTypeLabel = ACCOUNT_TYPES[account.type]?.[language] || account.type;
  
  successText += language === "ar"
    ? `🏦 النوع: ${accountTypeLabel}\n` +
      `💰 الرصيد: ${account.balance.toFixed(2)} ${account.currency}\n`
    : `🏦 Type: ${accountTypeLabel}\n` +
      `💰 Balance: ${account.balance.toFixed(2)} ${account.currency}\n`;

  // Query all user accounts for overview (AC12)
  const allAccounts = await ctx.runQuery(api.accounts.list.list, {
    userId,
    includeDeleted: false,
  });

  if (allAccounts.length > 0) {
    // Add accounts overview header
    successText += language === "ar"
      ? "\n\n📊 *جميع حساباتك:*\n"
      : "\n\n📊 *All your accounts:*\n";

    // List each account with emoji and balance
    for (const acc of allAccounts) {
      const emoji = ACCOUNT_TYPES[acc.type as keyof typeof ACCOUNT_TYPES]?.emoji || "💼";
      const defaultMarker = acc.isDefault ? " ⭐" : "";
      successText += `\n${emoji} ${acc.name}${defaultMarker}: ${acc.balance.toFixed(2)} ${acc.currency}`;
    }

    // Calculate and show total balance (only for accounts with same currency)
    const primaryCurrency = account.currency;
    const sameCurrencyAccounts = allAccounts.filter(
      (acc: any) => acc.currency === primaryCurrency
    );
    
    if (sameCurrencyAccounts.length > 0) {
      const totalBalance = sameCurrencyAccounts.reduce(
        (sum: number, acc: any) => sum + acc.balance,
        0
      );
      successText += language === "ar"
        ? `\n\n💵 *المجموع:* ${totalBalance.toFixed(2)} ${primaryCurrency}`
        : `\n\n💵 *Total:* ${totalBalance.toFixed(2)} ${primaryCurrency}`;
    }
  }

  // Send success message
  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: successText,
    parseMode: "Markdown",
  });

  // Store success message in history (AC16)
  await ctx.runMutation(api.messages.create.create, {
    userId,
    role: "assistant",
    content: successText,
  });
}

/**
 * Send set default account success message with overview
 * 
 * Story 2.4 - Task 6
 * AC8: Success Response - Sends confirmation with updated accounts overview
 * 
 * @param ctx - Action context for database and Telegram operations
 * @param newDefault - New default account object
 * @param oldDefault - Old default account object (if exists)
 * @param userId - User ID
 * @param language - User's preferred language
 * @param chatId - Telegram chat ID
 */
export async function sendSetDefaultSuccess(
  ctx: any,
  {
    newDefault,
    oldDefault,
    userId,
    language,
    chatId,
  }: {
    newDefault: Account;
    oldDefault: Account | null;
    userId: Id<"users">;
    language: "ar" | "en";
    chatId: number;
  }
): Promise<void> {
  // Generate success message (AC8)
  let successText = language === "ar"
    ? "✅ تم تعيين الحساب الافتراضي بنجاح!\n\n"
    : "✅ Default account set successfully!\n\n";

  // Show new default account details
  const accountEmoji = ACCOUNT_TYPES[newDefault.type]?.emoji || "💼";
  const accountTypeLabel = ACCOUNT_TYPES[newDefault.type]?.[language] || newDefault.type;
  
  successText += language === "ar"
    ? `⭐ الحساب الافتراضي: *${newDefault.name}*\n` +
      `🏦 النوع: ${accountTypeLabel}\n` +
      `💰 الرصيد: ${newDefault.balance.toFixed(2)} ${newDefault.currency}\n`
    : `⭐ Default account: *${newDefault.name}*\n` +
      `🏦 Type: ${accountTypeLabel}\n` +
      `💰 Balance: ${newDefault.balance.toFixed(2)} ${newDefault.currency}\n`;

  // Query all user accounts for overview (AC8)
  const allAccounts = await ctx.runQuery(api.accounts.list.list, {
    userId,
    includeDeleted: false,
  });

  if (allAccounts.length > 0) {
    // Add accounts overview header
    successText += language === "ar"
      ? "\n\n📊 *جميع حساباتك:*\n"
      : "\n\n📊 *All your accounts:*\n";

    // List each account with emoji, balance, and default indicator
    for (const acc of allAccounts) {
      const emoji = ACCOUNT_TYPES[acc.type as keyof typeof ACCOUNT_TYPES]?.emoji || "💼";
      const defaultMarker = acc.isDefault ? " ⭐" : "";
      successText += `\n${emoji} ${acc.name}${defaultMarker}: ${acc.balance.toFixed(2)} ${acc.currency}`;
    }

    // Calculate and show total balance (only for accounts with same currency)
    const primaryCurrency = newDefault.currency;
    const sameCurrencyAccounts = allAccounts.filter(
      (acc: any) => acc.currency === primaryCurrency
    );
    
    if (sameCurrencyAccounts.length > 0) {
      const totalBalance = sameCurrencyAccounts.reduce(
        (sum: number, acc: any) => sum + acc.balance,
        0
      );
      successText += language === "ar"
        ? `\n\n💵 *المجموع:* ${totalBalance.toFixed(2)} ${primaryCurrency}`
        : `\n\n💵 *Total:* ${totalBalance.toFixed(2)} ${primaryCurrency}`;
    }
  }

  // Send success message
  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: successText,
    parseMode: "Markdown",
  });

  // Store success message in history (AC14)
  await ctx.runMutation(api.messages.create.create, {
    userId,
    role: "assistant",
    content: successText,
  });
}

/**
 * Send account delete success message with overview
 * 
 * Story 2.5 - Task 10:
 * AC11: Success Response - Sends confirmation with deleted account details
 * 
 * @param ctx - Action context for database and Telegram operations
 * @param deletedAccount - Deleted account object
 * @param transactionCount - Number of transactions preserved
 * @param userId - User ID
 * @param language - User's preferred language
 * @param chatId - Telegram chat ID
 */
export async function sendAccountDeleteSuccess(
  ctx: any,
  {
    deletedAccount,
    transactionCount,
    userId,
    language,
    chatId,
  }: {
    deletedAccount: Account;
    transactionCount: number;
    userId: Id<"users">;
    language: "ar" | "en";
    chatId: number;
  }
): Promise<void> {
  // Task 10.3: Format success message in user's language
  let successText = language === "ar"
    ? "✅ تم حذف الحساب بنجاح!\n\n"
    : "✅ Account deleted successfully!\n\n";

  // Show deleted account details
  const accountEmoji = ACCOUNT_TYPES[deletedAccount.type]?.emoji || "💼";
  const accountTypeLabel = ACCOUNT_TYPES[deletedAccount.type]?.[language] || deletedAccount.type;
  
  successText += language === "ar"
    ? `🗑️ الحساب المحذوف: *${deletedAccount.name}* (${accountTypeLabel})\n` +
      `📝 تم الاحتفاظ بسجل ${transactionCount} معاملة للرجوع إليها\n` +
      `💡 الحساب مخفي من القائمة ولكن يمكنك رؤية معاملاته في السجل\n`
    : `🗑️ Deleted Account: *${deletedAccount.name}* (${accountTypeLabel})\n` +
      `📝 Preserved ${transactionCount} transaction${transactionCount !== 1 ? 's' : ''} for reference\n` +
      `💡 Account is hidden from the list but you can view its transactions in history\n`;

  // Task 10.4: Query all remaining active accounts for overview
  const allAccounts = await ctx.runQuery(api.accounts.list.list, {
    userId,
    includeDeleted: false,
  });

  if (allAccounts.length > 0) {
    // Add accounts overview header
    successText += language === "ar"
      ? "\n\n📊 *حساباتك المتبقية:*\n"
      : "\n\n📊 *Your Remaining Accounts:*\n";

    // List each account with emoji and balance
    for (const acc of allAccounts) {
      const emoji = ACCOUNT_TYPES[acc.type as keyof typeof ACCOUNT_TYPES]?.emoji || "💼";
      const defaultMarker = acc.isDefault ? " ⭐" : "";
      successText += `\n${emoji} ${acc.name}${defaultMarker}: ${acc.balance.toFixed(2)} ${acc.currency}`;
    }

    // Calculate and show total balance (only for accounts with same currency)
    const primaryCurrency = deletedAccount.currency;
    const sameCurrencyAccounts = allAccounts.filter(
      (acc: any) => acc.currency === primaryCurrency
    );
    
    if (sameCurrencyAccounts.length > 0) {
      const totalBalance = sameCurrencyAccounts.reduce(
        (sum: number, acc: any) => sum + acc.balance,
        0
      );
      successText += language === "ar"
        ? `\n\n💵 *المجموع:* ${totalBalance.toFixed(2)} ${primaryCurrency}`
        : `\n\n💵 *Total:* ${totalBalance.toFixed(2)} ${primaryCurrency}`;
    }
  } else {
    // No accounts left (shouldn't happen due to validation, but handle gracefully)
    successText += language === "ar"
      ? "\n\n⚠️ لم يتبق لديك حسابات. أنشئ حساباً جديداً للبدء."
      : "\n\n⚠️ You have no accounts left. Create a new account to get started.";
  }

  // Task 10.5: Send success message
  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: successText,
    parseMode: "Markdown",
  });

  // Store success message in history (AC17)
  await ctx.runMutation(api.messages.create.create, {
    userId,
    role: "assistant",
    content: successText,
  });
}

/**
 * Transaction data interface for success messages
 * Story 3.1 - Task 7
 */
interface Transaction {
  _id: Id<"transactions">;
  userId: Id<"users">;
  accountId: Id<"accounts">;
  type: "expense" | "income";
  amount: number;
  category: string;
  description?: string;
  date: number;
  createdAt: number;
}

/**
 * Send expense success message
 * 
 * Story 3.1 - Task 7: Create Success Response Handler (AC9)
 * 
 * Task 7.2: Accept transaction object, account object, language
 * Task 7.3: Format success message in user's language
 * Task 7.4: Add category emoji based on category type
 * Task 7.5: Format balance with proper number formatting
 * Task 7.6: Return formatted message string
 * 
 * AC9: Success Response - Sends confirmation with transaction details and new balance within 2 seconds
 * 
 * @param transaction - Created expense transaction
 * @param account - Account object with updated balance
 * @param newBalance - Updated account balance
 * @param language - User's language (ar or en)
 * @returns Formatted success message
 */
export function sendExpenseSuccess(
  transaction: Transaction,
  account: { name: string; type: string; currency: string },
  newBalance: number,
  language: "ar" | "en"
): string {
  // Task 7.3: Format success message in user's language
  const header = language === "ar"
    ? "✅ *تم تسجيل المصروف*\n\n"
    : "✅ *Expense logged successfully*\n\n";

  // Task 7.4: Add category emoji based on category type
  const categoryEmoji = getCategoryEmoji(transaction.category as any);
  const categoryName = getCategoryDisplayName(transaction.category as any, language);

  // Task 7.5: Format balance with proper number formatting (commas, decimals)
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(transaction.amount);

  const formattedBalance = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(newBalance);

  // Task 7.3: Build success message sections
  let message = header;

  // Amount and category line
  message += `💰 *${formattedAmount} ${account.currency}* - ${categoryEmoji} ${categoryName}\n`;

  // Description line (if provided)
  if (transaction.description) {
    const descLabel = language === "ar" ? "📝" : "📝";
    message += `${descLabel} ${transaction.description}\n`;
  }

  // Account line
  const accountLabel = language === "ar" ? "🏦 الحساب" : "🏦 Account";
  message += `${accountLabel}: ${account.name}\n`;

  // New balance line
  const balanceLabel = language === "ar" ? "💵 الرصيد الحالي" : "💵 Current Balance";
  message += `${balanceLabel}: *${formattedBalance} ${account.currency}*`;

  return message;
}

/**
 * Get expense error message
 * 
 * Story 3.1 - Task 15: Create Error Recovery Messages (AC20)
 * 
 * Task 15.2: Parsing failure message with examples
 * Task 15.3: Invalid amount message
 * Task 15.4: RORK API timeout message
 * Task 15.5: Localize all error messages
 * 
 * AC20: Error Recovery - Shows helpful error messages with examples
 * 
 * @param errorType - Type of error (parsing_failed, invalid_amount, api_timeout)
 * @param language - User's language (ar or en)
 * @returns Localized error message with examples
 */
export function getExpenseErrorMessage(
  errorType: "parsing_failed" | "invalid_amount" | "api_timeout" | "no_accounts",
  language: "ar" | "en"
): string {
  if (errorType === "parsing_failed") {
    // Task 15.2: Parsing failure message with examples
    return language === "ar"
      ? "عفواً، لم أفهم. حاول مرة أخرى مثل:\n• دفعت 50 جنيه على القهوة\n• صرفت 100 على المواصلات\n• اشتريت دواء ب 80 جنيه"
      : "Sorry, I didn't understand. Try again like:\n• spent 20 on coffee\n• paid 50 for lunch\n• bought medicine for 30";
  }

  if (errorType === "invalid_amount") {
    // Task 15.3: Invalid amount message
    return language === "ar"
      ? "⚠️ المبلغ غير صحيح. يجب أن يكون أكبر من صفر"
      : "⚠️ Invalid amount. Must be greater than zero";
  }

  if (errorType === "api_timeout") {
    // Task 15.4: RORK API timeout message
    return language === "ar"
      ? "⏱️ حدث تأخير. حاول مرة أخرى"
      : "⏱️ Request timed out. Please try again";
  }

  if (errorType === "no_accounts") {
    return language === "ar"
      ? "❌ ليس لديك حسابات. أنشئ حساباً أولاً لتسجيل المصروفات"
      : "❌ You don't have any accounts. Create an account first to log expenses";
  }

  // Default error message
  return language === "ar"
    ? "❌ حدث خطأ. حاول مرة أخرى"
    : "❌ An error occurred. Please try again";
}

/**
 * Send income success message
 * 
 * Story 3.2 - Task 7: Create Income Success Response Handler (AC9, AC10)
 * 
 * Task 7.2: Accept transaction object, account object, language as parameters
 * Task 7.3: Format success message in user's language
 * Task 7.4: Add income category emoji based on category type (💼, 💻, 🏢, 📈, 🎁)
 * Task 7.5: Use income emoji 💰 (not expense emoji 💸)
 * Task 7.6: Format balance with proper number formatting (commas, decimals)
 * Task 7.7: Return formatted message string
 * 
 * AC9: Success Response - Sends confirmation within 2 seconds of confirmation
 * AC10: Income-Specific Emoji - Uses income emoji (💰) instead of expense emoji (💸)
 * 
 * @param transaction - Created income transaction
 * @param account - Account object with updated balance
 * @param newBalance - Updated account balance
 * @param language - User's language (ar or en)
 * @returns Formatted success message
 */
export function sendIncomeSuccess(
  transaction: Transaction,
  account: { name: string; type: string; currency: string },
  newBalance: number,
  language: "ar" | "en"
): string {
  // Task 7.3: Format success message in user's language
  const header = language === "ar"
    ? "✅ *تم تسجيل الدخل*\n\n"
    : "✅ *Income logged successfully*\n\n";

  // Task 7.4: Add income category emoji based on category type (💼, 💻, 🏢, 📈, 🎁, 💰)
  const categoryEmoji = getIncomeCategoryEmoji(transaction.category as any);
  const categoryName = getIncomeCategoryDisplayName(transaction.category as any, language);

  // Task 7.6: Format balance with proper number formatting (commas, decimals)
  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(transaction.amount);

  const formattedBalance = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(newBalance);

  // Task 7.3: Build success message sections
  // Task 7.5: Use income emoji 💰 (not expense emoji 💸)
  let message = header;

  // Amount and category line (AC10: Income emoji 💰)
  message += `💰 *${formattedAmount} ${account.currency}* - ${categoryEmoji} ${categoryName}\n`;

  // Description line (if provided)
  if (transaction.description) {
    const descLabel = language === "ar" ? "📝" : "📝";
    message += `${descLabel} ${transaction.description}\n`;
  }

  // Account line
  const accountLabel = language === "ar" ? "🏦 الحساب" : "🏦 Account";
  message += `${accountLabel}: ${account.name}\n`;

  // New balance line
  const balanceLabel = language === "ar" ? "💵 الرصيد الحالي" : "💵 Current Balance";
  message += `${balanceLabel}: *${formattedBalance} ${account.currency}*`;

  return message;
}

/**
 * Get income error message
 * 
 * Story 3.2 - Task 13: Create Income Error Recovery Messages (AC20)
 * 
 * Task 13.2: Parsing failure message with income examples
 * Task 13.3: Invalid amount message
 * Task 13.4: RORK API timeout message
 * Task 13.5: Localize all error messages for both Arabic and English
 * 
 * AC20: Error Recovery - Shows helpful error messages with income examples
 * 
 * @param errorType - Type of error (parsing_failed, invalid_amount, api_timeout, no_accounts)
 * @param language - User's language (ar or en)
 * @returns Localized error message with income examples
 */
export function getIncomeErrorMessage(
  errorType: "parsing_failed" | "invalid_amount" | "api_timeout" | "no_accounts",
  language: "ar" | "en"
): string {
  if (errorType === "parsing_failed") {
    // Task 13.2: Parsing failure message with income examples
    return language === "ar"
      ? "عفواً، لم أفهم. حاول مرة أخرى مثل:\n• استلمت راتب 5000 جنيه\n• حصلت على 200 من عمل حر\n• جاني 1000 من مشروع"
      : "Sorry, I didn't understand. Try again like:\n• received 500 freelance payment\n• got paid 1000 salary\n• earned 200 from business";
  }

  if (errorType === "invalid_amount") {
    // Task 13.3: Invalid amount message
    return language === "ar"
      ? "⚠️ المبلغ غير صحيح. يجب أن يكون أكبر من صفر"
      : "⚠️ Invalid amount. Must be greater than zero";
  }

  if (errorType === "api_timeout") {
    // Task 13.4: RORK API timeout message
    return language === "ar"
      ? "⏱️ حدث تأخير. حاول مرة أخرى"
      : "⏱️ Request timed out. Please try again";
  }

  if (errorType === "no_accounts") {
    return language === "ar"
      ? "❌ ليس لديك حسابات. أنشئ حساباً أولاً لتسجيل الدخل"
      : "❌ You don't have any accounts. Create an account first to log income";
  }

  // Default error message
  return language === "ar"
    ? "❌ حدث خطأ. حاول مرة أخرى"
    : "❌ An error occurred. Please try again";
}
