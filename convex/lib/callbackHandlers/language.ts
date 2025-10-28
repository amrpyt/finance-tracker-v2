/**
 * Language Selection Callback Handler
 * 
 * Handles language preference selection (Story 1.3)
 * 
 * @see docs/stories/story-TD-001.md
 */

import { api } from "../../_generated/api";
import type { CallbackContext } from "../callbackRegistry";
import { extractParameter } from "../callbackRegistry";
import { CALLBACK_PATTERNS, MESSAGES } from "../constants";

/**
 * Handle language selection (Story 1.3)
 */
export async function handleLanguageSelection(context: CallbackContext): Promise<void> {
  const { ctx, userId, data } = context;
  const { editCallbackMessage } = await import("../callbackHelpers");
  const selectedLanguage = extractParameter(data, CALLBACK_PATTERNS.LANGUAGE_PREFIX) as "ar" | "en";

  // Update language preference
  await ctx.runMutation(api.users.updateProfile.updateProfile, {
    userId: userId as any,
    language: selectedLanguage,
  });

  // Edit original message with confirmation in selected language
  const confirmationMessage = MESSAGES.LANGUAGE_SELECTED[selectedLanguage];
  
  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId: context.callbackQueryId,
    text: selectedLanguage === "ar" ? "✅ تم الاختيار" : "✅ Selected",
  });

  await editCallbackMessage(context, confirmationMessage);

  // Store confirmation in message history
  await ctx.runMutation(api.messages.create.create, {
    userId: userId as any,
    role: "assistant",
    content: confirmationMessage,
  });

  console.info(`[LanguageHandler] Language preference updated: ${selectedLanguage}`);
}

// Export for registry registration
export { handleLanguageSelection as languageSelection };
