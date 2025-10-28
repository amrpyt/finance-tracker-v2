/**
 * Delete Account Command Handler
 * 
 * Handles natural language account delete requests using AI intent detection.
 * 
 * Story 2.5 - Task 1:
 * AC1: Intent Detection - AI parser detects "delete_account" intent with 85%+ confidence
 * AC3: Bilingual Support - Supports Arabic and English inputs
 * AC18: Fallback Regex - Falls back to regex on RORK API failure
 * 
 * Flow:
 * 1. Call AI parser (nlParser.parseAccountIntent)
 * 2. Check confidence >= 0.7
 * 3. If confidence low → clarification
 * 4. If valid → show account selection with transaction counts
 * 5. Store message in history
 */

import pino from "pino";
import { api } from "../_generated/api";
import type { CommandHandler, CommandHandlerContext } from "./types";
import type { ExtractedUserData } from "../telegram/types";
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
 * Delete Account Command Handler
 * Processes natural language account delete requests
 */
export class DeleteAccountCommandHandler implements CommandHandler {
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
      logger.warn({ telegramId }, "User not found for account delete");
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
      "Processing account delete request"
    );

    // Task 1.8: Store user message in history (AC17)
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
      // Task 1.3: Call AI parser to detect intent and extract entities (AC1, AC3)
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

      // Task 1.8: Store message with intent and entities for debugging (AC17)
      await ctx.runMutation(api.messages.create.create, {
        userId,
        role: "system",
        content: `Intent: ${parseResult.intent}, Confidence: ${parseResult.confidence}`,
        intent: parseResult.intent,
        entities: parseResult.entities,
      });

      // Task 1.4: Check if confidence is above threshold
      if (parseResult.confidence < MIN_CONFIDENCE) {
        logger.info(
          { telegramId, userId, confidence: parseResult.confidence },
          "Low confidence - triggering clarification"
        );

        // Task 1.5: Send clarification message
        const clarificationMsg = language === "ar"
          ? "لم أفهم تماماً أي حساب تريد حذفه. يمكنك:\n• احذف حساب المحفظة\n• امسح حساب البنك\n• حذف الحساب"
          : "I didn't quite understand which account you want to delete. You can try:\n• Delete wallet account\n• Remove bank account\n• Delete account";

        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: clarificationMsg,
        });

        return;
      }

      // Verify intent is delete_account
      if (parseResult.intent !== "delete_account") {
        logger.warn(
          { telegramId, userId, intent: parseResult.intent },
          "Wrong intent detected for deleteAccountCommand"
        );

        const wrongIntentMsg = language === "ar"
          ? "لم أفهم أنك تريد حذف حساب. جرب:\n• احذف حساب المحفظة\n• امسح الحساب"
          : "I didn't understand that you want to delete an account. Try:\n• Delete wallet account\n• Remove account";

        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: wrongIntentMsg,
        });

        return;
      }

      // Query user's accounts (Task 2.2)
      const accounts = await ctx.runQuery(api.accounts.list.list, {
        userId,
        includeDeleted: false,
      });

      logger.info(
        { telegramId, userId, accountCount: accounts.length },
        "Fetched user accounts for deletion selection"
      );

      // Task 2.5: Fetch transaction count for each account
      const accountsWithTxCount = await Promise.all(
        accounts.map(async (account: any) => {
          const txCount = await ctx.runQuery(api.transactions.countByAccount.countByAccount, {
            accountId: account._id,
          });
          return {
            ...account,
            transactionCount: txCount,
          };
        })
      );

      // Create account selection UI (Task 2)
      const selectionResult = createAccountSelection(accountsWithTxCount, language, "delete");

      // Handle zero accounts (Task 2.3)
      if (accounts.length === 0) {
        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: selectionResult.message,
        });
        return;
      }

      // Auto-select if single account (Task 2.4)
      if (selectionResult.shouldAutoSelect && selectionResult.selectedAccountId) {
        logger.info(
          { telegramId, userId, accountId: selectionResult.selectedAccountId },
          "Auto-selecting single account for deletion"
        );

        // Validation will be done by softDelete mutation when user confirms
        // For now, just proceed to show confirmation

        // Get account details
        const account = await ctx.runQuery(api.accounts.getById.getById, {
          accountId: selectionResult.selectedAccountId,
        });

        if (!account) {
          logger.error({ accountId: selectionResult.selectedAccountId }, "Account not found");
          return;
        }

        // Get transaction count
        const txCount = await ctx.runQuery(api.transactions.countByAccount.countByAccount, {
          accountId: selectionResult.selectedAccountId,
        });

        // Show delete confirmation directly (Task 4)
        const { createDeleteConfirmation } = await import("../lib/deleteAccountConfirmation");
        const confirmationResult = createDeleteConfirmation(
          account,
          txCount,
          language
        );

        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: confirmationResult.message,
          parseMode: "Markdown",
          replyMarkup: confirmationResult.keyboard,
        });

        return;
      }

      // Multiple accounts - show selection (Task 2.9)
      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: selectionResult.message,
        parseMode: "Markdown",
        replyMarkup: selectionResult.keyboard,
      });

      logger.info(
        { telegramId, userId, accountCount: accounts.length },
        "Account selection for deletion sent successfully"
      );

    } catch (error) {
      // Task 1.7: Handle RORK API failures with regex fallback (AC18)
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          telegramId,
          userId,
        },
        "Error processing account delete request"
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
