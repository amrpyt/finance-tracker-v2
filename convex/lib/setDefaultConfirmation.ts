/**
 * Set Default Account Confirmation Workflow
 * 
 * Sends confirmation message before changing default account.
 * 
 * Story 2.4:
 * AC5: Confirmation Workflow - Shows current and new default before changing
 * AC18: Cancel Anytime - Includes cancel button
 */

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

/**
 * Send set default account confirmation message
 * 
 * Shows current default (if exists) and new default account for confirmation.
 * 
 * @param ctx - Action context for database and Telegram operations
 * @param userId - User ID
 * @param accountId - Account ID to set as default
 * @param language - User's preferred language
 * @param chatId - Telegram chat ID
 * @returns Telegram message ID
 */
export async function sendSetDefaultConfirmation(
  ctx: any,
  {
    userId,
    accountId,
    language,
    chatId,
  }: {
    userId: Id<"users">;
    accountId: Id<"accounts">;
    language: "ar" | "en";
    chatId: number;
  }
): Promise<{ messageId: number }> {
  // Fetch the account to set as default
  const newDefaultAccount = await ctx.runQuery(api.accounts.getById.getById, {
    accountId,
  });

  if (!newDefaultAccount) {
    throw new Error("Account not found");
  }

  // Fetch current default account (if exists)
  const currentDefault = await ctx.runQuery(api.accounts.getDefault.getDefault, {
    userId,
  });

  // Build confirmation message
  let confirmationText: string;

  if (language === "ar") {
    if (currentDefault) {
      confirmationText = `⚠️ *تأكيد تغيير الحساب الافتراضي*\n\n`;
      confirmationText += `الحساب الافتراضي الحالي: ${currentDefault.name} (${formatAccountType(currentDefault.type, language)})\n`;
      confirmationText += `الحساب الافتراضي الجديد: ${newDefaultAccount.name} (${formatAccountType(newDefaultAccount.type, language)})\n\n`;
      confirmationText += `هل تريد تأكيد التغيير؟`;
    } else {
      confirmationText = `⚠️ *تعيين الحساب الافتراضي*\n\n`;
      confirmationText += `الحساب الافتراضي الجديد: ${newDefaultAccount.name} (${formatAccountType(newDefaultAccount.type, language)})\n`;
      confirmationText += `الرصيد: ${formatBalance(newDefaultAccount.balance)} ${newDefaultAccount.currency}\n\n`;
      confirmationText += `هل تريد تأكيد التعيين؟`;
    }
  } else {
    if (currentDefault) {
      confirmationText = `⚠️ *Confirm Default Account Change*\n\n`;
      confirmationText += `Current default account: ${currentDefault.name} (${formatAccountType(currentDefault.type, language)})\n`;
      confirmationText += `New default account: ${newDefaultAccount.name} (${formatAccountType(newDefaultAccount.type, language)})\n\n`;
      confirmationText += `Do you want to confirm this change?`;
    } else {
      confirmationText = `⚠️ *Set Default Account*\n\n`;
      confirmationText += `New default account: ${newDefaultAccount.name} (${formatAccountType(newDefaultAccount.type, language)})\n`;
      confirmationText += `Balance: ${formatBalance(newDefaultAccount.balance)} ${newDefaultAccount.currency}\n\n`;
      confirmationText += `Do you want to confirm?`;
    }
  }

  // Create confirmation keyboard
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: language === "ar" ? "تأكيد ✅" : "Confirm ✅",
          callback_data: `confirm_set_default_${accountId}`,
        },
        {
          text: language === "ar" ? "إلغاء ❌" : "Cancel ❌",
          callback_data: `cancel_set_default`,
        },
      ],
    ],
  };

  // Send confirmation message
  const sentMessage = await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: confirmationText,
    parseMode: "Markdown",
    replyMarkup: keyboard,
  });

  // Store confirmation message in history
  await ctx.runMutation(api.messages.create.create, {
    userId,
    role: "assistant",
    content: confirmationText,
  });

  return { messageId: sentMessage.messageId };
}

/**
 * Format account type for display
 */
function formatAccountType(
  type: "bank" | "cash" | "credit_card" | "digital_wallet",
  language: "ar" | "en"
): string {
  const typeMap: Record<string, { ar: string; en: string }> = {
    bank: { ar: "بنك", en: "Bank" },
    cash: { ar: "نقدي", en: "Cash" },
    credit_card: { ar: "بطاقة ائتمان", en: "Credit Card" },
    digital_wallet: { ar: "محفظة رقمية", en: "Digital Wallet" },
  };

  return typeMap[type][language];
}

/**
 * Format balance for display
 */
function formatBalance(balance: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);
}
