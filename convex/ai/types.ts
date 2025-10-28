/**
 * AI Natural Language Processing Types
 * 
 * Defines schemas for intent detection and entity extraction
 * using RORK Toolkit API with Zod validation.
 */

import { z } from "zod";

/**
 * Account Management Intents (Epic 2)
 */
export const AccountIntent = z.enum([
  "create_account",
  "view_accounts",
  "edit_account",
  "delete_account",
  "set_default_account",
  "unknown", // For fallback when intent cannot be determined
]);

export type AccountIntent = z.infer<typeof AccountIntent>;

/**
 * Expense & Income Intents (Epic 3)
 */
export const ExpenseIntent = z.enum([
  "log_expense",   // دفعت 50 جنيه على القهوة
  "log_income",    // استلمت 1000 جنيه راتب
  "unknown",       // For fallback when intent cannot be determined
]);

export type ExpenseIntent = z.infer<typeof ExpenseIntent>;

/**
 * Account Type Enum
 */
export const AccountType = z.enum([
  "bank",      // حساب بنكي
  "cash",      // محفظة نقدية
  "credit_card", // بطاقة ائتمان
  "digital_wallet", // محفظة رقمية
]);

export type AccountType = z.infer<typeof AccountType>;

/**
 * Currency Enum
 */
export const Currency = z.enum([
  "EGP",  // Egyptian Pound
  "USD",  // US Dollar
  "EUR",  // Euro
  "SAR",  // Saudi Riyal
]);

export type Currency = z.infer<typeof Currency>;

/**
 * Expense Category Enum
 * Used for auto-categorization (Story 3.1 AC6)
 */
export const ExpenseCategory = z.enum([
  "food",          // طعام، قهوة، مطعم
  "transport",     // مواصلات، تاكسي، بنزين
  "entertainment", // ترفيه، سينما، لعب
  "shopping",      // تسوق، ملابس
  "bills",         // فواتير، كهرباء، مياه
  "health",        // صحة، دواء، طبيب
  "other",         // أخرى
]);

export type ExpenseCategory = z.infer<typeof ExpenseCategory>;

/**
 * Income Category Enum
 * Used for auto-categorization (Story 3.2 AC6)
 * Task 20: Add Income Category Definitions
 */
export const IncomeCategory = z.enum([
  "salary",      // راتب، مرتب
  "freelance",   // عمل حر، فريلانس
  "business",    // مشروع، تجارة
  "investment",  // استثمار، أرباح
  "gift",        // هدية، عيدية
  "other",       // أخرى
]);

export type IncomeCategory = z.infer<typeof IncomeCategory>;

/**
 * Account Creation Entities
 * Extracted from user messages like:
 * - "أنشئ حساب محفظة برصيد 500 جنيه"
 * - "Create cash account with 200 EGP"
 */
export const CreateAccountEntities = z.object({
  accountType: AccountType.describe("Type of account to create"),
  accountName: z.string().optional().describe("Custom name for the account (e.g., 'My Wallet', 'Main Bank')"),
  initialBalance: z.number().optional().describe("Starting balance amount"),
  currency: Currency.optional().describe("Currency code (defaults to EGP)"),
});

export type CreateAccountEntities = z.infer<typeof CreateAccountEntities>;

/**
 * Account Query Entities
 * For viewing/filtering accounts
 */
export const ViewAccountsEntities = z.object({
  accountType: AccountType.optional().describe("Filter by account type"),
  includeDeleted: z.boolean().optional().describe("Include deleted accounts in results"),
});

export type ViewAccountsEntities = z.infer<typeof ViewAccountsEntities>;

/**
 * Account Edit Entities
 * For updating account details
 * 
 * Story 2.3:
 * AC1: Intent Detection - Extracts optional entities for edit operations
 * AC6: Name Edit Flow - Extracts newName if provided
 * AC7: Type Edit Flow - Extracts newType if provided
 */
export const EditAccountEntities = z.object({
  accountId: z.string().optional().describe("Account ID to edit (if known)"),
  accountName: z.string().optional().describe("Account name to identify which account to edit"),
  newName: z.string().optional().describe("New name for the account"),
  newType: AccountType.optional().describe("New type for the account"),
});

export type EditAccountEntities = z.infer<typeof EditAccountEntities>;

/**
 * Set Default Account Entities
 * For setting an account as default
 * 
 * Story 2.4:
 * AC1: Intent Detection - Extracts optional account identifier
 */
export const SetDefaultAccountEntities = z.object({
  accountId: z.string().optional().describe("Account ID to set as default (if known)"),
  accountName: z.string().optional().describe("Account name to identify which account to set as default"),
});

export type SetDefaultAccountEntities = z.infer<typeof SetDefaultAccountEntities>;

/**
 * Log Expense Entities
 * For expense logging with natural language
 * 
 * Story 3.1:
 * AC2: AI Entity Extraction - amount, category, description, account with 85%+ accuracy
 * AC12: Date Support - Extracts date from natural language
 */
