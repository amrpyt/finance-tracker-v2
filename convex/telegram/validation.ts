/**
 * Telegram Webhook Payload Validation
 * 
 * Uses Zod for runtime type validation of incoming webhook payloads.
 * Ensures type safety and provides detailed error messages for debugging.
 */

import { z } from "zod";

/**
 * Zod schema for Telegram User object
 */
export const TelegramUserSchema = z.object({
  id: z.number(),
  is_bot: z.boolean(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
});

/**
 * Zod schema for Telegram Chat object
 */
export const TelegramChatSchema = z.object({
  id: z.number(),
  type: z.enum(["private", "group", "supergroup", "channel"]),
  title: z.string().optional(),
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

/**
 * Zod schema for Telegram Voice object
 */
export const TelegramVoiceSchema = z.object({
  file_id: z.string(),
  file_unique_id: z.string(),
  duration: z.number(),
  mime_type: z.string().optional(),
  file_size: z.number().optional(),
});

/**
 * Zod schema for Telegram Message object
 */
export const TelegramMessageSchema = z.object({
  message_id: z.number(),
  from: TelegramUserSchema.optional(),
  sender_chat: TelegramChatSchema.optional(),
  date: z.number(),
  chat: TelegramChatSchema,
  text: z.string().optional(),
  voice: TelegramVoiceSchema.optional(),
});

/**
 * Zod schema for Telegram Callback Query object
 */
export const TelegramCallbackQuerySchema = z.object({
  id: z.string(),
  from: TelegramUserSchema,
  message: TelegramMessageSchema.optional(),
  inline_message_id: z.string().optional(),
  chat_instance: z.string(),
  data: z.string().optional(),
  game_short_name: z.string().optional(),
});

/**
 * Zod schema for Telegram Update object
 */
export const TelegramUpdateSchema = z.object({
  update_id: z.number(),
  message: TelegramMessageSchema.optional(),
  edited_message: TelegramMessageSchema.optional(),
  channel_post: TelegramMessageSchema.optional(),
  edited_channel_post: TelegramMessageSchema.optional(),
  callback_query: TelegramCallbackQuerySchema.optional(),
});

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details: z.ZodIssue[];
  };
}

/**
 * Validate Telegram webhook payload using Zod schema
 * 
 * @param payload - Raw webhook payload from Telegram
 * @returns Validation result with parsed data or error details
 */
export function validateWebhookPayload(
  payload: unknown
): ValidationResult<z.infer<typeof TelegramUpdateSchema>> {
  try {
    const result = TelegramUpdateSchema.safeParse(payload);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    return {
      success: false,
      error: {
        message: "Invalid webhook payload structure",
        details: result.error.issues,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Validation error",
        details: [],
      },
    };
  }
}

/**
 * Check if update contains a valid message
 */
export function hasValidMessage(
  update: z.infer<typeof TelegramUpdateSchema>
): boolean {
  return !!(update.message || update.edited_message);
}

/**
 * Check if message is from a user (not a channel or bot)
 */
export function isUserMessage(
  update: z.infer<typeof TelegramUpdateSchema>
): boolean {
  const message = update.message || update.edited_message;
  return !!message?.from && !message.from.is_bot;
}
