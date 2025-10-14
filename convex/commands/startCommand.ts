/**
 * /start Command Handler
 * 
 * Handles user onboarding and registration flow.
 * 
 * Story 1.3:
 * AC1: /start Command Recognition
 * AC2: New User Detection
 * AC3: User Registration
 * AC4: Welcome Message Delivery
 * AC5: Language Selection UI
 * AC8: Returning User Handling
 * AC10: Message History
 */

import pino from "pino";
import { api } from "../_generated/api";
import type { CommandHandler, CommandHandlerContext } from "./types";
import type { ExtractedUserData } from "../telegram/types";
import { MESSAGES } from "../lib/constants";
import { getLanguageSelectionKeyboard } from "../lib/keyboards";

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
 * Start Command Handler
 * Manages new user registration and returning user welcome
 */
export class StartCommandHandler implements CommandHandler {
  async execute(
    ctx: CommandHandlerContext,
    userData: ExtractedUserData,
    chatId: number,
    _messageText: string
  ): Promise<void> {
    const { telegramId, username, firstName, lastName } = userData;

    // Query existing user (AC2, AC8)
    const existingUser = await ctx.runQuery(api.users.getByTelegramId.getByTelegramId, {
      telegramId: String(telegramId),
    });

    let userId;

    if (!existingUser) {
      // New user - register (AC3)
      logger.info({ telegramId }, "New user detected, registering...");

      const registrationResult = await ctx.runMutation(api.users.register.register, {
        telegramId: String(telegramId),
        username,
        firstName,
        lastName,
      });

      userId = registrationResult.userId;

      // Send bilingual welcome message with language selection (AC4, AC5)
      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: MESSAGES.WELCOME_NEW_USER,
        replyMarkup: getLanguageSelectionKeyboard(),
      });

      logger.info(
        { telegramId, userId },
        "New user registered and welcome message sent"
      );
    } else {
      // Returning user - send welcome back message (AC8)
      userId = existingUser._id;

      const profile = await ctx.runQuery(api.users.getProfile.getProfile, {
        userId,
      });

      const language: "ar" | "en" = profile?.language || "ar";
      const welcomeBackMessage = MESSAGES.WELCOME_BACK[language];

      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: welcomeBackMessage,
      });

      logger.info(
        { telegramId, userId, language },
        "Returning user - welcome back message sent"
      );
    }

    // Store /start command in message history (AC10)
    await ctx.runMutation(api.messages.create.create, {
      userId,
      role: "user",
      content: "/start",
    });
  }
}
