/**
 * Log Income Command Handler
 * 
 * Story 3.2: AI Income Logging
 * Task 8: Create Log Income Command Handler (AC: #1, #17)
 * 
 * Handles natural language income logging requests using AI intent detection.
 * 
 * Flow:
 * 1. Call AI parser (parseIncomeIntent)
 * 2. Check confidence >= 0.7
 * 3. Extract date
 * 4. Map category
 * 5. Select account
 * 6. Build confirmation
 * 7. Store pending data and wait for user confirmation
 */

import pino from "pino";
import { api } from "../_generated/api";
import type { CommandHandler, CommandHandlerContext } from "./types";
import type { ExtractedUserData } from "../telegram/types";
import type { LogIncomeEntities } from "../ai/types";
import { parseRelativeDate } from "../lib/dateParser";
import { assignIncomeCategory } from "../lib/categoryMapper";
import { buildIncomeConfirmation } from "../lib/incomeConfirmation";
import { createAccountSelection } from "../lib/accountSelector";
import { getIncomeErrorMessage } from "../lib/responseHelpers";
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
 * Task 8.4: Check confidence >= 0.7 (AC3: 85%+ for automatic, 70%+ for manual)
 */
const MIN_CONFIDENCE = 0.7;

/**
 * Log Income Command Handler
 * Task 8.2: Implement execute() method accepting userId, message, language
 */
