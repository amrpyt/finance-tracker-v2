/**
 * UI Action Callback Handlers
 * 
 * Handles UI-related callback queries:
 * - Refresh accounts
 * - Create account button
 * - Edit account select button
 * - Delete account select button
 * 
 * Extracted from webhook.ts as part of TD-001 Phase 2.
 * 
 * @see docs/stories/story-TD-001.md
 */

import { api } from "../../_generated/api";
import type { CallbackContext } from "../callbackRegistry";

/**
 * Handle refresh accounts button (Story 2.2 - AC11)
 */
export async function handleRefreshAccounts(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId, message } = context;

  // Acknowledge button press
  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "🔄 جاري التحديث..." : "🔄 Refreshing...",
  });

  // Get user profile for currency
  const profile = await ctx.runQuery(api.users.getProfile.getProfile, {
    userId: userId as any,
  });

  // Query accounts overview
  const accounts = await ctx.runQuery(api.accounts.getOverview.getOverview, {
    userId: userId as any,
  });

  // Format and send updated response
  const { formatAccountsOverview } = await import("../accountFormatter");
  const formattedMessage = formatAccountsOverview(accounts, language, profile?.currency || "EGP");

  // Get quick actions keyboard
  const { getAccountsOverviewKeyboard } = await import("../keyboards");
  const keyboard = getAccountsOverviewKeyboard(language);

  // Update the message
  if (message?.message_id) {
    await ctx.runAction(api.telegram.sendMessage.editMessage, {
      chatId,
      messageId: message.message_id,
      text: formattedMessage,
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  } else {
    // If no message to edit, send new one
    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: formattedMessage,
      parseMode: "Markdown",
      replyMarkup: keyboard,
    });
  }

  console.info(`[UIHandlers] Accounts refreshed - ${accounts.length} accounts`);
}

/**
 * Handle create account button (Story 2.2 - AC11)
 */
export async function handleCreateAccount(context: CallbackContext): Promise<void> {
  const { ctx, language, chatId, callbackQueryId } = context;

  // Acknowledge button press
  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "➕ إنشاء حساب جديد" : "➕ Create new account",
  });

  // Send instructions for creating account
  const instructionMsg = language === "ar"
    ? "لإنشاء حساب جديد، أرسل رسالة مثل:\n\n• أنشئ حساب محفظة برصيد 500 جنيه\n• أنشئ حساب بنك اسمه الراجحي برصيد 1000 جنيه"
    : "To create a new account, send a message like:\n\n• Create cash account with 500 EGP\n• Create bank account named CIB with 1000 EGP";

  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: instructionMsg,
  });

  console.info("[UIHandlers] Create account instructions sent");
}

/**
 * Handle edit account select button (Story 2.2 - AC11)
 */
export async function handleEditAccountSelect(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId } = context;

  // Acknowledge button press
  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "✏️ تعديل الحساب" : "✏️ Edit account",
  });

  // Show account selection for edit
  const accounts = await ctx.runQuery(api.accounts.list.list, {
    userId: userId as any,
    includeDeleted: false,
  });

  const { createAccountSelection } = await import("../accountSelector");
  const selectionResult = createAccountSelection(accounts, language, "edit");

  // Handle zero accounts
  if (accounts.length === 0) {
    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: selectionResult.message,
    });
    return;
  }

  // Auto-select if single account
  if (selectionResult.shouldAutoSelect && selectionResult.selectedAccountId) {
    const account = await ctx.runQuery(api.accounts.getById.getById, {
      accountId: selectionResult.selectedAccountId,
    });

    if (account) {
      const { createEditOptionsMenu } = await import("../editAccountMenu");
      const menuResult = createEditOptionsMenu(account, language);

      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: menuResult.message,
        parseMode: "Markdown",
        replyMarkup: menuResult.keyboard,
      });
    }
    return;
  }

  // Multiple accounts - show selection
  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: selectionResult.message,
    parseMode: "Markdown",
    replyMarkup: selectionResult.keyboard,
  });

  console.info("[UIHandlers] Edit account selection sent");
}

/**
 * Handle delete account select button (Story 2.5)
 */
export async function handleDeleteAccountSelect(context: CallbackContext): Promise<void> {
  const { ctx, userId, language, chatId, callbackQueryId } = context;

  // Acknowledge button press
  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "🗑️ حذف الحساب" : "🗑️ Delete account",
  });

  // Show account selection for delete
  const accounts = await ctx.runQuery(api.accounts.list.list, {
    userId: userId as any,
    includeDeleted: false,
  });

  const { createAccountSelection } = await import("../accountSelector");
  const selectionResult = createAccountSelection(accounts, language, "delete");

  // Handle zero accounts
  if (accounts.length === 0) {
    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: selectionResult.message,
    });
    return;
  }

  // Auto-select if single account
  if (selectionResult.shouldAutoSelect && selectionResult.selectedAccountId) {
    // Run pre-deletion validation
    const { getValidationErrorMessage } = await import("../validateAccountDeletion");
    
    // Get account details first
    const account = await ctx.runQuery(api.accounts.getById.getById, {
      accountId: selectionResult.selectedAccountId as any,
    });

    if (!account) {
      const errorMsg = getValidationErrorMessage("ACCOUNT_NOT_FOUND", language);
      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: errorMsg,
      });
      return;
    }

    // Check if account is default (cannot delete default)
    if (account.isDefault) {
      const errorMsg = getValidationErrorMessage("CANNOT_DELETE_DEFAULT", language);
      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: errorMsg,
      });
      return;
    }

    // Check if this is the last account
    const accountCount = await ctx.runQuery(api.accounts.count.count, { userId: userId as any });
    if (accountCount <= 1) {
      const errorMsg = getValidationErrorMessage("CANNOT_DELETE_LAST", language);
      await ctx.runAction(api.telegram.sendMessage.sendMessage, {
        chatId,
        text: errorMsg,
      });
      return;
    }

    // Get transaction count
    const txCount = await ctx.runQuery(api.transactions.countByAccount.countByAccount, {
      accountId: selectionResult.selectedAccountId as any,
    });

    // Show delete confirmation
    const { createDeleteConfirmation } = await import("../deleteAccountConfirmation");
    const confirmationResult = createDeleteConfirmation(
      account,
      txCount,
      language
    );

    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: confirmationResult.message,
      parseMode: "Markdown",
      replyMarkup: confirmationResult.keyboard,
    });

    return;
  }

  // Multiple accounts - show selection
  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: selectionResult.message,
    parseMode: "Markdown",
    replyMarkup: selectionResult.keyboard,
  });

  console.info("[UIHandlers] Delete account selection sent");
}

// Export all handlers for registry registration
export {
  handleRefreshAccounts as refreshAccounts,
  handleCreateAccount as createAccount,
  handleEditAccountSelect as editAccountSelect,
  handleDeleteAccountSelect as deleteAccountSelect,
};
