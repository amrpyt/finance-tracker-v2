/**
 * Extended Account Callback Handlers
 * 
 * Additional account handlers for:
 * - Account editing (name, type, selection)
 * - Account deletion (selection, confirmation)
 * - Set default account (selection, confirmation)
 * 
 * These are separated from account.ts for better organization.
 * 
 * @see docs/stories/story-TD-001.md
 */

import { api } from "../../_generated/api";
import type { CallbackContext } from "../callbackRegistry";
import { extractParameter } from "../callbackRegistry";

/**
 * Handle account selection for edit (Story 2.3 - AC2)
 */
export async function handleSelectAccountEdit(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const accountId = extractParameter(data, "select_account_edit_");

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "✅ تم الاختيار" : "✅ Selected",
  });

  const account = await ctx.runQuery(api.accounts.getById.getById, {
    accountId: accountId as any,
  });

  if (!account) {
    const errorMsg = language === "ar" ? "❌ الحساب غير موجود" : "❌ Account not found";
    await ctx.runAction(api.telegram.sendMessage.sendMessage, { chatId, text: errorMsg });
    return;
  }

  const { createEditOptionsMenu } = await import("../editAccountMenu");
  const menuResult = createEditOptionsMenu(account, language);

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: menuResult.message,
    parseMode: "Markdown",
    replyMarkup: menuResult.keyboard,
  });
}

/**
 * Handle edit name selection (Story 2.3 - AC6)
 */
export async function handleEditName(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const accountId = extractParameter(data, "edit_name_");

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "✏️ تعديل الاسم" : "✏️ Edit name",
  });

  const account = await ctx.runQuery(api.accounts.getById.getById, {
    accountId: accountId as any,
  });

  if (!account) return;

  const { createNameEditPrompt } = await import("../editAccountName");
  const promptResult = createNameEditPrompt(account, language);

  await ctx.runMutation(api.conversationStates.set.set, {
    userId: userId as any,
    stateType: "awaiting_account_name",
    stateData: promptResult.stateData,
    expirationMinutes: 10,
  });

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: promptResult.message,
    parseMode: "Markdown",
  });
}

/**
 * Handle edit type selection (Story 2.3 - AC7)
 */
export async function handleEditType(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const accountId = extractParameter(data, "edit_type_");

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "🔄 تغيير النوع" : "🔄 Change type",
  });

  const account = await ctx.runQuery(api.accounts.getById.getById, {
    accountId: accountId as any,
  });

  if (!account) return;

  const { createTypeSelectionKeyboard } = await import("../editAccountType");
  const selectionResult = createTypeSelectionKeyboard(account, language);

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: selectionResult.message,
    parseMode: "Markdown",
    replyMarkup: selectionResult.keyboard,
  });
}

/**
 * Handle type selection (Story 2.3 - AC7)
 */
export async function handleSelectType(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const parts = extractParameter(data, "select_type_").split("_");
  const newType = parts.slice(0, -1).join("_");
  const accountId = parts[parts.length - 1];

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "✅ تم الاختيار" : "✅ Selected",
  });

  const account = await ctx.runQuery(api.accounts.getById.getById, {
    accountId: accountId as any,
  });

  if (!account) return;

  const { isValidAccountType, createTypeConfirmation } = await import("../editAccountType");
  if (!isValidAccountType(newType)) return;

  const confirmationResult = createTypeConfirmation(
    account.name,
    account.type,
    newType,
    account._id,
    language
  );

  await ctx.runMutation(api.conversationStates.set.set, {
    userId: userId as any,
    stateType: "awaiting_type_confirmation",
    stateData: { accountId: account._id, oldType: account.type, newType },
    expirationMinutes: 5,
  });

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: confirmationResult.message,
    parseMode: "Markdown",
    replyMarkup: confirmationResult.keyboard,
  });
}

/**
 * Handle name confirmation (Story 2.3 - AC8)
 */
export async function handleConfirmName(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const accountId = extractParameter(data, "confirm_name_");

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "✅ جاري التحديث..." : "✅ Updating...",
  });

  const state = await ctx.runQuery(api.conversationStates.get.get, { userId: userId as any });

  if (!state || state.stateType !== "awaiting_name_confirmation") return;

  const { newName, oldName } = state.stateData;

  try {
    const updatedAccount = await ctx.runMutation(api.accounts.update.update, {
      userId: userId as any,
      accountId: accountId as any,
      updates: { name: newName },
    });

    if (!updatedAccount) {
      throw new Error("Account update failed");
    }

    await ctx.runMutation(api.conversationStates.clear.clear, { userId: userId as any });

    const { sendAccountUpdateSuccess } = await import("../responseHelpers");
    await sendAccountUpdateSuccess(ctx, {
      account: updatedAccount,
      editType: "name",
      oldValue: oldName,
      newValue: newName,
      userId: userId as any,
      language,
      chatId,
    });
  } catch (error) {
    const errorMsg = language === "ar" ? "❌ حدث خطأ أثناء التحديث" : "❌ Error occurred during update";
    await ctx.runAction(api.telegram.sendMessage.sendMessage, { chatId, text: errorMsg });
  }
}

