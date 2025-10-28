/**
 * Income Callback Handlers
 * 
 * Story 3.2: AI Income Logging
 * Tasks 9-10: Update Webhook Callback Handlers
 * 
 * Handles all income-related callback queries:
 * - Income confirmation/cancellation (Task 9)
 * - Account selection for income (Task 10)
 * 
 * Follows pattern from expense.ts callback handlers.
 */

import { api } from "../../_generated/api";
import type { CallbackContext } from "../callbackRegistry";
import { extractParameter, extractParameters } from "../callbackRegistry";
import { CALLBACK_PATTERNS } from "../constants";

/**
 * Handle income confirmation (Story 3.2 - Task 9, AC7-9)
 * Task 9.3: On "نعم" (confirm): Retrieve pending income data
 * Task 9.4: Validate all required fields present
 * Task 9.5: Call api.transactions.createIncome mutation
 * Task 9.6: On success: Send success message
 * Task 9.8: Answer callback query to acknowledge button press
 * Task 9.9: Store all messages in messages table with intent and entities
 */
export async function handleConfirmIncome(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const confirmationId = extractParameter(data, CALLBACK_PATTERNS.CONFIRM_INCOME);

  const pending = await ctx.runQuery(
    api.pendingActions.getPendingByConfirmationId.getPendingByConfirmationId,
    { confirmationId }
  );

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

  // Task 9.4: Validate all required fields present
  const { amount, category, description, accountId, date, language: incomeLanguage } = pending.actionData;

  if (!accountId || !amount || !category) {
    const errorMsg = language === "ar"
      ? "❌ بيانات غير مكتملة. حاول مرة أخرى."
      : "❌ Incomplete data. Please try again.";

    await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
      callbackQueryId,
      text: errorMsg,
      showAlert: true,
    });
    return;
  }

  try {
    // Task 9.5: Call api.transactions.createIncome mutation
    const result = await ctx.runMutation(api.transactions.createIncome.createIncome, {
      userId: userId as any,
      accountId,
      amount,
      category,
      description,
      date,
    });

    // Delete pending action
    await ctx.runMutation(api.pendingActions.deletePending.deletePending, {
      pendingId: pending._id,
    });

    if (!result.transaction || !result.account) {
      throw new Error("Transaction or account not found in result");
    }

    // Task 9.6: Send success message
    const { sendIncomeSuccess } = await import("../responseHelpers");
    const successMessage = sendIncomeSuccess(
      result.transaction,
      result.account,
      result.newBalance,
      incomeLanguage || language
    );

    // Task 9.8: Answer callback query and edit original message with success details
    const { answerAndEdit } = await import("../callbackHelpers");
    await answerAndEdit(
      context,
      language === "ar" ? "✅ تم التسجيل" : "✅ Logged",
      successMessage,
      "Markdown"
    );

    // Task 9.9: Store success message in messages table with intent and entities (AC15)
    await ctx.runMutation(api.messages.create.create, {
      userId: userId as any,
      role: "assistant",
      content: successMessage,
      intent: "log_income_success",
      entities: {
        transactionId: result.transaction._id,
        amount,
        category,
      },
    });
  } catch (error) {
    console.error("[IncomeHandlers] Error creating income:", error);
    await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
      callbackQueryId,
      text: language === "ar" ? "❌ حدث خطأ" : "❌ Error occurred",
      showAlert: true,
    });
  }
}

/**
 * Handle income cancellation (Story 3.2 - Task 9, AC11)
 * Task 9.7: On "إلغاء" (cancel): Clear pending data, send "تم الإلغاء"
 */
export async function handleCancelIncome(context: CallbackContext): Promise<void> {
  const { ctx, language, data } = context;
  const { answerAndEdit } = await import("../callbackHelpers");
  const confirmationId = extractParameter(data, CALLBACK_PATTERNS.CANCEL_INCOME);

  const pending = await ctx.runQuery(
    api.pendingActions.getPendingByConfirmationId.getPendingByConfirmationId,
    { confirmationId }
  );

  if (pending) {
    await ctx.runMutation(api.pendingActions.deletePending.deletePending, {
      pendingId: pending._id,
    });
  }

  // AC11: Cancel Flow - discards data with message "تم الإلغاء"
  const cancelMsg = language === "ar"
    ? "❌ تم إلغاء تسجيل الدخل. يمكنك إرسال دخل جديد في أي وقت."
    : "❌ Income logging cancelled. You can send new income anytime.";

  await answerAndEdit(
    context,
    language === "ar" ? "❌ تم الإلغاء" : "❌ Cancelled",
    cancelMsg
  );
}

/**
 * Handle account selection for income (Story 3.2 - Task 10, AC18)
 * Task 10.2: Retrieve pending income data by confirmationId
 * Task 10.3: Update pending data with selected accountId
 * Task 10.4: Fetch account details
 * Task 10.5: Build confirmation message with selected account
 * Task 10.6: Send confirmation message
 * Task 10.7: Answer callback query
 */
export async function handleSelectAccountIncome(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const parts = extractParameters(data, CALLBACK_PATTERNS.SELECT_ACCOUNT_INCOME as string);
  const accountId = parts[0];
  const confirmationId = parts.slice(1).join("_");

  // Task 10.2: Retrieve pending income data by confirmationId
  const pending = await ctx.runQuery(
    api.pendingActions.getPendingByConfirmationId.getPendingByConfirmationId,
    { confirmationId }
  );

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

  // Task 10.4: Fetch account details
  const account = await ctx.runQuery(api.accounts.getById.getById, {
    accountId: accountId as any,
  });

  if (!account) {
    await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
      callbackQueryId,
      text: language === "ar" ? "❌ الحساب غير موجود" : "❌ Account not found",
      showAlert: true,
    });
    return;
  }

  // Task 10.3: Update pending data with selected accountId
  const updatedData = {
    ...pending.actionData,
    accountId: account._id,
  };

  await ctx.runMutation(api.pendingActions.updatePending.updatePending, {
    pendingId: pending._id,
    actionData: updatedData,
  });

  // Task 10.5: Build confirmation message with selected account
  const { buildIncomeConfirmation } = await import("../incomeConfirmation");
  const confirmationResult = buildIncomeConfirmation(
    {
      amount: updatedData.amount,
      category: updatedData.category,
      description: updatedData.description || "",
      accountName: account.name,
      accountType: account.type,
      currency: account.currency,
      date: updatedData.date,
    },
    language,
    confirmationId
  );

  // Task 10.7: Answer callback query
  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "✅ تم اختيار الحساب" : "✅ Account selected",
  });

  // Task 10.6: Edit message with confirmation
  const { message } = context;
  if (message?.message_id) {
    await ctx.runAction(api.telegram.sendMessage.editMessage, {
      chatId,
      messageId: message.message_id,
      text: confirmationResult.message,
      parse_mode: "Markdown",
      reply_markup: confirmationResult.keyboard,
    });
  }
}
