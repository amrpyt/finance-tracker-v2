/**
 * Log Expense Command Handler
 * 
 * Story 3.1: AI Expense Logging
 * Task 9: Create Log Expense Command Handler (AC: #1, #17)
 * 
 * Handles natural language expense logging requests using AI intent detection.
 * 
 * Flow:
 * 1. Call AI parser (parseExpenseIntent)
 * 2. Check confidence >= 0.7
 * 3. Extract date (Task 3)
 * 4. Map category (Task 2)
 * 5. Select account (Task 4)
 * 6. Build confirmation (Task 5)
 * 7. Store pending data and wait for user confirmation
 */

import pino from "pino";
import { api } from "../_generated/api";
import type { CommandHandler, CommandHandlerContext } from "./types";
import type { ExtractedUserData } from "../telegram/types";
import type { LogExpenseEntities } from "../ai/types";
import { parseRelativeDate } from "../lib/dateParser";
import { assignCategory } from "../lib/categoryMapper";
import { buildExpenseConfirmation } from "../lib/expenseConfirmation";
import { createAccountSelection } from "../lib/accountSelector";
import { getExpenseErrorMessage } from "../lib/responseHelpers";
import { v4 as uuidv4 } from "uuid";

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
 * Task 9.4: Check confidence >= 0.7 (AC3: 85%+ for automatic, 70%+ for manual)
 */
const MIN_CONFIDENCE = 0.7;

/**
 * Log Expense Command Handler
 * Task 9.2: Implement execute() method
 */
export class LogExpenseCommandHandler implements CommandHandler {
  async execute(
    ctx: CommandHandlerContext,
    userData: ExtractedUserData,
    chatId: number,
    messageText: string,
    preParseResult?: any // Optional: If already parsed by webhook, skip re-parsing
  ): Promise<void> {
    // Task 17.5-17.6: Performance measurement for AC19 (<5 seconds end-to-end)
    const flowStartTime = Date.now();
    const { telegramId } = userData;

    // Get existing user
    const existingUser = await ctx.runQuery(api.users.getByTelegramId.getByTelegramId, {
      telegramId: String(telegramId),
    });

    if (!existingUser) {
      logger.warn({ telegramId }, "User not found for expense logging");
      return;
    }

    const userId = existingUser._id;

    // Get user profile for language preference
    const profile = await ctx.runQuery(api.users.getProfile.getProfile, {
      userId,
    });

    const language: "ar" | "en" = profile?.language || "ar";

    logger.info(
      { telegramId, userId, language, messageText: messageText.substring(0, 50), flowStartTime },
      "Processing expense logging request - performance tracking enabled"
    );

    // Store user message in history (AC15)
    await ctx.runMutation(api.messages.create.create, {
      userId,
      role: "user",
      content: messageText,
      intent: "log_expense", // Task 9.13: Store intent for audit
    });

    // Performance optimization: Use pre-parsed result if available (from unified parser)
    let parseResult;
    
    if (preParseResult) {
      // Result already parsed by webhook unified parser - skip duplicate parsing!
      parseResult = preParseResult;
      logger.info(
        { intent: parseResult.intent, confidence: parseResult.confidence },
        "Using pre-parsed expense intent (from unified parser)"
      );
    } else {
      // Fallback: Parse if not already done (backward compatibility)
      const conversationHistory = await ctx.runQuery(api.messages.getRecent.getRecent, {
        userId,
        limit: 10,
      });

      parseResult = await ctx.runAction(api.ai.parseExpenseIntent.parseExpenseIntent, {
        userMessage: messageText,
        language,
        conversationHistory, // AC17: Pass history for context-aware detection
      });

      logger.info(
        { intent: parseResult.intent, confidence: parseResult.confidence },
        "Expense intent parsed (fallback parsing)"
      );
    }

    try {
      // Task 9.4: Check confidence >= 0.7 (AC3, AC20)
      if (parseResult.confidence < MIN_CONFIDENCE || parseResult.intent !== "log_expense") {
        // Task 9.5: Show error recovery message with examples (AC20)
        const errorMessage = getExpenseErrorMessage("parsing_failed", language);
        
        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: errorMessage,
        });

        // Store error message in history
        await ctx.runMutation(api.messages.create.create, {
          userId,
          role: "assistant",
          content: errorMessage,
        });

        return;
      }

      // Task 9.6: Extract entities from parsed intent
      const entities = parseResult.entities as LogExpenseEntities;

