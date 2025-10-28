/**
 * Create Expense Transaction Mutation
 * 
 * Story 3.1: AI Expense Logging
 * Task 6: Create Expense Transaction Mutation (AC: #8, #13)
 * 
 * Creates an expense transaction and deducts amount from account balance
 * in a single atomic operation.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import logger from "../lib/logger";

/**
 * Create expense transaction and update account balance atomically
 * 
 * Task 6.2: Define input schema
 * Task 6.3: Validate amount > 0 and < 1,000,000
 * Task 6.4: Validate accountId exists and user owns it
 * Task 6.5: Insert transaction record
 * Task 6.6: Deduct amount from account balance
 * Task 6.7: Update account.updatedAt
 * Task 6.8: Return created transaction with updated balance
 * Task 6.9: Wrap in transaction for atomicity
 * 
 * AC8: Balance Deduction - Creates expense transaction, deducts amount from account balance
 * AC13: Amount Validation - Validates amount > 0 and amount < 1,000,000
 * 
 * @param userId - User ID creating the transaction
 * @param accountId - Account ID to deduct from
 * @param amount - Expense amount (must be > 0 and < 1,000,000)
 * @param category - Expense category (food, transport, etc.)
 * @param description - Optional expense description
 * @param date - Transaction date (Unix timestamp)
 * @returns Created transaction and updated account balance
 */
export const createExpense = mutation({
  args: {
    userId: v.id("users"),
    accountId: v.id("accounts"),
    amount: v.number(),
    category: v.string(),
    description: v.optional(v.string()),
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();

    // Task 6.3: Validate amount > 0 and amount < 1,000,000 (AC13)
    // Coerce to number in case of string from v.any() storage
    const numericAmount = typeof args.amount === 'string' ? parseFloat(args.amount) : args.amount;

    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      logger.warn({
        userId: args.userId,
        amount: args.amount,
        numericAmount,
        type: typeof args.amount,
      }, "Invalid expense amount: must be greater than zero");
      throw new Error("المبلغ غير صحيح. يجب أن يكون أكبر من صفر");
    }

    // Use the coerced numeric amount for all operations
    const validatedAmount = numericAmount;

    if (validatedAmount >= 1_000_000) {
      logger.warn({
        userId: args.userId,
        amount: args.amount,
      }, "Invalid expense amount: must be less than 1,000,000");
      throw new Error("المبلغ كبير جداً. الحد الأقصى هو 1,000,000");
    }

    // Task 6.4: Validate accountId exists and user owns it
    const account = await ctx.db.get(args.accountId);
    
    if (!account) {
      logger.error({
        userId: args.userId,
        accountId: args.accountId,
      }, "Account not found");
      throw new Error("الحساب غير موجود");
    }

    if (account.userId !== args.userId) {
      logger.error({
        userId: args.userId,
        accountId: args.accountId,
        accountUserId: account.userId,
      }, "User does not own this account");
      throw new Error("ليس لديك صلاحية على هذا الحساب");
    }

    if (account.isDeleted) {
      logger.error({
        userId: args.userId,
        accountId: args.accountId,
      }, "Cannot create expense on deleted account");
      throw new Error("لا يمكن إضافة مصروف لحساب محذوف");
    }

    // Task 6.9: Atomic transaction - All DB operations succeed or fail together
    try {
      // Task 6.5: Insert transaction record with type="expense"
      const transactionId = await ctx.db.insert("transactions", {
        userId: args.userId,
        accountId: args.accountId,
        type: "expense",
        amount: validatedAmount,
        category: args.category,
        description: args.description,
        date: args.date,
        isDeleted: false,
        createdAt: Date.now(),
      });

      logger.info({
        transactionId,
        userId: args.userId,
        accountId: args.accountId,
        amount: validatedAmount,
        category: args.category,
      }, "Expense transaction created");

      // Task 6.6: Deduct amount from account balance (AC8)
      const newBalance = account.balance - validatedAmount;

      // Task 6.7: Update account balance and updatedAt timestamp
      await ctx.db.patch(args.accountId, {
        balance: newBalance,
        updatedAt: Date.now(),
      });

      logger.info({
        accountId: args.accountId,
        oldBalance: account.balance,
        newBalance,
        amountDeducted: validatedAmount,
      }, "Account balance updated");

      // Task 6.8: Return created transaction with updated account balance
      const transaction = await ctx.db.get(transactionId);

      const processingTime = Date.now() - startTime;
      logger.info({
        transactionId,
        processingTimeMs: processingTime,
      }, "Expense transaction completed successfully");

      return {
        transaction,
        newBalance,
        account: {
          _id: account._id,
          name: account.name,
          type: account.type,
          currency: account.currency,
        },
      };
    } catch (error) {
      // If any operation fails, Convex automatically rolls back all changes
      logger.error({
        userId: args.userId,
        accountId: args.accountId,
        error: error instanceof Error ? error.message : String(error),
      }, "Failed to create expense transaction");
      throw error;
    }
  },
});

/**
 * Get transaction count for an account
 * Helper query for account deletion (Story 2.5)
 */
export const getAccountTransactionCount = mutation({
  args: {
    accountId: v.id("accounts"),
  },
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .filter((q) => q.eq(q.field("isDeleted"), false))
      .collect();

    return transactions.length;
  },
});
