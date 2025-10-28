# Developer Guide: AI Integration & Callback Handlers

**Version:** 1.0  
**Last Updated:** 2025-10-18  
**Audience:** Development Team

---

## Overview

This guide provides step-by-step instructions for implementing AI-powered features and callback handlers in Finance Tracker v2.0, ensuring consistency and preventing common issues.

---

## Table of Contents

1. [Quick Checklist](#quick-checklist)
2. [Adding New AI Features](#adding-new-ai-features)
3. [Implementing Callback Handlers](#implementing-callback-handlers)
4. [Testing & Validation](#testing--validation)
5. [Common Pitfalls](#common-pitfalls)
6. [Troubleshooting](#troubleshooting)

---

## Quick Checklist

Before marking your story as "Ready for Review":

### ✅ Feature Registry
- [ ] Updated `convex/ai/prompts.ts` with feature details
- [ ] Set `available: true` and recorded version

### ✅ AI Prompts
- [ ] System prompt lists feature as "available"
- [ ] Tested AI doesn't say "under development"

### ✅ Callback Handlers
- [ ] Patterns defined in `constants.ts`
- [ ] Handlers implemented in `webhook.ts`
- [ ] All buttons tested in Telegram

### ✅ Pre-Deployment
- [ ] `npm run test:prompts` passes
- [ ] `npm run test:callbacks` passes
- [ ] Manual E2E test completed

---

## Adding New AI Features

### Step 1: Update Feature Registry

**File:** `convex/ai/prompts.ts`

Add your feature to the `FEATURE_REGISTRY`:

```typescript
export const FEATURE_REGISTRY = {
  // ... existing features
  
  expenses: {
    log: { 
      available: true,  // ← Set to true when implemented
      since: "3.1",     // ← Story version
      storyId: "3.1",   // ← Story ID
      description: "Log expenses with AI parsing"  // ← User-facing description
    },
    
    // New feature example:
    edit: { 
      available: true,        // ← YOUR FEATURE
      since: "3.2",          // ← YOUR VERSION
      storyId: "3.2",        // ← YOUR STORY ID
      description: "Edit expense details"  // ← YOUR DESCRIPTION
    },
  },
}
```

**Rules:**
- ✅ Set `available: true` ONLY when feature is fully implemented and tested
- ✅ Use clear, user-facing language in `description`
- ✅ Update this BEFORE deploying to production
- ❌ Don't set `available: true` for work-in-progress features

---

### Step 2: Update AI Parser (if needed)

**File:** `convex/ai/nlParser.ts` OR `convex/ai/parseExpenseIntent.ts`

The system prompts now use `generateFeatureList()` to automatically include available features. However, you may need to add:

1. **Intent Keywords:** Words/phrases that trigger your feature
2. **Examples:** Sample user messages showing how to use it
3. **Entity Extraction:** What data to extract from messages

**Example: Adding Expense Editing**

```typescript
// In parseExpenseIntent.ts system prompt

النوايا المتاحة:
- log_expense: تسجيل مصروف (دفعت، صرفت، اشتريت، جبت)
- edit_expense: تعديل مصروف (عدل، غير، صحح المصروف)  // ← NEW
- unknown: غير معروف

أمثلة للتعديل:  // ← NEW SECTION
- "عدل المصروف الأخير" → edit_expense, target: "last"
- "غير المبلغ إلى 100" → edit_expense, field: "amount", value: 100
- "صحح الفئة لـ طعام" → edit_expense, field: "category", value: "food"
```

---

### Step 3: Test AI Recognition

**Manual Testing:**

1. Send test messages to your bot:
   ```
   User: "عدل المصروف"
   Expected: AI detects edit_expense intent
   ```

2. Check AI confidence scores:
   ```typescript
   // In logs, verify:
   {
     "intent": "edit_expense",
     "confidence": 0.9,  // Should be >= 0.85
     "entities": { ... }
   }
   ```

3. Test edge cases:
   - Ambiguous messages
   - Typos
   - Mixed languages

---

## Implementing Callback Handlers

### Step 1: Define Callback Patterns

**File:** `convex/lib/constants.ts`

Add your callback patterns to `CALLBACK_PATTERNS`:

```typescript
export const CALLBACK_PATTERNS = {
  // ... existing patterns
  
  // Expense Management
  CONFIRM_EXPENSE_PREFIX: "confirm_expense_",
  EDIT_EXPENSE_PREFIX: "edit_expense_",
  CANCEL_EXPENSE_PREFIX: "cancel_expense_",
  
  // Your new patterns:
  EDIT_EXPENSE_AMOUNT_PREFIX: "edit_expense_amount_",    // ← NEW
  EDIT_EXPENSE_CATEGORY_PREFIX: "edit_expense_category_", // ← NEW
  SAVE_EXPENSE_EDIT_PREFIX: "save_expense_edit_",       // ← NEW
};
```

**Naming Convention:**
- Use `_PREFIX` suffix for patterns that include dynamic data
- Use SCREAMING_SNAKE_CASE
- Be descriptive: `EDIT_EXPENSE_AMOUNT_` not `EDIT_AMT_`

---

### Step 2: Create Keyboard Buttons

**File:** Where you build confirmation messages (e.g., `convex/lib/expenseConfirmation.ts`)

Create inline keyboard with your callback patterns:

```typescript
const keyboard: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      {
        text: language === "ar" ? "تعديل المبلغ" : "Edit Amount",
        callback_data: `edit_expense_amount_${confirmationId}`,  // ← Uses your pattern
      },
    ],
    [
      {
        text: language === "ar" ? "حفظ التعديلات" : "Save Changes",
        callback_data: `save_expense_edit_${confirmationId}`,    // ← Uses your pattern
      },
    ],
  ],
};
```

---

### Step 3: Implement Handler in Webhook

**File:** `convex/telegram/webhook.ts`

Add your handler in the `callback_query` section:

```typescript
// Handle edit expense amount callback
if (data && data.startsWith(CALLBACK_PATTERNS.EDIT_EXPENSE_AMOUNT_PREFIX)) {
  const confirmationId = data.replace(CALLBACK_PATTERNS.EDIT_EXPENSE_AMOUNT_PREFIX, "");
  
  logger.info({ 
    confirmationId, 
    userId: user._id 
  }, "Edit expense amount callback received");

  // 1. Acknowledge button press
  await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
    callbackQueryId,
    text: language === "ar" ? "تعديل المبلغ" : "Edit Amount",
  });

  // 2. Retrieve pending data
  const pending = await ctx.runQuery(
    api.pendingActions.getPendingByConfirmationId.getPendingByConfirmationId,
    { userId: user._id, confirmationId }
  );

  if (!pending) {
    // Handle expired confirmation
    const errorMessage = language === "ar"
      ? "⚠️ انتهت صلاحية التأكيد"
      : "⚠️ Confirmation expired";
    
    await ctx.runAction(api.telegram.sendMessage.sendMessage, {
      chatId,
      text: errorMessage,
    });
    return;
  }

  // 3. Implement your logic
  // ... (show edit interface, update state, etc.)

  logger.info({ 
    userId: user._id, 
    confirmationId 
  }, "Edit amount flow initiated");
  
  return;
}
```

**Handler Pattern:**
1. ✅ Extract data from callback_data
2. ✅ Acknowledge button press immediately
3. ✅ Validate/retrieve any required data
4. ✅ Handle error cases (expired, missing data, etc.)
5. ✅ Implement feature logic
6. ✅ Log important events
7. ✅ Return to exit handler

---

### Step 4: Handle Conversation State (if needed)

For multi-step flows (like editing), use `conversationStates` table:

```typescript
// Set conversation state
await ctx.runMutation(api.conversationStates.set.set, {
  userId: user._id,
  state: {
    type: "editing_expense_amount",
    confirmationId,
    currentAmount: pending.actionData.amount,
  },
  expiresAt: Date.now() + (5 * 60 * 1000), // 5 minutes
});

// In message handler, check for state:
const conversationState = await ctx.runQuery(
  api.conversationStates.get.get,
  { userId: user._id }
);

if (conversationState?.state.type === "editing_expense_amount") {
  // Handle the user's response
  const newAmount = parseFloat(message.text);
  
  // Update pending expense
  await ctx.runMutation(api.pendingActions.updatePending.updatePending, {
    id: conversationState.state.confirmationId,
    actionData: {
      ...pending.actionData,
      amount: newAmount,
    },
  });
  
  // Clear state
  await ctx.runMutation(api.conversationStates.clear.clear, {
    userId: user._id,
  });
  
  // Show updated confirmation
  // ...
}
```

---

## Testing & Validation

### Unit Tests

**File:** `tests/unit/callback-handlers.test.ts`

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Edit Expense Amount Handler", () => {
  it("should extract confirmationId from callback data", () => {
    const data = "edit_expense_amount_12345";
    const confirmationId = data.replace("edit_expense_amount_", "");
    expect(confirmationId).toBe("12345");
  });

  it("should handle expired confirmations gracefully", async () => {
    // Mock expired confirmation
    const mockCtx = {
      runQuery: vi.fn().mockResolvedValue(null),
      runAction: vi.fn(),
    };

    // Test handler
    // ... your test logic
  });
});
```

### Integration Tests

**File:** `tests/e2e/expense-editing.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test("Edit expense amount flow", async ({ page }) => {
  // 1. Send expense
  await sendTelegramMessage(page, "جبت شامبو ب 50");
  
  // 2. Wait for confirmation
  await expect(page.locator("text=هل هذا صحيح؟")).toBeVisible();
  
  // 3. Click edit button
  await page.click("text=تعديل");
  
  // 4. Click edit amount
  await page.click("text=المبلغ");
  
  // 5. Verify response
  await expect(page.locator("text=تعديل المبلغ")).toBeVisible();
});
```

### Manual Testing Checklist

Before merging:

- [ ] **Happy Path:** Feature works end-to-end
- [ ] **Callbacks:** All buttons respond correctly
- [ ] **Errors:** Expired confirmations handled
- [ ] **Edge Cases:** Invalid input handled
- [ ] **Bilingual:** Works in both Arabic and English
- [ ] **Logs:** Important events are logged

---

## Common Pitfalls

### ❌ Pitfall #1: Forgetting to Update Feature Registry

**Symptom:** AI says feature is "under development"

**Fix:**
```typescript
// convex/ai/prompts.ts
expenses: {
  edit: { 
    available: true,  // ← Don't forget this!
    since: "3.2",
    storyId: "3.2",
    description: "Edit expense details"
  },
}
```

---

### ❌ Pitfall #2: Callback Pattern Mismatch

**Symptom:** Button appears but does nothing when clicked

**Problem:**
```typescript
// constants.ts
EDIT_AMOUNT_PREFIX: "edit_amount_",

// keyboard.ts
callback_data: "edit_expense_amount_123"  // ← Doesn't match!

// webhook.ts
if (data.startsWith("edit_amount_")) { ... }  // ← Never matches!
```

**Fix:** Use consistent naming everywhere:
```typescript
// constants.ts
EDIT_EXPENSE_AMOUNT_PREFIX: "edit_expense_amount_",

// keyboard.ts
callback_data: `edit_expense_amount_${id}`

// webhook.ts
if (data.startsWith(CALLBACK_PATTERNS.EDIT_EXPENSE_AMOUNT_PREFIX)) { ... }
```

---

### ❌ Pitfall #3: Not Acknowledging Callback Queries

**Symptom:** Telegram shows loading spinner forever

**Fix:** Always call `answerCallbackQuery`:
```typescript
await ctx.runAction(api.telegram.sendMessage.answerCallbackQuery, {
  callbackQueryId,
  text: "Processing...",  // ← Shows brief toast notification
});
```

---

### ❌ Pitfall #4: Missing Error Handling

**Symptom:** User sees generic error or no response

**Fix:** Handle edge cases:
```typescript
// Check if confirmation expired
if (!pending) {
  const errorMessage = language === "ar"
    ? "⚠️ انتهت صلاحية التأكيد. يرجى إرسال المصروف مرة أخرى."
    : "⚠️ Confirmation expired. Please send the expense again.";
  
  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: errorMessage,
  });
  return;
}

// Check if account exists
if (!account) {
  const errorMessage = language === "ar"
    ? "⚠️ الحساب غير موجود"
    : "⚠️ Account not found";
  
  await ctx.runAction(api.telegram.sendMessage.sendMessage, {
    chatId,
    text: errorMessage,
  });
  return;
}
```

---

## Troubleshooting

### Issue: AI doesn't recognize new feature

**Check:**
1. ✅ Feature in `FEATURE_REGISTRY` with `available: true`
2. ✅ Intent keywords added to AI prompt
3. ✅ Examples provided in prompt
4. ✅ Deployed to production environment

**Debug:**
```typescript
// Check logs for AI response
logger.info({ intent, confidence, entities }, "AI parsed intent");

// If confidence < 0.85, add more examples or keywords
```

---

### Issue: Callback button doesn't work

**Check:**
1. ✅ Pattern defined in `constants.ts`
2. ✅ Handler exists in `webhook.ts`
3. ✅ Pattern names match exactly
4. ✅ `answerCallbackQuery` called
5. ✅ Handler returns (doesn't hang)

**Debug:**
```typescript
// Add logging at start of handler
logger.info({ data, pattern }, "Callback received");

// Check if handler is reached
logger.info({ confirmationId }, "Handler executed");
```

---

### Issue: Tests fail before commit

**Pre-Commit Hook Error:**
```
❌ AI Prompt validation failed!
Make sure FEATURE_REGISTRY is updated in convex/ai/prompts.ts
```

**Fix:**
1. Update `FEATURE_REGISTRY` in `convex/ai/prompts.ts`
2. Set `available: true` for your feature
3. Run `npm run test:prompts` locally
4. Commit again

---

## Quick Reference

### File Locations

| File | Purpose |
|------|---------|
| `convex/ai/prompts.ts` | Feature registry (single source of truth) |
| `convex/ai/nlParser.ts` | Account intent parsing |
| `convex/ai/parseExpenseIntent.ts` | Expense intent parsing |
| `convex/lib/constants.ts` | Callback pattern definitions |
| `convex/telegram/webhook.ts` | Callback handler implementations |
| `convex/lib/keyboards.ts` | Inline keyboard builders |
| `convex/conversationStates/` | Conversation state management |

### Common Commands

```bash
# Run prompt validation tests
npm run test:prompts

# Run callback validation tests
npm run test:callbacks

# Run all tests
npm test

# Deploy to dev
npx convex dev

# Deploy to production
npx convex deploy -y

# View logs
npx convex logs --history 50
```

---

## Related Documents

- **ADR-004:** AI Prompt & Callback Management (architectural decision)
- **Story Template:** `docs/stories/TEMPLATE.md` (includes AI checklist)
- **Testing Guide:** `docs/TESTING.md` (E2E testing strategies)

---

## Support

**Questions?** Ask in #dev-team channel  
**Found a bug?** Create issue with `bug` label  
**Improving this guide?** Submit PR to `docs/DEVELOPER-GUIDE-AI-INTEGRATION.md`

---

**Last Updated:** 2025-10-18  
**Version:** 1.0  
**Maintainer:** Development Team
