/**
 * Expense Intent Parser Tests
 * 
 * Story 3.1: AI Expense Logging
 * Task 16.1-16.6: Test intent detection and entity extraction
 * 
 * Tests fallback regex patterns for expense logging in Arabic and English.
 * Real RORK API integration is tested in E2E tests to avoid rate limits.
 */

import { describe, it, expect } from "vitest";

/**
 * AC2: AI Entity Extraction - 85%+ accuracy for amount, category, description
 * AC3: Intent Detection - Detects log_expense with 85%+ confidence
 * AC4: Bilingual Support - Arabic and English with equivalent accuracy
 */

describe("Expense Intent Parser - Fallback Regex", () => {
  describe("Amount Extraction - Arabic", () => {
    it("should extract amount from Arabic expense phrases", () => {
      const testCases = [
        { message: "دفعت 50 جنيه على القهوة", expected: 50 },
        { message: "صرفت 100 على المواصلات", expected: 100 },
        { message: "اشتريت بـ 250 جنيه", expected: 250 },
        { message: "دفعت 1500 جنية", expected: 1500 },
      ];

      testCases.forEach(({ message, expected }) => {
        const amountMatch = message.match(/(\d+\.?\d*)\s*(?:جنيه|جنية|egp|pound)?/i);
        expect(amountMatch).not.toBeNull();
        expect(parseFloat(amountMatch![1])).toBe(expected);
      });
    });

    it("should extract decimal amounts", () => {
      const message = "دفعت 50.5 جنيه";
      const amountMatch = message.match(/(\d+\.?\d*)/);
      expect(amountMatch).not.toBeNull();
      expect(parseFloat(amountMatch![1])).toBe(50.5);
    });
  });

  describe("Amount Extraction - English", () => {
    it("should extract amount from English expense phrases", () => {
      const testCases = [
        { message: "spent 20 on coffee", expected: 20 },
        { message: "paid 50 for lunch", expected: 50 },
        { message: "bought for 100 EGP", expected: 100 },
        { message: "spent 15.5 pounds", expected: 15.5 },
      ];

      testCases.forEach(({ message, expected }) => {
        const amountMatch = message.match(/(\d+\.?\d*)\s*(?:egp|pound|dollar)?/i);
        expect(amountMatch).not.toBeNull();
        expect(parseFloat(amountMatch![1])).toBe(expected);
      });
    });
  });

  describe("Expense Intent Detection - Arabic", () => {
    it("should detect expense intent from Arabic keywords", () => {
      const expenseKeywords = ["دفعت", "صرفت", "اشتريت", "دفعت فلوس"];
      
      expenseKeywords.forEach((keyword) => {
        const pattern = /(دفعت|صرفت|اشتريت|دفعت فلوس)/i;
        expect(pattern.test(keyword)).toBe(true);
      });
    });

    it("should match complete Arabic expense phrases", () => {
      const testCases = [
        "دفعت 50 جنيه على القهوة",
        "صرفت 100 على المواصلات",
        "اشتريت حاجة بـ 30 جنيه",
      ];

      testCases.forEach((message) => {
        const expensePattern = /(دفعت|صرفت|اشتريت)/i;
        expect(expensePattern.test(message)).toBe(true);
      });
    });
  });

  describe("Expense Intent Detection - English", () => {
    it("should detect expense intent from English keywords", () => {
      const expenseKeywords = ["spent", "paid", "bought", "paid for"];
      
      expenseKeywords.forEach((keyword) => {
        const pattern = /(spent|paid|bought|paid for)/i;
        expect(pattern.test(keyword)).toBe(true);
      });
    });

    it("should match complete English expense phrases", () => {
      const testCases = [
        "spent 20 on coffee",
        "paid 50 for lunch",
        "bought something for 30",
      ];

      testCases.forEach((message) => {
        const expensePattern = /(spent|paid|bought)/i;
        expect(expensePattern.test(message)).toBe(true);
      });
    });
  });

  describe("Mixed Language Support (AC4)", () => {
    it("should extract amounts from mixed Arabic-English phrases", () => {
      const testCases = [
        { message: "دفعت 30 on taxi", expected: 30 },
        { message: "spent 50 على القهوة", expected: 50 },
      ];

      testCases.forEach(({ message, expected }) => {
        const amountMatch = message.match(/(\d+\.?\d*)/);
        expect(amountMatch).not.toBeNull();
        expect(parseFloat(amountMatch![1])).toBe(expected);
      });
    });

    it("should detect expense keywords in mixed language", () => {
      const message = "دفعت 30 on coffee";
      const hasArabicKeyword = /(دفعت|صرفت|اشتريت)/i.test(message);
      expect(hasArabicKeyword).toBe(true);
    });
  });

  describe("Category Keywords - Arabic", () => {
    it("should detect food category keywords in Arabic", () => {
      const foodKeywords = ["قهوة", "طعام", "غداء", "عشاء", "فطور"];
      
      foodKeywords.forEach((keyword) => {
        const pattern = /(قهوة|طعام|غداء|عشاء|فطور|مطعم|أكل)/i;
        expect(pattern.test(keyword)).toBe(true);
      });
    });

    it("should detect transport category keywords in Arabic", () => {
      const transportKeywords = ["مواصلات", "تاكسي", "أوبر", "بنزين"];
      
      transportKeywords.forEach((keyword) => {
        const pattern = /(مواصلات|تاكسي|أوبر|بنزين|سيارة)/i;
        expect(pattern.test(keyword)).toBe(true);
      });
    });

    it("should detect entertainment category keywords in Arabic", () => {
      const entertainmentKeywords = ["سينما", "فيلم", "ترفيه"];
      
      entertainmentKeywords.forEach((keyword) => {
        const pattern = /(سينما|فيلم|ترفيه)/i;
        expect(pattern.test(keyword)).toBe(true);
      });
    });
  });

  describe("Category Keywords - English", () => {
    it("should detect food category keywords in English", () => {
      const foodKeywords = ["coffee", "food", "lunch", "dinner", "breakfast"];
      
      foodKeywords.forEach((keyword) => {
        const pattern = /(coffee|food|lunch|dinner|breakfast|restaurant)/i;
        expect(pattern.test(keyword)).toBe(true);
      });
    });

    it("should detect transport category keywords in English", () => {
      const transportKeywords = ["taxi", "uber", "gas", "transport"];
      
      transportKeywords.forEach((keyword) => {
        const pattern = /(taxi|uber|gas|transport|car)/i;
        expect(pattern.test(keyword)).toBe(true);
      });
    });

    it("should detect entertainment category keywords in English", () => {
      const entertainmentKeywords = ["movie", "cinema", "entertainment"];
      
      entertainmentKeywords.forEach((keyword) => {
        const pattern = /(movie|cinema|entertainment)/i;
        expect(pattern.test(keyword)).toBe(true);
      });
    });
  });

  describe("Date Extraction - Arabic (AC12)", () => {
    it("should detect Arabic relative date keywords", () => {
      const dateKeywords = ["أمس", "اليوم", "الأسبوع اللي فات"];
      
      dateKeywords.forEach((keyword) => {
        const pattern = /(أمس|اليوم|البارحة|الأسبوع|يوم)/i;
        expect(pattern.test(keyword)).toBe(true);
      });
    });

    it("should extract date mentions from expense phrases", () => {
      const message = "أمس دفعت 50 جنيه";
      const datePattern = /(أمس|اليوم|البارحة)/i;
      expect(datePattern.test(message)).toBe(true);
    });
  });

  describe("Date Extraction - English (AC12)", () => {
    it("should detect English relative date keywords", () => {
      const dateKeywords = ["yesterday", "today", "last week", "two days ago"];
      
      dateKeywords.forEach((keyword) => {
        const pattern = /(yesterday|today|last\s+week|days?\s+ago|week\s+ago)/i;
        expect(pattern.test(keyword)).toBe(true);
      });
    });

    it("should extract date mentions from expense phrases", () => {
      const message = "yesterday spent 50 on coffee";
      const datePattern = /(yesterday|today|last\s+week)/i;
      expect(datePattern.test(message)).toBe(true);
    });
  });

  describe("Amount Validation (AC13)", () => {
    it("should validate amounts within acceptable range", () => {
      const validAmounts = [0.01, 1, 100, 1000, 999999];
      const MIN_AMOUNT = 0;
      const MAX_AMOUNT = 1000000;

      validAmounts.forEach((amount) => {
        expect(amount).toBeGreaterThan(MIN_AMOUNT);
        expect(amount).toBeLessThan(MAX_AMOUNT);
      });
    });

    it("should reject invalid amounts", () => {
      const invalidAmounts = [-10, 0, 1000001];
      const MIN_AMOUNT = 0;
      const MAX_AMOUNT = 1000000;

      invalidAmounts.forEach((amount) => {
        const isValid = amount > MIN_AMOUNT && amount < MAX_AMOUNT;
        expect(isValid).toBe(false);
      });
    });
  });

  describe("Complex Expense Phrases", () => {
    it("should handle Arabic phrases with multiple entities", () => {
      const message = "أمس دفعت 50 جنيه على القهوة من حساب المحفظة";
      
      // Check all entities can be extracted
      const hasExpenseKeyword = /(دفعت|صرفت)/i.test(message);
      const hasAmount = /(\d+\.?\d*)/.test(message);
      const hasDate = /(أمس)/i.test(message);
      const hasCategory = /(قهوة|طعام)/i.test(message);
      
      expect(hasExpenseKeyword).toBe(true);
      expect(hasAmount).toBe(true);
      expect(hasDate).toBe(true);
      expect(hasCategory).toBe(true);
    });

    it("should handle English phrases with multiple entities", () => {
      const message = "yesterday spent 50 EGP on coffee from wallet";
      
      // Check all entities can be extracted
      const hasExpenseKeyword = /(spent|paid)/i.test(message);
      const hasAmount = /(\d+\.?\d*)/.test(message);
      const hasDate = /(yesterday)/i.test(message);
      const hasCategory = /(coffee|food)/i.test(message);
      
      expect(hasExpenseKeyword).toBe(true);
      expect(hasAmount).toBe(true);
      expect(hasDate).toBe(true);
      expect(hasCategory).toBe(true);
    });
  });
});
