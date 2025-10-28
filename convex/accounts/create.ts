/**
 * Create Account Mutation
 * 
 * Creates a new financial account with validation and smart defaults.
 * 
 * Story 2.1:
 * AC5: Account Creation - Creates account record with all required fields
 * AC6: Default Account Handling - First account automatically default
 * AC8: Account Name Generation - Generates default names with increments
 * AC9: Currency Default - Uses user profile currency if not specified
 * AC10: Validation Rules - Enforces all validation constraints
 * AC11: Duplicate Prevention - Ensures unique account names per user
 */

import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { api } from "../_generated/api";

/**
 * Create a new financial account
 * 
 * @param userId - Owner of the account
 * @param accountType - Type: bank, cash, credit_card, digital_wallet
 * @param accountName - Custom name (optional, auto-generated if not provided)
 * @param initialBalance - Starting balance (optional, defaults to 0)
 * @param currency - Account currency (optional, uses user profile default)
 * @returns Account ID
 */
export const create: any = mutation({
  args: {
    userId: v.id("users"),
    accountType: v.union(
      v.literal("bank"),
      v.literal("cash"),
      v.literal("credit_card"),
      v.literal("digital_wallet")
    ),
    accountName: v.optional(v.string()),
    initialBalance: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const { userId, accountType, accountName, initialBalance, currency } = args;

    // Validate account type (AC10)
    const validTypes = ["bank", "cash", "credit_card", "digital_wallet"];
    if (!validTypes.includes(accountType)) {
      throw new Error(`Invalid account type: ${accountType}`);
    }

    // Validate initial balance (AC10)
    // Credit cards can have 0 or negative balance, others must be >= 0
    const balance = initialBalance ?? 0;
    if (accountType !== "credit_card" && balance < 0) {
      throw new Error("Initial balance must be >= 0 for non-credit card accounts");
    }

    // Get user profile for currency default (AC9)
    const profile: any = await ctx.runQuery(api.users.getProfile.getProfile, {
      userId,
    });

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Use profile currency if not specified (AC9)
    const accountCurrency: string = currency || profile.currency;

    // Validate currency is supported (AC10)
    const supportedCurrencies = ["EGP", "USD", "SAR", "EUR"];
    if (!supportedCurrencies.includes(accountCurrency)) {
      throw new Error(`Unsupported currency: ${accountCurrency}`);
    }

    // Generate or validate account name (AC8, AC11)
    let finalAccountName = accountName;

    if (!finalAccountName) {
      // Generate default name based on type (AC8)
      const typeNameMap: Record<string, string> = {
        bank: "Bank Account",
        cash: "Cash Wallet",
        credit_card: "Credit Card",
        digital_wallet: "Digital Wallet",
      };

      const baseName = typeNameMap[accountType] || "Account";

      // Get existing accounts to find next available number (AC11)
      const existingAccounts = await ctx.db
        .query("accounts")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("isDeleted"), false))
        .collect();

      // Find accounts with same base name pattern
      const sameTypeAccounts = existingAccounts.filter((acc) =>
        acc.name.startsWith(baseName)
      );

      // Generate name with next available number
      const nextNumber = sameTypeAccounts.length + 1;
      finalAccountName = `${baseName} ${nextNumber}`;
    } else {
      // Validate name length (AC10)
      if (finalAccountName.length > 50) {
        throw new Error("Account name must be 50 characters or less");
      }

      // Check for duplicate name (AC11)
      const existingWithName = await ctx.db
        .query("accounts")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) =>
          q.and(
            q.eq(q.field("name"), finalAccountName),
            q.eq(q.field("isDeleted"), false)
          )
        )
        .first();

      if (existingWithName) {
        throw new Error(`Account with name "${finalAccountName}" already exists`);
      }
    }

    // Check if user has any existing accounts (AC6)
    const accountCount = await ctx.db
      .query("accounts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    const isFirstAccount = accountCount.length === 0;

    // Create account (AC5)
    const now = Date.now();
    const accountId: any = await ctx.db.insert("accounts", {
      userId,
      name: finalAccountName,
      type: accountType,
      balance,
      currency: accountCurrency,
      isDefault: isFirstAccount, // First account automatically default (AC6)
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });

    return accountId;
  },
});
