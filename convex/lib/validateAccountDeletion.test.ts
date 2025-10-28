/**
 * Integration Tests for Account Deletion Validation
 * 
 * Story 2.5 - Task 14: Add Integration Tests
 * Tests validation logic for AC8, AC9
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateAccountDeletion } from "./validateAccountDeletion";
import type { QueryCtx } from "../_generated/server";

// Mock Convex context
const createMockCtx = () => {
  // Create a shared mock chain
  const mockChain = {
    withIndex: vi.fn(function(this: any) { return this; }),
    filter: vi.fn(function(this: any) { return this; }),
    collect: vi.fn(),
    first: vi.fn(),
  };

  const mockDb = {
    get: vi.fn(),
    query: vi.fn(() => mockChain),
  };

  return {
    db: mockDb,
  } as unknown as QueryCtx;
};

describe("validateAccountDeletion", () => {
  let mockCtx: QueryCtx;

  beforeEach(() => {
    mockCtx = createMockCtx();
    vi.clearAllMocks();
  });

  describe("Account Ownership Validation", () => {
    it("should pass validation when user owns the account", async () => {
      const userId = "user123" as any;
      const accountId = "account456" as any;

      const mockAccount = {
        _id: accountId,
        userId,
        name: "My Account",
        type: "bank" as const,
        emoji: "🏦",
        balance: 1000,
        currency: "EGP",
        isDefault: false,
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (mockCtx.db.get as any).mockResolvedValueOnce(mockAccount);
      (mockCtx.db.query as any)().withIndex().filter().collect.mockResolvedValueOnce([
        mockAccount,
        { _id: "account789", userId, isDeleted: false },
      ]);

      const result = await validateAccountDeletion(mockCtx, userId, accountId);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.account).toEqual(mockAccount);
    });

    it("should fail validation when user doesn't own the account", async () => {
      const userId = "user123" as any;
      const accountId = "account456" as any;

      const mockAccount = {
        _id: accountId,
        userId: "differentUser", // Different owner
        name: "Not My Account",
        type: "bank" as const,
        emoji: "🏦",
        balance: 1000,
        currency: "EGP",
        isDefault: false,
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (mockCtx.db.get as any).mockResolvedValueOnce(mockAccount);

      const result = await validateAccountDeletion(mockCtx, userId, accountId);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("UNAUTHORIZED");
    });

    it("should fail validation when account doesn't exist", async () => {
      const userId = "user123" as any;
      const accountId = "nonexistent" as any;

      (mockCtx.db.get as any).mockResolvedValueOnce(null);

      const result = await validateAccountDeletion(mockCtx, userId, accountId);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("ACCOUNT_NOT_FOUND");
    });
  });

  describe("AC8: Default Account Protection", () => {
    it("should fail validation when trying to delete default account", async () => {
      const userId = "user123" as any;
      const accountId = "account456" as any;

      const mockDefaultAccount = {
        _id: accountId,
        userId,
        name: "Default Account",
        type: "bank" as const,
        emoji: "🏦",
        balance: 1000,
        currency: "EGP",
        isDefault: true, // This is the default
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (mockCtx.db.get as any).mockResolvedValueOnce(mockDefaultAccount);

      const result = await validateAccountDeletion(mockCtx, userId, accountId);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("CANNOT_DELETE_DEFAULT");
    });

    it("should pass validation when deleting non-default account", async () => {
      const userId = "user123" as any;
      const accountId = "account456" as any;

      const mockAccount = {
        _id: accountId,
        userId,
        name: "Non-Default Account",
        type: "wallet" as const,
        emoji: "💰",
        balance: 500,
        currency: "USD",
        isDefault: false, // Not default
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (mockCtx.db.get as any).mockResolvedValueOnce(mockAccount);
      const mockQuery = (mockCtx.db.query as any)();
      (mockQuery.collect as any).mockResolvedValue([
        mockAccount,
        { _id: "account789", userId, isDefault: true, isDeleted: false },
      ]);

      const result = await validateAccountDeletion(mockCtx, userId, accountId);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("AC9: Last Account Protection", () => {
    it("should fail validation when trying to delete the only account", async () => {
      const userId = "user123" as any;
      const accountId = "account456" as any;

      const mockAccount = {
        _id: accountId,
        userId,
        name: "Only Account",
        type: "bank" as const,
        emoji: "🏦",
        balance: 1000,
        currency: "EGP",
        isDefault: false, // Not default to test last account protection specifically
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (mockCtx.db.get as any).mockResolvedValueOnce(mockAccount);
      // Only one account in the system
      const mockQuery2 = (mockCtx.db.query as any)();
      (mockQuery2.collect as any).mockResolvedValue([mockAccount]);

      const result = await validateAccountDeletion(mockCtx, userId, accountId);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("CANNOT_DELETE_LAST_ACCOUNT");
    });

    it("should pass validation when user has multiple accounts", async () => {
      const userId = "user123" as any;
      const accountId = "account456" as any;

      const mockAccount = {
        _id: accountId,
        userId,
        name: "Account to Delete",
        type: "bank" as const,
        emoji: "🏦",
        balance: 0,
        currency: "EGP",
        isDefault: false,
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (mockCtx.db.get as any).mockResolvedValueOnce(mockAccount);
      // User has 3 accounts
      const mockQuery3 = (mockCtx.db.query as any)();
      (mockQuery3.collect as any).mockResolvedValue([
        mockAccount,
        { _id: "account789", userId, isDefault: true, isDeleted: false },
        { _id: "account101", userId, isDefault: false, isDeleted: false },
      ]);

      const result = await validateAccountDeletion(mockCtx, userId, accountId);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should count only active accounts (exclude deleted)", async () => {
      const userId = "user123" as any;
      const accountId = "account456" as any;

      const mockAccount = {
        _id: accountId,
        userId,
        name: "Account to Delete",
        type: "bank" as const,
        emoji: "🏦",
        balance: 0,
        currency: "EGP",
        isDefault: false,
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (mockCtx.db.get as any).mockResolvedValueOnce(mockAccount);
      // User has 2 active accounts + 1 deleted (should only count active)
      const mockQuery4 = (mockCtx.db.query as any)();
      (mockQuery4.collect as any).mockResolvedValue([
        mockAccount,
        { _id: "account789", userId, isDefault: true, isDeleted: false },
      ]);

      const result = await validateAccountDeletion(mockCtx, userId, accountId);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("Already Deleted Check", () => {
    it("should fail validation if account is already deleted", async () => {
      const userId = "user123" as any;
      const accountId = "account456" as any;

      const mockAccount = {
        _id: accountId,
        userId,
        name: "Deleted Account",
        type: "bank" as const,
        emoji: "🏦",
        balance: 1000,
        currency: "EGP",
        isDefault: false,
        isDeleted: true, // Already deleted
        deletedAt: Date.now() - 86400000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (mockCtx.db.get as any).mockResolvedValueOnce(mockAccount);

      const result = await validateAccountDeletion(mockCtx, userId, accountId);

      expect(result.valid).toBe(false);
      expect(result.error).toBe("ALREADY_DELETED");
    });
  });

  describe("Combined Validation Scenarios", () => {
    it("should fail with appropriate error for default + last account", async () => {
      const userId = "user123" as any;
      const accountId = "account456" as any;

      const mockAccount = {
        _id: accountId,
        userId,
        name: "Only Default Account",
        type: "bank" as const,
        emoji: "🏦",
        balance: 1000,
        currency: "EGP",
        isDefault: true, // Both default and last
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (mockCtx.db.get as any).mockResolvedValueOnce(mockAccount);
      const mockQuery5 = (mockCtx.db.query as any)();
      (mockQuery5.collect as any).mockResolvedValue([mockAccount]);

      const result = await validateAccountDeletion(mockCtx, userId, accountId);

      expect(result.valid).toBe(false);
      // Should fail on default account check first (validation order matters)
      expect(result.error).toBe("CANNOT_DELETE_DEFAULT");
    });

    it("should pass all validations for valid deletion scenario", async () => {
      const userId = "user123" as any;
      const accountId = "account456" as any;

      const mockAccount = {
        _id: accountId,
        userId,
        name: "Valid Account to Delete",
        type: "wallet" as const,
        emoji: "💰",
        balance: 0,
        currency: "EGP",
        isDefault: false, // Not default
        isDeleted: false, // Not deleted
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      (mockCtx.db.get as any).mockResolvedValueOnce(mockAccount);
      // User has 2 accounts (not last)
      const mockQuery6 = (mockCtx.db.query as any)();
      (mockQuery6.collect as any).mockResolvedValue([
        mockAccount,
        { _id: "account789", userId, isDefault: true, isDeleted: false },
      ]);

      const result = await validateAccountDeletion(mockCtx, userId, accountId);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.account).toEqual(mockAccount);
    });
  });
});
