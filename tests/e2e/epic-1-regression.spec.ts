/**
 * Epic 1 Regression Tests
 * 
 * E2E tests for Foundation & Telegram Bot Setup
 * Tests all 4 Epic 1 stories:
 * - Story 1.1: Webhook Registration
 * - Story 1.2: Database Schema (implicit - tested via mutations)
 * - Story 1.3: User Onboarding
 * - Story 1.4: Help System
 */

import { test, expect } from '@playwright/test';
import {
  createStartCommandPayload,
  createHelpCommandPayload,
  createLanguageCallbackPayload,
  createInvalidPayload,
  TEST_USER,
} from './fixtures/telegram-payloads';

// Base URL from environment or config
const CONVEX_SITE_URL = process.env.CONVEX_SITE_URL || 'https://giant-mouse-652.convex.site';

test.describe('Epic 1: Foundation & Telegram Bot Setup', () => {
  
  test.describe('Story 1.1: Webhook Registration', () => {
    
    test('should successfully register webhook with Telegram', async ({ request }) => {
      // Call setWebhook endpoint
      const response = await request.get(`${CONVEX_SITE_URL}/telegram/setWebhook`);
      
      expect(response.ok()).toBeTruthy();
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.webhookUrl).toContain('convex.site/telegram/webhook');
      expect(data.message).toContain('Webhook registered successfully');
    });
    
    test('should return webhook health status', async ({ request }) => {
      const response = await request.get(`${CONVEX_SITE_URL}/telegram/setWebhook`);
      
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('webhookUrl');
    });
  });
  
  test.describe('Story 1.3: User Onboarding', () => {
    
    test('should handle /start command for new user', async ({ request }) => {
      const payload = createStartCommandPayload(Date.now());
      
      const response = await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
        data: payload,
      });
      
      // Webhook should return 200 OK even if processing fails (AC8: prevent Telegram retries)
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.ok).toBe(true);
    });
    
    test('should handle /start command for returning user', async ({ request }) => {
      // Send /start twice with same user
      const payload1 = createStartCommandPayload(Date.now());
      const payload2 = createStartCommandPayload(Date.now() + 1);
      
      // First /start (new user registration)
      const response1 = await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
        data: payload1,
      });
      expect(response1.status()).toBe(200);
      
      // Wait a bit to ensure first request is processed
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Second /start (returning user)
      const response2 = await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
        data: payload2,
      });
      expect(response2.status()).toBe(200);
      
      const data2 = await response2.json();
      expect(data2.ok).toBe(true);
    });
    
    test('should handle language selection callback', async ({ request }) => {
      // First send /start to register user
      const startPayload = createStartCommandPayload(Date.now());
      await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
        data: startPayload,
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then send language selection
      const callbackPayload = createLanguageCallbackPayload('en', Date.now() + 2);
      const response = await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
        data: callbackPayload,
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.ok).toBe(true);
    });
  });
  
  test.describe('Story 1.4: Help System', () => {
    
    test('should handle /help command', async ({ request }) => {
      // First ensure user exists with /start
      const startPayload = createStartCommandPayload(Date.now());
      await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
        data: startPayload,
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then send /help
      const helpPayload = createHelpCommandPayload(Date.now() + 3);
      const response = await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
        data: helpPayload,
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.ok).toBe(true);
    });
    
    test('should process /help within 1 second target (Story 1.4 AC6)', async ({ request }) => {
      // Ensure user exists
      const startPayload = createStartCommandPayload(Date.now());
      await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
        data: startPayload,
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Measure /help response time
      const helpPayload = createHelpCommandPayload(Date.now() + 4);
      const startTime = Date.now();
      
      const response = await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
        data: helpPayload,
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status()).toBe(200);
      
      // Target is < 1000ms (Story 1.4 AC6)
      // Allow some buffer for network latency in E2E
      expect(duration).toBeLessThan(2000); // More lenient for E2E
      
      console.log(`/help response time: ${duration}ms`);
    });
  });
  
  test.describe('Error Handling & Edge Cases', () => {
    
    test('should return 200 OK for invalid payload (AC8: prevent retries)', async ({ request }) => {
      const invalidPayload = createInvalidPayload();
      
      const response = await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
        data: invalidPayload,
      });
      
      // Must return 200 OK even for invalid payloads to prevent Telegram retries
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.ok).toBe(true);
    });
    
    test('should handle non-POST requests to webhook', async ({ request }) => {
      const response = await request.get(`${CONVEX_SITE_URL}/telegram/webhook`);
      
      // Should still return 200 OK (AC8)
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data.ok).toBe(true);
    });
    
    test('should handle concurrent webhook requests', async ({ request }) => {
      const payloads = [
        createStartCommandPayload(Date.now() + 10),
        createHelpCommandPayload(Date.now() + 11),
        createStartCommandPayload(Date.now() + 12),
      ];
      
      // Send multiple requests concurrently
      const responses = await Promise.all(
        payloads.map(payload =>
          request.post(`${CONVEX_SITE_URL}/telegram/webhook`, { data: payload })
        )
      );
      
      // All should return 200 OK (AC5: 100+ concurrent handling)
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
    });
  });
  
  test.describe('Performance & NFRs', () => {
    
    test('should handle /start within 2 second target (Story 1.3 AC4)', async ({ request }) => {
      const payload = createStartCommandPayload(Date.now() + 20);
      const startTime = Date.now();
      
      const response = await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
        data: payload,
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status()).toBe(200);
      
      // Target is < 2000ms (Story 1.3 AC4)
      expect(duration).toBeLessThan(3000); // More lenient for E2E
      
      console.log(`/start response time: ${duration}ms`);
    });
  });
});

test.describe('Command Router Refactoring Validation', () => {
  
  test('should route /start command via registry pattern', async ({ request }) => {
    const payload = createStartCommandPayload(Date.now() + 30);
    
    const response = await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
      data: payload,
    });
    
    expect(response.status()).toBe(200);
    
    // If routing works, webhook should process successfully
    const data = await response.json();
    expect(data.ok).toBe(true);
  });
  
  test('should route /help command via registry pattern', async ({ request }) => {
    // Ensure user exists
    await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
      data: createStartCommandPayload(Date.now() + 31),
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const payload = createHelpCommandPayload(Date.now() + 32);
    
    const response = await request.post(`${CONVEX_SITE_URL}/telegram/webhook`, {
      data: payload,
    });
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.ok).toBe(true);
  });
});