/**
 * Handle type confirmation (Story 2.3 - AC8)
 */
export async function handleConfirmType(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const accountId = extractParameter(data, "confirm_type_");

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "✅ جاري التحديث..." : "✅ Updating...",
  });

  const state = await ctx.runQuery(api.conversationStates.get.get, { userId: userId as any });

  if (!state || state.stateType !== "awaiting_type_confirmation") return;

  const { newType, oldType } = state.stateData;

  try {
    const updatedAccount = await ctx.runMutation(api.accounts.update.update, {
      userId: userId as any,
      accountId: accountId as any,
      updates: { type: newType },
    });

    if (!updatedAccount) {
      throw new Error("Account update failed");
    }

    await ctx.runMutation(api.conversationStates.clear.clear, { userId: userId as any });

    const { sendAccountUpdateSuccess } = await import("../responseHelpers");
    await sendAccountUpdateSuccess(ctx, {
      account: updatedAccount,
      editType: "type",
      oldValue: oldType,
      newValue: newType,
      userId: userId as any,
      language,
      chatId,
    });
  } catch (error) {
    const errorMsg = language === "ar" ? "❌ حدث خطأ أثناء التحديث" : "❌ Error occurred during update";
    await ctx.runAction(api.telegram.sendMessage.sendMessage, { chatId, text: errorMsg });
  }
}

/**
 * Handle account selection for set default (Story 2.4 - AC2)
 */
export async function handleSelectAccountDefault(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const accountId = extractParameter(data, "select_account_default_");

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "✅ تم الاختيار" : "✅ Selected",
  });

  const account = await ctx.runQuery(api.accounts.getById.getById, {
    accountId: accountId as any,
  });

  if (!account) {
    const errorMsg = language === "ar" ? "❌ الحساب غير موجود" : "❌ Account not found";
    await ctx.runAction(api.telegram.sendMessage.sendMessage, { chatId, text: errorMsg });
    return;
  }

  if (account.isDefault) {
    const alreadyDefaultMsg = language === "ar"
      ? `هذا الحساب هو الافتراضي بالفعل ⭐\n\n*${account.name}*`
      : `This account is already the default ⭐\n\n*${account.name}*`;

    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: alreadyDefaultMsg,
      parseMode: "Markdown",
    });
    return;
  }

  const { sendSetDefaultConfirmation } = await import("../setDefaultConfirmation");
  await sendSetDefaultConfirmation(ctx, { userId: userId as any, accountId: accountId as any, language, chatId });
}

/**
 * Handle confirm set default (Story 2.4 - AC5, AC8)
 */
export async function handleConfirmSetDefault(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const accountId = extractParameter(data, "confirm_set_default_");

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "✅ جاري التعيين..." : "✅ Setting...",
  });

  try {
    const result = await ctx.runMutation(api.accounts.setDefault.setDefault, {
      userId: userId as any,
      accountId: accountId as any,
    });

    if (result.alreadyDefault) {
      const alreadyDefaultMsg = language === "ar"
        ? `هذا الحساب هو الافتراضي بالفعل ⭐\n\n*${result.newDefault?.name || 'Account'}*`
        : `This account is already the default ⭐\n\n*${result.newDefault?.name || 'Account'}*`;

      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: alreadyDefaultMsg,
        parseMode: "Markdown",
      });
      return;
    }

    const { sendSetDefaultSuccess } = await import("../responseHelpers");
    await sendSetDefaultSuccess(ctx, {
      newDefault: result.newDefault!,
      oldDefault: result.oldDefault || null,
      userId: userId as any,
      language,
      chatId,
    });
  } catch (error) {
    const errorMsg = language === "ar"
      ? "❌ حدث خطأ أثناء تعيين الحساب الافتراضي"
      : "❌ Error setting default account";
    await ctx.runAction(api.telegram.sendMessage.sendMessage, { chatId, text: errorMsg });
  }
}

/**
 * Handle cancel set default (Story 2.4 - AC11)
 */
export async function handleCancelSetDefault(context: CallbackContext): Promise<void> {
  const { language } = context;
  const { answerAndEdit } = await import("../callbackHelpers");

  const cancelMsg = language === "ar" ? "❌ تم إلغاء تعيين الحساب الافتراضي." : "❌ Default account selection cancelled.";
  
  await answerAndEdit(
    context,
    language === "ar" ? "❌ تم الإلغاء" : "❌ Cancelled",
    cancelMsg
  );
}

/**
 * Handle cancel edit (Story 2.3 - AC20)
 */
