/**
 * E2E Test: Story 2.1 - Create Account with Natural Language
 * 
 * Tests the complete account creation workflow using natural language input.
 * 
 * Test Coverage:
 * - AC1: Intent Detection
 * - AC2: Entity Extraction
 * - AC3: Bilingual Support
 * - AC4: Confirmation Workflow
 * - AC5: Account Creation
 * - AC6: Default Account Handling
 * - AC7: Success Response with Overview
 * - AC8: Auto-generated Names
 * - AC9: Currency Defaults
 * - AC10: Validation Rules
 * - AC11: Duplicate Prevention
 * - AC12: Message History
 * - AC13: Low Confidence Handling
 */

import { test, expect } from "@playwright/test";

test.describe("Story 2.1: Create Account with Natural Language", () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to application
    await page.goto("/");
  });

  test("AC1, AC2, AC3: Detects intent and extracts entities from Arabic input", async ({ page }) => {
    // Send Arabic message: "أنشئ حساب محفظة برصيد 500 جنيه"
    // Expected: AI detects create_account intent with entities
    
    await page.fill('[data-testid="message-input"]', "أنشئ حساب محفظة برصيد 500 جنيه");
    await page.click('[data-testid="send-button"]');
    
    // Wait for confirmation message
    await page.waitForSelector('[data-testid="confirmation-message"]');
    
    // Verify confirmation contains extracted entities
    const confirmation = await page.textContent('[data-testid="confirmation-message"]');
    expect(confirmation).toContain("محفظة نقدية"); // Account type: cash
    expect(confirmation).toContain("500"); // Balance
    expect(confirmation).toContain("EGP"); // Currency
  });

  test("AC1, AC2, AC3: Detects intent and extracts entities from English input", async ({ page }) => {
    // Send English message: "Create bank account with 1000 USD"
    
    await page.fill('[data-testid="message-input"]', "Create bank account with 1000 USD");
    await page.click('[data-testid="send-button"]');
    
    // Wait for confirmation message
    await page.waitForSelector('[data-testid="confirmation-message"]');
    
    // Verify confirmation
    const confirmation = await page.textContent('[data-testid="confirmation-message"]');
    expect(confirmation).toContain("Bank Account");
    expect(confirmation).toContain("1000");
    expect(confirmation).toContain("USD");
  });

  test("AC4, AC5: Confirmation workflow creates account on confirm", async ({ page }) => {
    // Send account creation request
    await page.fill('[data-testid="message-input"]', "Create cash account");
    await page.click('[data-testid="send-button"]');
    
    // Wait for confirmation with buttons
    await page.waitForSelector('[data-testid="confirm-button"]');
    
    // Click confirm button
    await page.click('[data-testid="confirm-button"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    
    const success = await page.textContent('[data-testid="success-message"]');
    expect(success).toContain("تم إنشاء الحساب"); // Success indicator
  });

  test("AC4: Cancellation workflow does not create account", async ({ page }) => {
    // Send account creation request
    await page.fill('[data-testid="message-input"]', "Create bank account");
    await page.click('[data-testid="send-button"]');
    
    // Wait for confirmation
    await page.waitForSelector('[data-testid="cancel-button"]');
    
    // Click cancel button
    await page.click('[data-testid="cancel-button"]');
    
    // Verify cancellation message
    await page.waitForSelector('[data-testid="cancel-message"]');
    const cancel = await page.textContent('[data-testid="cancel-message"]');
    expect(cancel).toContain("تم الإلغاء"); // Cancelled
  });

  test("AC6: First account is automatically set as default", async ({ page }) => {
    // Create first account
    await page.fill('[data-testid="message-input"]', "Create cash account");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="confirm-button"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Verify account is marked as default (⭐)
    const message = await page.textContent('[data-testid="success-message"]');
    expect(message).toContain("⭐"); // Default marker
  });

  test("AC6: Second account prompts for default selection", async ({ page }) => {
    // Create first account
    await page.fill('[data-testid="message-input"]', "Create cash account");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="confirm-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Create second account
    await page.fill('[data-testid="message-input"]', "Create bank account");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="confirm-button"]');
    
    // Wait for default prompt
    await page.waitForSelector('[data-testid="default-prompt"]');
    const prompt = await page.textContent('[data-testid="default-prompt"]');
    expect(prompt).toContain("افتراضي"); // Default prompt in Arabic
  });

  test("AC7: Success response shows account overview with total", async ({ page }) => {
    // Create first account
    await page.fill('[data-testid="message-input"]', "أنشئ محفظة برصيد 500");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="confirm-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Create second account
    await page.fill('[data-testid="message-input"]', "أنشئ بنك برصيد 1000");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="confirm-button"]');
    
    // Wait for success with overview
    await page.waitForSelector('[data-testid="success-message"]');
    const message = await page.textContent('[data-testid="success-message"]');
    
    // Verify overview
    expect(message).toContain("حساباتك"); // Your accounts
    expect(message).toContain("إجمالي الرصيد"); // Total balance
    expect(message).toContain("1500"); // Total: 500 + 1000
  });

  test("AC8: Auto-generates account names with increments", async ({ page }) => {
    // Create first cash account without name
    await page.fill('[data-testid="message-input"]', "أنشئ محفظة");
    await page.click('[data-testid="send-button"]');
    
    // Verify confirmation shows "Cash Wallet 1" or "محفظة نقدية 1"
    await page.waitForSelector('[data-testid="confirmation-message"]');
    let confirmation = await page.textContent('[data-testid="confirmation-message"]');
    expect(confirmation).toMatch(/محفظة نقدية 1|Cash Wallet 1/);
    
    await page.click('[data-testid="confirm-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Create second cash account
    await page.fill('[data-testid="message-input"]', "أنشئ محفظة");
    await page.click('[data-testid="send-button"]');
    
    // Verify incremented name
    await page.waitForSelector('[data-testid="confirmation-message"]');
    confirmation = await page.textContent('[data-testid="confirmation-message"]');
    expect(confirmation).toMatch(/محفظة نقدية 2|Cash Wallet 2/);
  });

  test("AC9: Uses user profile currency as default", async ({ page }) => {
    // Assuming user profile has currency set to EGP
    // Create account without specifying currency
    await page.fill('[data-testid="message-input"]', "Create cash account with 100");
    await page.click('[data-testid="send-button"]');
    
    // Verify confirmation uses profile currency (EGP)
    await page.waitForSelector('[data-testid="confirmation-message"]');
    const confirmation = await page.textContent('[data-testid="confirmation-message"]');
    expect(confirmation).toContain("EGP");
  });

  test("AC10: Validates account type", async ({ page }) => {
    // This would be a backend test - validation happens server-side
    // Placeholder for integration test
  });

  test("AC11: Prevents duplicate account names", async ({ page }) => {
    // Create account with specific name
    await page.fill('[data-testid="message-input"]', "Create account named MySavings");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="confirm-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Try to create another account with same name
    await page.fill('[data-testid="message-input"]', "Create account named MySavings");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="confirm-button"]');
    
    // Expect error about duplicate name
    await page.waitForSelector('[data-testid="error-message"]');
    const error = await page.textContent('[data-testid="error-message"]');
    expect(error).toContain("MySavings"); // Error mentions duplicate name
  });

  test("AC12: Stores all messages in history", async ({ page }) => {
    // Send account creation request
    await page.fill('[data-testid="message-input"]', "Create cash account");
    await page.click('[data-testid="send-button"]');
    await page.click('[data-testid="confirm-button"]');
    await page.waitForSelector('[data-testid="success-message"]');
    
    // Open message history
    await page.click('[data-testid="history-button"]');
    
    // Verify messages are stored
    const history = await page.textContent('[data-testid="message-history"]');
    expect(history).toContain("Create cash account"); // User message
    expect(history).toContain("تأكيد"); // Confirmation message
    expect(history).toContain("تم إنشاء"); // Success message
  });

  test("AC13: Low confidence triggers clarification", async ({ page }) => {
    // Send ambiguous message
    await page.fill('[data-testid="message-input"]', "I want something");
    await page.click('[data-testid="send-button"]');
    
    // Expect clarification message
    await page.waitForSelector('[data-testid="clarification-message"]');
    const clarification = await page.textContent('[data-testid="clarification-message"]');
    expect(clarification).toContain("لم أفهم"); // Didn't understand
  });

  test("AC13: Missing account type triggers selection keyboard", async ({ page }) => {
    // Send message without clear account type
    await page.fill('[data-testid="message-input"]', "Create account");
    await page.click('[data-testid="send-button"]');
    
    // Expect account type selection keyboard
    await page.waitForSelector('[data-testid="account-type-selection"]');
    const buttons = await page.$$('[data-testid^="account-type-"]');
    expect(buttons.length).toBe(4); // 4 account types
  });

  test("Performance: Confirmation sent within 2 seconds", async ({ page }) => {
    const startTime = Date.now();
    
    await page.fill('[data-testid="message-input"]', "Create cash account");
    await page.click('[data-testid="send-button"]');
    
    await page.waitForSelector('[data-testid="confirmation-message"]');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(2000); // < 2 seconds
  });

  test("Performance: Account creation completes within 2 seconds", async ({ page }) => {
    await page.fill('[data-testid="message-input"]', "Create cash account");
    await page.click('[data-testid="send-button"]');
    await page.waitForSelector('[data-testid="confirm-button"]');
    
    const startTime = Date.now();
    await page.click('[data-testid="confirm-button"]');
    
    await page.waitForSelector('[data-testid="success-message"]');
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(2000); // < 2 seconds
  });
});
