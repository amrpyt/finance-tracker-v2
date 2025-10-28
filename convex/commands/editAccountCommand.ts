/**
 * Edit Account Command Handler
 * 
 * Handles natural language account edit requests using AI intent detection.
 * 
 * Story 2.3 - Task 1:
 * AC1: Intent Detection - AI parser detects "edit_account" intent with 85%+ confidence
 * AC3: Bilingual Support - Supports Arabic and English inputs
 * AC15: Error Handling - Low confidence triggers clarification
 * AC17: Fallback Regex - Falls back to regex on RORK API failure
 * 
 * Flow:
 * 1. Call AI parser (nlParser.parseAccountIntent)
 * 2. Check confidence >= 0.7
 * 3. If confidence low → clarification
 * 4. If valid → show account selection (or auto-select if single account)
 * 5. Store message in history
 */

import pino from "pino";
import { api } from "../_generated/api";
import type { CommandHandler, CommandHandlerContext } from "./types";
import type { ExtractedUserData } from "../telegram/types";
import type { EditAccountEntities } from "../ai/types";
import { createAccountSelection } from "../lib/accountSelector";

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
 * Edit Account Command Handler
 * Processes natural language account edit requests
 */
export class EditAccountCommandHandler implements CommandHandler {
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
      logger.warn({ telegramId }, "User not found for account edit");
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
      "Processing account edit request"
    );

    // Store user message in history (AC16)
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

      // Store message with intent and entities for debugging (AC16)
      await ctx.runMutation(api.messages.create.create, {
        userId,
        role: "system",
        content: `Intent: ${parseResult.intent}, Confidence: ${parseResult.confidence}`,
        intent: parseResult.intent,
        entities: parseResult.entities,
      });

      // AC15: Check if confidence is above threshold
      if (parseResult.confidence < MIN_CONFIDENCE) {
        logger.info(
          { telegramId, userId, confidence: parseResult.confidence },
          "Low confidence - triggering clarification"
        );

        // Send clarification message
        const clarificationMsg = language === "ar"
          ? "لم أفهم تماماً أي حساب تريد تعديله. يمكنك:\n• عدل حساب المحفظة\n• غير اسم البنك\n• تعديل حساب البنك"
          : "I didn't quite understand which account you want to edit. You can try:\n• Edit wallet account\n• Change bank name\n• Update bank account";

        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: clarificationMsg,
        });

        return;
      }

      // Verify intent is edit_account
      if (parseResult.intent !== "edit_account") {
        logger.warn(
          { telegramId, userId, intent: parseResult.intent },
          "Wrong intent detected for editAccountCommand"
        );

        const wrongIntentMsg = language === "ar"
          ? "لم أفهم أنك تريد تعديل حساب. جرب:\n• عدل حساب المحفظة\n• غير اسم البنك"
          : "I didn't understand that you want to edit an account. Try:\n• Edit wallet account\n• Change bank name";

        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: wrongIntentMsg,
        });

        return;
      }

      // Extract entities
      const entities = parseResult.entities as EditAccountEntities;

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
      const selectionResult = createAccountSelection(accounts, language, "edit");

      // AC2: Handle zero accounts
      if (accounts.length === 0) {
        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: selectionResult.message,
        });
        return;
      }

      // AC2: Auto-select if single account
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

        // Show edit options menu directly (Task 3)
        const { createEditOptionsMenu } = await import("../lib/editAccountMenu");
        const menuResult = createEditOptionsMenu(account, language);

        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: menuResult.message,
          parseMode: "Markdown",
          replyMarkup: menuResult.keyboard,
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
      // AC17: Handle RORK API failures with regex fallback
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          telegramId,
          userId,
        },
        "Error processing account edit request"
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