      // Validate amount exists
      if (!entities.amount || entities.amount <= 0) {
        const errorMessage = getExpenseErrorMessage("invalid_amount", language);
        
        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: errorMessage,
        });

        await ctx.runMutation(api.messages.create.create, {
          userId,
          role: "assistant",
          content: errorMessage,
        });

        return;
      }

      // Task 9.7: Run date parsing on extracted date entity (Task 3, AC12)
      const transactionDate = parseRelativeDate(entities.date);

      // Task 9.8: Run category mapping on extracted category (Task 2, AC6, AC14)
      let finalCategory = entities.category;
      let categoryConfidence = 1.0;

      if (!finalCategory && entities.description) {
        const categoryResult = assignCategory(entities.description);
        finalCategory = categoryResult.category || "other";
        categoryConfidence = categoryResult.confidence;

        logger.info(
          { category: finalCategory, confidence: categoryConfidence },
          "Category auto-assigned"
        );
      } else if (!finalCategory) {
        finalCategory = "other"; // Default category
      }

      // Task 9.9: Run account selection (Task 4, AC5, AC18)
      const accounts = await ctx.runQuery(api.accounts.list.list, {
        userId,
        includeDeleted: false,
      });

      if (accounts.length === 0) {
        const errorMessage = getExpenseErrorMessage("no_accounts", language);
        
        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: errorMessage,
        });

        await ctx.runMutation(api.messages.create.create, {
          userId,
          role: "assistant",
          content: errorMessage,
        });

        return;
      }

      // Try to find account by name if specified
      let selectedAccount = null;
      
      if (entities.accountName) {
        // Task 4.2: Query matching account by name
        selectedAccount = accounts.find((acc: any) =>
          acc.name.toLowerCase().includes(entities.accountName!.toLowerCase())
        );
      }

      // Task 4.3: If no account specified, use default account
      if (!selectedAccount) {
        selectedAccount = accounts.find((acc: any) => acc.isDefault);
      }

      // Task 4.4: If no default and single account, use that account
      if (!selectedAccount && accounts.length === 1) {
        selectedAccount = accounts[0];
      }

      // Generate unique confirmation ID
      const confirmationId = uuidv4();

      // Task 9.10: If multiple accounts and no selection, show account menu and wait
      if (!selectedAccount && accounts.length > 1) {
        const accountSelection = createAccountSelection(
          accounts,
          language,
          "expense",
          confirmationId
        );

        // Store pending expense data with accountId to be selected (Task 4.8)
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        
        await ctx.runMutation(api.pendingActions.createPending.createPending, {
          userId,
          actionType: "log_expense",
          actionData: {
            confirmationId,
            amount: entities.amount,
            category: finalCategory,
            description: entities.description,
            date: transactionDate,
            accountId: null, // To be selected
            language,
          },
          messageId: 0, // Will be updated after sending
          expiresAt,
        });

        const sentMessage = await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: accountSelection.message,
          parseMode: "Markdown",
          replyMarkup: accountSelection.keyboard,
        });

        return;
      }

      // Task 9.11: Build confirmation message (Task 5, AC7)
      const confirmation = buildExpenseConfirmation(
        {
          amount: entities.amount,
          category: finalCategory,
          description: entities.description,
          accountName: selectedAccount.name,
          accountType: selectedAccount.type,
          currency: selectedAccount.currency,
          date: transactionDate,
        },
        language,
        confirmationId
      );

      // Task 9.12: Send confirmation and store pending data (AC7, Task 14.3)
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes TTL

      const sentMessage = await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: confirmation.message,
        parseMode: "Markdown",
        replyMarkup: confirmation.keyboard,
      });

      // Store pending expense data
      await ctx.runMutation(api.pendingActions.createPending.createPending, {
        userId,
        actionType: "log_expense",
        actionData: {
          confirmationId,
          amount: entities.amount,
          category: finalCategory,
          description: entities.description,
          accountId: selectedAccount._id,
          date: transactionDate,
          language,
        },
        messageId: sentMessage?.message_id || 0,
        expiresAt,
      });

      // Store confirmation message in history
      await ctx.runMutation(api.messages.create.create, {
        userId,
        role: "assistant",
        content: confirmation.message,
        intent: "log_expense_confirmation",
        entities: {
          confirmationId,
          amount: entities.amount,
          category: finalCategory,
        },
      });

      // Task 17.5-17.6: Log end-to-end performance (AC19: target <5 seconds)
      const flowEndTime = Date.now();
      const totalFlowDuration = flowEndTime - flowStartTime;
      const performanceStatus = totalFlowDuration < 5000 ? "PASS" : "FAIL";

      logger.info(
        { 
          confirmationId, 
          accountId: selectedAccount._id,
          flowDurationMs: totalFlowDuration,
          flowDurationSec: (totalFlowDuration / 1000).toFixed(2),
          performanceTarget: "5000ms",
          performanceStatus,
        },
        `Expense confirmation sent - AC19 Performance: ${performanceStatus} (${totalFlowDuration}ms)`
      );

    } catch (error) {
      // Task 17.6: Log performance even on error
      const flowEndTime = Date.now();
      const totalFlowDuration = flowEndTime - flowStartTime;

      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          flowDurationMs: totalFlowDuration,
        },
        "Failed to process expense logging"
      );

      // Send user-friendly error message
      const errorMessage = getExpenseErrorMessage("api_timeout", language);
      
      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: errorMessage,
      });

      await ctx.runMutation(api.messages.create.create, {
        userId,
        role: "assistant",
        content: errorMessage,
      });
    }
  }
}
