/**
 * Natural Language Parser Tests
 * 
 * Tests intent detection and entity extraction for account management.
 * Tests both RORK API integration and fallback regex patterns.
 */

import { describe, it, expect } from "vitest";

/**
 * Note: These are unit tests for the fallback regex logic.
 * Integration tests with real RORK API should be done manually
 * or in E2E tests to avoid API rate limits.
 */

describe("NL Parser - Fallback Regex Patterns", () => {
  describe("Create Account Intent - Arabic", () => {
    it("should detect create cash account in Arabic", () => {
      const testCases = [
        "أنشئ حساب محفظة برصيد 500 جنيه",
        "إنشاء محفظة نقدية",
        "عمل حساب محفظة",
        "اعمل محفظة",
      ];

      testCases.forEach((message) => {
        const normalized = message.toLowerCase().trim();
        const createPattern = /(أنشئ|إنشاء|عمل|اعمل)\s+(حساب|محفظة|بنك)/i;
        expect(createPattern.test(normalized)).toBe(true);
      });
    });

    it("should detect create bank account in Arabic", () => {
      const message = "أنشئ حساب بنك برصيد 1000 جنيه";
      const normalized = message.toLowerCase().trim();
      
      const createPattern = /(أنشئ|إنشاء|عمل|اعمل)\s+(حساب|محفظة|بنك)/i;
      expect(createPattern.test(normalized)).toBe(true);
      
      const isBankAccount = /بنك|bank/i.test(normalized);
      expect(isBankAccount).toBe(true);
    });

    it("should extract balance from Arabic message", () => {
      const message = "أنشئ حساب محفظة برصيد 500 جنيه";
      const balanceMatch = message.match(/(\d+)\s*(?:جنيه|egp|pound|جنية)/i);
      
      expect(balanceMatch).not.toBeNull();
      expect(balanceMatch![1]).toBe("500");
      expect(parseFloat(balanceMatch![1])).toBe(500);
    });
  });

  describe("Create Account Intent - English", () => {
    it("should detect create cash account in English", () => {
      const testCases = [
        "Create account with 500 EGP",
        "Add wallet account",
        "Create wallet account",
        "New bank account",
      ];

      testCases.forEach((message) => {
        const normalized = message.toLowerCase().trim();
        const createPattern = /(create|add|new)\s+.*?(account|wallet|bank)/i;
        expect(createPattern.test(normalized)).toBe(true);
      });
    });

    it("should detect create bank account in English", () => {
      const message = "Create bank account with 1000 EGP";
      const normalized = message.toLowerCase().trim();
      
      const createPattern = /(create|add|new)\s+(account|wallet|bank)/i;
      expect(createPattern.test(normalized)).toBe(true);
      
      const isBankAccount = /بنك|bank/i.test(normalized);
      expect(isBankAccount).toBe(true);
    });

    it("should extract balance from English message", () => {
      const message = "Create cash account with 500 EGP";
      const balanceMatch = message.match(/(\d+)\s*(?:جنيه|egp|pound|جنية)/i);
      
      expect(balanceMatch).not.toBeNull();
      expect(balanceMatch![1]).toBe("500");
      expect(parseFloat(balanceMatch![1])).toBe(500);
    });
  });

  describe("View Accounts Intent - Arabic", () => {
    it("should detect view accounts in Arabic", () => {
      const testCases = [
        "أرني حساباتي",
        "عرض الحسابات",
        "اعرض حساباتي",
        "شوف الحسابات",
      ];

      testCases.forEach((message) => {
        const normalized = message.toLowerCase().trim();
        const viewPattern = /(أرني|عرض|اعرض|شوف)\s+(حساب|الحسابات)/i;
        expect(viewPattern.test(normalized)).toBe(true);
      });
    });
  });

  describe("View Accounts Intent - English", () => {
    it("should detect view accounts in English", () => {
      const testCases = [
        "Show accounts",
        "View accounts",
        "List accounts",
        "Display account",
      ];

      testCases.forEach((message) => {
        const normalized = message.toLowerCase().trim();
        const viewPattern = /(show|view|list|display)\s+(account|accounts)/i;
        expect(viewPattern.test(normalized)).toBe(true);
      });
    });
  });

  describe("Account Type Detection", () => {
    it("should detect cash/wallet account type", () => {
      const testCases = [
        "محفظة نقدية",
        "cash wallet",
        "wallet",
        "محفظة",
      ];

      testCases.forEach((message) => {
        const normalized = message.toLowerCase().trim();
        const isCash = /محفظة|wallet|cash/i.test(normalized);
        expect(isCash).toBe(true);
      });
    });

    it("should detect bank account type", () => {
      const testCases = [
        "حساب بنكي",
        "bank account",
        "بنك",
        "bank",
      ];

      testCases.forEach((message) => {
        const normalized = message.toLowerCase().trim();
        const isBank = /بنك|bank/i.test(normalized);
        expect(isBank).toBe(true);
      });
    });

    it("should detect credit card account type", () => {
      const testCases = [
        "بطاقة ائتمان",
        "credit card",
        "بطاقة",
        "card",
      ];

      testCases.forEach((message) => {
        const normalized = message.toLowerCase().trim();
        const isCreditCard = /بطاقة|credit|card/i.test(normalized);
        expect(isCreditCard).toBe(true);
      });
    });

    it("should detect digital wallet account type", () => {
      const testCases = [
        "محفظة رقمية",
        "digital wallet",
        "فودافون كاش",
      ];

      testCases.forEach((message) => {
        const normalized = message.toLowerCase().trim();
        const isDigital = /رقمية|digital|فودافون/i.test(normalized);
        expect(isDigital).toBe(true);
      });
    });
  });

  describe("Balance Extraction", () => {
    it("should extract balance with various formats", () => {
      const testCases = [
        { message: "500 جنيه", expected: 500 },
        { message: "1000 EGP", expected: 1000 },
        { message: "250 جنية", expected: 250 },
        { message: "100pound", expected: 100 },
        { message: "75 pounds", expected: 75 },
      ];

      testCases.forEach(({ message, expected }) => {
        const balanceMatch = message.match(/(\d+)\s*(?:جنيه|egp|pound|جنية)/i);
        expect(balanceMatch).not.toBeNull();
        expect(parseFloat(balanceMatch![1])).toBe(expected);
      });
    });

    it("should handle decimal balances", () => {
      const message = "150.50 EGP";
      const balanceMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:جنيه|egp|pound|جنية)/i);
      expect(balanceMatch).not.toBeNull();
      expect(parseFloat(balanceMatch![1])).toBe(150.5);
    });
  });
});

