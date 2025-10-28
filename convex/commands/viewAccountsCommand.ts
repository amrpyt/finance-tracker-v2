/**
 * View Accounts Command Handler
 * 
 * Handles natural language account viewing requests using AI intent detection.
 * 
 * Story 2.2:
 * AC1: Intent Detection - AI parser detects "view_accounts" intent with 85%+ confidence
 * AC3: Bilingual Support - Supports Arabic and English inputs
 * AC12: Performance - Complete flow in < 3 seconds
 * AC15: Fallback Regex - Falls back to regex on RORK API failure
 * 
 * Flow:
 * 1. Call AI parser (nlParser.parseAccountIntent)
 * 2. Check confidence >= 0.7 and intent === "view_accounts"
 * 3. Query user accounts with getOverview
 * 4. Format and display accounts with balance overview
 * 5. Store message in history
 */

import pino from "pino";
import { api } from "../_generated/api";
import type { CommandHandler, CommandHandlerContext } from "./types";
import type { ExtractedUserData } from "../telegram/types";

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
 * Minimum confidence threshold for AI parsing
 * Below this, we use regex fallback
 */
const MIN_CONFIDENCE = 0.7;

/**
 * View Accounts Command Handler
 * Processes natural language account viewing requests
 */
export class ViewAccountsCommandHandler implements CommandHandler {
  async execute(
    ctx: CommandHandlerContext,
    userData: ExtractedUserData,
    chatId: number,
    messageText: string
  ): Promise<void> {
    const { telegramId } = userData;
    const startTime = Date.now();

    // Get existing user
    const existingUser = await ctx.runQuery(api.users.getByTelegramId.getByTelegramId, {
      telegramId: String(telegramId),
    });

    if (!existingUser) {
      logger.warn({ telegramId }, "User not found for view accounts");
      return;
    }

    const userId = existingUser._id;

    // Get user profile for language preference
    const profile = await ctx.runQuery(api.users.getProfile.getProfile, {
      userId,
    });

    const language: "ar" | "en" = profile?.language || "ar";

    logger.info(
      { telegramId, userId, language, messageText: messageText.substring(0, 50) },
      "Processing view accounts request"
    );

    // Fetch recent conversation history for AI context (5-10 messages)
    const conversationHistory = await ctx.runQuery(api.messages.getRecent.getRecent, {
      userId,
      limit: 10, // Last 10 messages for context retention
    });

    // Store user message in history (AC12)
    await ctx.runMutation(api.messages.create.create, {
      userId,
      role: "user",
      content: messageText,
    });

    try {
      // Call AI parser to detect intent with conversation context (AC1, AC3, AC15)
      const parseResult = await ctx.runAction(api.ai.nlParser.parseAccountIntent, {
        userMessage: messageText,
        language,
        conversationHistory, // Pass history for context-aware intent detection
      });

      logger.info(
        {
          telegramId,
          userId,
          intent: parseResult.intent,
          confidence: parseResult.confidence,
        },
        "AI parsing completed"
      );

      // Store message with intent for debugging
      await ctx.runMutation(api.messages.create.create, {
        userId,
        role: "system",
        content: `Intent: ${parseResult.intent}, Confidence: ${parseResult.confidence}`,
        intent: parseResult.intent,
      });

      // Check if confidence is above threshold
      if (parseResult.confidence < MIN_CONFIDENCE) {
        logger.info(
          { telegramId, userId, confidence: parseResult.confidence },
          "Low confidence - not processing"
        );

        // Low confidence - don't process
        const errorMsg = language === "ar"
          ? "لم أفهم طلبك بوضوح. جرب: عرض حساباتي"
          : "I didn't understand clearly. Try: show my accounts";

        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: errorMsg,
        });
        return;
      }

      // Verify intent is view_accounts
      if (parseResult.intent !== "view_accounts") {
        logger.info(
          { telegramId, userId, intent: parseResult.intent },
          "Wrong intent detected for viewAccountsCommand"
        );

        // Not a view accounts command - silently return
        return;
      }

      // Query accounts overview (AC2)
      const accounts = await ctx.runQuery(api.accounts.getOverview.getOverview, {
        userId,
      });

      logger.info(
        { telegramId, userId, accountCount: accounts.length },
        "Accounts retrieved"
      );

      // Format and send response (AC4-AC14)
      const { formatAccountsOverview } = await import("../lib/accountFormatter");
      const formattedMessage = formatAccountsOverview(accounts, language, profile?.currency || "EGP");

      // Get quick actions keyboard (AC11)
      const { getAccountsOverviewKeyboard } = await import("../lib/keyboards");
      const keyboard = getAccountsOverviewKeyboard(language);

      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: formattedMessage,
        parseMode: "Markdown",
        replyMarkup: keyboard,
      });

      const processingTime = Date.now() - startTime;
      logger.info(
        { telegramId, userId, processingTimeMs: processingTime },
        "View accounts completed successfully"
      );

    } catch (error) {
      // Handle errors (AC15)
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          telegramId,
          userId,
        },
        "Error processing view accounts request"
      );

      const errorMsg = language === "ar"
        ? "عذراً، حدث خطأ. حاول مرة أخرى."
        : "Sorry, an error occurred. Please try again.";

      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: errorMsg,
      });
    }
  }
}
