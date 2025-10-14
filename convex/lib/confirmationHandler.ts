/**
 * Confirmation Workflow Handler
 * 
 * Sends confirmation messages with inline keyboards and stores pending actions.
 * 
 * Story 2.1:
 * AC4: Confirmation Workflow - Shows extracted details with confirm/cancel buttons
 * AC12: Message History - Stores confirmation in messages table
 */

import { api } from "../_generated/api";
import type { CreateAccountEntities } from "../ai/types";
import type { Id } from "../_generated/dataModel";
import { ACCOUNT_MESSAGES } from "./constants";
import { getConfirmationKeyboard } from "./keyboards";

/**
 * Send account creation confirmation message
 * 
 * Generates confirmation message showing extracted entities and sends it
 * with inline keyboard. Stores pending action for callback handling.
 * 
 * @param ctx - Action context for database and Telegram operations
 * @param userId - User ID
 * @param entities - Extracted account creation entities
 * @param language - User's preferred language
 * @param chatId - Telegram chat ID
 * @returns Telegram message ID and pending action ID
 */
export async function sendAccountConfirmation(
  ctx: any,
  {
    userId,
    entities,
    language,
    chatId,
  }: {
    userId: Id<"users">;
    entities: CreateAccountEntities;
    language: "ar" | "en";
    chatId: number;
  }
): Promise<{ messageId: number; pendingId: Id<"pendingActions"> }> {
  // Get user profile for currency default
  const profile = await ctx.runQuery(api.users.getProfile.getProfile, {
    userId,
  });

  // Determine final values with defaults
  const accountType = entities.accountType;
  const balance = entities.initialBalance ?? 0;
  const currency = entities.currency || profile?.currency || "EGP";
  
  // Generate account name if not provided
  let accountName = entities.accountName;
  if (!accountName) {
    const typeNameMap: Record<string, string> = {
      bank: language === "ar" ? "حساب بنكي" : "Bank Account",
      cash: language === "ar" ? "محفظة نقدية" : "Cash Wallet",
      credit_card: language === "ar" ? "بطاقة ائتمان" : "Credit Card",
      digital_wallet: language === "ar" ? "محفظة رقمية" : "Digital Wallet",
    };
    accountName = `${typeNameMap[accountType]} 1`;
  }

  // Create pending action first with temporary messageId
  // We'll update it after sending the message
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  const pendingId = await ctx.runMutation(api.pendingActions.createPending.createPending, {
    userId,
    actionType: "create_account",
    actionData: {
      accountType,
      accountName,
      initialBalance: balance,
      currency,
    },
    messageId: 0, // Temporary, will update after sending
    expiresAt,
  });

  // Generate confirmation message
  const confirmationText = ACCOUNT_MESSAGES.CONFIRMATION[language](
    accountType,
    accountName,
    balance,
    currency
  );

  // Create keyboard using pendingId (converted to string for callback_data)
  const keyboard = {
    inline_keyboard: [
      [
        {
          text: language === "ar" ? "تأكيد ✅" : "Confirm ✅",
          callback_data: `confirm_account_${pendingId}`,
        },
        {
          text: language === "ar" ? "إلغاء ❌" : "Cancel ❌",
          callback_data: `cancel_account_${pendingId}`,
        },
      ],
    ],
  };

  // Send confirmation message with keyboard
  const sentMessage = await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: confirmationText,
    parseMode: "Markdown",
    replyMarkup: keyboard,
  });

  const messageId = sentMessage.messageId;

  // Store confirmation message in history (AC12)
  await ctx.runMutation(api.messages.create.create, {
    userId,
    role: "assistant",
    content: confirmationText,
  });

  return { messageId, pendingId };
}
