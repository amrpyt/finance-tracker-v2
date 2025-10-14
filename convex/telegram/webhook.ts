/**
 * Telegram Webhook HTTP Action
 * 
 * Receives POST requests from Telegram Bot API and processes incoming messages.
 * This is the Layer 1 entry point for all user interactions.
 * 
 * Performance Target: < 500ms processing time
 * Concurrency: Supports 100+ concurrent requests
 */

import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";
import pino from "pino";
import type {
  TelegramUpdate,
  ExtractedUserData,
  ExtractedMessage,
  WebhookProcessingResult,
  TelegramCallbackQuery,
} from "./types";
import { validateWebhookPayload, hasValidMessage } from "./validation";
import { detectCommand } from "../lib/commandRouter";
import { MESSAGES, CALLBACK_PATTERNS } from "../lib/constants";
import { getCommandHandler } from "../commands/registry";

// Initialize structured logger
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
 * Extract user data from Telegram message
 */
function extractUserData(update: TelegramUpdate): ExtractedUserData | null {
  const message = update.message || update.edited_message;
  
  if (!message?.from) {
    return null;
  }

  const { from } = message;

  return {
    telegramId: from.id,
    username: from.username,
    firstName: from.first_name,
    lastName: from.last_name,
    languageCode: from.language_code,
  };
}

/**
 * Extract message content from Telegram update
 */
function extractMessage(update: TelegramUpdate): ExtractedMessage | null {
  const message = update.message || update.edited_message;
  
  if (!message) {
    return null;
  }

  return {
    messageId: message.message_id,
    text: message.text,
    hasVoice: !!message.voice,
    voiceFileId: message.voice?.file_id,
    date: message.date,
    chatId: message.chat.id,
  };
}

/**
 * Validate and parse Telegram update payload using Zod
 */
function parseWebhookPayload(body: unknown): { update: TelegramUpdate | null; validationError?: string } {
  const validationResult = validateWebhookPayload(body);
  
  if (!validationResult.success || !validationResult.data) {
    const errorDetails = validationResult.error?.details.map(issue => 
      `${issue.path.join('.')}: ${issue.message}`
    ).join(", ");
    
    logger.warn({
      error: validationResult.error?.message,
      details: errorDetails,
    }, "Webhook payload validation failed");
    
    return {
      update: null,
      validationError: validationResult.error?.message,
    };
  }

  // At this point, validationResult.data is guaranteed to exist
  const update = validationResult.data;

  // Additional check for valid message
  if (!hasValidMessage(update)) {
    logger.info({ updateId: update.update_id }, "Update has no message content");
  }

  return { update };
}

/**
 * Extract callback query data from Telegram update
 */
function extractCallbackQuery(update: TelegramUpdate): TelegramCallbackQuery | null {
  return update.callback_query || null;
}

/**
 * Handle bot commands using registry pattern
 * 
 * Commands are now handled by dedicated handler classes in commands/ directory.
 * This keeps webhook.ts lean and makes commands independently testable.
 */
async function handleCommand(
  ctx: any,
  command: string,
  userData: ExtractedUserData,
  chatId: number,
  messageText: string
): Promise<void> {
  const handler = getCommandHandler(command as any);
  
  if (!handler) {
    logger.warn({ command }, "No handler found for command");
    return;
  }

  await handler.execute(ctx, userData, chatId, messageText);
}

/**
 * Handle callback query (inline button press)
 * 
 * AC6: Callback Query Handling
 * AC7: Confirmation Message
 * AC10: Message History
 */
