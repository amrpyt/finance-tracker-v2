/**
 * Telegram Webhook Payload Fixtures
 * 
 * Mock Telegram API payloads for testing bot functionality
 */

export const TEST_USER = {
  id: 667858457,
  first_name: "Test",
  last_name: "User",
  username: "testuser",
  language_code: "en",
};

/**
 * /start command payload
 */
export function createStartCommandPayload(updateId: number = 1): any {
  return {
    update_id: updateId,
    message: {
      message_id: updateId,
      from: TEST_USER,
      chat: {
        id: TEST_USER.id,
        first_name: TEST_USER.first_name,
        last_name: TEST_USER.last_name,
        username: TEST_USER.username,
        type: "private",
      },
      date: Math.floor(Date.now() / 1000),
      text: "/start",
    },
  };
}

/**
 * /help command payload
 */
export function createHelpCommandPayload(updateId: number = 2): any {
  return {
    update_id: updateId,
    message: {
      message_id: updateId,
      from: TEST_USER,
      chat: {
        id: TEST_USER.id,
        first_name: TEST_USER.first_name,
        last_name: TEST_USER.last_name,
        username: TEST_USER.username,
        type: "private",
      },
      date: Math.floor(Date.now() / 1000),
      text: "/help",
    },
  };
}

/**
 * Language selection callback query
 */
export function createLanguageCallbackPayload(
  language: "ar" | "en",
  updateId: number = 3
): any {
  return {
    update_id: updateId,
    callback_query: {
      id: `cbq_${updateId}`,
      from: TEST_USER,
      message: {
        message_id: updateId - 1,
        from: {
          id: 123456789,
          is_bot: true,
          first_name: "Finance Tracker",
          username: "finance_tracker_bot",
        },
        chat: {
          id: TEST_USER.id,
          first_name: TEST_USER.first_name,
          last_name: TEST_USER.last_name,
          username: TEST_USER.username,
          type: "private",
        },
        date: Math.floor(Date.now() / 1000),
        text: "Welcome message",
      },
      chat_instance: "1234567890",
      data: `lang_${language}`,
    },
  };
}

/**
 * Generic text message payload
 */
export function createTextMessagePayload(
  text: string,
  updateId: number = 4
): any {
  return {
    update_id: updateId,
    message: {
      message_id: updateId,
      from: TEST_USER,
      chat: {
        id: TEST_USER.id,
        first_name: TEST_USER.first_name,
        last_name: TEST_USER.last_name,
        username: TEST_USER.username,
        type: "private",
      },
      date: Math.floor(Date.now() / 1000),
      text,
    },
  };
}

/**
 * Invalid payload (missing required fields)
 */
export function createInvalidPayload(): any {
  return {
    update_id: 999,
    // Missing message field
  };
}
