/**
 * Telegram Bot API Type Definitions
 * Based on Telegram Bot API v7.10
 * https://core.telegram.org/bots/api
 */

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  sender_chat?: TelegramChat;
  date: number;
  chat: TelegramChat;
  text?: string;
  voice?: {
    file_id: string;
    file_unique_id: string;
    duration: number;
    mime_type?: string;
    file_size?: number;
  };
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  inline_message_id?: string;
  chat_instance: string;
  data?: string;
  game_short_name?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface ExtractedUserData {
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  languageCode?: string;
}

export interface ExtractedMessage {
  messageId: number;
  text?: string;
  hasVoice: boolean;
  voiceFileId?: string;
  date: number;
  chatId: number;
}

export interface WebhookProcessingResult {
  success: boolean;
  updateId: number;
  userData?: ExtractedUserData;
  message?: ExtractedMessage;
  error?: string;
}
