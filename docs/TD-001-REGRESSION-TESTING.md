# TD-001 Regression Testing Guide

**Purpose:** Ensure all callback handlers work correctly after refactoring to registry pattern  
**Before Testing:** Deploy to dev environment  
**Estimated Time:** 30-45 minutes

---

## Pre-Testing Checklist

- [ ] Run `npm install` to install new dependencies
- [ ] Run `npm run prepare` to initialize husky hooks
- [ ] Run `npm run test:validation` - should PASS
- [ ] Run `tsc` or `npm run build` - should compile without errors
- [ ] Deploy to dev environment with `npm run dev`
- [ ] Have Telegram app ready for testing

---

## 1. Language Selection (Story 1.3)

### Test Case 1.1: Language Selection Callback
**Pattern:** `lang_`

**Steps:**
1. Send `/start` command
2. Press "English 🇬🇧" button
3. Verify: Success message in English
4. Send `/start` again
5. Press "العربية 🇸🇦" button
6. Verify: Success message in Arabic

**Expected Result:** ✅ Language changes successfully, confirmation messages appear

---

## 2. Account Creation (Story 2.1)

### Test Case 2.1: Confirm Account Creation
**Pattern:** `confirm_account_`

**Steps:**
1. Send: "Create cash account with 500 EGP"
2. Verify: Confirmation message appears with details
3. Press "تأكيد ✅" button
4. Verify: Account created successfully
5. Verify: Accounts overview displayed

**Expected Result:** ✅ Account created, success message shown

### Test Case 2.2: Cancel Account Creation
**Pattern:** `cancel_account_`

**Steps:**
1. Send: "Create bank account with 1000 EGP"
2. Press "إلغاء ❌" button
3. Verify: Cancellation message appears

**Expected Result:** ✅ Account creation cancelled

### Test Case 2.3: Account Type Selection
**Pattern:** `create_account_type_`

**Steps:**
1. Send: "Create account" (no type specified)
2. Verify: Clarification message with account type buttons
3. Press "Bank 🏦" button
4. Verify: Initial balance prompt appears

**Expected Result:** ✅ Clarification flow works

### Test Case 2.4: Set Default Account Prompt
**Patterns:** `set_default_yes_`, `set_default_no_`

**Steps:**
1. Create second account (if needed)
2. Verify: "Set as default?" prompt appears
3. Press "نعم" button
4. Verify: Account set as default

**Expected Result:** ✅ Default account set successfully

---

## 3. Account Overview UI Actions (Story 2.2)

### Test Case 3.1: Refresh Accounts
**Pattern:** `refresh_accounts`

**Steps:**
1. Send: "Show my accounts"
2. Press "Refresh 🔄" button
3. Verify: Accounts list updates

**Expected Result:** ✅ List refreshes without errors

### Test Case 3.2: Create Account Button
**Pattern:** `create_account`

**Steps:**
1. View accounts overview
2. Press "Create Account ➕" button
3. Verify: Instructions message appears

**Expected Result:** ✅ Instructions displayed

### Test Case 3.3: Edit Account Select
**Pattern:** `edit_account_select`

**Steps:**
1. View accounts overview
2. Press "Edit Account ✏️" button
3. Verify: Account selection list appears OR edit menu if single account

**Expected Result:** ✅ Edit flow starts

### Test Case 3.4: Delete Account Select
**Pattern:** `delete_account_select`

**Steps:**
1. View accounts overview
2. Press "Delete Account 🗑️" button
3. Verify: Account selection list appears OR confirmation if single account

**Expected Result:** ✅ Delete flow starts

---

## 4. Account Editing (Story 2.3)

### Test Case 4.1: Select Account for Edit
**Pattern:** `select_account_edit_`

**Steps:**
1. Trigger edit flow with multiple accounts
2. Select an account from list
3. Verify: Edit options menu appears (Edit Name, Edit Type, Cancel)

**Expected Result:** ✅ Edit menu displayed

### Test Case 4.2: Edit Account Name
**Patterns:** `edit_name_`, `confirm_name_`

