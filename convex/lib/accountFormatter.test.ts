/**
 * Account Formatter Tests
 * 
 * Tests for Story 2.2: Account display formatting
 * 
 * Test Coverage:
 * - AC4: Balance display with emoji, name, balance, currency
 * - AC5: Account grouping by type
 * - AC6: Default account indicator
 * - AC9: Empty state
 * - AC10: Account count
 * - AC13: Clean formatting
 */

import { describe, it, expect } from "vitest";
import { formatAccountsOverview, formatEmptyAccountsState } from "./accountFormatter";
import type { AccountData } from "./accountFormatter";

describe("Account Formatter", () => {
  describe("AC9: Empty State", () => {
    it("should show empty state message in Arabic", () => {
      const message = formatEmptyAccountsState("ar");

      expect(message).toContain("📊");
      expect(message).toContain("لا توجد حسابات");
      expect(message).toContain("أنشئ حسابك الأول");
    });

    it("should show empty state message in English", () => {
      const message = formatEmptyAccountsState("en");

      expect(message).toContain("📊");
      expect(message).toContain("No accounts yet");
      expect(message).toContain("Create your first account");
    });

    it("should return empty state for zero accounts", () => {
      const message = formatAccountsOverview([], "en", "EGP");

      expect(message).toContain("No accounts yet");
    });
  });

  describe("AC10: Account Count", () => {
    it("should show correct count for single account", () => {
      const accounts: AccountData[] = [
        {
          _id: "acc1",
          name: "My Wallet",
          type: "cash",
          balance: 500,
          currency: "EGP",
          isDefault: true,
        },
      ];

      const message = formatAccountsOverview(accounts, "en", "EGP");

      expect(message).toContain("1 account");
    });

    it("should show correct count for multiple accounts", () => {
      const accounts: AccountData[] = [
        {
          _id: "acc1",
          name: "Bank",
          type: "bank",
          balance: 1000,
          currency: "EGP",
          isDefault: true,
        },
        {
          _id: "acc2",
          name: "Cash",
          type: "cash",
          balance: 500,
          currency: "EGP",
          isDefault: false,
        },
        {
          _id: "acc3",
          name: "Credit",
          type: "credit_card",
          balance: -200,
          currency: "EGP",
          isDefault: false,
        },
      ];

      const message = formatAccountsOverview(accounts, "en", "EGP");

      expect(message).toContain("3 accounts");
    });

    it("should use Arabic plural forms correctly", () => {
      const oneAccount: AccountData[] = [
        { _id: "1", name: "A", type: "cash", balance: 100, currency: "EGP", isDefault: true },
      ];
      const twoAccounts: AccountData[] = [
        { _id: "1", name: "A", type: "cash", balance: 100, currency: "EGP", isDefault: true },
        { _id: "2", name: "B", type: "bank", balance: 200, currency: "EGP", isDefault: false },
      ];
      const threeAccounts: AccountData[] = [
        ...twoAccounts,
        { _id: "3", name: "C", type: "cash", balance: 300, currency: "EGP", isDefault: false },
      ];

      expect(formatAccountsOverview(oneAccount, "ar", "EGP")).toContain("1 حساب");
      expect(formatAccountsOverview(twoAccounts, "ar", "EGP")).toContain("2 حسابان");
      expect(formatAccountsOverview(threeAccounts, "ar", "EGP")).toContain("3 حسابات");
    });
  });

  describe("AC4 & AC6: Balance Display with Default Indicator", () => {
    it("should show default account with star indicator", () => {
      const accounts: AccountData[] = [
        {
          _id: "acc1",
          name: "Main Account",
          type: "bank",
          balance: 1000,
          currency: "EGP",
          isDefault: true,
        },
        {
          _id: "acc2",
          name: "Secondary",
          type: "cash",
          balance: 500,
          currency: "EGP",
          isDefault: false,
        },
      ];

      const message = formatAccountsOverview(accounts, "en", "EGP");

      expect(message).toContain("⭐ Main Account");
      expect(message).toContain("   Secondary"); // Non-default has spaces
    });

    it("should format balance with currency", () => {
      const accounts: AccountData[] = [
        {
          _id: "acc1",
          name: "Wallet",
          type: "cash",
          balance: 1234.56,
          currency: "EGP",
          isDefault: true,
        },
      ];

      const message = formatAccountsOverview(accounts, "en", "EGP");

      expect(message).toContain("1,234.56 EGP");
    });
  });

  describe("AC5: Account Grouping by Type", () => {
    it("should group accounts by type with headers", () => {
      const accounts: AccountData[] = [
        {
          _id: "acc1",
          name: "CIB Bank",
          type: "bank",
          balance: 5000,
          currency: "EGP",
          isDefault: true,
        },
        {
          _id: "acc2",
          name: "My Wallet",
          type: "cash",
          balance: 500,
          currency: "EGP",
          isDefault: false,
        },
        {
          _id: "acc3",
          name: "Visa Card",
          type: "credit_card",
          balance: -1000,
          currency: "EGP",
          isDefault: false,
        },
        {
          _id: "acc4",
          name: "Vodafone Cash",
          type: "digital_wallet",
          balance: 200,
          currency: "EGP",
          isDefault: false,
        },
      ];

      const message = formatAccountsOverview(accounts, "en", "EGP");

      // Should have type headers with emojis
      expect(message).toContain("🏦 Bank Account");
      expect(message).toContain("💵 Cash Wallet");
      expect(message).toContain("💳 Credit Card");
      expect(message).toContain("📱 Digital Wallet");

      // Should have accounts under correct headers
      expect(message).toContain("CIB Bank");
      expect(message).toContain("My Wallet");
      expect(message).toContain("Visa Card");
      expect(message).toContain("Vodafone Cash");
    });

    it("should show only types that have accounts", () => {
      const accounts: AccountData[] = [
        {
          _id: "acc1",
          name: "Bank",
          type: "bank",
          balance: 1000,
          currency: "EGP",
          isDefault: true,
        },
      ];

      const message = formatAccountsOverview(accounts, "en", "EGP");

      expect(message).toContain("🏦 Bank Account");
      expect(message).not.toContain("💵 Cash Wallet");
      expect(message).not.toContain("💳 Credit Card");
    });

    it("should use Arabic type labels", () => {
      const accounts: AccountData[] = [
        {
          _id: "acc1",
          name: "بنك",
          type: "bank",
          balance: 1000,
          currency: "EGP",
          isDefault: true,
        },
      ];

      const message = formatAccountsOverview(accounts, "ar", "EGP");

      expect(message).toContain("🏦 حساب بنكي");
    });
  });

  describe("AC7 & AC8: Total Calculation", () => {
    it("should show single currency total", () => {
      const accounts: AccountData[] = [
        {
          _id: "acc1",
          name: "Bank",
          type: "bank",
          balance: 5000,
          currency: "EGP",
          isDefault: true,
        },
        {
          _id: "acc2",
          name: "Cash",
          type: "cash",
          balance: 500,
          currency: "EGP",
          isDefault: false,
        },
      ];

      const message = formatAccountsOverview(accounts, "en", "EGP");

      expect(message).toContain("Total Balance");
      expect(message).toContain("5,500.00 EGP");
    });

    it("should show multi-currency subtotals", () => {
      const accounts: AccountData[] = [
        {
          _id: "acc1",
          name: "EGP Bank",
          type: "bank",
          balance: 5000,
          currency: "EGP",
          isDefault: true,
        },
        {
          _id: "acc2",
          name: "USD Account",
          type: "bank",
          balance: 100,
          currency: "USD",
          isDefault: false,
        },
        {
          _id: "acc3",
          name: "SAR Wallet",
          type: "cash",
          balance: 200,
          currency: "SAR",
          isDefault: false,
        },
      ];

      const message = formatAccountsOverview(accounts, "en", "EGP");

      expect(message).toContain("Subtotals");
      expect(message).toContain("5,000.00 EGP");
      expect(message).toContain("100.00 USD");
      expect(message).toContain("200.00 SAR");
    });

    it("should use Arabic labels for totals", () => {
      const accounts: AccountData[] = [
        {
          _id: "acc1",
          name: "حساب",
          type: "bank",
          balance: 1000,
          currency: "EGP",
          isDefault: true,
        },
      ];

      const message = formatAccountsOverview(accounts, "ar", "EGP");

      expect(message).toContain("المجموع الكلي");
    });
  });

  describe("AC13: Clean Formatting", () => {
    it("should have proper structure with header, accounts, and total", () => {
      const accounts: AccountData[] = [
        {
          _id: "acc1",
          name: "Test",
          type: "cash",
          balance: 100,
          currency: "EGP",
          isDefault: true,
        },
      ];

      const message = formatAccountsOverview(accounts, "en", "EGP");

      // Should start with header
      expect(message).toMatch(/^📊.*Your Financial Accounts/);

      // Should have account count
      expect(message).toContain("1 account");

      // Should have type section
      expect(message).toContain("💵 Cash Wallet");

      // Should end with total
      expect(message).toMatch(/Total Balance.*100\.00 EGP$/);
    });

    it("should have readable spacing and alignment", () => {
      const accounts: AccountData[] = [
        {
          _id: "acc1",
          name: "Account 1",
          type: "bank",
          balance: 1000,
          currency: "EGP",
          isDefault: true,
        },
      ];

      const message = formatAccountsOverview(accounts, "en", "EGP");

      // Should have newlines for structure
      expect(message.split("\n").length).toBeGreaterThan(3);

      // Should have proper indentation for non-default accounts
      expect(message).toContain("⭐");
    });
  });
});
