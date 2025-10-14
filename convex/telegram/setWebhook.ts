/**
 * Telegram Webhook Registration HTTP Action
 * 
 * Registers the webhook URL with Telegram Bot API.
 * This should be called once after deployment to configure the bot.
 * 
 * Usage: POST https://<deployment-name>.convex.site/telegram/setWebhook
 */

import { httpAction } from "../_generated/server";
import pino from "pino";

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

interface TelegramSetWebhookResponse {
  ok: boolean;
  result?: boolean;
  description?: string;
  error_code?: number;
}

interface SetWebhookResult {
  success: boolean;
  webhookUrl: string;
  telegramResponse?: TelegramSetWebhookResponse;
  error?: string;
}

/**
 * HTTP Action to register webhook with Telegram Bot API
 */
export const setWebhook = httpAction(async (_ctx, request): Promise<Response> => {
  logger.info({ url: request.url }, "Webhook registration requested");

  try {
    // Get bot token from environment variables (AC6)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      const error = "TELEGRAM_BOT_TOKEN not configured in environment variables";
      logger.error(error);
      
      return new Response(JSON.stringify({
        success: false,
        error,
        instructions: "Set TELEGRAM_BOT_TOKEN in Convex Dashboard → Settings → Environment Variables",
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Construct webhook URL from current request URL
    const requestUrl = new URL(request.url);
    const webhookUrl = `${requestUrl.protocol}//${requestUrl.host}/telegram/webhook`;
    
    logger.info({ webhookUrl }, "Constructed webhook URL");

    // Call Telegram Bot API setWebhook endpoint
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
    
    logger.info("Calling Telegram setWebhook API");
    
    const telegramResponse = await fetch(telegramApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "edited_message"],
        drop_pending_updates: true, // Clear any pending updates from previous webhook
      }),
    });

    const telegramData = await telegramResponse.json() as TelegramSetWebhookResponse;
    
    logger.info({
      ok: telegramData.ok,
      result: telegramData.result,
      description: telegramData.description,
      statusCode: telegramResponse.status,
    }, "Telegram API response received");

    const result: SetWebhookResult = {
      success: telegramData.ok,
      webhookUrl,
      telegramResponse: telegramData,
    };

    // Handle Telegram API errors
    if (!telegramData.ok) {
      const errorMsg = telegramData.description || "Unknown error from Telegram API";
      result.error = errorMsg;
      
      logger.error({
        error: errorMsg,
        errorCode: telegramData.error_code,
      }, "Telegram webhook registration failed");

      return new Response(JSON.stringify(result), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Success response
    logger.info({
      webhookUrl,
      success: true,
    }, "Webhook registered successfully");

    return new Response(JSON.stringify({
      ...result,
      message: "Webhook registered successfully",
      nextSteps: [
        "Send a message to your bot on Telegram",
        "Check Convex logs to verify webhook is receiving messages",
        `Verify webhook: curl "https://api.telegram.org/bot${botToken.substring(0, 10)}***/getWebhookInfo"`,
      ],
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error({
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    }, "Webhook registration error");

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
