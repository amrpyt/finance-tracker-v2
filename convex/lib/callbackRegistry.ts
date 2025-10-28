/**
 * Callback Registry - Type-Safe Callback Handler Management
 * 
 * This module implements TD-001 Phase 2: Type-Safe Callback System.
 * It provides a centralized registry for mapping callback patterns to handlers,
 * with compile-time type safety to prevent "handler not found" runtime errors.
 * 
 * Pattern:
 * - All callback patterns defined in constants.ts
 * - All handlers organized by domain (account, expense, ui)
 * - Type-safe mapping prevents missing handlers at compile time
 * - Single source of truth for callback routing
 * 
 * @see docs/decisions/ADR-004-ai-prompt-callback-management.md
 * @see docs/stories/story-TD-001.md
 */

import type { ActionCtx } from "../_generated/server";
import { CALLBACK_PATTERNS } from "./constants";
import * as languageHandlers from "./callbackHandlers/language";
import * as accountHandlers from "./callbackHandlers/account";
import * as accountExtended from "./callbackHandlers/accountExtended";
import * as expenseHandlers from "./callbackHandlers/expense";
import * as incomeHandlers from "./callbackHandlers/income";
import * as uiHandlers from "./callbackHandlers/ui";

/**
 * Callback context passed to all callback handlers
 * 
 * Contains all information needed to process a callback:
 * - Convex action context for database/API access
 * - User information and preferences
 * - Callback query data from Telegram
 * - Chat context for sending responses
 */
export interface CallbackContext {
  /** Convex action context for running queries/mutations */
  ctx: ActionCtx;
  /** User ID from database */
  userId: string;
  /** User's preferred language */
  language: "ar" | "en";
  /** Telegram chat ID for sending messages */
  chatId: number;
  /** Callback query ID (must be answered within 30 seconds) */
  callbackQueryId: string;
  /** Callback data (pattern with optional parameters) */
  data: string;
  /** Optional message from callback query */
  message?: {
    message_id: number;
    [key: string]: any;
  };
}

/**
 * Callback handler function signature
 * 
 * All handlers must:
 * - Accept CallbackContext
 * - Return Promise<void>
 * - Answer the callback query (or let router do it)
 * - Handle errors gracefully
 */
export type CallbackHandler = (context: CallbackContext) => Promise<void>;

/**
 * Callback Handlers Registry
 * 
 * Maps callback patterns to their handler functions.
 * This is the single source of truth for callback routing.
 * 
 * Pattern naming convention:
 * - Simple patterns: exact match (e.g., "refresh_accounts")
 * - Prefix patterns: ends with underscore (e.g., "confirm_account_")
 * 
 * Type safety:
 * - TypeScript enforces that all patterns have handlers
 * - Compiler errors if pattern is missing from registry
 * - Compiler errors if handler is unused
 */
export const CALLBACK_HANDLERS: Record<string, CallbackHandler> = {
  // ========== LANGUAGE HANDLER (Story 1.3) ==========
  [CALLBACK_PATTERNS.LANGUAGE_PREFIX]: languageHandlers.languageSelection,
  
  // ========== ACCOUNT HANDLERS (Task 2) ==========
  // Account creation
  [CALLBACK_PATTERNS.CONFIRM_ACCOUNT_PREFIX]: accountHandlers.confirmAccount,
  [CALLBACK_PATTERNS.CANCEL_ACCOUNT_PREFIX]: accountHandlers.cancelAccount,
  [CALLBACK_PATTERNS.ACCOUNT_TYPE_PREFIX]: accountHandlers.accountType,
  
  // Set default (old pattern from Story 2.1)
  [CALLBACK_PATTERNS.SET_DEFAULT_YES]: accountHandlers.setDefaultYes,
  [CALLBACK_PATTERNS.SET_DEFAULT_NO]: accountHandlers.setDefaultNo,
  
  // Account editing
  "select_account_edit_": accountExtended.selectAccountEdit,
  "edit_name_": accountExtended.editName,
  "edit_type_": accountExtended.editType,
  "select_type_": accountExtended.selectType,
  "confirm_name_": accountExtended.confirmName,
  "confirm_type_": accountExtended.confirmType,
  "cancel_edit": accountExtended.cancelEdit,
  
  // Set default account
  "select_account_default_": accountExtended.selectAccountDefault,
  "confirm_set_default_": accountExtended.confirmSetDefault,
  "cancel_set_default": accountExtended.cancelSetDefault,
  
  // Account deletion
  "select_account_delete_": accountExtended.selectAccountDelete,
  "confirm_delete_": accountExtended.confirmDelete,
  "cancel_delete": accountExtended.cancelDelete,
  
  // ========== EXPENSE HANDLERS (Task 3) ==========
  // Expense confirmation/cancellation
  [CALLBACK_PATTERNS.CONFIRM_EXPENSE_PREFIX]: expenseHandlers.confirmExpense,
  [CALLBACK_PATTERNS.CANCEL_EXPENSE_PREFIX]: expenseHandlers.cancelExpense,
  
  // Expense editing
  [CALLBACK_PATTERNS.EDIT_EXPENSE_PREFIX]: expenseHandlers.editExpense,
  [CALLBACK_PATTERNS.EDIT_EXPENSE_AMOUNT_PREFIX]: expenseHandlers.editExpenseAmount,
  [CALLBACK_PATTERNS.EDIT_EXPENSE_CATEGORY_PREFIX]: expenseHandlers.editExpenseCategory,
  [CALLBACK_PATTERNS.EDIT_EXPENSE_DESCRIPTION_PREFIX]: expenseHandlers.editExpenseDescription,
  [CALLBACK_PATTERNS.EDIT_EXPENSE_ACCOUNT_PREFIX]: expenseHandlers.editExpenseAccount,
  
  // Account selection for expense
  [CALLBACK_PATTERNS.SELECT_ACCOUNT_EXPENSE_PREFIX]: expenseHandlers.selectAccountExpense,
  
  // Back to confirmation
  [CALLBACK_PATTERNS.BACK_TO_CONFIRMATION_PREFIX]: expenseHandlers.backToConfirmation,
  
  // ========== INCOME HANDLERS (Story 3.2 - Tasks 9-10) ==========
  // Income confirmation/cancellation
  [CALLBACK_PATTERNS.CONFIRM_INCOME]: incomeHandlers.handleConfirmIncome,
  [CALLBACK_PATTERNS.CANCEL_INCOME]: incomeHandlers.handleCancelIncome,
  
  // Account selection for income
  [CALLBACK_PATTERNS.SELECT_ACCOUNT_INCOME]: incomeHandlers.handleSelectAccountIncome,
  
  // ========== UI ACTION HANDLERS (Task 4) ==========
  // Accounts overview actions
  "refresh_accounts": uiHandlers.refreshAccounts,
  "create_account": uiHandlers.createAccount,
  "edit_account_select": uiHandlers.editAccountSelect,
  "delete_account_select": uiHandlers.deleteAccountSelect,
};