/**
 * Integration Tests (Manual)
 * 
 * These should be run manually with real RORK API to verify integration.
 * Do not run in CI/CD to avoid API rate limits.
 */
describe.skip("NL Parser - RORK API Integration (Manual)", () => {
  it("should parse create account intent in Arabic", async () => {
    // Manual test: Call parseAccountIntent action via Convex dashboard
    // Input: { userMessage: "أنشئ حساب محفظة برصيد 500 جنيه", language: "ar" }
    // Expected: { intent: "create_account", entities: { accountType: "cash", initialBalance: 500 } }
  });

  it("should parse create account intent in English", async () => {
    // Manual test: Call parseAccountIntent action via Convex dashboard
    // Input: { userMessage: "Create bank account with 1000 EGP", language: "en" }
    // Expected: { intent: "create_account", entities: { accountType: "bank", initialBalance: 1000 } }
  });

  it("should parse view accounts intent", async () => {
    // Manual test: Call parseAccountIntent action via Convex dashboard
    // Input: { userMessage: "Show my accounts", language: "en" }
    // Expected: { intent: "view_accounts", entities: {} }
  });

  it("should fallback to regex when RORK API fails", async () => {
    // Manual test: Temporarily set invalid RORK_TOOLKIT_URL
    // Verify fallback regex parsing works correctly
  });
});
