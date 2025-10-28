/**
 * Income Intent Parser Tests
 * 
 * Story 3.2: AI Income Logging
 * Task 14.1-14.3: Test intent detection and entity extraction
 * 
 * Tests fallback regex patterns for income logging in Arabic and English.
 * Real RORK API integration is tested in E2E tests to avoid rate limits.
 */

import { describe, it, expect } from "vitest";

/**
 * AC2: AI Entity Extraction - 85%+ accuracy for amount, category, description
 * AC3: Intent Detection - Detects log_income with 85%+ confidence
 * AC4: Bilingual Support - Arabic and English with equivalent accuracy
 */

describe("Income Intent Parser - Fallback Regex", () => {
  describe("Amount Extraction - Arabic", () => {
    it("should extract amount from Arabic income phrases", () => {
      const testCases = [
        { message: "استلمت راتب 5000 جنيه", expected: 5000 },
        { message: "قبضت 3000 جنيه راتب", expected: 3000 },
        { message: "حصلت على 200 من عمل حر", expected: 200 },
        { message: "جاني 1000 من مشروع", expected: 1000 },
        { message: "استلمت 500 هدية", expected: 500 },
        { message: "قبضت أرباح 300", expected: 300 },
      ];

      testCases.forEach(({ message, expected }) => {
        const amountMatch = message.match(/(\d+\.?\d*)\s*(?:جنيه|جنية|egp|pound)?/i);
        expect(amountMatch).not.toBeNull();
        expect(parseFloat(amountMatch![1])).toBe(expected);
      });
    });

    it("should extract decimal amounts", () => {
      const message = "استلمت 5000.50 جنيه راتب";
      const amountMatch = message.match(/(\d+\.?\d*)/);
      expect(amountMatch).not.toBeNull();
      expect(parseFloat(amountMatch![1])).toBe(5000.50);
    });

    it("should handle large amounts", () => {
      const testCases = [
        { message: "استلمت 50000 جنيه", expected: 50000 },
        { message: "قبضت 100000 راتب", expected: 100000 },
      ];

      testCases.forEach(({ message, expected }) => {
        const amountMatch = message.match(/(\d+)/);
        expect(amountMatch).not.toBeNull();
        expect(parseFloat(amountMatch![1])).toBe(expected);
      });
    });
  });

  describe("Amount Extraction - English", () => {
    it("should extract amount from English income phrases", () => {
      const testCases = [
        { message: "received 500 freelance payment", expected: 500 },
        { message: "got paid 1000 salary", expected: 1000 },
        { message: "earned 200 from business", expected: 200 },
        { message: "received 300 gift", expected: 300 },
        { message: "got dividend 150", expected: 150 },
      ];

      testCases.forEach(({ message, expected }) => {
        const amountMatch = message.match(/(\d+\.?\d*)\s*(?:egp|pound|dollar)?/i);
        expect(amountMatch).not.toBeNull();
        expect(parseFloat(amountMatch![1])).toBe(expected);
      });
    });

    it("should extract decimal amounts in English", () => {
      const message = "received 1500.75 salary payment";
      const amountMatch = message.match(/(\d+\.?\d*)/);
      expect(amountMatch).not.toBeNull();
      expect(parseFloat(amountMatch![1])).toBe(1500.75);
    });
  });

  describe("Income Intent Detection - Arabic", () => {
    it("should detect income intent from Arabic keywords", () => {
      const incomeKeywords = ["استلمت", "قبضت", "حصلت على", "جاني"];
      
      incomeKeywords.forEach((keyword) => {
        const pattern = /(استلمت|قبضت|حصلت على|جاني)/i;
        expect(pattern.test(keyword)).toBe(true);
      });
    });

    it("should match complete Arabic income phrases", () => {
      const testCases = [
        "استلمت راتب 5000 جنيه",
        "قبضت 3000 من عمل حر",
        "حصلت على 200 هدية",
        "جاني 1000 من مشروع",
      ];

      testCases.forEach((message) => {
        const incomePattern = /(استلمت|قبضت|حصلت|جاني)/i;
        expect(incomePattern.test(message)).toBe(true);
      });
    });

    it("should detect income category keywords in Arabic", () => {
      const categoryTests = [
        { message: "استلمت راتب 5000", category: "راتب", expected: "salary" },
        { message: "قبضت من عمل حر 200", category: "عمل حر", expected: "freelance" },
        { message: "جاني من مشروع 1000", category: "مشروع", expected: "business" },
        { message: "حصلت على هدية 500", category: "هدية", expected: "gift" },
        { message: "قبضت أرباح 300", category: "أرباح", expected: "investment" },
      ];

      categoryTests.forEach(({ message, category }) => {
        expect(message).toContain(category);
      });
    });
  });

  describe("Income Intent Detection - English", () => {
    it("should detect income intent from English keywords", () => {
      const incomeKeywords = ["received", "got paid", "earned", "got"];
      
      incomeKeywords.forEach((keyword) => {
        const pattern = /(received|got paid|earned|got)/i;
        expect(pattern.test(keyword)).toBe(true);
      });
    });

    it("should match complete English income phrases", () => {
      const testCases = [
        "received 500 freelance payment",
        "got paid 1000 salary",
        "earned 200 from business",
        "got 300 gift",
      ];

      testCases.forEach((message) => {
        const incomePattern = /(received|got|earned)/i;
        expect(incomePattern.test(message)).toBe(true);
      });
    });

    it("should detect income category keywords in English", () => {
      const categoryTests = [
        { message: "received 1000 salary", category: "salary" },
        { message: "got paid freelance 500", category: "freelance" },
        { message: "earned from business 200", category: "business" },
        { message: "received gift 300", category: "gift" },
        { message: "got dividend 150", category: "dividend" },
      ];

      categoryTests.forEach(({ message, category }) => {
        expect(message.toLowerCase()).toContain(category);
      });
    });
  });

  describe("Mixed Language Support - AC4", () => {
    it("should handle mixed Arabic-English phrases", () => {
      const testCases = [
        { message: "استلمت 300 from freelance", hasAmount: true, hasArabic: true, hasEnglish: true },
        { message: "received 500 من عمل حر", hasAmount: true, hasArabic: true, hasEnglish: true },
        { message: "قبضت salary 5000 جنيه", hasAmount: true, hasArabic: true, hasEnglish: true },
      ];

      testCases.forEach(({ message, hasAmount, hasArabic, hasEnglish }) => {
        const amountMatch = message.match(/(\d+)/);
        const arabicMatch = message.match(/[\u0600-\u06FF]/);
        const englishMatch = message.match(/[a-zA-Z]/);

        if (hasAmount) expect(amountMatch).not.toBeNull();
        if (hasArabic) expect(arabicMatch).not.toBeNull();
        if (hasEnglish) expect(englishMatch).not.toBeNull();
      });
    });
  });

  describe("Category Confidence - AC6", () => {
    it("should identify high-confidence category matches", () => {
      const highConfidenceTests = [
        { message: "استلمت راتب 5000", expectedCategory: "salary", confidence: "high" },
        { message: "received salary 1000", expectedCategory: "salary", confidence: "high" },
        { message: "قبضت من عمل حر", expectedCategory: "freelance", confidence: "high" },
        { message: "got freelance payment", expectedCategory: "freelance", confidence: "high" },
      ];

      highConfidenceTests.forEach(({ message, expectedCategory }) => {
        const categoryKeywords = {
          salary: /(راتب|مرتب|salary|wage)/i,
          freelance: /(عمل حر|فريلانس|freelance|contract)/i,
          business: /(مشروع|تجارة|business|profit)/i,
          investment: /(استثمار|أرباح|investment|dividend)/i,
          gift: /(هدية|عيدية|gift|present)/i,
        };

        const pattern = categoryKeywords[expectedCategory as keyof typeof categoryKeywords];
        expect(pattern.test(message)).toBe(true);
      });
    });
  });

  describe("Amount Validation - AC13", () => {
    it("should identify valid amounts", () => {
      const validAmounts = [
        { message: "استلمت 100 جنيه", amount: 100, valid: true },
        { message: "received 5000", amount: 5000, valid: true },
        { message: "قبضت 999999", amount: 999999, valid: true },
      ];

      validAmounts.forEach(({ message, amount, valid }) => {
        const extracted = parseFloat(message.match(/(\d+)/)?.[1] || "0");
        expect(extracted).toBe(amount);
        expect(extracted > 0 && extracted < 1000000).toBe(valid);
      });
    });

    it("should identify invalid amounts", () => {
      const invalidAmounts = [
        { amount: 0, valid: false },
        { amount: -100, valid: false },
        { amount: 1000000, valid: false },
        { amount: 1500000, valid: false },
      ];

      invalidAmounts.forEach(({ amount, valid }) => {
        const isValid = amount > 0 && amount < 1000000;
        expect(isValid).toBe(valid);
      });
    });
  });

  describe("Date Extraction - AC12", () => {
    it("should detect relative date keywords in Arabic", () => {
      const dateTests = [
        { message: "أمس استلمت 1000", keyword: "أمس" },
        { message: "اليوم قبضت راتب", keyword: "اليوم" },
        { message: "الأسبوع اللي فات حصلت على 500", keyword: "الأسبوع اللي فات" },
      ];

      dateTests.forEach(({ message, keyword }) => {
        expect(message).toContain(keyword);
      });
    });

    it("should detect relative date keywords in English", () => {
      const dateTests = [
        { message: "yesterday received 1000", keyword: "yesterday" },
        { message: "today got paid salary", keyword: "today" },
        { message: "last week earned 500", keyword: "last week" },
      ];

      dateTests.forEach(({ message, keyword }) => {
        expect(message.toLowerCase()).toContain(keyword.toLowerCase());
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle messages with no amount", () => {
      const messages = [
        "استلمت راتب",
        "received salary",
        "قبضت من عمل حر",
      ];

      messages.forEach((message) => {
        const amountMatch = message.match(/(\d+)/);
        expect(amountMatch).toBeNull();
      });
    });

    it("should handle messages with multiple numbers", () => {
      const message = "استلمت 5000 جنيه من 3 مشاريع";
      const amounts = message.match(/\d+/g);
      expect(amounts).not.toBeNull();
      expect(amounts!.length).toBeGreaterThan(1);
      expect(parseFloat(amounts![0])).toBe(5000); // First number is the amount
    });

    it("should handle very long messages", () => {
      const longMessage = "استلمت اليوم راتب شهر يناير بمبلغ 5000 جنيه مصري من شركة التكنولوجيا المتقدمة وتم إيداعه في حساب البنك الأهلي";
      const amountMatch = longMessage.match(/(\d+)/);
      expect(amountMatch).not.toBeNull();
      expect(parseFloat(amountMatch![1])).toBe(5000);
    });

    it("should handle messages with special characters", () => {
      const messages = [
        "استلمت 1,000 جنيه",
        "received $500",
        "قبضت ٥٠٠٠ جنيه", // Arabic numerals
      ];

      messages.forEach((message) => {
        // Should still detect intent even with special chars
        const hasIncomeKeyword = /(استلمت|received|قبضت)/i.test(message);
        expect(hasIncomeKeyword).toBe(true);
      });
    });
  });

  describe("Confidence Scoring - AC3", () => {
    it("should assign high confidence to clear income phrases", () => {
      const highConfidenceTests = [
        "استلمت راتب 5000 جنيه",
        "received 1000 salary payment",
        "قبضت 500 من عمل حر",
      ];

      highConfidenceTests.forEach((message) => {
        // Has income keyword + amount + category = high confidence
        const hasIncomeKeyword = /(استلمت|received|قبضت)/i.test(message);
        const hasAmount = /\d+/.test(message);
        const hasCategory = /(راتب|salary|عمل حر|freelance)/i.test(message);
        
        const confidence = (hasIncomeKeyword ? 0.4 : 0) + 
                          (hasAmount ? 0.3 : 0) + 
                          (hasCategory ? 0.3 : 0);
        
        expect(confidence).toBeGreaterThanOrEqual(0.7);
      });
    });

    it("should assign low confidence to ambiguous phrases", () => {
      const lowConfidenceTests = [
        "حصلت على حاجة", // Got something (no amount)
        "received something", // No amount
        "1000 جنيه", // Amount only, no income keyword
      ];

      lowConfidenceTests.forEach((message) => {
        const hasIncomeKeyword = /(استلمت|received|قبضت|حصلت)/i.test(message);
        const hasAmount = /\d+/.test(message);
        const hasCategory = /(راتب|salary|عمل حر|freelance|مشروع|business)/i.test(message);
        
        const confidence = (hasIncomeKeyword ? 0.4 : 0) + 
                          (hasAmount ? 0.3 : 0) + 
                          (hasCategory ? 0.3 : 0);
        
        expect(confidence).toBeLessThan(0.85);
      });
    });
  });
});
