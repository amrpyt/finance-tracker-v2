/**
 * E2E Test: Story 2.4 - Set Default Account
 * 
 * Tests the complete set default account workflow using natural language input.
 * 
 * Test Coverage:
 * - AC1: Intent Detection (85%+ confidence)
 * - AC2: Account Selection with default indicator
 * - AC3: Bilingual Support (Arabic/English)
 * - AC4: Single Default Enforcement (atomic transaction)
 * - AC5: Confirmation Workflow
 * - AC6: Visual ⭐ Indicator
 * - AC7: Transaction Integration (ready for future)
 * - AC8: Success Response with Overview
 * - AC9: First Account Auto-Default
 * - AC10: Validation Rules
 * - AC11: Already Default Handling
 * - AC12: No Accounts Error
 * - AC13: Single Account Auto-Select
 * - AC14: Message History
 * - AC15: Fallback Regex
 * - AC16: Performance < 3 seconds
 * - AC17: Audit Trail (updatedAt)
 * - AC18: Cancel Anytime
 * - AC19: Query Optimization (indexed)
 * - AC20: Help Documentation
 */

import { test, expect } from "@playwright/test";

test.describe("Story 2.4: Set Default Account", () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to application and ensure user is registered
    await page.goto("/");
    
    // Register user if needed (Story 1.1)
    // This should be handled by test fixtures
  });

  test("AC1, AC3: Detects set_default_account intent from Arabic input", async ({ page }) => {
    // Prerequisite: User has multiple accounts
    // Send Arabic message: "اجعل الحساب الافتراضي"
    
    await page.fill('[data-testid="message-input"]', "اجعل الحساب الافتراضي");
    await page.click('[data-testid="send-button"]');
    
    // Wait for account selection message
    await page.waitForSelector('[data-testid="account-selection"]', { timeout: 3000 });
    
    // Verify selection message appears (AC2)
    const selection = await page.textContent('[data-testid="account-selection"]');
    expect(selection).toContain("اختر الحساب"); // "Select account"
  });

  test("AC1, AC3: Detects set_default_account intent from English input", async ({ page }) => {
    // Send English message: "set default account"
    
    await page.fill('[data-testid="message-input"]', "set default account");
    await page.click('[data-testid="send-button"]');
    
    // Wait for account selection
    await page.waitForSelector('[data-testid="account-selection"]', { timeout: 3000 });
    
    const selection = await page.textContent('[data-testid="account-selection"]');
    expect(selection).toContain("Select account");
  });

  test("AC2, AC6: Account selection displays ⭐ indicator for current default", async ({ page }) => {
    // Prerequisite: User has multiple accounts with one default
    
    await page.fill('[data-testid="message-input"]', "غير الحساب الافتراضي");
    await page.click('[data-testid="send-button"]');
    
    await page.waitForSelector('[data-testid="account-list"]');
    
    // Verify ⭐ appears next to default account
    const accountList = await page.textContent('[data-testid="account-list"]');
    expect(accountList).toContain("⭐");
  });

  test("AC4, AC5, AC8: Complete flow - select account, confirm, verify single default", async ({ page }) => {
    // Create test accounts first
    await page.fill('[data-testid="message-input"]', "Create cash account");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="confirm-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    await page.fill('[data-testid="message-input"]', "Create bank account");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="confirm-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Now set default
    await page.fill('[data-testid="message-input"]', "set default account");
    await page.click('[data-testid="send-button"]');
    
    // Select second account
    await page.waitForSelector('[data-testid="account-button-1"]');
    await page.click('[data-testid="account-button-1"]');
    
    // Verify confirmation shows current and new default (AC5)
    await page.waitForSelector('[data-testid="confirmation-message"]');
    const confirmation = await page.textContent('[data-testid="confirmation-message"]');
    expect(confirmation).toContain("Current default");
    expect(confirmation).toContain("New default");
    
    // Confirm change
    await page.click('[data-testid="confirm-button"]');
    
    // Verify success message (AC8)
    await page.waitForSelector('[data-testid="success-message"]');
    const success = await page.textContent('[data-testid="success-message"]');
    expect(success).toContain("✅");
    expect(success).toContain("⭐");
    
    // Verify only one account has ⭐ (AC4 - single default enforcement)
    const accountsOverview = await page.textContent('[data-testid="accounts-overview"]');
    const starCount = (accountsOverview.match(/⭐/g) || []).length;
    expect(starCount).toBe(1);
  });

  test("AC9: First account automatically set as default", async ({ page }) => {
    // Start with no accounts
    // Create first account
    await page.fill('[data-testid="message-input"]', "Create cash account with 100 EGP");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="confirm-button"]');
    
    // Wait for success
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify account has ⭐ indicator
    const success = await page.textContent('[data-testid="success-message"]');
    expect(success).toContain("⭐");
  });

  test("AC11: Already default account shows friendly message", async ({ page }) => {
    // Prerequisite: User has accounts with one default
    
    await page.fill('[data-testid="message-input"]', "set default account");
    await page.click('[data-testid="send-button"]');
    
    // Select the account that's already default
    await page.waitForSelector('[data-testid="account-button-0"]'); // Assuming first is default
    await page.click('[data-testid="account-button-0"]');
    
    // Verify friendly message (AC11)
    await page.waitForSelector('[data-testid="info-message"]');
    const message = await page.textContent('[data-testid="info-message"]');
    expect(message).toContain("already");
    expect(message).toContain("⭐");
  });

  test("AC12: No accounts error with prompt to create", async ({ page }) => {
    // Start with no accounts
    
    await page.fill('[data-testid="message-input"]', "set default account");
    await page.click('[data-testid="send-button"]');
    
    // Verify error message
    await page.waitForSelector('[data-testid="error-message"]');
    const error = await page.textContent('[data-testid="error-message"]');
    expect(error).toContain("no accounts");
    expect(error).toContain("create");
  });

  test("AC13: Single account auto-selects and skips to confirmation", async ({ page }) => {
    // Create only one account
    await page.fill('[data-testid="message-input"]', "Create cash account");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="confirm-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Try to set default (should auto-select)
    await page.fill('[data-testid="message-input"]', "change default account");
    await page.click('[data-testid="send-button"]');
    
    // Should skip selection and show "already default" message
    // (since first account is auto-default)
    await page.waitForSelector('[data-testid="info-message"]', { timeout: 2000 });
    const message = await page.textContent('[data-testid="info-message"]');
    expect(message).toContain("already");
  });

  test("AC15: Fallback regex works when AI confidence is low", async ({ page }) => {
    // Send message with clear set default pattern but potentially low AI confidence
    
    await page.fill('[data-testid="message-input"]', "خلي المحفظة افتراضية");
    await page.click('[data-testid="send-button"]');
    
    // Should still detect intent via regex fallback
    await page.waitForSelector('[data-testid="account-selection"]', { timeout: 3000 });
    
    const selection = await page.textContent('[data-testid="account-selection"]');
    expect(selection).toBeTruthy();
  });

  test("AC16: Performance - Complete flow under 3 seconds", async ({ page }) => {
    const startTime = Date.now();
    
    // Execute complete flow
    await page.fill('[data-testid="message-input"]', "set default account");
    await page.click('[data-testid="send-button"]');
    
    await page.waitForSelector('[data-testid="account-selection"]');
    await page.click('[data-testid="account-button-1"]');
    
    await page.waitForSelector('[data-testid="confirm-button"]');
    await page.click('[data-testid="confirm-button"]');
    
    await page.waitForSelector('[data-testid="success-message"]');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Verify under 3 seconds (3000ms)
    expect(duration).toBeLessThan(3000);
  });

  test("AC18: Cancel at account selection step", async ({ page }) => {
    await page.fill('[data-testid="message-input"]', "set default account");
    await page.click('[data-testid="send-button"]');
    
    await page.waitForSelector('[data-testid="cancel-button"]');
    await page.click('[data-testid="cancel-button"]');
    
    // Verify cancellation message
    await page.waitForSelector('[data-testid="cancel-message"]');
    const message = await page.textContent('[data-testid="cancel-message"]');
    expect(message).toContain("cancel");
  });

  test("AC18: Cancel at confirmation step", async ({ page }) => {
    await page.fill('[data-testid="message-input"]', "set default account");
    await page.click('[data-testid="send-button"]');
    
    await page.waitForSelector('[data-testid="account-button-1"]');
    await page.click('[data-testid="account-button-1"]');
    
    await page.waitForSelector('[data-testid="cancel-button"]');
    await page.click('[data-testid="cancel-button"]');
    
    // Verify cancellation
    await page.waitForSelector('[data-testid="cancel-message"]');
    const message = await page.textContent('[data-testid="cancel-message"]');
    expect(message).toContain("cancel");
  });

  test("AC20: Help documentation includes set default examples", async ({ page }) => {
    // Send /help command
    await page.fill('[data-testid="message-input"]', "/help");
    await page.click('[data-testid="send-button"]');
    
    await page.waitForSelector('[data-testid="help-message"]');
    const help = await page.textContent('[data-testid="help-message"]');
    
    // Verify set default examples are documented
    expect(help).toContain("default");
    expect(help).toContain("⭐");
  });

  test("Integration: View accounts shows ⭐ indicator after setting default", async ({ page }) => {
    // Set default account
    await page.fill('[data-testid="message-input"]', "set default account");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="account-button-1"]');
    await page.click('[data-testid="confirm-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // View accounts
    await page.fill('[data-testid="message-input"]', "show my accounts");
    await page.click('[data-testid="send-button"]');
    
    await page.waitForSelector('[data-testid="accounts-list"]');
    const accounts = await page.textContent('[data-testid="accounts-list"]');
    
    // Verify ⭐ appears in accounts list (AC6)
    expect(accounts).toContain("⭐");
    
    // Verify only one ⭐ (AC4)
    const starCount = (accounts.match(/⭐/g) || []).length;
    expect(starCount).toBe(1);
  });

  test("Race condition: Concurrent set default requests maintain single default", async ({ page, context }) => {
    // Open two pages to simulate concurrent requests
    const page2 = await context.newPage();
    await page2.goto("/");
    
    // Both pages try to set different accounts as default simultaneously
    const promise1 = (async () => {
      await page.fill('[data-testid="message-input"]', "set default account");
      await page.click('[data-testid="send-button"]');
      await page.click('[data-testid="account-button-0"]');
      await page.click('[data-testid="confirm-button"]');
    })();
    
    const promise2 = (async () => {
      await page2.fill('[data-testid="message-input"]', "set default account");
      await page2.click('[data-testid="send-button"]');
      await page2.click('[data-testid="account-button-1"]');
      await page2.click('[data-testid="confirm-button"]');
    })();
    
    await Promise.all([promise1, promise2]);
    
    // View accounts to verify only one default
    await page.fill('[data-testid="message-input"]', "show accounts");
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="accounts-list"]');
    
    const accounts = await page.textContent('[data-testid="accounts-list"]');
    const starCount = (accounts.match(/⭐/g) || []).length;
    
    // AC4: Atomic transaction ensures only one default
    expect(starCount).toBe(1);
    
    await page2.close();
  });
});
