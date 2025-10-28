/**
 * View Accounts Command Handler Tests
 * 
 * Tests for Story 2.2: View Accounts with Balance Overview
 * 
 * Test Coverage:
 * - AC1: Intent detection with 85%+ confidence
 * - AC3: Bilingual support (Arabic/English)
 * - AC9: Empty state handling
 * - AC15: Regex fallback when RORK fails
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ViewAccountsCommandHandler } from "./viewAccountsCommand";
import type { CommandHandlerContext } from "./types";
import type { ExtractedUserData } from "../telegram/types";

describe("ViewAccountsCommandHandler", () => {
  let handler: ViewAccountsCommandHandler;
  let mockCtx: CommandHandlerContext;
  let mockUserData: ExtractedUserData;
  const chatId = 123456789;

  beforeEach(() => {
    handler = new ViewAccountsCommandHandler();
    
    // Mock context
    mockCtx = {
      runQuery: vi.fn(),
      runMutation: vi.fn(),
      runAction: vi.fn(),
    };

    // Mock user data
    mockUserData = {
      telegramId: 123456789,
      username: "testuser",
      firstName: "Test",
      lastName: "User",
      languageCode: "en",
    };
  });

  describe("AC1 & AC3: Intent Detection - Bilingual", () => {
    it("should detect view_accounts intent from Arabic command", async () => {
      // Mock user and profile
      mockCtx.runQuery = vi.fn()
        .mockResolvedValueOnce({ _id: "user123" }) // getByTelegramId
        .mockResolvedValueOnce({ language: "ar", currency: "EGP" }) // getProfile
        .mockResolvedValueOnce([]); // getOverview

      // Mock AI parser response
      mockCtx.runAction = vi.fn()
        .mockResolvedValueOnce({
          intent: "view_accounts",
          confidence: 0.9,
          entities: {},
          language: "ar",
        }) // parseAccountIntent
        .mockResolvedValue({ success: true }); // sendMessage

      mockCtx.runMutation = vi.fn().mockResolvedValue(undefined);

      await handler.execute(mockCtx, mockUserData, chatId, "عرض حساباتي");

      // Verify AI parser was called
      expect(mockCtx.runAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userMessage: "عرض حساباتي",
          language: "ar",
        })
      );

      // Verify accounts query was called
      expect(mockCtx.runQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: "user123",
        })
      );
    });

    it("should detect view_accounts intent from English command", async () => {
      // Mock user and profile
      mockCtx.runQuery = vi.fn()
        .mockResolvedValueOnce({ _id: "user123" }) // getByTelegramId
        .mockResolvedValueOnce({ language: "en", currency: "USD" }) // getProfile
        .mockResolvedValueOnce([]); // getOverview

      // Mock AI parser response
      mockCtx.runAction = vi.fn()
        .mockResolvedValueOnce({
          intent: "view_accounts",
          confidence: 0.95,
          entities: {},
          language: "en",
        }) // parseAccountIntent
        .mockResolvedValue({ success: true }); // sendMessage

      mockCtx.runMutation = vi.fn().mockResolvedValue(undefined);

      await handler.execute(mockCtx, mockUserData, chatId, "show my accounts");

      // Verify AI parser was called with English
      expect(mockCtx.runAction).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userMessage: "show my accounts",
          language: "en",
        })
      );
    });
  });

  describe("AC9: Empty State Handling", () => {
    it("should show empty state message when user has no accounts", async () => {
      // Mock user and profile
      mockCtx.runQuery = vi.fn()
        .mockResolvedValueOnce({ _id: "user123" })
        .mockResolvedValueOnce({ language: "ar", currency: "EGP" })
        .mockResolvedValueOnce([]); // Empty accounts array

      // Mock AI parser
      mockCtx.runAction = vi.fn()
        .mockResolvedValueOnce({
          intent: "view_accounts",
          confidence: 0.9,
          entities: {},
          language: "ar",
        })
        .mockResolvedValue({ success: true });

      mockCtx.runMutation = vi.fn().mockResolvedValue(undefined);

      await handler.execute(mockCtx, mockUserData, chatId, "عرض حساباتي");

      // Verify sendMessage was called
      expect(mockCtx.runAction).toHaveBeenCalled();
      
      // Get the last sendMessage call
      const calls = (mockCtx.runAction as any).mock.calls;
      const sendMessageCall = calls[calls.length - 1];
      
      expect(sendMessageCall).toBeDefined();
      expect(sendMessageCall[1]).toBeDefined();
      expect(sendMessageCall[1].text).toContain("لا توجد حسابات");
    });
  });

  describe("AC15: Regex Fallback", () => {
    it("should use regex fallback when RORK confidence is low", async () => {
      // Mock user and profile
      mockCtx.runQuery = vi.fn()
        .mockResolvedValueOnce({ _id: "user123" })
        .mockResolvedValueOnce({ language: "ar", currency: "EGP" })
        .mockResolvedValueOnce([
          {
            _id: "acc1",
            name: "محفظتي",
            type: "cash",
            balance: 500,
            currency: "EGP",
            isDefault: true,
          },
        ]);

      // Mock AI parser with low confidence
      mockCtx.runAction = vi.fn()
        .mockResolvedValueOnce({
          intent: "view_accounts",
          confidence: 0.5, // Low confidence
          entities: {},
          language: "ar",
        })
        .mockResolvedValue({ success: true });

      mockCtx.runMutation = vi.fn().mockResolvedValue(undefined);

      // Use clear Arabic view accounts command
      await handler.execute(mockCtx, mockUserData, chatId, "عرض حساباتي");

      // Should still process because regex fallback matches
      expect(mockCtx.runQuery).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userId: "user123",
        })
      );
    });

    it("should reject non-view-accounts commands even with low confidence", async () => {
      // Mock user and profile
      mockCtx.runQuery = vi.fn()
        .mockResolvedValueOnce({ _id: "user123" })
        .mockResolvedValueOnce({ language: "en", currency: "USD" });

      // Mock AI parser with low confidence and wrong intent
      mockCtx.runAction = vi.fn()
        .mockResolvedValueOnce({
          intent: "create_account",
          confidence: 0.4,
          entities: {},
          language: "en",
        })
        .mockResolvedValue({ success: true });

      mockCtx.runMutation = vi.fn().mockResolvedValue(undefined);

      await handler.execute(mockCtx, mockUserData, chatId, "hello there");

      // Should send error message, not query accounts overview
      const queryCallsCount = (mockCtx.runQuery as any).mock.calls.length;
      // Only 2 calls: getByTelegramId and getProfile, no getOverview
      expect(queryCallsCount).toBe(2);
    });
  });

  describe("Account Display", () => {
    it("should format and display accounts with proper grouping", async () => {
      const mockAccounts = [
        {
          _id: "acc1",
          _creationTime: Date.now(),
          userId: "user123",
          name: "Main Bank",
          type: "bank" as const,
          balance: 5000,
          currency: "EGP",
          isDefault: true,
          isDeleted: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          _id: "acc2",
          _creationTime: Date.now(),
          userId: "user123",
          name: "Cash Wallet",
          type: "cash" as const,
          balance: 500,
          currency: "EGP",
          isDefault: false,
          isDeleted: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      // Mock user and profile
      mockCtx.runQuery = vi.fn()
        .mockResolvedValueOnce({ _id: "user123" })
        .mockResolvedValueOnce({ language: "en", currency: "EGP" })
        .mockResolvedValueOnce(mockAccounts);

      // Mock AI parser
      mockCtx.runAction = vi.fn()
        .mockResolvedValueOnce({
          intent: "view_accounts",
          confidence: 0.9,
          entities: {},
          language: "en",
        })
        .mockResolvedValue({ success: true });

      mockCtx.runMutation = vi.fn().mockResolvedValue(undefined);

      await handler.execute(mockCtx, mockUserData, chatId, "show accounts");

      // Verify sendMessage was called
      expect(mockCtx.runAction).toHaveBeenCalled();
      
      // Get the last sendMessage call
      const calls = (mockCtx.runAction as any).mock.calls;
      const sendMessageCall = calls[calls.length - 1];
      
      expect(sendMessageCall).toBeDefined();
      expect(sendMessageCall[1]).toBeDefined();
      
      const messageText = sendMessageCall[1].text;
      
      // Should contain account count
      expect(messageText).toContain("2 accounts");
      
      // Should contain account names
      expect(messageText).toContain("Main Bank");
      expect(messageText).toContain("Cash Wallet");
      
      // Should contain default indicator
      expect(messageText).toContain("⭐");
      
      // Should contain total
      expect(messageText).toContain("5,500.00");
    });
  });
});