async function handleCallbackQuery(
  ctx: any,
  callbackQuery: TelegramCallbackQuery
): Promise<void> {
  const { id: callbackQueryId, from, data, message } = callbackQuery;
  const chatId = from.id;

  // Get user
  const user = await ctx.runQuery(api.users.getByTelegramId.getByTelegramId, {
    telegramId: String(from.id),
  });

  if (!user) {
    logger.error({ telegramId: from.id }, "User not found for callback query");
    return;
  }

  // Get user profile for language preference
  const profile = await ctx.runQuery(api.users.getProfile.getProfile, {
    userId: user._id,
  });
  const language: "ar" | "en" = profile?.language || "ar";

  // Handle language selection (Story 1.3)
  if (data && data.startsWith(CALLBACK_PATTERNS.LANGUAGE_PREFIX)) {
    const selectedLanguage = data.replace(CALLBACK_PATTERNS.LANGUAGE_PREFIX, "") as "ar" | "en";

    // Update language preference
    await ctx.runMutation(api.users.updateProfile.updateProfile, {
      userId: user._id,
      language: selectedLanguage,
    });

    // Acknowledge button press (must be within 30 seconds)
    await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
      callbackQueryId,
    });

    // Send confirmation message in selected language
    const confirmationMessage = MESSAGES.LANGUAGE_SELECTED[selectedLanguage];
    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: confirmationMessage,
    });

    // Store confirmation in message history
    await ctx.runMutation(api.messages.create.create, {
      userId: user._id,
      role: "assistant",
      content: confirmationMessage,
    });

    logger.info(
      { telegramId: from.id, userId: user._id, language: selectedLanguage },
      "Language preference updated and confirmation sent"
    );
    return;
  }

  // Handle account creation confirmation (Story 2.1 - AC4, AC5)
  if (data && data.startsWith(CALLBACK_PATTERNS.CONFIRM_ACCOUNT_PREFIX)) {
    const pendingIdStr = data.replace(CALLBACK_PATTERNS.CONFIRM_ACCOUNT_PREFIX, "");
    
    // Query pending action by ID
    const pending = await ctx.runQuery(api.pendingActions.getById.getById, {
      pendingId: pendingIdStr as any,
    });

    if (!pending) {
      // Action expired or not found
      const errorMsg = language === "ar"
        ? "⏰ انتهت صلاحية التأكيد. أرسل طلبك مرة أخرى."
        : "⏰ Confirmation expired. Please send your request again.";

      await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
        callbackQueryId,
        text: errorMsg,
        showAlert: true,
      });

      logger.warn({ pendingIdStr, userId: user._id }, "Pending action not found or expired");
      return;
    }

    // Extract action data
    const actionData = pending.actionData;
    const { accountType, accountName, initialBalance, currency } = actionData;

    try {
      // Create account (AC5)
      const accountId = await ctx.runMutation(api.accounts.create.create, {
        userId: user._id,
        accountType,
        accountName,
        initialBalance,
        currency,
      });

      // Get created account
      const account = await ctx.runQuery(api.accounts.getById.getById, {
        accountId,
      });

      if (!account) {
        throw new Error("Account creation failed");
      }

      // Check if user has multiple accounts for default prompt (AC6)
      const accountCount = await ctx.runQuery(api.accounts.count.count, {
        userId: user._id,
      });

      // Delete pending action
      await ctx.runMutation(api.pendingActions.deletePending.deletePending, {
        pendingId: pending._id,
      });

      // Acknowledge button press
      await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
        callbackQueryId,
        text: language === "ar" ? "✅ تم الإنشاء" : "✅ Created",
      });

      // Send success message with accounts overview (AC7)
      const { sendAccountSuccessMessage } = await import("../lib/responseHelpers");
      await sendAccountSuccessMessage(ctx, {
        account,
        userId: user._id,
        language,
        chatId,
      });

      // If this is not the first account, ask about setting as default (AC6)
      if (accountCount > 1 && !account.isDefault) {
        const { getDefaultAccountPromptKeyboard } = await import("../lib/keyboards");
        const { ACCOUNT_MESSAGES } = await import("../lib/constants");
        
        const defaultPrompt = ACCOUNT_MESSAGES.SET_AS_DEFAULT[language];
        await ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId,
          text: defaultPrompt,
          replyMarkup: getDefaultAccountPromptKeyboard(accountId, language),
        });
      }

      logger.info(
        { userId: user._id, accountId, accountType },
        "Account created successfully via confirmation"
      );

    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          userId: user._id,
          actionData,
        },
        "Error creating account from confirmation"
      );

      await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
        callbackQueryId,
        text: language === "ar" ? "❌ حدث خطأ" : "❌ Error occurred",
        showAlert: true,
      });
    }
    return;
  }

  // Handle account creation cancellation (Story 2.1 - AC4)
  if (data && data.startsWith(CALLBACK_PATTERNS.CANCEL_ACCOUNT_PREFIX)) {
    const pendingIdStr = data.replace(CALLBACK_PATTERNS.CANCEL_ACCOUNT_PREFIX, "");
    
    // Delete pending action if exists
    const pending = await ctx.runQuery(api.pendingActions.getById.getById, {
      pendingId: pendingIdStr as any,
    });

    if (pending) {
      await ctx.runMutation(api.pendingActions.deletePending.deletePending, {
        pendingId: pending._id,
      });
    }

    // Acknowledge button press
    await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
      callbackQueryId,
      text: language === "ar" ? "❌ تم الإلغاء" : "❌ Cancelled",
    });

    // Send cancellation message
    const cancelMsg = language === "ar"
      ? "تم إلغاء إنشاء الحساب."
      : "Account creation cancelled.";

    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: cancelMsg,
    });

    logger.info({ userId: user._id }, "Account creation cancelled by user");
    return;
  }

  // Handle set default account (Story 2.1 - AC6)
  if (data && (data.startsWith(CALLBACK_PATTERNS.SET_DEFAULT_YES) || data.startsWith(CALLBACK_PATTERNS.SET_DEFAULT_NO))) {
    const isYes = data.startsWith(CALLBACK_PATTERNS.SET_DEFAULT_YES);
    
    if (isYes) {
      const accountId = data.replace(CALLBACK_PATTERNS.SET_DEFAULT_YES, "");
      
      // TODO: Implement setDefaultAccount mutation
      // For now, just acknowledge
      await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
        callbackQueryId,
        text: language === "ar" ? "✅ تم التعيين كافتراضي" : "✅ Set as default",
      });

      const successMsg = language === "ar"
        ? "✅ تم تعيين الحساب كافتراضي"
        : "✅ Account set as default";

      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: successMsg,
      });
    } else {
      await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
        callbackQueryId,
        text: language === "ar" ? "حسناً" : "OK",
      });
    }

    logger.info({ userId: user._id, isYes }, "Default account prompt answered");
    return;
  }

  // Handle account type selection (Story 2.1 - AC13 Clarification)
  if (data && data.startsWith(CALLBACK_PATTERNS.ACCOUNT_TYPE_PREFIX)) {
    const accountType = data.replace(CALLBACK_PATTERNS.ACCOUNT_TYPE_PREFIX, "");

    logger.info(
      { userId: user._id, accountType },
      "Account type selected from clarification"
    );

    // Acknowledge button press
    await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
      callbackQueryId,
      text: language === "ar" ? "✅ تم الاختيار" : "✅ Selected",
    });

    // Import clarification handler
    const { askInitialBalance } = await import("../lib/clarificationHandler");
    
    // Ask for initial balance
    await askInitialBalance(ctx, {
      userId: user._id,
      language,
      chatId,
      accountType,
    });

    logger.info({ userId: user._id, accountType }, "Asking for initial balance");
    return;
  }
}

