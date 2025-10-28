# TD-001 Quick Manual Test Guide

**Time Required:** 10-15 minutes  
**What We're Testing:** All callback handlers work after refactoring to registry pattern

---

## Pre-Test Setup

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```
   ✅ Wait for "Convex functions ready"

2. **Open Telegram** on your phone/desktop

---

## Critical Path Tests (Must Pass)

### 1️⃣ Language Selection (2 min)
**Handler:** `language.ts`

```
Action: Send /start
Click: "العربية 🇸🇦" button
✅ Expect: Confirmation message in Arabic

Action: Send /start again  
Click: "English 🇬🇧" button
✅ Expect: Confirmation message in English
```

---

### 2️⃣ Account Creation (3 min)
**Handler:** `account.ts` → `confirmAccount`

```
Action: Send "Create cash account with 500 EGP"
✅ Expect: Confirmation message appears
Click: "تأكيد ✅" button
✅ Expect: Account created, success message
```

---

### 3️⃣ View Accounts (2 min)
**Handler:** `ui.ts` → `refreshAccounts`

```
Action: Send "Show my accounts"
✅ Expect: Accounts list appears with buttons
Click: "Refresh 🔄" button
✅ Expect: List refreshes (no errors)
```

---

### 4️⃣ Log Expense (3 min)
**Handler:** `expense.ts` → `confirmExpense`

```
Action: Send "Spent 50 EGP on food"
✅ Expect: Confirmation message
Click: "Confirm ✅" button
✅ Expect: Expense logged, balance updated
```

---

### 5️⃣ Edit Account (Optional - 2 min)
**Handler:** `accountExtended.ts` → `selectAccountEdit`

```
Action: Send "Edit account"
Select: Any account from list
✅ Expect: Edit menu appears (Edit Name, Edit Type, Cancel)
Click: "Cancel ❌" button
✅ Expect: Edit cancelled
```

---

## Success Criteria

**PASS** = All 4 critical tests work ✅  
**PARTIAL** = 3/4 tests work (note which failed)  
**FAIL** = < 3 tests work (rollback needed)

---

## Quick Debug

If a button doesn't respond:
1. Check Convex logs in terminal
2. Look for "handler not found" errors
3. Check the callback data in logs

If you see errors, share:
- Which button was clicked
- Error message from Convex logs
- I'll fix it immediately

---

## After Testing

✅ **If All Pass:**
- TD-001 is **COMPLETE**
- Ready for production deployment
- Mark story as done

⚠️ **If Issues Found:**
- Share specific failing test
- I'll debug and fix
- Re-test affected callback

---

**Start with:** `npm run dev` and let me know when Convex is ready!
