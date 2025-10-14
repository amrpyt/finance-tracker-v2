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
 */
export const EditAccountEntities = z.object({
  accountIdentifier: z.string().describe("Account name or ID to edit"),
  newName: z.string().optional().describe("New name for the account"),
  newBalance: z.number().optional().describe("New balance (manual adjustment)"),
});

export type EditAccountEntities = z.infer<typeof EditAccountEntities>;

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
    z.object({}), // Empty for intents without entities
  ]).describe("Extracted entities specific to the intent"),
  language: z.enum(["ar", "en"]).describe("Detected language"),
});

export type IntentDetectionResult = z.infer<typeof IntentDetectionResult>;

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