/**
 * Main webhook handler - receives all Telegram updates
 */
export const webhook = httpAction(async (_ctx, request): Promise<Response> => {
  const startTime = Date.now();
  
  logger.info({
    method: request.method,
    url: request.url,
    headers: {
      contentType: request.headers.get("content-type"),
      userAgent: request.headers.get("user-agent"),
    },
  }, "Webhook request received");

  // Only accept POST requests
  if (request.method !== "POST") {
    logger.warn({ method: request.method }, "Invalid HTTP method");
    // Return 200 OK even for invalid methods to prevent Telegram retries
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let result: WebhookProcessingResult = {
    success: false,
    updateId: 0,
  };

  try {
    // Parse request body
    const body = await request.json();
    const { update, validationError } = parseWebhookPayload(body);

    if (!update) {
      logger.warn({ validationError }, "Invalid webhook payload structure");
      result.error = validationError || "Invalid payload structure";
      
      // Return 200 OK to prevent Telegram retries (AC8)
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    result.updateId = update.update_id;

    // Handle callback queries (inline button presses) (AC6)
    const callbackQuery = extractCallbackQuery(update);
    if (callbackQuery) {
      logger.info({
        updateId: update.update_id,
        callbackQueryId: callbackQuery.id,
        data: callbackQuery.data,
      }, "Callback query detected");

      await handleCallbackQuery(_ctx, callbackQuery);
      
      result.success = true;
      
      // Return 200 OK after handling callback query
      const processingTime = Date.now() - startTime;
      logger.info({
        updateId: update.update_id,
        processingTimeMs: processingTime,
        type: "callback_query",
      }, "Callback query processed successfully");

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract user data
    const userData = extractUserData(update);
    if (userData) {
      result.userData = userData;
      logger.info({
        updateId: update.update_id,
        telegramId: userData.telegramId,
        username: userData.username,
        firstName: userData.firstName,
      }, "User data extracted");
    }

    // Extract message content
    const message = extractMessage(update);
    if (message) {
      result.message = message;
      logger.info({
        updateId: update.update_id,
        messageId: message.messageId,
        hasText: !!message.text,
        hasVoice: message.hasVoice,
        textPreview: message.text?.substring(0, 50),
      }, "Message extracted");

      // Detect and handle commands (AC1)
      if (message.text && userData) {
        const command = detectCommand(message.text);

        if (command) {
          logger.info({
            updateId: update.update_id,
            telegramId: userData.telegramId,
            command,
          }, "Command detected");

          // Execute command via registry pattern
          await handleCommand(_ctx, command, userData, message.chatId, message.text);
          
          result.success = true;
          
          // Return 200 OK after handling command
          const processingTime = Date.now() - startTime;
          logger.info({
            updateId: update.update_id,
            processingTimeMs: processingTime,
            command,
          }, "Command processed successfully");

          // Warn if processing time exceeds targets
          const targetMs = command === "help" ? 1000 : 2000;
          if (processingTime > targetMs) {
            logger.warn({
              updateId: update.update_id,
              processingTimeMs: processingTime,
              targetMs,
              command,
            }, "Command processing time exceeded target");
          }

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Check if user is in middle of clarification flow (Story 2.1 - AC13)
        // Look for pending clarify_balance action
        const user = await _ctx.runQuery(api.users.getByTelegramId.getByTelegramId, {
          telegramId: String(userData.telegramId),
        });

        if (user) {
          // Get user profile for language
          const userProfile = await _ctx.runQuery(api.users.getProfile.getProfile, {
            userId: user._id,
          });
          const userLanguage: "ar" | "en" = userProfile?.language || "ar";

          // Check for pending balance clarification using query
          const pendingBalances = await _ctx.runQuery(
            api.pendingActions.getPendingByUserAndType.getPendingByUserAndType,
            {
              userId: user._id,
              actionType: "clarify_balance",
            }
          );

          const validPending = pendingBalances[0]; // Get first (most recent)

          if (validPending) {
            // User is responding with balance amount
            logger.info(
              { userId: user._id, messageText: message.text },
              "Processing balance input from clarification"
            );

            try {
              // Parse balance from message
              const balance = parseFloat(message.text.replace(/[^\d.-]/g, ''));
              
              if (isNaN(balance)) {
                // Invalid number
                const errorMsg = userLanguage === "ar"
                  ? "الرجاء إدخال رقم صحيح للرصيد."
                  : "Please enter a valid number for the balance.";

                await _ctx.runAction(api.telegram.sendMessage.sendMessage, {
                  chatId: message.chatId,
                  text: errorMsg,
                });

                return new Response(JSON.stringify({ ok: true }), {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                });
              }

              // Get account type from pending action
              const { accountType } = validPending.actionData;

              // Delete pending action
              await _ctx.runMutation(api.pendingActions.deletePending.deletePending, {
                pendingId: validPending._id,
              });

              // Send confirmation with complete entities
              const { sendAccountConfirmation } = await import("../lib/confirmationHandler");
              await sendAccountConfirmation(_ctx, {
                userId: user._id,
                entities: {
                  accountType,
                  initialBalance: balance,
                  currency: undefined, // Will use profile default
                  accountName: undefined, // Will auto-generate
                },
                language: userLanguage,
                chatId: message.chatId,
              });

              return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            } catch (error) {
              logger.error({
                error: error instanceof Error ? error.message : String(error),
                userId: user._id,
              }, "Error processing balance clarification");
              // Continue to regular processing below
            }
          }
        }

        // No slash command detected - check for natural language account commands
        // Story 2.1: Handle natural language account creation
        // Use keyword detection for routing, let handler do full AI parsing
        const lowerText = message.text.toLowerCase();
        const accountKeywords = [
          "create", "account", "أنشئ", "حساب", "إنشاء",
          "wallet", "محفظة", "bank", "بنك", "cash", "نقدي"
        ];

        const hasAccountKeyword = accountKeywords.some(keyword => lowerText.includes(keyword));

        if (hasAccountKeyword) {
          logger.info({
            updateId: update.update_id,
            telegramId: userData.telegramId,
            textPreview: message.text.substring(0, 50),
          }, "Account-related keywords detected - routing to createAccountCommand");

          try {
            const { CreateAccountCommandHandler } = await import("../commands/createAccountCommand");
            const handler = new CreateAccountCommandHandler();
            await handler.execute(_ctx, userData, message.chatId, message.text);
            
            result.success = true;
            
            const processingTime = Date.now() - startTime;
            logger.info({
              updateId: update.update_id,
              processingTimeMs: processingTime,
            }, "Account command processed successfully");

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } catch (error) {
            logger.error({
              error: error instanceof Error ? error.message : String(error),
              updateId: update.update_id,
              telegramId: userData.telegramId,
            }, "Error processing account command");
            
            // Send error message to user
            const errorMsg = language === "ar"
              ? "❌ عذراً، حدث خطأ أثناء معالجة طلبك. الرجاء المحاولة مرة أخرى."
              : "❌ Sorry, an error occurred while processing your request. Please try again.";

            await _ctx.runAction(api.telegram.sendMessage.sendMessage, {
              chatId: message.chatId,
              text: errorMsg,
            });

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        // No keywords matched - send help message
        logger.info({
          updateId: update.update_id,
          telegramId: userData.telegramId,
          messagePreview: message.text.substring(0, 30),
        }, "Message did not match any keywords - sending help");

        // Get user profile for language
        const helpUser = await _ctx.runQuery(api.users.getByTelegramId.getByTelegramId, {
          telegramId: String(userData.telegramId),
        });

        const helpUserProfile = helpUser ? await _ctx.runQuery(api.users.getProfile.getProfile, {
          userId: helpUser._id,
        }) : null;

        const helpLanguage: "ar" | "en" = helpUserProfile?.language || "ar";

        const helpMsg = helpLanguage === "ar"
          ? "لم أفهم طلبك. استخدم /help لمعرفة الأوامر المتاحة.\n\nأمثلة:\n• أنشئ حساب محفظة برصيد 500 جنيه\n• Create bank account with 1000 USD"
          : "I didn't understand your request. Use /help to see available commands.\n\nExamples:\n• Create cash account with 500 EGP\n• أنشئ حساب بنك برصيد 1000 جنيه";

        await _ctx.runAction(api.telegram.sendMessage.sendMessage, {
          chatId: message.chatId,
          text: helpMsg,
        });
      }
    }

    result.success = true;

    // Log successful processing
    const processingTime = Date.now() - startTime;
    logger.info({
      updateId: update.update_id,
      processingTimeMs: processingTime,
      hasUser: !!userData,
      hasMessage: !!message,
    }, "Webhook processed successfully");

    // Warn if processing time exceeds target (AC4)
    if (processingTime > 500) {
      logger.warn({
        updateId: update.update_id,
        processingTimeMs: processingTime,
        targetMs: 500,
      }, "Processing time exceeded target");
    }

    // Return 200 OK (AC1)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    // Log error with full context (AC8)
    const processingTime = Date.now() - startTime;
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: processingTime,
      updateId: result.updateId,
    }, "Webhook processing error");

    result.error = error instanceof Error ? error.message : "Unknown error";

    // Return 200 OK even on errors to prevent Telegram retries (AC8)
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
