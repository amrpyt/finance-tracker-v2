/**
 * Expense Callback Handlers
 * 
 * Handles all expense-related callback queries:
 * - Expense confirmation/cancellation
 * - Account selection for expense
 * - Expense editing (amount/category/description/account)
 * - Back to confirmation
 * 
 * Extracted from webhook.ts as part of TD-001 Phase 2.
 * 
 * @see docs/stories/story-TD-001.md
 */

import { api } from "../../_generated/api";
import type { CallbackContext } from "../callbackRegistry";
import { extractParameter, extractParameters } from "../callbackRegistry";
import { CALLBACK_PATTERNS } from "../constants";

/**
 * Handle expense confirmation (Story 3.1 - Task 10, AC7-9)
 */
export async function handleConfirmExpense(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const confirmationId = extractParameter(data, CALLBACK_PATTERNS.CONFIRM_EXPENSE_PREFIX);

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

  const { amount, category, description, accountId, date, language: expenseLanguage } = pending.actionData;

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
    const result = await ctx.runMutation(api.transactions.createExpense.createExpense, {
      userId: userId as any,
      accountId,
      amount,
      category,
      description,
      date,
    });

    await ctx.runMutation(api.pendingActions.deletePending.deletePending, {
      pendingId: pending._id,
    });

    if (!result.transaction || !result.account) {
      throw new Error("Transaction or account not found in result");
    }

    const { sendExpenseSuccess } = await import("../responseHelpers");
    const successMessage = sendExpenseSuccess(
      result.transaction,
      result.account,
      result.newBalance,
      expenseLanguage || language
    );

    // Edit original message with success details
    const { answerAndEdit } = await import("../callbackHelpers");
    await answerAndEdit(
      context,
      language === "ar" ? "✅ تم التسجيل" : "✅ Logged",
      successMessage,
      "Markdown"
    );

    await ctx.runMutation(api.messages.create.create, {
      userId: userId as any,
      role: "assistant",
      content: successMessage,
      intent: "log_expense_success",
      entities: {
        transactionId: result.transaction._id,
        amount,
        category,
      },
    });
  } catch (error) {
    console.error("[ExpenseHandlers] Error creating expense:", error);
    await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
      callbackQueryId,
      text: language === "ar" ? "❌ حدث خطأ" : "❌ Error occurred",
      showAlert: true,
    });
  }
}

/**
 * Handle expense cancellation (Story 3.1 - Task 12, AC11)
 */
export async function handleCancelExpense(context: CallbackContext): Promise<void> {
  const { ctx, language, data } = context;
  const { answerAndEdit } = await import("../callbackHelpers");
  const confirmationId = extractParameter(data, CALLBACK_PATTERNS.CANCEL_EXPENSE_PREFIX);

  const pending = await ctx.runQuery(
    api.pendingActions.getPendingByConfirmationId.getPendingByConfirmationId,
    { confirmationId }
  );

  if (pending) {
    await ctx.runMutation(api.pendingActions.deletePending.deletePending, {
      pendingId: pending._id,
    });
  }

  const cancelMsg = language === "ar"
    ? "❌ تم إلغاء تسجيل المصروف. يمكنك إرسال مصروف جديد في أي وقت."
    : "❌ Expense logging cancelled. You can send a new expense anytime.";

  await answerAndEdit(
    context,
    language === "ar" ? "❌ تم الإلغاء" : "❌ Cancelled",
    cancelMsg
  );
}

/**
 * Handle account selection for expense (Story 3.1 - Task 11, AC18)
 */
export async function handleSelectAccountExpense(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const parts = extractParameters(data, CALLBACK_PATTERNS.SELECT_ACCOUNT_EXPENSE_PREFIX);
  const accountId = parts[0];
  const confirmationId = parts.slice(1).join("_");

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

  await ctx.runMutation(api.pendingActions.updatePending.updatePending, {
    pendingId: pending._id,
    actionData: { accountId },
  });

  const account = await ctx.runQuery(api.accounts.getById.getById, {
    accountId: accountId as any,
  });

  if (!account) {
    console.error("[ExpenseHandlers] Selected account not found");
    return;
  }

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "✅ تم الاختيار" : "✅ Selected",
  });

  const { buildExpenseConfirmation } = await import("../expenseConfirmation");
  const confirmation = buildExpenseConfirmation(
    {
      amount: pending.actionData.amount,
      category: pending.actionData.category,
      description: pending.actionData.description,
      accountName: account.name,
      accountType: account.type,
      currency: account.currency,
      date: pending.actionData.date,
    },
    language,
    confirmationId
  );

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: confirmation.message,
    parseMode: "Markdown",
    replyMarkup: confirmation.keyboard,
  });
}

/**
 * Handle edit expense (Story 3.1 - Task 8, AC10)
 */
export async function handleEditExpense(context: CallbackContext): Promise<void> {
  const { ctx, language, chatId, callbackQueryId, data } = context;
  const confirmationId = extractParameter(data, CALLBACK_PATTERNS.EDIT_EXPENSE_PREFIX);

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "✏️ تعديل" : "✏️ Edit",
  });

  const { buildEditOptionsMenu } = await import("../expenseConfirmation");
  const editMenu = buildEditOptionsMenu(language, confirmationId);

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: editMenu.message,
    parseMode: "Markdown",
    replyMarkup: editMenu.keyboard,
  });
}

