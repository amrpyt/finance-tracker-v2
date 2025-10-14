/**
 * Convex Database Schema Definition
 * Version: 1.0.0
 * Epic: 1 - Foundation & Telegram Bot Setup
 * 
 * This schema defines the core data model for the Finance Tracker application.
 * It includes tables for user management, profiles, financial accounts, and conversation history.
 * 
 * References:
 * - PRD: docs/PRD.md (FR1: User Onboarding & Authentication, FR2: Account Management)
 * - Architecture: docs/solution-architecture.md (Data Architecture section)
 * - Tech Spec: docs/tech-spec-epic-1.md (Data Models and Contracts)
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Database Schema Export
 * 
 * Design Principles:
 * - Soft Deletes: isDeleted flag preserves audit trail for accounts
 * - Timestamps: Unix timestamps (Date.now()) for cross-timezone consistency
 * - User Isolation: All data scoped by userId with supporting indexes
 * - Comprehensive Indexes: Every query path has supporting index (O(log n) lookups)
 * - Type Safety: Convex Id<"tableName"> for foreign key references
 */
export default defineSchema({
  /**
   * Users Table
   * 
   * Stores core user authentication data from Telegram.
   * Primary authentication uses Telegram ID which is unique per user.
   * 
   * Usage: FR1 (User Onboarding & Authentication)
   * Epic: 1 (Story 1.3 - User Registration)
   * 
   * Indexes:
   * - by_telegram_id: Supports fast authentication lookup on every message (< 100ms)
   */
  users: defineTable({
    telegramId: v.string(), // Unique identifier from Telegram (e.g., "123456789")
    username: v.optional(v.string()), // Telegram username (e.g., "@johndoe")
    firstName: v.optional(v.string()), // User's first name from Telegram
    lastName: v.optional(v.string()), // User's last name from Telegram
    createdAt: v.number(), // Unix timestamp of user registration
  }).index("by_telegram_id", ["telegramId"]), // Fast authentication lookup

  /**
   * User Profiles Table
   * 
   * Stores user preferences and settings separate from authentication data.
   * One profile per user, created during onboarding.
   * 
   * Usage: FR1 (Language preference, default account, notification settings)
   * Epic: 1 (Story 1.3 - User Registration with profile creation)
   * 
   * Indexes:
   * - by_user: Enables single-query profile retrieval
   * 
   * Default Values (set during registration):
   * - language: "ar" (Arabic) or "en" (English) - user selects during /start
   * - currency: "EGP" (Egyptian Pound)
   * - timezone: "Africa/Cairo"
   * - All notification preferences: true (user can disable later)
   */
  userProfiles: defineTable({
    userId: v.id("users"), // Foreign key to users table
    language: v.union(v.literal("ar"), v.literal("en")), // User's preferred language
    defaultAccountId: v.optional(v.id("accounts")), // Default account for quick transactions (Epic 2)
    
    // Notification preferences for different event types (Epic 3+)
    notificationPreferences: v.object({
      dailySummary: v.boolean(), // Daily spending summary (Epic 3)
      budgetAlerts: v.boolean(), // Budget threshold warnings (Epic 4)
      accountUpdates: v.boolean(), // Account balance changes (Epic 2)
      systemMessages: v.boolean(), // System announcements
      voiceConfirmations: v.boolean(), // Voice message processing confirmations (Epic 3)
    }),
    
    currency: v.string(), // Primary currency (e.g., "EGP", "USD")
    timezone: v.string(), // IANA timezone (e.g., "Africa/Cairo") for date formatting
    updatedAt: v.number(), // Unix timestamp of last profile update
  }).index("by_user", ["userId"]), // Fast profile fetch by user

  /**
   * Accounts Table
   * 
   * Stores financial accounts (bank, cash, credit card, digital wallet).
   * Users can create multiple accounts with different currencies.
   * Supports soft deletes to preserve transaction history and audit trail.
   * 
   * Usage: FR2 (Account Management)
   * Epic: 2 (Stories 2.1-2.4 - Account CRUD operations)
   * 
   * Indexes:
   * - by_user: Fetch all accounts for a user
   * - by_user_active: Filter active (non-deleted) accounts efficiently
   * - by_user_default: Quick lookup for default account during transactions
   * 
   * Account Types:
   * - bank: Traditional bank account
   * - cash: Physical cash
   * - credit_card: Credit card account
   * - digital_wallet: E-wallets (Vodafone Cash, InstaPay, etc.)
   */
  accounts: defineTable({
    userId: v.id("users"), // Foreign key to users table
    name: v.string(), // User-defined name (e.g., "Main Wallet", "CIB Bank")
    type: v.union(
      v.literal("bank"),
      v.literal("cash"),
      v.literal("credit_card"),
      v.literal("digital_wallet")
    ),
    balance: v.number(), // Current account balance (can be negative for credit cards)
    currency: v.string(), // Account currency (e.g., "EGP", "USD")
    isDefault: v.boolean(), // One default account per user for quick transactions
    isDeleted: v.boolean(), // Soft delete flag - preserves transaction history
    createdAt: v.number(), // Unix timestamp of account creation
    updatedAt: v.number(), // Unix timestamp of last account update
  })
    .index("by_user", ["userId"]) // Fetch all accounts
    .index("by_user_active", ["userId", "isDeleted"]) // Filter active accounts
    .index("by_user_default", ["userId", "isDefault"]), // Find default account

  /**
   * Messages Table
   * 
   * Stores conversation history between user and the Telegram bot.
   * Supports text and voice messages (voice is transcribed to text).
   * Used for AI context, debugging, and user support.
   * 
   * Usage: All epics (conversation tracking, AI intent detection)
   * Epic: 1 (Story 1.4 - Message handling)
   * Epic: 3 (Voice message support with transcription)
   * 
   * Indexes:
   * - by_user: Fetch all messages for a user
   * - by_user_date: Supports pagination and recent message queries
   * 
   * Message Roles:
   * - user: Message from the user to the bot
   * - assistant: Response from the bot to the user
   * - system: System-generated messages (e.g., onboarding prompts)
   * 
   * Future Enhancements (Epic 3+):
   * - isVoiceMessage: Flag for voice message detection
   * - intent: AI-detected user intent (e.g., "add_transaction", "view_balance")
   * - entities: Extracted entities from message (e.g., amounts, dates, categories)
   */
  messages: defineTable({
    userId: v.id("users"), // Foreign key to users table
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(), // Message text or voice transcription
    isVoiceMessage: v.optional(v.boolean()), // True if message was originally voice (Epic 3)
    intent: v.optional(v.string()), // AI-detected intent for debugging (Epic 3)
    entities: v.optional(v.any()), // Extracted entities from AI processing (Epic 3)
    createdAt: v.number(), // Unix timestamp of message
  })
    .index("by_user", ["userId"]) // Fetch all user messages
    .index("by_user_date", ["userId", "createdAt"]), // Recent messages + pagination

  /**
   * Pending Actions Table
   * 
   * Stores temporary state for confirmation workflows (e.g., account creation confirmations).
   * Actions expire after 5 minutes to prevent stale confirmations.
   * 
   * Usage: FR2 (Account Management - Confirmation workflows)
   * Epic: 2 (Story 2.1 - Create Account with confirmation)
   * 
   * Indexes:
   * - by_user: Fetch all pending actions for a user
   * - by_message: Fast lookup on callback button press (links to Telegram messageId)
   * - by_expiration: Scheduled cleanup job to remove expired actions
   * 
   * Lifecycle:
   * 1. Created when user initiates action requiring confirmation
   * 2. Updated when user clicks inline button
   * 3. Deleted after action completed or expired
   * 4. Cleaned up hourly by scheduled job
   */
  pendingActions: defineTable({
    userId: v.id("users"), // Foreign key to users table
    actionType: v.string(), // Type of pending action (e.g., "create_account", "delete_account")
    actionData: v.any(), // JSON data for the action (entities from AI parsing, etc.)
    messageId: v.number(), // Telegram message ID for callback tracking
    expiresAt: v.number(), // Unix timestamp when action expires (5 minutes from creation)
    createdAt: v.number(), // Unix timestamp of action creation
  })
    .index("by_user", ["userId"]) // Fetch all pending actions for user
    .index("by_message", ["messageId"]) // Fast lookup on callback button press
    .index("by_expiration", ["expiresAt"]), // Scheduled cleanup of expired actions
});
