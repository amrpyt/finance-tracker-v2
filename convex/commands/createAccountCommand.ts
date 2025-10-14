/**
 * Create Account Command Handler
 * 
 * Handles natural language account creation requests using AI intent detection.
 * 
 * Story 2.1:
 * AC1: Intent Detection - AI parser detects "create_account" intent with 85%+ confidence
 * AC2: Entity Extraction - Extracts accountType, initialBalance, currency, accountName
 * AC3: Bilingual Support - Supports Arabic and English inputs
 * AC13: Error Handling - Low confidence triggers clarification
 * AC14: Fallback Regex - Falls back to regex on RORK API failure
 * 
 * Flow:
 * 1. Call AI parser (nlParser.parseAccountIntent)
 * 2. Check confidence >= 0.7
 * 3. Validate extracted entities
 * 4. If confidence low or entities incomplete → clarification
 * 5. If entities valid → send confirmation
 * 6. Store message in history
 */

import pino from "pino";
import { api } from "../_generated/api";
import type { CommandHandler, CommandHandlerContext } from "./types";
import type { ExtractedUserData } from "../telegram/types";
import type { CreateAccountEntities } from "../ai/types";

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
 * Create Account Command Handler
 * Processes natural language account creation requests
 */
export class CreateAccountCommandHandler implements CommandHandler {
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
      logger.warn({ telegramId }, "User not found for account creation");
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
      "Processing account creation request"
    );

    // Store user message in history (AC12)
    await ctx.runMutation(api.messages.create.create, {
      userId,
      role: "user",
      content: messageText,
    });

    try {
      // Call AI parser to detect intent and extract entities (AC1, AC2, AC3)
      const parseResult = await ctx.runAction(api.ai.nlParser.parseAccountIntent, {
        userMessage: messageText,
        language,
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

      // Store message with intent and entities for debugging (AC12)
      await ctx.runMutation(api.messages.create.create, {
        userId,
        role: "system",
        content: `Intent: ${parseResult.intent}, Confidence: ${parseResult.confidence}`,
        intent: parseResult.intent,
        entities: parseResult.entities,
      });

      // Check if confidence is above threshold (AC13)
      if (parseResult.confidence < MIN_CONFIDENCE) {
        logger.info(
          { telegramId, userId, confidence: parseResult.confidence },
          "Low confidence - triggering clarification"
        );

        // Call clarification handler for low confidence (Task 8)
        const { handleLowConfidence } = await import("../lib/clarificationHandler");
        await handleLowConfidence(ctx, {
          userId,
          language,
          chatId,
        });

        return;
      }

      // Verify intent is create_account
      if (parseResult.intent !== "create_account") {
        logger.warn(
          { telegramId, userId, intent: parseResult.intent },
          "Wrong intent detected for createAccountCommand"
        );

        // Send message that this isn't account creation
        const wrongIntentMsg = language === "ar"
          ? "لم أفهم أنك تريد إنشاء حساب. جرب:\n• أنشئ حساب محفظة برصيد 500 جنيه\n• Create bank account with 1000 USD"
          : "I didn't understand that you want to create an account. Try:\n• Create cash account with 500 EGP\n• أنشئ حساب بنك برصيد 1000 جنيه";

        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: wrongIntentMsg,
        });

        return;
      }

      // Extract and validate entities (AC2)
      const entities = parseResult.entities as CreateAccountEntities;

      // Check if required entity (accountType) is present
      if (!entities.accountType) {
        logger.info(
          { telegramId, userId, entities },
          "Missing accountType - triggering clarification"
        );

        // Call clarification handler to ask for account type (Task 8)
        const { askAccountTypeSelection } = await import("../lib/clarificationHandler");
        await askAccountTypeSelection(ctx, {
          userId,
          language,
          chatId,
          partialEntities: {
            initialBalance: entities.initialBalance,
            currency: entities.currency,
            accountName: entities.accountName,
          },
        });

        return;
      }

      // At this point, we have valid entities - send confirmation (AC4)
      logger.info(
        { telegramId, userId, entities },
        "Entities validated - sending confirmation"
      );

      // Send confirmation with inline keyboard (Task 4)
      const { sendAccountConfirmation } = await import("../lib/confirmationHandler");
      const { messageId, pendingId } = await sendAccountConfirmation(ctx, {
        userId,
        entities,
        language,
        chatId,
      });

      logger.info(
        { telegramId, userId, messageId, pendingId },
        "Account creation confirmation sent successfully"
      );

    } catch (error) {
      // Handle RORK API failures (AC14)
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          telegramId,
          userId,
        },
        "Error processing account creation request"
      );

      // TODO: Implement regex fallback (Task 1.8)
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
