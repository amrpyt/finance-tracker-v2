/**
 * Set Default Account Command Handler
 * 
 * Handles natural language set default account requests using AI intent detection.
 * 
 * Story 2.4 - Task 1:
 * AC1: Intent Detection - AI parser detects "set_default_account" intent with 85%+ confidence
 * AC3: Bilingual Support - Supports Arabic and English inputs
 * AC15: Fallback Regex - Falls back to regex on RORK API failure
 * 
 * Flow:
 * 1. Call AI parser (nlParser.parseAccountIntent)
 * 2. Check confidence >= 0.7
 * 3. If confidence low → clarification
 * 4. If valid → show account selection (or auto-select if single account)
 * 5. Show confirmation workflow
 * 6. Store message in history
 */

import pino from "pino";
import { api } from "../_generated/api";
import type { CommandHandler, CommandHandlerContext } from "./types";
import type { ExtractedUserData } from "../telegram/types";
import type { SetDefaultAccountEntities } from "../ai/types";
import { createAccountSelection } from "../lib/accountSelector";
import { sendSetDefaultConfirmation } from "../lib/setDefaultConfirmation";

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
 * Below this, we ask clarifying questions
 */
const MIN_CONFIDENCE = 0.7;

/**
 * Set Default Account Command Handler
 * Processes natural language set default account requests
 */
export class SetDefaultAccountCommandHandler implements CommandHandler {
  async execute(
    ctx: CommandHandlerContext,
    userData: ExtractedUserData,
    chatId: number,
    messageText: string
  ): Promise<void> {
    const { telegramId } = userData;

    // Get existing user
    const existingUser = await ctx.runQuery(api.users.getByTelegramId.getByTelegramId, {
      telegramId: String(telegramId),
    });

    if (!existingUser) {
      logger.warn({ telegramId }, "User not found for set default account");
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
      "Processing set default account request"
    );

    // Store user message in history (AC14)
    await ctx.runMutation(api.messages.create.create, {
      userId,
      role: "user",
      content: messageText,
    });

    // Fetch recent conversation history for AI context
    const conversationHistory = await ctx.runQuery(api.messages.getRecent.getRecent, {
      userId,
      limit: 10,
    });

    try {
      // Call AI parser to detect intent and extract entities (AC1, AC3)
      const parseResult = await ctx.runAction(api.ai.nlParser.parseAccountIntent, {
        userMessage: messageText,
        language,
        conversationHistory,
      });

      logger.info(
        {
          telegramId,
          userId,
          intent: parseResult.intent,
          confidence: parseResult.confidence,
          hasEntities: !!parseResult.entities,
        },
        "AI parsing completed"
      );

      // Store message with intent and entities for debugging (AC14)
      await ctx.runMutation(api.messages.create.create, {
        userId,
        role: "system",
        content: `Intent: ${parseResult.intent}, Confidence: ${parseResult.confidence}`,
        intent: parseResult.intent,
        entities: parseResult.entities,
      });

      // Check if confidence is above threshold
      if (parseResult.confidence < MIN_CONFIDENCE) {
        logger.info(
          { telegramId, userId, confidence: parseResult.confidence },
          "Low confidence - triggering clarification"
        );

        // Send clarification message
        const clarificationMsg = language === "ar"
          ? "لم أفهم تماماً. هل تريد تعيين حساب كافتراضي؟ جرب:\n• اجعل الحساب الافتراضي\n• غير الحساب الافتراضي\n• خلي المحفظة افتراضية"
          : "I didn't quite understand. Do you want to set a default account? Try:\n• Set default account\n• Make wallet default\n• Change default account";

        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: clarificationMsg,
        });

        return;
      }

      // Verify intent is set_default_account
      if (parseResult.intent !== "set_default_account") {
        logger.warn(
          { telegramId, userId, intent: parseResult.intent },
          "Wrong intent detected for setDefaultAccountCommand"
        );

        const wrongIntentMsg = language === "ar"
          ? "لم أفهم أنك تريد تعيين حساب افتراضي. جرب:\n• اجعل الحساب الافتراضي\n• غير الحساب الافتراضي"
          : "I didn't understand that you want to set a default account. Try:\n• Set default account\n• Change default account";

        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: wrongIntentMsg,
        });

        return;
      }

      // Extract entities
      const entities = parseResult.entities as SetDefaultAccountEntities;

      // Query user's accounts (AC2)
      const accounts = await ctx.runQuery(api.accounts.list.list, {
        userId,
        includeDeleted: false,
      });

      logger.info(
        { telegramId, userId, accountCount: accounts.length },
        "Fetched user accounts for selection"
      );

      // Create account selection UI (Task 2)
      const selectionResult = createAccountSelection(accounts, language, "set_default");

      // AC12: Handle zero accounts
      if (accounts.length === 0) {
        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: selectionResult.message,
        });
        return;
      }

      // AC13: Auto-select if single account
      if (selectionResult.shouldAutoSelect && selectionResult.selectedAccountId) {
        logger.info(
          { telegramId, userId, accountId: selectionResult.selectedAccountId },
          "Auto-selecting single account"
        );

        // Get account details
        const account = await ctx.runQuery(api.accounts.getById.getById, {
          accountId: selectionResult.selectedAccountId,
        });

        if (!account) {
          logger.error({ accountId: selectionResult.selectedAccountId }, "Account not found after auto-select");
          return;
        }

        // AC11: Check if already default
        if (account.isDefault) {
          const alreadyDefaultMsg = language === "ar"
            ? `هذا الحساب هو الافتراضي بالفعل ⭐\n\n*${account.name}*`
            : `This account is already the default ⭐\n\n*${account.name}*`;

          await ctx.runAction(api.telegram.sendMessage.sendMessage, {
            chatId,
            text: alreadyDefaultMsg,
            parseMode: "Markdown",
          });

          return;
        }

        // Show confirmation workflow directly (Task 4)
        await sendSetDefaultConfirmation(ctx, {
          userId,
          accountId: selectionResult.selectedAccountId,
          language,
          chatId,
        });

        return;
      }

      // AC2: Multiple accounts - show selection
      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: selectionResult.message,
        parseMode: "Markdown",
        replyMarkup: selectionResult.keyboard,
      });

      logger.info(
        { telegramId, userId, accountCount: accounts.length },
        "Account selection sent successfully"
      );

    } catch (error) {
      // AC15: Handle RORK API failures with regex fallback
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          telegramId,
          userId,
        },
        "Error processing set default account request"
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
