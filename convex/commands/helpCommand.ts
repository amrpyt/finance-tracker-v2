/**
 * /help Command Handler
 * 
 * Provides comprehensive help guidance in user's preferred language.
 * 
 * Story 1.4:
 * AC1: Help Command Recognition
 * AC2: User Authentication & Language Retrieval
 * AC3: Bilingual Help Content
 * AC6: Response Time (< 1 second)
 * AC8: Message History Logging
 * AC9: Returning User Support
 */

import pino from "pino";
import { api } from "../_generated/api";
import type { CommandHandler, CommandHandlerContext } from "./types";
import type { ExtractedUserData } from "../telegram/types";
import { MESSAGES } from "../lib/constants";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Help Command Handler
 * Delivers help content in user's preferred language
 */
export class HelpCommandHandler implements CommandHandler {
  async execute(
    ctx: CommandHandlerContext,
    userData: ExtractedUserData,
    chatId: number,
    _messageText: string
  ): Promise<void> {
    const { telegramId } = userData;

    // Query existing user (AC2)
    const existingUser = await ctx.runQuery(api.users.getByTelegramId.getByTelegramId, {
      telegramId: String(telegramId),
    });

    if (!existingUser) {
      // User not found - shouldn't happen, but handle gracefully (AC10)
      logger.warn({ telegramId }, "User not found for /help command");

      // Send help in default language (Arabic)
      const helpMessage = MESSAGES.HELP.ar;
      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: helpMessage,
        parseMode: "Markdown",
      });

      return;
    }

    const userId = existingUser._id;

    // Get user profile for language preference (AC2)
    const profile = await ctx.runQuery(api.users.getProfile.getProfile, {
      userId,
    });

    const language: "ar" | "en" = profile?.language || "ar";

    // Generate help message in user's language (AC3, AC4, AC5)
    const helpMessage = MESSAGES.HELP[language];

    // Send help message (AC6 - target < 1 second)
    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: helpMessage,
      parseMode: "Markdown",
    });

    // Store /help command in message history (AC8)
    await ctx.runMutation(api.messages.create.create, {
      userId,
      role: "user",
      content: "/help",
    });

    // Store help response in message history (AC8)
    await ctx.runMutation(api.messages.create.create, {
      userId,
      role: "assistant",
      content: helpMessage,
    });

    logger.info(
      { telegramId, userId, language },
      "/help command processed successfully"
    );
  }
}
