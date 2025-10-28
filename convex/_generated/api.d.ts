/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as accounts_count from "../accounts/count.js";
import type * as accounts_create from "../accounts/create.js";
import type * as accounts_getById from "../accounts/getById.js";
import type * as accounts_getByName from "../accounts/getByName.js";
import type * as accounts_getDefault from "../accounts/getDefault.js";
import type * as accounts_getOverview from "../accounts/getOverview.js";
import type * as accounts_list from "../accounts/list.js";
import type * as accounts_setDefault from "../accounts/setDefault.js";
import type * as accounts_softDelete from "../accounts/softDelete.js";
import type * as accounts_update from "../accounts/update.js";
import type * as ai_nlParser from "../ai/nlParser.js";
import type * as ai_parseExpenseIntent from "../ai/parseExpenseIntent.js";
import type * as ai_parseIncomeIntent from "../ai/parseIncomeIntent.js";
import type * as ai_parseUnifiedIntent from "../ai/parseUnifiedIntent.js";
import type * as ai_prompts from "../ai/prompts.js";
import type * as ai_types from "../ai/types.js";
import type * as commands_createAccountCommand from "../commands/createAccountCommand.js";
import type * as commands_deleteAccountCommand from "../commands/deleteAccountCommand.js";
import type * as commands_editAccountCommand from "../commands/editAccountCommand.js";
import type * as commands_helpCommand from "../commands/helpCommand.js";
import type * as commands_logExpenseCommand from "../commands/logExpenseCommand.js";
import type * as commands_logIncomeCommand from "../commands/logIncomeCommand.js";
import type * as commands_registry from "../commands/registry.js";
import type * as commands_setDefaultAccountCommand from "../commands/setDefaultAccountCommand.js";
import type * as commands_startCommand from "../commands/startCommand.js";
import type * as commands_types from "../commands/types.js";
import type * as commands_viewAccountsCommand from "../commands/viewAccountsCommand.js";
import type * as conversationStates_clear from "../conversationStates/clear.js";
import type * as conversationStates_get from "../conversationStates/get.js";
import type * as conversationStates_set from "../conversationStates/set.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_accountFormatter from "../lib/accountFormatter.js";
import type * as lib_accountSelector from "../lib/accountSelector.js";
import type * as lib_balanceCalculator from "../lib/balanceCalculator.js";
import type * as lib_callbackHandlers_account from "../lib/callbackHandlers/account.js";
import type * as lib_callbackHandlers_accountExtended from "../lib/callbackHandlers/accountExtended.js";
import type * as lib_callbackHandlers_expense from "../lib/callbackHandlers/expense.js";
import type * as lib_callbackHandlers_income from "../lib/callbackHandlers/income.js";
import type * as lib_callbackHandlers_language from "../lib/callbackHandlers/language.js";
import type * as lib_callbackHandlers_ui from "../lib/callbackHandlers/ui.js";
import type * as lib_callbackHelpers from "../lib/callbackHelpers.js";
import type * as lib_callbackRegistry from "../lib/callbackRegistry.js";
import type * as lib_categoryMapper from "../lib/categoryMapper.js";
import type * as lib_clarificationHandler from "../lib/clarificationHandler.js";
import type * as lib_commandRouter from "../lib/commandRouter.js";
import type * as lib_confirmationHandler from "../lib/confirmationHandler.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_dateParser from "../lib/dateParser.js";
import type * as lib_deleteAccountConfirmation from "../lib/deleteAccountConfirmation.js";
import type * as lib_editAccountMenu from "../lib/editAccountMenu.js";
import type * as lib_editAccountName from "../lib/editAccountName.js";
import type * as lib_editAccountType from "../lib/editAccountType.js";
import type * as lib_expenseConfirmation from "../lib/expenseConfirmation.js";
import type * as lib_helpContent from "../lib/helpContent.js";
import type * as lib_incomeConfirmation from "../lib/incomeConfirmation.js";
import type * as lib_keyboards from "../lib/keyboards.js";
import type * as lib_logger from "../lib/logger.js";
import type * as lib_responseHelpers from "../lib/responseHelpers.js";
import type * as lib_setDefaultConfirmation from "../lib/setDefaultConfirmation.js";
import type * as lib_transactionFormatter from "../lib/transactionFormatter.js";
import type * as lib_validateAccountDeletion from "../lib/validateAccountDeletion.js";
import type * as messages_create from "../messages/create.js";
import type * as messages_getRecent from "../messages/getRecent.js";
import type * as pendingActions_cleanExpiredInternal from "../pendingActions/cleanExpiredInternal.js";
import type * as pendingActions_createPending from "../pendingActions/createPending.js";
import type * as pendingActions_deletePending from "../pendingActions/deletePending.js";
import type * as pendingActions_getById from "../pendingActions/getById.js";
import type * as pendingActions_getPending from "../pendingActions/getPending.js";
import type * as pendingActions_getPendingByConfirmationId from "../pendingActions/getPendingByConfirmationId.js";
import type * as pendingActions_getPendingByUserAndType from "../pendingActions/getPendingByUserAndType.js";
import type * as pendingActions_updatePending from "../pendingActions/updatePending.js";
import type * as telegram_sendMessage from "../telegram/sendMessage.js";
import type * as telegram_setWebhook from "../telegram/setWebhook.js";
import type * as telegram_types from "../telegram/types.js";
import type * as telegram_validation from "../telegram/validation.js";
import type * as telegram_webhook from "../telegram/webhook.js";
import type * as transactions_countByAccount from "../transactions/countByAccount.js";
import type * as transactions_createExpense from "../transactions/createExpense.js";
import type * as transactions_createIncome from "../transactions/createIncome.js";
import type * as users_getByTelegramId from "../users/getByTelegramId.js";
import type * as users_getProfile from "../users/getProfile.js";
import type * as users_register from "../users/register.js";
import type * as users_updateProfile from "../users/updateProfile.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "accounts/count": typeof accounts_count;
  "accounts/create": typeof accounts_create;
  "accounts/getById": typeof accounts_getById;
  "accounts/getByName": typeof accounts_getByName;
  "accounts/getDefault": typeof accounts_getDefault;
  "accounts/getOverview": typeof accounts_getOverview;
  "accounts/list": typeof accounts_list;
  "accounts/setDefault": typeof accounts_setDefault;
  "accounts/softDelete": typeof accounts_softDelete;
  "accounts/update": typeof accounts_update;
  "ai/nlParser": typeof ai_nlParser;
  "ai/parseExpenseIntent": typeof ai_parseExpenseIntent;
  "ai/parseIncomeIntent": typeof ai_parseIncomeIntent;
  "ai/parseUnifiedIntent": typeof ai_parseUnifiedIntent;
  "ai/prompts": typeof ai_prompts;
  "ai/types": typeof ai_types;
  "commands/createAccountCommand": typeof commands_createAccountCommand;
  "commands/deleteAccountCommand": typeof commands_deleteAccountCommand;
  "commands/editAccountCommand": typeof commands_editAccountCommand;
  "commands/helpCommand": typeof commands_helpCommand;
  "commands/logExpenseCommand": typeof commands_logExpenseCommand;
  "commands/logIncomeCommand": typeof commands_logIncomeCommand;
  "commands/registry": typeof commands_registry;
  "commands/setDefaultAccountCommand": typeof commands_setDefaultAccountCommand;
  "commands/startCommand": typeof commands_startCommand;
  "commands/types": typeof commands_types;
  "commands/viewAccountsCommand": typeof commands_viewAccountsCommand;
  "conversationStates/clear": typeof conversationStates_clear;
  "conversationStates/get": typeof conversationStates_get;
  "conversationStates/set": typeof conversationStates_set;
  crons: typeof crons;
  http: typeof http;
  "lib/accountFormatter": typeof lib_accountFormatter;
  "lib/accountSelector": typeof lib_accountSelector;
  "lib/balanceCalculator": typeof lib_balanceCalculator;
  "lib/callbackHandlers/account": typeof lib_callbackHandlers_account;
  "lib/callbackHandlers/accountExtended": typeof lib_callbackHandlers_accountExtended;
  "lib/callbackHandlers/expense": typeof lib_callbackHandlers_expense;
  "lib/callbackHandlers/income": typeof lib_callbackHandlers_income;
  "lib/callbackHandlers/language": typeof lib_callbackHandlers_language;
  "lib/callbackHandlers/ui": typeof lib_callbackHandlers_ui;
  "lib/callbackHelpers": typeof lib_callbackHelpers;
  "lib/callbackRegistry": typeof lib_callbackRegistry;
  "lib/categoryMapper": typeof lib_categoryMapper;
  "lib/clarificationHandler": typeof lib_clarificationHandler;
  "lib/commandRouter": typeof lib_commandRouter;
  "lib/confirmationHandler": typeof lib_confirmationHandler;
  "lib/constants": typeof lib_constants;
  "lib/dateParser": typeof lib_dateParser;
  "lib/deleteAccountConfirmation": typeof lib_deleteAccountConfirmation;
  "lib/editAccountMenu": typeof lib_editAccountMenu;
  "lib/editAccountName": typeof lib_editAccountName;
  "lib/editAccountType": typeof lib_editAccountType;
  "lib/expenseConfirmation": typeof lib_expenseConfirmation;
  "lib/helpContent": typeof lib_helpContent;
  "lib/incomeConfirmation": typeof lib_incomeConfirmation;
  "lib/keyboards": typeof lib_keyboards;
  "lib/logger": typeof lib_logger;
  "lib/responseHelpers": typeof lib_responseHelpers;
  "lib/setDefaultConfirmation": typeof lib_setDefaultConfirmation;
  "lib/transactionFormatter": typeof lib_transactionFormatter;
  "lib/validateAccountDeletion": typeof lib_validateAccountDeletion;
  "messages/create": typeof messages_create;
  "messages/getRecent": typeof messages_getRecent;
  "pendingActions/cleanExpiredInternal": typeof pendingActions_cleanExpiredInternal;
  "pendingActions/createPending": typeof pendingActions_createPending;
  "pendingActions/deletePending": typeof pendingActions_deletePending;
  "pendingActions/getById": typeof pendingActions_getById;
  "pendingActions/getPending": typeof pendingActions_getPending;
  "pendingActions/getPendingByConfirmationId": typeof pendingActions_getPendingByConfirmationId;
  "pendingActions/getPendingByUserAndType": typeof pendingActions_getPendingByUserAndType;
  "pendingActions/updatePending": typeof pendingActions_updatePending;
  "telegram/sendMessage": typeof telegram_sendMessage;
  "telegram/setWebhook": typeof telegram_setWebhook;
  "telegram/types": typeof telegram_types;
  "telegram/validation": typeof telegram_validation;
  "telegram/webhook": typeof telegram_webhook;
  "transactions/countByAccount": typeof transactions_countByAccount;
  "transactions/createExpense": typeof transactions_createExpense;
  "transactions/createIncome": typeof transactions_createIncome;
  "users/getByTelegramId": typeof users_getByTelegramId;
  "users/getProfile": typeof users_getProfile;
  "users/register": typeof users_register;
  "users/updateProfile": typeof users_updateProfile;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
