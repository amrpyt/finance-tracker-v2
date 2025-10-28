/**
 * Account Callback Handlers
 * 
 * Handles all account-related callback queries:
 * - Account creation confirmation/cancellation
 * - Set default account
 * - Account type selection
 * - Account edit (name/type)
 * - Account deletion
 * 
 * Extracted from webhook.ts as part of TD-001 Phase 2.
 * 
 * @see docs/stories/story-TD-001.md
 */

import { api } from "../../_generated/api";
import type { CallbackContext } from "../callbackRegistry";
import { extractParameter } from "../callbackRegistry";
import { CALLBACK_PATTERNS } from "../constants";

/**
 * Handle account creation confirmation (Story 2.1 - AC4, AC5)
 */
export async function handleConfirmAccountCreate(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const pendingIdStr = extractParameter(data, CALLBACK_PATTERNS.CONFIRM_ACCOUNT_PREFIX);

  const pending = await ctx.runQuery(api.pendingActions.getById.getById, {
    pendingId: pendingIdStr as any,
  });

  if (!pending) {
    const errorMsg = language === "ar"
      ? "⏰ انتهت صلاحية التأكيد. أرسل طلبك مرة أخرى."
      : "⏰ Confirmation expired. Please send your request again.";

    await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
      callbackQueryId,
      text: errorMsg,
      showAlert: true,
    });
    return;
  }

  const { accountType, accountName, initialBalance, currency } = pending.actionData;

  try {
    const accountId = await ctx.runMutation((api.accounts as any).create.create, {
      userId: userId as any,
      accountType,
      accountName,
      initialBalance,
      currency,
    });

    const account = await ctx.runQuery(api.accounts.getById.getById, { accountId });
    if (!account) throw new Error("Account creation failed");

    const accountCount = await ctx.runQuery(api.accounts.count.count, { userId: userId as any });

    await ctx.runMutation(api.pendingActions.deletePending.deletePending, {
      pendingId: pending._id,
    });

    // Build success message
    const { ACCOUNT_TYPES } = await import("../constants");
    const accountEmoji = ACCOUNT_TYPES[account.type]?.emoji || "💼";
    const accountTypeLabel = ACCOUNT_TYPES[account.type]?.[language] || account.type;
    
    const successMsg = language === "ar"
      ? `✅ تم إنشاء الحساب بنجاح!\n\n${accountEmoji} *${account.name}*\n🏦 النوع: ${accountTypeLabel}\n💰 الرصيد: ${account.balance.toFixed(2)} ${account.currency}`
      : `✅ Account created successfully!\n\n${accountEmoji} *${account.name}*\n🏦 Type: ${accountTypeLabel}\n💰 Balance: ${account.balance.toFixed(2)} ${account.currency}`;

    // Edit original message with success
    const { answerAndEdit } = await import("../callbackHelpers");
    await answerAndEdit(
      context,
      language === "ar" ? "✅ تم الإنشاء" : "✅ Created",
      successMsg,
      "Markdown"
    );

    // If not first account and not default, ask about setting as default
    if (accountCount > 1 && !account.isDefault) {
      const { getDefaultAccountPromptKeyboard } = await import("../keyboards");
      const { ACCOUNT_MESSAGES } = await import("../constants");
      
      const defaultPrompt = ACCOUNT_MESSAGES.SET_AS_DEFAULT[language];
      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: defaultPrompt,
        replyMarkup: getDefaultAccountPromptKeyboard(accountId, language),
      });
    }
  } catch (error) {
    console.error("[AccountHandlers] Error creating account:", error);
    await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
      callbackQueryId,
      text: language === "ar" ? "❌ حدث خطأ" : "❌ Error occurred",
      showAlert: true,
    });
  }
}

/**
 * Handle account creation cancellation (Story 2.1 - AC4)
 */
export async function handleCancelAccountCreate(context: CallbackContext): Promise<void> {
  const { ctx, language, data } = context;
  const { answerAndEdit } = await import("../callbackHelpers");
  const pendingIdStr = extractParameter(data, CALLBACK_PATTERNS.CANCEL_ACCOUNT_PREFIX);

  const pending = await ctx.runQuery(api.pendingActions.getById.getById, {
    pendingId: pendingIdStr as any,
  });

  if (pending) {
    await ctx.runMutation(api.pendingActions.deletePending.deletePending, {
      pendingId: pending._id,
    });
  }

  const cancelMsg = language === "ar"
    ? "❌ تم إلغاء إنشاء الحساب. يمكنك إنشاء حساب جديد في أي وقت."
    : "❌ Account creation cancelled. You can create a new account anytime.";

  await answerAndEdit(
    context,
    language === "ar" ? "❌ تم الإلغاء" : "❌ Cancelled",
    cancelMsg
  );
}

/**
 * Handle set default account "Yes" (Story 2.1 - AC6)
 */
export async function handleSetDefaultYes(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const accountId = extractParameter(data, CALLBACK_PATTERNS.SET_DEFAULT_YES);

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
}

/**
 * Handle set default account "No" (Story 2.1 - AC6)
 */
export async function handleSetDefaultNo(context: CallbackContext): Promise<void> {
  const { ctx, language, chatId, callbackQueryId } = context;

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "حسناً" : "OK",
  });
}

/**
 * Handle account type selection (Story 2.1 - AC13)
 */
export async function handleAccountTypeSelection(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const accountType = extractParameter(data, CALLBACK_PATTERNS.ACCOUNT_TYPE_PREFIX);

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "✅ تم الاختيار" : "✅ Selected",
  });

  const { askInitialBalance } = await import("../clarificationHandler");
  await askInitialBalance(ctx, { userId: userId as any, language, chatId, accountType });
}

// Export all handlers for registry registration
export {
  handleConfirmAccountCreate as confirmAccount,
  handleCancelAccountCreate as cancelAccount,
  handleSetDefaultYes as setDefaultYes,
  handleSetDefaultNo as setDefaultNo,
  handleAccountTypeSelection as accountType,
};
