/**
 * Help Content Generator Tests
 * 
 * Tests for Story 1.4:
 * AC3: Bilingual Help Content
 * AC4: Arabic Help Message
 * AC5: English Help Message
 * AC7: Help Message Formatting
 */

import { describe, it, expect } from "vitest";
import { generateHelpMessage } from "./helpContent";

describe("generateHelpMessage", () => {
  describe("Arabic help message (AC4)", () => {
    it("should generate Arabic help with all required sections", () => {
      const arabicHelp = generateHelpMessage("ar");

      // Verify message is not empty
      expect(arabicHelp).toBeDefined();
      expect(arabicHelp.length).toBeGreaterThan(100);

      // Verify title emoji (AC7)
      expect(arabicHelp).toContain("📚");
      
      // Verify available commands section
      expect(arabicHelp).toContain("/start");
      expect(arabicHelp).toContain("/help");
      
      // Verify upcoming features section (AC4)
      expect(arabicHelp).toContain("🆕");
      expect(arabicHelp).toContain("الذكاء الاصطناعي"); // AI mention
      expect(arabicHelp).toContain("حسابات"); // accounts
      expect(arabicHelp).toContain("ميزانيات"); // budgets
      
      // Verify support section (AC4)
      expect(arabicHelp).toContain("💬");
      expect(arabicHelp).toContain("الدعم"); // support
      
      // Verify tip section
      expect(arabicHelp).toContain("🎯");
    });

    it("should use proper Arabic language", () => {
      const arabicHelp = generateHelpMessage("ar");
      
      // Check for Arabic text (right-to-left characters)
      const arabicRegex = /[\u0600-\u06FF]/;
      expect(arabicRegex.test(arabicHelp)).toBe(true);
    });
  });

  describe("English help message (AC5)", () => {
    it("should generate English help with all required sections", () => {
      const englishHelp = generateHelpMessage("en");

      // Verify message is not empty
      expect(englishHelp).toBeDefined();
      expect(englishHelp.length).toBeGreaterThan(100);

      // Verify title emoji (AC7)
      expect(englishHelp).toContain("📚");
      expect(englishHelp).toContain("Finance Tracker");
      
      // Verify available commands section
      expect(englishHelp).toContain("/start");
      expect(englishHelp).toContain("/help");
      
      // Verify upcoming features section (AC5)
      expect(englishHelp).toContain("🆕");
      expect(englishHelp).toContain("AI-powered"); // AI mention
      expect(englishHelp).toContain("accounts");
      expect(englishHelp).toContain("budget");
      
      // Verify support section (AC5)
      expect(englishHelp).toContain("💬");
      expect(englishHelp).toContain("Support");
      
      // Verify tip section
      expect(englishHelp).toContain("🎯");
    });

    it("should use proper English language", () => {
      const englishHelp = generateHelpMessage("en");
      
      // Verify English content
      expect(englishHelp).toContain("Welcome");
      expect(englishHelp).toContain("bot");
      expect(englishHelp).toContain("managing");
    });
  });

  describe("Message formatting (AC7)", () => {
    it("should contain required emojis for visual hierarchy", () => {
      const arabicHelp = generateHelpMessage("ar");
      const englishHelp = generateHelpMessage("en");

      // Required emojis from AC7
      const requiredEmojis = ["📚", "💰", "🆕", "💬", "🎯"];

      requiredEmojis.forEach((emoji) => {
        expect(arabicHelp).toContain(emoji);
        expect(englishHelp).toContain(emoji);
      });
    });

    it("should use Markdown formatting for commands", () => {
      const arabicHelp = generateHelpMessage("ar");
      const englishHelp = generateHelpMessage("en");

      // Check for Markdown bold (asterisks)
      expect(arabicHelp).toContain("*");
      expect(englishHelp).toContain("*");
    });
  });

  describe("Content equivalence (AC5)", () => {
    it("should have equivalent command listings in both languages", () => {
      const arabicHelp = generateHelpMessage("ar");
      const englishHelp = generateHelpMessage("en");

      // Both should mention the same commands
      expect(arabicHelp).toContain("/start");
      expect(englishHelp).toContain("/start");
      expect(arabicHelp).toContain("/help");
      expect(englishHelp).toContain("/help");
    });

    it("should have similar length indicating equivalent content", () => {
      const arabicHelp = generateHelpMessage("ar");
      const englishHelp = generateHelpMessage("en");

      // Messages should be within 30% of each other in length
      const lengthRatio = arabicHelp.length / englishHelp.length;
      expect(lengthRatio).toBeGreaterThan(0.7);
      expect(lengthRatio).toBeLessThan(1.3);
    });
  });

  describe("Performance (AC6)", () => {
    it("should generate help message in less than 1ms", () => {
      const startTime = performance.now();
      generateHelpMessage("ar");
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1); // Should be < 1ms (way under 1 second target)
    });
  });
});