**Steps:**
1. Select "Edit Name ✏️" from edit menu
2. Send new account name (e.g., "My Savings")
3. Verify: Confirmation prompt appears
4. Press "Confirm ✅" button
5. Verify: Account name updated, success message shown

**Expected Result:** ✅ Name updated successfully

### Test Case 4.3: Edit Account Type
**Patterns:** `edit_type_`, `select_type_`, `confirm_type_`

**Steps:**
1. Select "Edit Type 🔄" from edit menu
2. Verify: Type selection buttons appear
3. Select new type (e.g., "Digital Wallet 📱")
4. Verify: Confirmation prompt appears
5. Press "Confirm ✅" button
6. Verify: Account type updated

**Expected Result:** ✅ Type updated successfully

### Test Case 4.4: Cancel Edit
**Pattern:** `cancel_edit`

**Steps:**
1. Start edit flow
2. Press "Cancel ❌" button
3. Verify: Edit cancelled, confirmation message shown

**Expected Result:** ✅ Edit cancelled

---

## 5. Set Default Account (Story 2.4)

### Test Case 5.1: Select Account for Default
**Pattern:** `select_account_default_`

**Steps:**
1. Send: "Set default account"
2. Select an account from list
3. Verify: Confirmation prompt appears

**Expected Result:** ✅ Confirmation shown

### Test Case 5.2: Confirm Set Default
**Pattern:** `confirm_set_default_`

**Steps:**
1. Continue from 5.1
2. Press "Confirm ✅" button
3. Verify: Account set as default
4. Verify: Old default marked as non-default

**Expected Result:** ✅ Default account changed

### Test Case 5.3: Cancel Set Default
**Pattern:** `cancel_set_default`

**Steps:**
1. Start set default flow
2. Press "Cancel ❌" button
3. Verify: Operation cancelled

**Expected Result:** ✅ Operation cancelled

---

## 6. Account Deletion (Story 2.5)

### Test Case 6.1: Select Account for Deletion
**Pattern:** `select_account_delete_`

**Steps:**
1. Send: "Delete account"
2. Select a non-default account
3. Verify: Pre-deletion validation runs
4. Verify: Confirmation prompt with transaction count

**Expected Result:** ✅ Validation passes, confirmation shown

### Test Case 6.2: Confirm Delete
**Pattern:** `confirm_delete_`

**Steps:**
1. Continue from 6.1
2. Press "Confirm Delete 🗑️" button
3. Verify: Account soft-deleted
4. Verify: Success message with accounts overview

**Expected Result:** ✅ Account deleted (soft)

### Test Case 6.3: Cancel Delete
**Pattern:** `cancel_delete`

**Steps:**
1. Start delete flow
2. Press "Cancel ❌" button
3. Verify: Deletion cancelled

**Expected Result:** ✅ Deletion cancelled

### Test Case 6.4: Validation - Cannot Delete Default
**Steps:**
1. Try to delete default account
2. Verify: Error message appears
3. Verify: Delete operation blocked

**Expected Result:** ✅ Validation prevents deletion

### Test Case 6.5: Validation - Cannot Delete Last Account
**Steps:**
1. Try to delete when only 1 account exists
2. Verify: Error message appears

**Expected Result:** ✅ Validation prevents deletion

---

## 7. Expense Logging (Story 3.1)

### Test Case 7.1: Confirm Expense
**Pattern:** `confirm_expense_`

**Steps:**
1. Send: "Spent 50 EGP on food"
2. Verify: Confirmation message with details
3. Press "Confirm ✅" button
4. Verify: Expense logged, success message shown

**Expected Result:** ✅ Expense created

### Test Case 7.2: Cancel Expense
**Pattern:** `cancel_expense_`

**Steps:**
1. Send expense intent
2. Press "Cancel ❌" button
3. Verify: Expense logging cancelled

**Expected Result:** ✅ Expense cancelled

### Test Case 7.3: Select Account for Expense
**Pattern:** `select_account_expense_`

**Steps:**
1. Send expense without account specified
2. Verify: Account selection list appears
3. Select an account
4. Verify: Confirmation message updated with selected account

**Expected Result:** ✅ Account selected

### Test Case 7.4: Edit Expense Button
**Pattern:** `edit_expense_`

