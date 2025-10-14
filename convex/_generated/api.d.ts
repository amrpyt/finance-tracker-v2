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
import type * as accounts_list from "../accounts/list.js";
import type * as ai_nlParser from "../ai/nlParser.js";
import type * as ai_types from "../ai/types.js";
import type * as commands_createAccountCommand from "../commands/createAccountCommand.js";
import type * as commands_helpCommand from "../commands/helpCommand.js";
import type * as commands_registry from "../commands/registry.js";
import type * as commands_startCommand from "../commands/startCommand.js";
import type * as commands_types from "../commands/types.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as lib_clarificationHandler from "../lib/clarificationHandler.js";
import type * as lib_commandRouter from "../lib/commandRouter.js";
import type * as lib_confirmationHandler from "../lib/confirmationHandler.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_helpContent from "../lib/helpContent.js";
import type * as lib_keyboards from "../lib/keyboards.js";
import type * as lib_responseHelpers from "../lib/responseHelpers.js";
import type * as messages_create from "../messages/create.js";
import type * as pendingActions_cleanExpiredInternal from "../pendingActions/cleanExpiredInternal.js";
import type * as pendingActions_createPending from "../pendingActions/createPending.js";
import type * as pendingActions_deletePending from "../pendingActions/deletePending.js";
import type * as pendingActions_getById from "../pendingActions/getById.js";
import type * as pendingActions_getPending from "../pendingActions/getPending.js";
import type * as pendingActions_getPendingByUserAndType from "../pendingActions/getPendingByUserAndType.js";
import type * as telegram_sendMessage from "../telegram/sendMessage.js";
import type * as telegram_setWebhook from "../telegram/setWebhook.js";
import type * as telegram_types from "../telegram/types.js";
import type * as telegram_validation from "../telegram/validation.js";
import type * as telegram_webhook from "../telegram/webhook.js";
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
  "accounts/list": typeof accounts_list;
  "ai/nlParser": typeof ai_nlParser;
  "ai/types": typeof ai_types;
  "commands/createAccountCommand": typeof commands_createAccountCommand;
  "commands/helpCommand": typeof commands_helpCommand;
  "commands/registry": typeof commands_registry;
  "commands/startCommand": typeof commands_startCommand;
  "commands/types": typeof commands_types;
  crons: typeof crons;
  http: typeof http;
  "lib/clarificationHandler": typeof lib_clarificationHandler;
  "lib/commandRouter": typeof lib_commandRouter;
  "lib/confirmationHandler": typeof lib_confirmationHandler;
  "lib/constants": typeof lib_constants;
  "lib/helpContent": typeof lib_helpContent;
  "lib/keyboards": typeof lib_keyboards;
  "lib/responseHelpers": typeof lib_responseHelpers;
  "messages/create": typeof messages_create;
  "pendingActions/cleanExpiredInternal": typeof pendingActions_cleanExpiredInternal;
  "pendingActions/createPending": typeof pendingActions_createPending;
  "pendingActions/deletePending": typeof pendingActions_deletePending;
  "pendingActions/getById": typeof pendingActions_getById;
  "pendingActions/getPending": typeof pendingActions_getPending;
  "pendingActions/getPendingByUserAndType": typeof pendingActions_getPendingByUserAndType;
  "telegram/sendMessage": typeof telegram_sendMessage;
  "telegram/setWebhook": typeof telegram_setWebhook;
  "telegram/types": typeof telegram_types;
  "telegram/validation": typeof telegram_validation;
  "telegram/webhook": typeof telegram_webhook;
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