/**
 * Handle edit expense amount
 */
export async function handleEditExpenseAmount(context: CallbackContext): Promise<void> {
  const { ctx, language, chatId, callbackQueryId } = context;

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "المبلغ" : "Amount",
  });

  const message = language === "ar"
    ? "✏️ *تعديل المبلغ*\n\nللأسف، تعديل المبلغ غير متاح حالياً.\n\nيمكنك إلغاء هذا المصروف وإدخال مصروف جديد بالمبلغ الصحيح."
    : "✏️ *Edit Amount*\n\nSorry, amount editing is not available yet.\n\nYou can cancel this expense and enter a new one with the correct amount.";

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: message,
    parseMode: "Markdown",
  });
}

/**
 * Handle edit expense category
 */
export async function handleEditExpenseCategory(context: CallbackContext): Promise<void> {
  const { ctx, language, chatId, callbackQueryId } = context;

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "الفئة" : "Category",
  });

  const message = language === "ar"
    ? "✏️ *تعديل الفئة*\n\nللأسف، تعديل الفئة غير متاح حالياً.\n\nيمكنك إلغاء هذا المصروف وإدخال مصروف جديد بالفئة الصحيحة."
    : "✏️ *Edit Category*\n\nSorry, category editing is not available yet.\n\nYou can cancel this expense and enter a new one with the correct category.";

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: message,
    parseMode: "Markdown",
  });
}

/**
 * Handle edit expense description
 */
export async function handleEditExpenseDescription(context: CallbackContext): Promise<void> {
  const { ctx, language, chatId, callbackQueryId } = context;

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "الوصف" : "Description",
  });

  const message = language === "ar"
    ? "✏️ *تعديل الوصف*\n\nللأسف، تعديل الوصف غير متاح حالياً.\n\nيمكنك إلغاء هذا المصروف وإدخال مصروف جديد بالوصف الصحيح."
    : "✏️ *Edit Description*\n\nSorry, description editing is not available yet.\n\nYou can cancel this expense and enter a new one with the correct description.";

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: message,
    parseMode: "Markdown",
  });
}

/**
 * Handle edit expense account
 */
export async function handleEditExpenseAccount(context: CallbackContext): Promise<void> {
  const { ctx, language, chatId, callbackQueryId } = context;

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "الحساب" : "Account",
  });

  const message = language === "ar"
    ? "✏️ *تعديل الحساب*\n\nللأسف، تعديل الحساب غير متاح حالياً.\n\nيمكنك إلغاء هذا المصروف وإدخال مصروف جديد من الحساب الصحيح."
    : "✏️ *Edit Account*\n\nSorry, account editing is not available yet.\n\nYou can cancel this expense and enter a new one with the correct account.";

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: message,
    parseMode: "Markdown",
  });
}

/**
 * Handle back to confirmation
 */
export async function handleBackToConfirmation(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const confirmationId = extractParameter(data, CALLBACK_PATTERNS.BACK_TO_CONFIRMATION_PREFIX);

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "رجوع" : "Back",
  });

  const pending = await ctx.runQuery(
    api.pendingActions.getPendingByConfirmationId.getPendingByConfirmationId,
    { confirmationId }
  );

  if (!pending) {
    const errorMessage = language === "ar"
      ? "⚠️ انتهت صلاحية التأكيد. يرجى إرسال المصروف مرة أخرى."
      : "⚠️ Confirmation expired. Please send the expense again.";
    
    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: errorMessage,
    });
    return;
  }

  const account = await ctx.runQuery(api.accounts.getById.getById, {
    accountId: pending.actionData.accountId,
  });

  if (!account) {
    const errorMessage = language === "ar"
      ? "⚠️ الحساب غير موجود"
      : "⚠️ Account not found";
    
    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: errorMessage,
    });
    return;
  }

  const { buildExpenseConfirmation } = await import("../expenseConfirmation");
  const confirmation = buildExpenseConfirmation(
    {
      amount: pending.actionData.amount,
      category: pending.actionData.category,
      description: pending.actionData.description,
      accountName: account.name,
      accountType: account.type,
      currency: account.currency,
      date: pending.actionData.date,
    },
    language,
    confirmationId
  );

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: confirmation.message,
    parseMode: "Markdown",
    replyMarkup: confirmation.keyboard,
  });
}

// Export all handlers for registry registration
export {
  handleConfirmExpense as confirmExpense,
  handleCancelExpense as cancelExpense,
  handleSelectAccountExpense as selectAccountExpense,
  handleEditExpense as editExpense,
  handleEditExpenseAmount as editExpenseAmount,
  handleEditExpenseCategory as editExpenseCategory,
  handleEditExpenseDescription as editExpenseDescription,
  handleEditExpenseAccount as editExpenseAccount,
  handleBackToConfirmation as backToConfirmation,
};
