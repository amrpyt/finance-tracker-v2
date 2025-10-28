/**
 * Callback Helper Functions
 * 
 * Utility functions for handling Telegram callback queries with better UX.
 * Includes message editing to remove buttons after user interaction.
 */

import { api } from "../_generated/api";
import type { CallbackContext } from "./callbackRegistry";

/**
 * Edit the original callback message to remove buttons
 * 
 * This provides better UX by:
 * - Removing interactive buttons after user clicks
 * - Showing the result in the same message (no clutter)
 * - Preserving conversation context
 * 
 * @param context - Callback context with message info
 * @param newText - New text to show in the message
 * @param parseMode - Optional parse mode ("Markdown" or "HTML")
 */
export async function editCallbackMessage(
  context: CallbackContext,
  newText: string,
  parseMode?: "Markdown" | "HTML"
): Promise<void> {
  const { ctx, chatId, message } = context;

  if (!message?.message_id) {
    console.warn("[CallbackHelpers] No message ID available, sending new message instead");
    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: newText,
      parseMode,
    });
    return;
  }

  try {
    await ctx.runAction(api.telegram.sendMessage.editMessage, {
      chatId,
      messageId: message.message_id,
      text: newText,
      parse_mode: parseMode,
      reply_markup: undefined, // Remove buttons
    });
  } catch (error) {
    console.error("[CallbackHelpers] Error editing message:", error);
    // Fallback: send new message if edit fails
    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: newText,
      parseMode,
    });
  }
}

/**
 * Answer callback query and edit original message
 * 
 * Convenience function that combines:
 * 1. Answering the callback query (required within 30s)
 * 2. Editing the original message to show result
 * 
 * @param context - Callback context
 * @param toastText - Short text shown in toast notification
 * @param newMessageText - New text for the edited message
 * @param parseMode - Optional parse mode
 */
export async function answerAndEdit(
  context: CallbackContext,
  toastText: string,
  newMessageText: string,
  parseMode?: "Markdown" | "HTML"
): Promise<void> {
  const { ctx, callbackQueryId } = context;

  // Answer callback query first (must be within 30s)
  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: toastText,
  });

  // Edit the original message to remove buttons
  await editCallbackMessage(context, newMessageText, parseMode);
}

/**
 * Answer callback query and send new message (keep old message)
 * 
 * Use this when you want to keep the original message with buttons.
 * For example, when showing error messages or additional info.
 * 
 * @param context - Callback context
 * @param toastText - Short text shown in toast notification
 * @param newMessageText - New message to send
 * @param parseMode - Optional parse mode
 */
export async function answerAndSend(
  context: CallbackContext,
  toastText: string,
  newMessageText: string,
  parseMode?: "Markdown" | "HTML"
): Promise<void> {
  const { ctx, chatId, callbackQueryId } = context;

  // Answer callback query
  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: toastText,
  });

  // Send new message
  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: newMessageText,
    parseMode,
  });
}