**Steps:**
1. View expense confirmation
2. Press "Edit ✏️" button
3. Verify: Edit options menu appears

**Expected Result:** ✅ Edit menu shown

### Test Case 7.5: Back to Confirmation
**Pattern:** `back_to_confirmation_`

**Steps:**
1. Open edit menu
2. Press "Back ⬅️" button
3. Verify: Returns to confirmation screen

**Expected Result:** ✅ Navigation works

---

## 8. Compile-Time Validation

### Test Case 8.1: TypeScript Compilation
**Steps:**
```bash
npm run build
```

**Expected Result:** ✅ No TypeScript errors

### Test Case 8.2: Pattern Coverage
**Steps:**
```bash
npm run test:callbacks
```

**Expected Result:** ✅ All tests pass
- All patterns have handlers
- No orphaned handlers
- Function signatures correct

---

## 9. Automated Test Suite

### Test Case 9.1: Callback Handler Tests
**Steps:**
```bash
npm run test:callbacks
```

**Expected Result:** ✅ All callback handler tests pass

### Test Case 9.2: AI Prompt Tests
**Steps:**
```bash
npm run test:prompts
```

**Expected Result:** ✅ All AI prompt tests pass

### Test Case 9.3: Full Validation Suite
**Steps:**
```bash
npm run test:validation
```

**Expected Result:** ✅ Both test suites pass

---

## 10. Pre-Commit Hook

### Test Case 10.1: Hook Prevents Bad Commits
**Steps:**
1. Comment out a handler in `callbackRegistry.ts`
2. Try to commit: `git commit -m "test"`
3. Verify: Pre-commit hook runs
4. Verify: Tests fail, commit blocked
5. Revert changes

**Expected Result:** ✅ Hook prevents commit with failing tests

---

## Critical Path Test (Quick Smoke Test)

**Time:** ~5 minutes  
**Purpose:** Quick verification that core flows work

1. ✅ Language Selection: Change language (both directions)
2. ✅ Create Account: Confirm account creation
3. ✅ View Accounts: Refresh accounts list
4. ✅ Edit Account: Edit account name
5. ✅ Log Expense: Confirm expense logging
6. ✅ Validation: Run `npm run test:validation`

If all 6 pass → **Ready for production**

---

## Regression Testing Results Template

```markdown
## TD-001 Regression Testing Results

**Date:** [Date]  
**Environment:** [Dev/Staging]  
**Tester:** [Name]  
**Duration:** [Time]

### Test Summary
- Total Test Cases: 35
- Passed: ___
- Failed: ___
- Skipped: ___

### Failed Tests
[List any failures with details]

### Critical Issues
[Any blocking issues]

### Notes
[Additional observations]

### Recommendation
- [ ] ✅ Ready for Production
- [ ] ⚠️ Minor Issues - Deploy with Monitoring
- [ ] ❌ Blocking Issues - Do Not Deploy
```

---

## Troubleshooting Common Issues

### Issue: "Handler not found" error
**Solution:** Check `CALLBACK_HANDLERS` registry, ensure pattern registered

### Issue: Button doesn't respond
**Solution:** Check console logs for callback data, verify pattern matches

### Issue: TypeScript errors
**Solution:** Run `npm run build`, fix type mismatches

### Issue: Tests fail after changes
**Solution:** Update `AVAILABLE_FEATURES` in ai-prompts.test.ts

---

## Post-Deployment Monitoring

**What to Monitor (First 24 hours):**
1. Error logs for "handler not found"
2. Callback query failures
3. User complaints about non-working buttons
4. AI prompt accuracy issues

**Where to Check:**
- Convex Dashboard → Logs
- Telegram Bot logs
- User feedback channels

**Success Criteria:**
- Zero "handler not found" errors
- Zero callback-related user complaints
- All callback buttons working
- No AI prompt synchronization issues

---

## Rollback Plan

If critical issues found:

1. **Immediate:** Revert webhook.ts to previous version
2. **Keep:** Registry files (for future attempts)
3. **Document:** What failed and why
4. **Plan:** Schedule fix and re-deployment

**Rollback Command:**
```bash
git revert HEAD
npm run build
# Deploy reverted version
```
