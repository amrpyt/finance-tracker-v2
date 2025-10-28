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
import { routeCallback } from "../lib/callbackRegistry";

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
 * REFACTORED: TD-001 Phase 2 - Now uses callback registry for routing
 * All callback handlers are organized in convex/lib/callbackHandlers/
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

  // Route callback to appropriate handler via registry
  await routeCallback({
    ctx,
    userId: user._id,
    language,
    chatId,
    callbackQueryId,
    data: data || "",
    message,
  });
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

        // Check if user is in middle of clarification flow or edit account name flow
        const user = await _ctx.runQuery(api.users.getByTelegramId.getByTelegramId, {
          telegramId: String(userData.telegramId),
        });

        if (user) {
          // Get user profile for language
          const userProfile = await _ctx.runQuery(api.users.getProfile.getProfile, {
            userId: user._id,
          });
          const userLanguage: "ar" | "en" = userProfile?.language || "ar";

          // Check for active conversation state
          const conversationState = await _ctx.runQuery(api.conversationStates.get.get, {
            userId: user._id,
          });

          if (conversationState && conversationState.stateType === "awaiting_account_name") {
            // User is providing new account name
            logger.info(
              { userId: user._id, messageText: message.text },
              "Processing account name input from edit flow"
            );

            const { accountId, oldName } = conversationState.stateData;
            const newName = message.text;

            // Validate name
            const { validateAccountName, createNameConfirmation, createDuplicateNameError } = 
              await import("../lib/editAccountName");
            
            const validation = validateAccountName(newName, userLanguage);

            if (!validation.isValid) {
              // Send validation error and retry prompt
              await _ctx.runAction(api.telegram.sendMessage.sendMessage, {
                chatId: message.chatId,
                text: validation.error!,
              });

              return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            // Check for duplicate name
            const existingAccount = await _ctx.runQuery(api.accounts.getByName.getByName, {
              userId: user._id,
              accountName: validation.trimmedName!,
            });

            if (existingAccount && existingAccount._id !== accountId) {
              // Duplicate name found
              const errorMsg = createDuplicateNameError(validation.trimmedName!, userLanguage);
              
              await _ctx.runAction(api.telegram.sendMessage.sendMessage, {
                chatId: message.chatId,
                text: errorMsg,
              });

              return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }

            // Name is valid - show confirmation
            const confirmation = createNameConfirmation(
              oldName,
              validation.trimmedName!,
              accountId,
              userLanguage
            );

            // Update conversation state to awaiting confirmation
            await _ctx.runMutation(api.conversationStates.set.set, {
              userId: user._id,
              stateType: "awaiting_name_confirmation",
              stateData: {
                accountId,
                oldName,
                newName: validation.trimmedName!,
              },
              expirationMinutes: 5,
            });

            // Send confirmation message
            await _ctx.runAction(api.telegram.sendMessage.sendMessage, {
              chatId: message.chatId,
              text: confirmation.message,
              parseMode: "Markdown",
              replyMarkup: confirmation.keyboard,
            });

            // Store message in history
            await _ctx.runMutation(api.messages.create.create, {
              userId: user._id,
              role: "user",
              content: message.text,
            });

            logger.info(
              { userId: user._id, newName: validation.trimmedName },
              "Name confirmation sent"
            );

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Check for pending balance clarification
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

        // AI-DRIVEN INTENT ROUTING
        logger.info({
          updateId: update.update_id,
          telegramId: userData.telegramId,
          textPreview: message.text.substring(0, 50),
        }, "Parsing message with AI for intent detection");

        try {
          // Get user profile for language
          const aiUser = await _ctx.runQuery(api.users.getByTelegramId.getByTelegramId, {
            telegramId: String(userData.telegramId),
          });

          if (!aiUser) {
            logger.warn({ telegramId: userData.telegramId }, "User not found for AI parsing");
            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const aiProfile = await _ctx.runQuery(api.users.getProfile.getProfile, {
            userId: aiUser._id,
          });
          const aiLanguage: "ar" | "en" = aiProfile?.language || "ar";

          // Fetch recent conversation history for AI context
          const conversationHistory = await _ctx.runQuery(api.messages.getRecent.getRecent, {
            userId: aiUser._id,
            limit: 10,
          });

          // UNIFIED PARSER: Single AI call detects ALL intent types
          // Performance: ~2 seconds instead of ~9 seconds (3 sequential calls)
          const parseResult = await _ctx.runAction(api.ai.parseUnifiedIntent.parseUnifiedIntent, {
            userMessage: message.text,
            language: aiLanguage,
            conversationHistory,
          });

          logger.info({
            updateId: update.update_id,
            telegramId: userData.telegramId,
            intent: parseResult.intent,
            confidence: parseResult.confidence,
          }, "Unified intent detected (single AI call)");

          // Route based on AI-detected intent
          if (parseResult.intent === "view_accounts" && parseResult.confidence >= 0.7) {
            const { ViewAccountsCommandHandler } = await import("../commands/viewAccountsCommand");
            const handler = new ViewAccountsCommandHandler();
            await handler.execute(_ctx, userData, message.chatId, message.text);
            
            result.success = true;
            const processingTime = Date.now() - startTime;
            logger.info({
              updateId: update.update_id,
              processingTimeMs: processingTime,
            }, "View accounts command processed via AI routing");

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } else if (parseResult.intent === "create_account" && parseResult.confidence >= 0.7) {
            const { CreateAccountCommandHandler } = await import("../commands/createAccountCommand");
            const handler = new CreateAccountCommandHandler();
            await handler.execute(_ctx, userData, message.chatId, message.text);
            
            result.success = true;
            const processingTime = Date.now() - startTime;
            logger.info({
              updateId: update.update_id,
              processingTimeMs: processingTime,
            }, "Create account command processed via AI routing");

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } else if (parseResult.intent === "edit_account" && parseResult.confidence >= 0.7) {
            const { EditAccountCommandHandler } = await import("../commands/editAccountCommand");
            const handler = new EditAccountCommandHandler();
            await handler.execute(_ctx, userData, message.chatId, message.text);
            
            result.success = true;
            const processingTime = Date.now() - startTime;
            logger.info({
              updateId: update.update_id,
              processingTimeMs: processingTime,
            }, "Edit account command processed via AI routing");

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } else if (parseResult.intent === "set_default_account" && parseResult.confidence >= 0.7) {
            const { SetDefaultAccountCommandHandler } = await import("../commands/setDefaultAccountCommand");
            const handler = new SetDefaultAccountCommandHandler();
            await handler.execute(_ctx, userData, message.chatId, message.text);
            
            result.success = true;
            const processingTime = Date.now() - startTime;
            logger.info({
              updateId: update.update_id,
              processingTimeMs: processingTime,
            }, "Set default account command processed via AI routing");

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } else if (parseResult.intent === "delete_account" && parseResult.confidence >= 0.7) {
            const { DeleteAccountCommandHandler } = await import("../commands/deleteAccountCommand");
            const handler = new DeleteAccountCommandHandler();
            await handler.execute(_ctx, userData, message.chatId, message.text);
            
            result.success = true;
            const processingTime = Date.now() - startTime;
            logger.info({
              updateId: update.update_id,
              processingTimeMs: processingTime,
            }, "Delete account command processed via AI routing");

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } else if (parseResult.intent === "log_expense" && parseResult.confidence >= 0.7) {
            // Expense logging intent - Pass parsed result to avoid duplicate parsing
            const { LogExpenseCommandHandler } = await import("../commands/logExpenseCommand");
            const handler = new LogExpenseCommandHandler();
            await handler.execute(_ctx, userData, message.chatId, message.text, parseResult);
            
            result.success = true;
            const processingTime = Date.now() - startTime;
            logger.info({
              updateId: update.update_id,
              processingTimeMs: processingTime,
            }, "Log expense command processed via unified AI routing");

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } else if (parseResult.intent === "log_income" && parseResult.confidence >= 0.7) {
            // Income logging intent - Pass parsed result to avoid duplicate parsing
            const { LogIncomeCommandHandler } = await import("../commands/logIncomeCommand");
            const handler = new LogIncomeCommandHandler();
            await handler.execute(_ctx, userData, message.chatId, message.text, parseResult);
            
            result.success = true;
            const processingTime = Date.now() - startTime;
            logger.info({
              updateId: update.update_id,
              processingTimeMs: processingTime,
            }, "Log income command processed via unified AI routing");

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } else {

            // Unknown or low confidence intent - Use AI to generate contextual response
            logger.info({
              updateId: update.update_id,
              intent: parseResult.intent,
              confidence: parseResult.confidence,
              message: message.text,
              historyLength: conversationHistory.length,
            }, "Unknown or low confidence intent - generating AI response with context");

            // Store user message in history BEFORE generating response
            await _ctx.runMutation(api.messages.create.create, {
              userId: aiUser._id,
              role: "user",
              content: message.text,
            });

            // Call AI to generate a helpful, contextual response with conversation history
            const aiResponse = await _ctx.runAction(api.ai.nlParser.generateContextualResponse, {
              userMessage: message.text,
              language: aiLanguage,
              availableFeatures: ["create_account", "view_accounts", "edit_account", "log_expense", "log_income"],
              conversationHistory,
            });

            // Store assistant response in history
            await _ctx.runMutation(api.messages.create.create, {
              userId: aiUser._id,
              role: "assistant",
              content: aiResponse,
            });

            await _ctx.runAction(api.telegram.sendMessage.sendMessage, {
              chatId: message.chatId,
              text: aiResponse,
            });

            logger.info({
              updateId: update.update_id,
              responseLength: aiResponse.length,
            }, "AI contextual response sent");

            return new Response(JSON.stringify({ ok: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch (error) {
          logger.error({
            error: error instanceof Error ? error.message : String(error),
            updateId: update.update_id,
            telegramId: userData.telegramId,
          }, "Error in AI intent routing");

          // Fallback error message
          const errorUser = await _ctx.runQuery(api.users.getByTelegramId.getByTelegramId, {
            telegramId: String(userData.telegramId),
          });
          const errorProfile = errorUser ? await _ctx.runQuery(api.users.getProfile.getProfile, {
            userId: errorUser._id,
          }) : null;
          const errorLanguage: "ar" | "en" = errorProfile?.language || "ar";

          const errorMsg = errorLanguage === "ar"
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

    // Warn if processing time exceeds target
    if (processingTime > 500) {
      logger.warn({
        updateId: update.update_id,
        processingTimeMs: processingTime,
        targetMs: 500,
      }, "Processing time exceeded target");
    }

    // Return 200 OK
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    // Log error with full context
    const processingTime = Date.now() - startTime;
    logger.error({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: processingTime,
      updateId: result.updateId,
    }, "Webhook processing error");

    result.error = error instanceof Error ? error.message : "Unknown error";

    // Return 200 OK even on errors to prevent Telegram retries
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});