export const LogExpenseEntities = z.object({
  amount: z.preprocess(
    (val) => {
      // Coerce strings to numbers (handles AI returning "2000" instead of 2000)
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    },
    z.number().positive().describe("Expense amount (must be > 0)")
  ),
  category: ExpenseCategory.optional().describe("Auto-assigned category based on description"),
  description: z.string().optional().describe("Free-text description of the expense"),
  accountName: z.string().optional().describe("Account name to charge (if specified)"),
  date: z.string().optional().describe("Relative date like 'أمس', 'yesterday', 'last week', or specific date"),
});

export type LogExpenseEntities = z.infer<typeof LogExpenseEntities>;

/**
 * Log Income Entities
 * For income logging with natural language
 * 
 * Story 3.2:
 * AC2: AI Entity Extraction - amount, category, description, account with 85%+ accuracy
 * AC12: Date Support - Extracts date from natural language
 */
export const LogIncomeEntities = z.object({
  amount: z.preprocess(
    (val) => {
      // Coerce strings to numbers (handles AI returning "2000" instead of 2000)
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    },
    z.number().positive().describe("Income amount (must be > 0)")
  ),
  category: IncomeCategory.optional().describe("Auto-assigned category based on description"),
  description: z.string().optional().describe("Free-text description of the income"),
  accountName: z.string().optional().describe("Account name to credit (if specified)"),
  date: z.string().optional().describe("Relative date like 'أمس', 'yesterday', 'last week', or specific date"),
});

export type LogIncomeEntities = z.infer<typeof LogIncomeEntities>;

/**
 * Intent Detection Result
 * Returned from AI NLP parsing
 */
export const IntentDetectionResult = z.object({
  intent: AccountIntent.describe("Detected user intent"),
  confidence: z.number().min(0).max(1).describe("Confidence score (0-1)"),
  entities: z.union([
    CreateAccountEntities,
    ViewAccountsEntities,
    EditAccountEntities,
    SetDefaultAccountEntities,
    z.object({}), // Empty for intents without entities
  ]).describe("Extracted entities specific to the intent"),
  language: z.enum(["ar", "en"]).describe("Detected language"),
});

export type IntentDetectionResult = z.infer<typeof IntentDetectionResult>;

/**
 * Expense Intent Detection Result
 * Returned from AI NLP parsing for expense/income logging
 * 
 * Story 3.1: AC2, AC3 - Intent detection with 85%+ accuracy
 */
export const ExpenseIntentDetectionResult = z.object({
  intent: ExpenseIntent.describe("Detected expense/income intent"),
  confidence: z.number().min(0).max(1).describe("Confidence score (0-1)"),
  entities: z.union([
    LogExpenseEntities,
    LogIncomeEntities,
    z.object({}), // Empty for unknown intents
  ]).describe("Extracted entities for the expense/income"),
  language: z.enum(["ar", "en"]).describe("Detected language"),
});

export type ExpenseIntentDetectionResult = z.infer<typeof ExpenseIntentDetectionResult>;

/**
 * Unified Intent Enum (All Intents)
 * Task 13: Single parser for all intent types to reduce API calls
 */
export const UnifiedIntent = z.enum([
  // Account Management Intents (Epic 2)
  "create_account",
  "view_accounts",
  "edit_account",
  "delete_account",
  "set_default_account",
  // Transaction Intents (Epic 3)
  "log_expense",
  "log_income",
  // Fallback
  "unknown",
]);

export type UnifiedIntent = z.infer<typeof UnifiedIntent>;

/**
 * Unified Intent Detection Result
 * Single result type that can handle any intent with appropriate entities
 * Task 13: Performance optimization - single RORK call detects all intents
 */
export const UnifiedIntentDetectionResult = z.object({
  intent: UnifiedIntent.describe("Detected user intent (account or transaction)"),
  confidence: z.number().min(0).max(1).describe("Confidence score (0-1)"),
  entities: z.any().describe("Extracted entities specific to the intent - validated by command handlers"),
  language: z.enum(["ar", "en"]).describe("Detected language"),
});

export type UnifiedIntentDetectionResult = z.infer<typeof UnifiedIntentDetectionResult>;

/**
 * RORK API Message Format (Vercel AI SDK v5 compatible)
 */
export interface RorkMessage {
  id: string;
  role: "user" | "assistant" | "system";
  parts: RorkMessagePart[];
}

export type RorkMessagePart = RorkTextPart | RorkImagePart;

export interface RorkTextPart {
  type: "text";
  text: string;
}

export interface RorkImagePart {
  type: "image";
  image: string; // base64 encoded data URI
}

/**
 * RORK API Request/Response Types
 */
export interface RorkChatRequest {
  messages: RorkMessage[];
  tools?: Record<string, RorkToolDefinition>;
}

export interface RorkToolDefinition {
  description: string;
  parameters: any; // JSON Schema (converted from Zod)
}

export interface RorkChatResponse {
  messages: RorkMessage[];
}
