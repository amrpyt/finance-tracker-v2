/**
 * Balance Calculator Tests
 * 
 * Tests for Story 2.2: Balance calculation and formatting
 * 
 * Test Coverage:
 * - AC7: Total calculation across accounts
 * - AC8: Multi-currency handling
 * - AC14: Number formatting with thousands separator
 */

import { describe, it, expect } from "vitest";
import { calculateTotalBalance, formatBalance } from "./balanceCalculator";

describe("Balance Calculator", () => {
  describe("AC7: Single Currency Total Calculation", () => {
    it("should calculate total for single currency accounts", () => {
      const accounts = [
        { balance: 1000, currency: "EGP" },
        { balance: 2500, currency: "EGP" },
        { balance: 500, currency: "EGP" },
      ];

      const result = calculateTotalBalance(accounts, "EGP");

      expect(result.totalByCurrency).toEqual({ EGP: 4000 });
      expect(result.hasMixedCurrencies).toBe(false);
      expect(result.primaryCurrencyTotal).toBe(4000);
      expect(result.primaryCurrency).toBe("EGP");
    });

    it("should handle zero balance accounts", () => {
      const accounts = [
        { balance: 0, currency: "EGP" },
        { balance: 0, currency: "EGP" },
      ];

      const result = calculateTotalBalance(accounts, "EGP");

      expect(result.totalByCurrency).toEqual({ EGP: 0 });
      expect(result.hasMixedCurrencies).toBe(false);
    });

    it("should handle negative balances (credit cards)", () => {
      const accounts = [
        { balance: 1000, currency: "EGP" },
        { balance: -500, currency: "EGP" }, // Credit card debt
      ];

      const result = calculateTotalBalance(accounts, "EGP");

      expect(result.totalByCurrency).toEqual({ EGP: 500 });
    });
  });

  describe("AC8: Multi-Currency Handling", () => {
    it("should group balances by currency", () => {
      const accounts = [
        { balance: 5000, currency: "EGP" },
        { balance: 100, currency: "USD" },
        { balance: 2500, currency: "EGP" },
        { balance: 50, currency: "USD" },
      ];

      const result = calculateTotalBalance(accounts, "EGP");

      expect(result.totalByCurrency).toEqual({
        EGP: 7500,
        USD: 150,
      });
      expect(result.hasMixedCurrencies).toBe(true);
      expect(result.primaryCurrencyTotal).toBe(7500);
    });

    it("should handle three or more currencies", () => {
      const accounts = [
        { balance: 1000, currency: "EGP" },
        { balance: 100, currency: "USD" },
        { balance: 200, currency: "SAR" },
        { balance: 50, currency: "EUR" },
      ];

      const result = calculateTotalBalance(accounts, "EGP");

      expect(result.totalByCurrency).toEqual({
        EGP: 1000,
        USD: 100,
        SAR: 200,
        EUR: 50,
      });
      expect(result.hasMixedCurrencies).toBe(true);
    });

    it("should handle primary currency not in accounts", () => {
      const accounts = [
        { balance: 100, currency: "USD" },
        { balance: 200, currency: "SAR" },
      ];

      const result = calculateTotalBalance(accounts, "EGP");

      expect(result.totalByCurrency).toEqual({
        USD: 100,
        SAR: 200,
      });
      expect(result.hasMixedCurrencies).toBe(true);
      expect(result.primaryCurrencyTotal).toBeUndefined();
    });
  });

  describe("AC14: Number Formatting", () => {
    it("should format balance with thousands separator", () => {
      expect(formatBalance(1000)).toBe("1,000.00");
      expect(formatBalance(1234567.89)).toBe("1,234,567.89");
      expect(formatBalance(999)).toBe("999.00");
    });

    it("should format zero balance", () => {
      expect(formatBalance(0)).toBe("0.00");
    });

    it("should format negative balance", () => {
      expect(formatBalance(-500)).toBe("-500.00");
      expect(formatBalance(-1234.56)).toBe("-1,234.56");
    });

    it("should always show two decimal places", () => {
      expect(formatBalance(100)).toBe("100.00");
      expect(formatBalance(100.5)).toBe("100.50");
      expect(formatBalance(100.123)).toBe("100.12"); // Rounds
    });

    it("should handle large numbers", () => {
      expect(formatBalance(1000000)).toBe("1,000,000.00");
      expect(formatBalance(9999999.99)).toBe("9,999,999.99");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty accounts array", () => {
      const result = calculateTotalBalance([], "EGP");

      expect(result.totalByCurrency).toEqual({});
      expect(result.hasMixedCurrencies).toBe(false);
    });

    it("should handle single account", () => {
      const accounts = [{ balance: 500, currency: "EGP" }];

      const result = calculateTotalBalance(accounts, "EGP");

      expect(result.totalByCurrency).toEqual({ EGP: 500 });
      expect(result.hasMixedCurrencies).toBe(false);
    });

    it("should handle very small decimal amounts", () => {
      expect(formatBalance(0.01)).toBe("0.01");
      expect(formatBalance(0.001)).toBe("0.00"); // Rounds down
    });
  });
});
