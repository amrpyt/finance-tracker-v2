/**
 * Clarification Handler
 * 
 * Handles multi-step clarification flows when AI confidence is low
 * or required entities are missing.
 * 
 * Story 2.1:
 * AC13: Error Handling - Low confidence triggers clarification
 */

import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { ACCOUNT_MESSAGES } from "./constants";
import { getAccountTypeSelectionKeyboard } from "./keyboards";

/**
 * Ask for account type clarification
 * 
 * Sends a message with inline keyboard showing 4 account types.
 * Stores clarification state in pendingActions.
 * 
 * @param ctx - Action context
 * @param userId - User ID
 * @param language - User's preferred language
 * @param chatId - Telegram chat ID
 * @param partialEntities - Any entities already extracted (e.g., balance, currency)
 * @returns Message ID and pending action ID
 */
export async function askAccountTypeSelection(
  ctx: any,
  {
    userId,
    language,
    chatId,
    partialEntities = {},
  }: {
    userId: Id<"users">;
    language: "ar" | "en";
    chatId: number;
    partialEntities?: Record<string, any>;
  }
): Promise<{ messageId: number; pendingId: Id<"pendingActions"> }> {
  // Get account type selection keyboard
  const keyboard = getAccountTypeSelectionKeyboard(language);

  // Get clarification message
  const clarificationText = ACCOUNT_MESSAGES.CLARIFICATION.SELECT_TYPE[language];

  // Send clarification message with keyboard
  const sentMessage = await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: clarificationText,
    replyMarkup: keyboard,
  });

  const messageId = sentMessage.messageId;

  // Store clarification state in pendingActions
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  const pendingId = await ctx.runMutation(api.pendingActions.createPending.createPending, {
    userId,
    actionType: "clarify_account_type",
    actionData: {
      step: "select_type",
      partialEntities,
    },
    messageId,
    expiresAt,
  });

  // Store clarification in message history
  await ctx.runMutation(api.messages.create.create, {
    userId,
    role: "assistant",
    content: clarificationText,
  });

  return { messageId, pendingId };
}

/**
 * Ask for initial balance
 * 
 * After account type is selected, asks for initial balance.
 * 
 * @param ctx - Action context
 * @param userId - User ID
 * @param language - User's preferred language
 * @param chatId - Telegram chat ID
 * @param accountType - Selected account type
 * @returns Pending action ID
 */
export async function askInitialBalance(
  ctx: any,
  {
    userId,
    language,
    chatId,
    accountType,
  }: {
    userId: Id<"users">;
    language: "ar" | "en";
    chatId: number;
    accountType: string;
  }
): Promise<Id<"pendingActions">> {
  // Get balance prompt message
  const balancePrompt = ACCOUNT_MESSAGES.CLARIFICATION.ENTER_BALANCE[language];

  // Send balance prompt
  const sentMessage = await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: balancePrompt,
  });

  const messageId = sentMessage.messageId;

  // Store clarification state for balance input
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  const pendingId = await ctx.runMutation(api.pendingActions.createPending.createPending, {
    userId,
    actionType: "clarify_balance",
    actionData: {
      step: "enter_balance",
      accountType,
    },
    messageId,
    expiresAt,
  });

  // Store prompt in message history
  await ctx.runMutation(api.messages.create.create, {
    userId,
    role: "assistant",
    content: balancePrompt,
  });

  return pendingId;
}

/**
 * Handle low confidence response
 * 
 * When AI confidence is below threshold, asks if user wants to create account.
 * 
 * @param ctx - Action context
 * @param userId - User ID
 * @param language - User's preferred language
 * @param chatId - Telegram chat ID
 */
export async function handleLowConfidence(
  ctx: any,
  {
    userId,
    language,
    chatId,
  }: {
    userId: Id<"users">;
    language: "ar" | "en";
    chatId: number;
  }
): Promise<void> {
  // Send low confidence message
  const lowConfidenceMsg = ACCOUNT_MESSAGES.CLARIFICATION.LOW_CONFIDENCE[language];

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: lowConfidenceMsg,
  });

  // Store in message history
  await ctx.runMutation(api.messages.create.create, {
    userId,
    role: "assistant",
    content: lowConfidenceMsg,
  });
}
