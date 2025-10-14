/**
 * Telegram Send Message Action
 * 
 * Sends messages to users via Telegram Bot API.
 * Supports inline keyboards for interactive buttons.
 * 
 * AC4: Welcome Message Delivery - Sends bilingual welcome with inline keyboard
 * AC5: Language Selection UI - Includes inline keyboard in message
 * AC7: Confirmation Message - Sends language-specific confirmation
 */

import { action } from "../_generated/server";
import { v } from "convex/values";
import type { InlineKeyboardMarkup } from "../lib/keyboards";

/**
 * Get Telegram Bot Token from environment
 */
function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable not set");
  }
  return token;
}

/**
 * Send message to Telegram user
 * 
 * @param chatId - Telegram chat ID (same as user's telegramId for private chats)
 * @param text - Message text to send
 * @param replyMarkup - Optional inline keyboard for interactive buttons
 * 
 * @returns { success: boolean, messageId: number } - Send status and Telegram message ID
 */
export const sendMessage = action({
  args: {
    chatId: v.number(),
    text: v.string(),
    replyMarkup: v.optional(v.any()), // InlineKeyboardMarkup type
    parseMode: v.optional(v.string()), // "Markdown" or "HTML"
  },
  handler: async (_ctx, args) => {
    const { chatId, text, replyMarkup, parseMode } = args;
    const botToken = getBotToken();

    // Build request payload
    const payload: {
      chat_id: number;
      text: string;
      reply_markup?: InlineKeyboardMarkup;
      parse_mode?: string;
    } = {
      chat_id: chatId,
      text,
    };

    // Add inline keyboard if provided (AC5)
    if (replyMarkup) {
      payload.reply_markup = replyMarkup as InlineKeyboardMarkup;
    }

    // Add parse mode if provided (Story 1.4 - Markdown formatting)
    if (parseMode) {
      payload.parse_mode = parseMode;
    }

    // Send message via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    return {
      success: true,
      messageId: data.result.message_id,
      result: data.result,
    };
  },
});

/**
 * Answer callback query (acknowledge button press)
 * 
 * Must be called within 30 seconds of receiving callback_query
 * or Telegram shows error notification to user.
 * 
 * AC6: Callback Query Handling - Acknowledges inline button press
 * 
 * @param callbackQueryId - Callback query ID from button press event
 * @param text - Optional notification text (shown as toast to user)
 * 
 * @returns { success: boolean } - Acknowledgment status
 */
export const answerCallbackQuery = action({
  args: {
    callbackQueryId: v.string(),
    text: v.optional(v.string()),
    showAlert: v.optional(v.boolean()),
  },
  handler: async (_ctx, args) => {
    const { callbackQueryId, text, showAlert } = args;
    const botToken = getBotToken();

    // Build request payload
    const payload: {
      callback_query_id: string;
      text?: string;
      show_alert?: boolean;
    } = {
      callback_query_id: callbackQueryId,
    };

    if (text) {
      payload.text = text;
    }

    if (showAlert) {
      payload.show_alert = showAlert;
    }

    // Answer callback query via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/answerCallbackQuery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    return {
      success: true,
    };
  },
});
