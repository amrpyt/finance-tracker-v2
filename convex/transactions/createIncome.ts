/**
 * Create Income Transaction Mutation
 * 
 * Story 3.2: AI Income Logging
 * Task 6: Create Income Transaction Mutation (AC: #8, #13)
 * 
 * Creates an income transaction and INCREASES amount in account balance
 * in a single atomic operation.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import logger from "../lib/logger";

/**
 * Create income transaction and update account balance atomically
 * 
 * Task 6.2: Define input schema: userId, accountId, amount, category, description, date
 * Task 6.3: Validate amount > 0 and < 1,000,000
 * Task 6.4: Validate accountId exists and user owns it
 * Task 6.5: Insert transaction record with type="income"
 * Task 6.6: **INCREASE** account balance: balance += amount (NOT decrease!)
 * Task 6.7: Update account.updatedAt timestamp
 * Task 6.8: Return created transaction with updated balance
 * Task 6.9: Wrap in transaction for atomicity
 * 
 * AC8: Balance Increase - Creates income transaction, INCREASES amount in account balance (not decrease)
 * AC13: Amount Validation - Validates amount > 0 and amount < 1,000,000
 * 
 * @param userId - User ID creating the transaction
 * @param accountId - Account ID to credit
 * @param amount - Income amount (must be > 0 and < 1,000,000)
 * @param category - Income category (salary, freelance, business, investment, gift, other)
 * @param description - Optional income description
 * @param date - Transaction date (Unix timestamp)
 * @returns Created transaction and updated account balance
 */
export const createIncome = mutation({
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
      }, "Invalid income amount: must be greater than zero");
      throw new Error("المبلغ غير صحيح. يجب أن يكون أكبر من صفر");
    }

    // Use the coerced numeric amount for all operations
    const validatedAmount = numericAmount;

    if (validatedAmount >= 1_000_000) {
      logger.warn({
        userId: args.userId,
        amount: args.amount,
      }, "Invalid income amount: must be less than 1,000,000");
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
      }, "Cannot create income on deleted account");
      throw new Error("لا يمكن إضافة دخل لحساب محذوف");
    }

    // Task 6.9: Atomic transaction - All DB operations succeed or fail together
    try {
      // Task 6.5: Insert transaction record with type="income"
      const transactionId = await ctx.db.insert("transactions", {
        userId: args.userId,
        accountId: args.accountId,
        type: "income",
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
      }, "Income transaction created");

      // Task 6.6: **INCREASE** account balance (AC8) - Critical difference from expense!
      // balance += amount (NOT balance -= amount)
      const newBalance = account.balance + validatedAmount;

      // Task 6.7: Update account balance and updatedAt timestamp
      await ctx.db.patch(args.accountId, {
        balance: newBalance,
        updatedAt: Date.now(),
      });

      logger.info({
        accountId: args.accountId,
        oldBalance: account.balance,
        newBalance,
        amountAdded: validatedAmount,
      }, "Account balance increased");

      // Task 6.8: Return created transaction with updated account balance
      const transaction = await ctx.db.get(transactionId);

      const processingTime = Date.now() - startTime;
      logger.info({
        transactionId,
        processingTimeMs: processingTime,
      }, "Income transaction completed successfully");

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
      }, "Failed to create income transaction");
      throw error;
    }
  },
});