export class LogIncomeCommandHandler implements CommandHandler {
  async execute(
    ctx: CommandHandlerContext,
    userData: ExtractedUserData,
    chatId: number,
    messageText: string,
    preParseResult?: any // Optional: If already parsed by webhook, skip re-parsing
  ): Promise<void> {
    // Performance measurement for AC19 (<5 seconds end-to-end)
    const flowStartTime = Date.now();
    const { telegramId } = userData;

    // Get existing user
    const existingUser = await ctx.runQuery(api.users.getByTelegramId.getByTelegramId, {
      telegramId: String(telegramId),
    });

    if (!existingUser) {
      logger.warn({ telegramId }, "User not found for income logging");
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
      "Processing income logging request - performance tracking enabled"
    );

    // Store user message in history (AC15)
    await ctx.runMutation(api.messages.create.create, {
      userId,
      role: "user",
      content: messageText,
      intent: "log_income", // Task 8.13: Store intent for audit
    });

    // Performance optimization: Use pre-parsed result if available (from unified parser)
    let parseResult;
    
    if (preParseResult) {
      // Result already parsed by webhook unified parser - skip duplicate parsing!
      parseResult = preParseResult;
      logger.info(
        { intent: parseResult.intent, confidence: parseResult.confidence },
        "Using pre-parsed income intent (from unified parser)"
      );
    } else {
      // Fallback: Parse if not already done (backward compatibility)
      const conversationHistory = await ctx.runQuery(api.messages.getRecent.getRecent, {
        userId,
        limit: 10,
      });

      parseResult = await ctx.runAction(api.ai.parseIncomeIntent.parseIncomeIntent, {
        userMessage: messageText,
        language,
        conversationHistory,
      });

      logger.info(
        { intent: parseResult.intent, confidence: parseResult.confidence },
        "Income intent parsed (fallback parsing)"
      );
    }

    try {

      // Task 8.4: Check confidence >= 0.7 (AC3, AC20)
      if (parseResult.confidence < MIN_CONFIDENCE || parseResult.intent !== "log_income") {
        // Task 8.5: Show error recovery message with income examples (AC20)
        const errorMessage = getIncomeErrorMessage("parsing_failed", language);
        
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

      // Task 8.6: Extract entities from parsed intent
      const entities = parseResult.entities as LogIncomeEntities;

      // DEBUG: Log the entities structure
      logger.info({
        rawParseResult: parseResult,
        entities: entities,
        entitiesType: typeof entities,
        hasAmount: 'amount' in entities,
        amountValue: entities.amount,
        amountType: typeof entities.amount,
      }, "[INCOME DEBUG] Entities from unified parser");

      // Validate amount exists
      if (!entities.amount || entities.amount <= 0) {
        const errorMessage = getIncomeErrorMessage("invalid_amount", language);
        
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

      // Task 8.7: Run date parsing on extracted date entity (Task 3, AC12)
      const transactionDate = parseRelativeDate(entities.date);

      // Task 8.8: Run category mapping on extracted category (Task 2, AC6, AC14)
      let finalCategory = entities.category;
      let categoryConfidence = 1.0;

      if (!finalCategory && entities.description) {
        const categoryResult = assignIncomeCategory(entities.description);
        finalCategory = categoryResult.category || "other";
        categoryConfidence = categoryResult.confidence;

        logger.info(
          { category: finalCategory, confidence: categoryConfidence },
          "Income category auto-assigned"
        );
      } else if (!finalCategory) {
        finalCategory = "other"; // Default category
      }

      // Task 8.9: Run account selection (Task 4, AC5, AC18)
      const accounts = await ctx.runQuery(api.accounts.list.list, {
        userId,
        includeDeleted: false,
      });

      if (accounts.length === 0) {
        const errorMessage = getIncomeErrorMessage("no_accounts", language);
        
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
        const normalizedSearch = entities.accountName.toLowerCase().trim();
        selectedAccount = accounts.find(
          (acc: any) => acc.name.toLowerCase().includes(normalizedSearch)
        );

        if (selectedAccount) {
          logger.info({ accountName: selectedAccount.name }, "Account matched by name");
        }
      }

      // Task 8.10: If no account matched and multiple accounts exist, show account selection menu
      if (!selectedAccount && accounts.length > 1) {
        // Check for default account first (AC5)
        const defaultAccount = accounts.find((acc: any) => acc.isDefault);
        
        if (defaultAccount) {
          selectedAccount = defaultAccount;
          logger.info({ accountName: defaultAccount.name }, "Using default account");
        } else {
          // Show account selection menu (AC18: Multi-Account Support)
          const confirmationId = uuidv4();
          const accountSelectionResult = createAccountSelection(
            accounts,
            language,
            "income", // actionType for income
            confirmationId
          );

          // Send account selection message
          const selectionMsg = await ctx.runAction(api.telegram.sendMessage.sendMessage, {
            chatId,
            text: accountSelectionResult.message,
            parseMode: "Markdown",
            replyMarkup: accountSelectionResult.keyboard,
          });

          // Store pending data with account selection needed
          await ctx.runMutation(api.pendingActions.createPending.createPending, {
            userId,
            actionType: "log_income",
            actionData: {
              confirmationId,
              amount: entities.amount,
              category: finalCategory,
              description: entities.description || "",
              date: transactionDate,
              needsAccountSelection: true,
            },
            messageId: selectionMsg.messageId,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes (AC11)
          });

          // Store message in history
          await ctx.runMutation(api.messages.create.create, {
            userId,
            role: "assistant",
            content: accountSelectionResult.message,
          });

          return;
        }
      } else if (!selectedAccount) {
        // Single account - use it
        selectedAccount = accounts[0];
        logger.info({ accountName: selectedAccount.name }, "Using only available account");
      }

      // Task 8.11: Build confirmation message (Task 5, AC7)
      const confirmationId = uuidv4();
      const confirmationData = {
        amount: entities.amount,
        category: finalCategory,
        description: entities.description || "",
        accountName: selectedAccount.name,
        accountType: selectedAccount.type,
        currency: selectedAccount.currency,
        date: transactionDate,
      };

      const confirmationResult = buildIncomeConfirmation(
        confirmationData,
        language,
        confirmationId
      );

      // Send confirmation message
      const confirmMsg = await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: confirmationResult.message,
        parseMode: "Markdown",
        replyMarkup: confirmationResult.keyboard,
      });

      // Task 8.12: Store pending data (Task 12, AC7, AC15)
      await ctx.runMutation(api.pendingActions.createPending.createPending, {
        userId,
        actionType: "log_income",
        actionData: {
          confirmationId,
          amount: entities.amount,
          category: finalCategory,
          description: entities.description || "",
          accountId: selectedAccount._id,
          date: transactionDate,
        },
        messageId: confirmMsg.messageId,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes expiration (AC11)
      });

      // Store confirmation message in history (AC15)
      await ctx.runMutation(api.messages.create.create, {
        userId,
        role: "assistant",
        content: confirmationResult.message,
        entities: {
          amount: entities.amount,
          category: finalCategory,
          description: entities.description,
          accountId: selectedAccount._id,
        },
      });

      // Performance measurement
      const flowEndTime = Date.now();
      const totalTime = flowEndTime - flowStartTime;
      const status = totalTime < 5000 ? "PASS" : "FAIL";
      
      logger.info(
        { 
          totalTimeMs: totalTime, 
          targetMs: 5000,
          status,
          userId,
        },
        `Income logging flow completed - Performance: ${status} (${totalTime}ms / 5000ms target)`
      );

    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Failed to process income logging"
      );

      const errorMessage = getIncomeErrorMessage("api_timeout", language);
      
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