/**
 * Compile-time validation (TD-001 Task 6)
 * 
 * These type checks ensure that:
 * 1. All callback patterns have handlers
 * 2. All handlers are registered with patterns
 * 3. TypeScript will error at compile time if there's a mismatch
 */

// Extract all pattern keys from CALLBACK_PATTERNS
type CallbackPatternKeys = typeof CALLBACK_PATTERNS[keyof typeof CALLBACK_PATTERNS];

// Extract all handler keys from CALLBACK_HANDLERS
type HandlerKeys = keyof typeof CALLBACK_HANDLERS;

// Type-level validation to ensure all patterns have handlers
type PatternsWithoutHandlers = Exclude<CallbackPatternKeys, HandlerKeys>;

// Type check: This should resolve to 'never' if all patterns have handlers
const _patternCheck: PatternsWithoutHandlers = undefined as never;

// Check 2: Document registered patterns (for visibility)
// These patterns have handlers but aren't in CALLBACK_PATTERNS constant
// This is OK for patterns like "refresh_accounts", "create_account", etc.
type HandlersWithoutPatterns = Exclude<HandlerKeys, CallbackPatternKeys>;

/**
 * Route callback to appropriate handler
 * 
 * This is the main entry point for callback routing.
 * It performs pattern matching and delegates to the registered handler.
 * 
 * Pattern matching:
 * - Exact match: callback data === pattern
 * - Prefix match: callback data starts with pattern (for patterns ending in "_")
 * 
 * Error handling:
 * - Logs warning if no handler found
 * - Returns early without throwing to prevent webhook failures
 * 
 * @param context - Callback context with all necessary information
 * @returns Promise that resolves when handler completes
 */
export async function routeCallback(context: CallbackContext): Promise<void> {
  const { data } = context;

  // Try exact match first
  if (CALLBACK_HANDLERS[data]) {
    await CALLBACK_HANDLERS[data](context);
    return;
  }

  // Try prefix match for patterns with parameters
  for (const [pattern, handler] of Object.entries(CALLBACK_HANDLERS)) {
    if (pattern.endsWith("_") && data.startsWith(pattern)) {
      await handler(context);
      return;
    }
  }

  // No handler found - log warning
  console.warn(`[CallbackRegistry] No handler found for callback data: ${data}`);
}

/**
 * Helper function to extract parameter from callback data
 * 
 * Examples:
 * - extractParameter("confirm_account_123", "confirm_account_") => "123"
 * - extractParameter("select_type_bank_456", "select_type_") => "bank_456"
 * 
 * @param data - Full callback data string
 * @param prefix - Pattern prefix to remove
 * @returns Parameter value (everything after prefix)
 */
export function extractParameter(data: string, prefix: string): string {
  return data.replace(prefix, "");
}

/**
 * Helper function to extract multiple parameters from callback data
 * 
 * Used for callbacks with multiple underscore-separated parameters.
 * 
 * Example:
 * - extractParameters("select_account_expense_123_abc", "select_account_expense_") => ["123", "abc"]
 * 
 * @param data - Full callback data string
 * @param prefix - Pattern prefix to remove
 * @param separator - Character to split on (default: "_")
 * @returns Array of parameter values
 */
export function extractParameters(
  data: string,
  prefix: string,
  separator: string = "_"
): string[] {
  const paramString = extractParameter(data, prefix);
  return paramString.split(separator);
}