export async function handleCancelEdit(context: CallbackContext): Promise<void> {
  const { ctx, userId, language } = context;
  const { answerAndEdit } = await import("../callbackHelpers");

  await ctx.runMutation(api.conversationStates.clear.clear, { userId: userId as any });

  const cancelMsg = language === "ar" ? "❌ تم إلغاء التعديل." : "❌ Edit cancelled.";
  
  await answerAndEdit(
    context,
    language === "ar" ? "❌ تم الإلغاء" : "❌ Cancelled",
    cancelMsg
  );
}

/**
 * Handle account selection for deletion (Story 2.5 - AC2)
 */
export async function handleSelectAccountDelete(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const accountId = extractParameter(data, "select_account_delete_");

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "⏳ جاري التحقق..." : "⏳ Checking...",
  });

  const { getValidationErrorMessage } = await import("../validateAccountDeletion");
  const account = await ctx.runQuery(api.accounts.getById.getById, { accountId: accountId as any });

  if (!account) {
    const errorMsg = getValidationErrorMessage("ACCOUNT_NOT_FOUND", language);
    await ctx.runAction(api.telegram.sendMessage.sendMessage, { chatId, text: errorMsg });
    return;
  }

  if (account.isDefault) {
    const errorMsg = getValidationErrorMessage("CANNOT_DELETE_DEFAULT", language);
    await ctx.runAction(api.telegram.sendMessage.sendMessage, { chatId, text: errorMsg });
    return;
  }

  const accountCount = await ctx.runQuery(api.accounts.count.count, { userId: userId as any });

  if (accountCount <= 1) {
    const errorMsg = getValidationErrorMessage("CANNOT_DELETE_LAST", language);
    await ctx.runAction(api.telegram.sendMessage.sendMessage, { chatId, text: errorMsg });
    return;
  }

  if (account.userId !== userId) {
    const errorMsg = getValidationErrorMessage("ACCOUNT_NOT_FOUND", language);
    await ctx.runAction(api.telegram.sendMessage.sendMessage, { chatId, text: errorMsg });
    return;
  }

  const txCount = await ctx.runQuery(api.transactions.countByAccount.countByAccount, {
    accountId: accountId as any,
  });

  const { createDeleteConfirmation } = await import("../deleteAccountConfirmation");
  const confirmationResult = createDeleteConfirmation(account, txCount, language);

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: confirmationResult.message,
    parseMode: "Markdown",
    replyMarkup: confirmationResult.keyboard,
  });
}

/**
 * Handle confirm delete (Story 2.5 - AC10, AC11)
 */
export async function handleConfirmDelete(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, data } = context;
  const accountId = extractParameter(data, "confirm_delete_");

  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "🗑️ جاري الحذف..." : "🗑️ Deleting...",
  });

  try {
    const txCount = await ctx.runQuery(api.transactions.countByAccount.countByAccount, {
      accountId: accountId as any,
    });

    const deletedAccount = await ctx.runMutation(api.accounts.softDelete.softDelete, {
      userId: userId as any,
      accountId: accountId as any,
    });

    const { sendAccountDeleteSuccess } = await import("../responseHelpers");
    await sendAccountDeleteSuccess(ctx, {
      deletedAccount: deletedAccount!,
      transactionCount: txCount,
      userId: userId as any,
      language,
      chatId,
    });
  } catch (error) {
    const { getValidationErrorMessage } = await import("../validateAccountDeletion");
    const errorCode = error instanceof Error ? error.message : "VALIDATION_FAILED";
    const errorMsg = getValidationErrorMessage(errorCode, language);
    await ctx.runAction(api.telegram.sendMessage.sendMessage, { chatId, text: errorMsg });
  }
}

/**
 * Handle cancel delete (Story 2.5 - AC13)
 */
export async function handleCancelDelete(context: CallbackContext): Promise<void> {
  const { language } = context;
  const { answerAndEdit } = await import("../callbackHelpers");

  const cancelMsg = language === "ar" ? "❌ تم إلغاء حذف الحساب." : "❌ Account deletion cancelled.";
  
  await answerAndEdit(
    context,
    language === "ar" ? "❌ تم الإلغاء" : "❌ Cancelled",
    cancelMsg
  );
}

// Export all handlers for registry registration
export {
  handleSelectAccountEdit as selectAccountEdit,
  handleEditName as editName,
  handleEditType as editType,
  handleSelectType as selectType,
  handleConfirmName as confirmName,
  handleConfirmType as confirmType,
  handleSelectAccountDefault as selectAccountDefault,
  handleConfirmSetDefault as confirmSetDefault,
  handleCancelSetDefault as cancelSetDefault,
  handleCancelEdit as cancelEdit,
  handleSelectAccountDelete as selectAccountDelete,
  handleConfirmDelete as confirmDelete,
  handleCancelDelete as cancelDelete,
};
