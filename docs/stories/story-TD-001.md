# Story TD-001: AI Integration Systematic Improvements (ADR-004 Phases 2-3)

Status: Ready

## Story

As a **development team**,
I want **type-safe callback handler management and automated validation for AI integration**,
so that **we eliminate recurring bugs where callback buttons don't work and AI prompts become outdated, saving ~4-5 hours of debugging time per sprint**.

## Context

**Origin:** Post-Story 3.1 Review identified recurring pattern across Stories 1.1, 2.5, and 3.1 where:
1. AI prompts not updated → users told features are "under development" when they work
2. Callback handlers missing → buttons appear but don't work when clicked  
3. No validation catches issues until production

**ADR-004 Phase 1 (Complete):** Centralized feature registry (`convex/ai/prompts.ts`) solved prompt sync issues.

**This Story:** Implements Phases 2-3 to solve callback handler issues and add automated validation.

**References:**
- [Source: docs/decisions/ADR-004-ai-prompt-callback-management.md]
- [Source: docs/stories/story-3.1.md#Senior Developer Review]

## Acceptance Criteria

### Phase 2: Type-Safe Callback System (Critical Path)

**AC1:** Callback registry file created with type-safe handler mapping
- Create `convex/lib/callbackRegistry.ts` with `CALLBACK_HANDLERS` record
- All callback patterns from `constants.ts` registered with handlers
- TypeScript enforces handler existence at compile time
- No runtime lookups without type safety

**AC2:** Existing callback handlers extracted and organized
- Create `convex/lib/callbackHandlers/` directory structure:
  - `account.ts` - account management handlers (create, edit, delete, setDefault)
  - `expense.ts` - expense logging handlers (confirm, edit options, cancel)
  - `ui.ts` - UI action handlers (refresh, navigation)
- Each handler file exports typed handler functions
- Handlers accept `CallbackContext` and return `Promise<void>`

**AC3:** Webhook refactored to use callback registry
- `webhook.ts` imports `routeCallback()` from registry
- Callback routing logic simplified to single registry lookup
- Remove long if/else chains (currently ~150 lines)
- Maintain backward compatibility with all existing callbacks

**AC4:** TypeScript compile-time validation implemented
- Type assertions ensure pattern/handler parity
- Compiler errors if pattern lacks handler
- Compiler errors if handler lacks pattern
- Zero runtime surprises from missing handlers

### Phase 3: Automated Validation (Quality Assurance)

**AC5:** AI prompt validation tests created
- File: `tests/integration/ai-prompts.test.ts`
- Test: All available features included in system prompts
- Test: Unavailable features NOT marked as available
- Test: Planned features marked as "under development"
- Tests run in CI/CD pipeline

**AC6:** Callback handler validation tests created
- File: `tests/integration/callback-handlers.test.ts`
- Test: Every callback pattern has handler
- Test: No unused handlers exist
- Tests fail fast with clear error messages

**AC7:** Pre-commit hooks configured
- `.husky/pre-commit` runs prompt and callback tests
- Commits blocked if tests fail
- Clear error messages guide developers to fix
- Hook performance < 5 seconds

**AC8:** Story template updated with AI integration checklist
- Update `docs/stories/TEMPLATE.md` with new section
- Checklist includes: feature registry, system prompts, callback handlers, pre-deployment validation
- Template used for all future stories

### Documentation & Process

**AC9:** Implementation documented with examples
- Update ADR-004 with "Implemented" status for Phases 2-3
- Code examples showing how to add new feature with callbacks
- Clear instructions for future developers

**AC10:** Zero regression in existing functionality
- All existing callback buttons work after refactor
- All AI responses remain accurate
- No new bugs introduced during refactoring
- 100% backward compatibility maintained

## Tasks / Subtasks

### Phase 2: Type-Safe Callback System (AC: #1-4)

- [ ] **Task 1:** Create callback registry infrastructure (AC: #1)
  - [ ] 1.1: Create `convex/lib/callbackRegistry.ts` file
  - [ ] 1.2: Define `CallbackContext` type with all required fields
  - [ ] 1.3: Define `CallbackHandler` function signature
  - [ ] 1.4: Create `CALLBACK_HANDLERS` record (empty initially)
  - [ ] 1.5: Implement `routeCallback()` function with error handling

- [ ] **Task 2:** Extract account callback handlers (AC: #2)
  - [ ] 2.1: Create `convex/lib/callbackHandlers/account.ts`
  - [ ] 2.2: Extract `handleConfirmCreate` from webhook.ts
  - [ ] 2.3: Extract `handleConfirmEdit` from webhook.ts
  - [ ] 2.4: Extract `handleConfirmDelete` and `handleCancelDelete` from webhook.ts
  - [ ] 2.5: Extract `handleSetDefaultYes` and `handleSetDefaultNo` from webhook.ts
  - [ ] 2.6: Register all handlers in `CALLBACK_HANDLERS`

- [ ] **Task 3:** Extract expense callback handlers (AC: #2)
  - [ ] 3.1: Create `convex/lib/callbackHandlers/expense.ts`
  - [ ] 3.2: Extract `handleConfirmExpense` from webhook.ts
  - [ ] 3.3: Extract edit flow handlers (`handleEditExpense*`) from webhook.ts
  - [ ] 3.4: Extract `handleCancelExpense` from webhook.ts
  - [ ] 3.5: Extract `handleSelectAccountExpense` from webhook.ts
  - [ ] 3.6: Extract `handleBackToConfirmation` from webhook.ts
  - [ ] 3.7: Register all handlers in `CALLBACK_HANDLERS`

- [ ] **Task 4:** Extract UI action handlers (AC: #2)
  - [ ] 4.1: Create `convex/lib/callbackHandlers/ui.ts`
  - [ ] 4.2: Extract `handleRefreshAccounts` from webhook.ts
  - [ ] 4.3: Extract any navigation/menu handlers
  - [ ] 4.4: Register all handlers in `CALLBACK_HANDLERS`

- [ ] **Task 5:** Refactor webhook.ts to use registry (AC: #3)
  - [ ] 5.1: Import `routeCallback` and `CALLBACK_HANDLERS` in webhook.ts
  - [ ] 5.2: Replace callback routing logic with registry lookup
  - [ ] 5.3: Remove old if/else chains (~150 lines)
  - [ ] 5.4: Add error logging for unhandled callbacks
  - [ ] 5.5: Verify TypeScript compiles without errors

- [ ] **Task 6:** Implement compile-time validation (AC: #4)
  - [ ] 6.1: Import `CALLBACK_PATTERNS` from constants.ts
  - [ ] 6.2: Create type aliases for pattern and handler keys
  - [ ] 6.3: Add `MissingHandlers` type assertion
  - [ ] 6.4: Add `UnusedHandlers` type assertion
  - [ ] 6.5: Verify TypeScript errors on missing handlers

### Phase 3: Automated Validation (AC: #5-8)

- [ ] **Task 7:** Create AI prompt validation tests (AC: #5)
  - [ ] 7.1: Create `tests/integration/ai-prompts.test.ts`
  - [ ] 7.2: Test available features included in prompts
  - [ ] 7.3: Test unavailable features NOT marked available
  - [ ] 7.4: Test planned features in "under development" section
  - [ ] 7.5: Add tests to CI/CD pipeline

- [ ] **Task 8:** Create callback handler validation tests (AC: #6)
  - [ ] 8.1: Create `tests/integration/callback-handlers.test.ts`
  - [ ] 8.2: Test every pattern has handler
  - [ ] 8.3: Test no unused handlers
  - [ ] 8.4: Test handler function signatures
  - [ ] 8.5: Add tests to CI/CD pipeline

- [ ] **Task 9:** Configure pre-commit hooks (AC: #7)
  - [ ] 9.1: Update `.husky/pre-commit` script
  - [ ] 9.2: Add `npm run test:prompts` command
  - [ ] 9.3: Add `npm run test:callbacks` command
  - [ ] 9.4: Test hook blocks commit on failure
  - [ ] 9.5: Optimize hook performance (< 5 sec)

- [ ] **Task 10:** Update story template (AC: #8)
  - [ ] 10.1: Add "AI Integration Checklist" section to TEMPLATE.md
  - [ ] 10.2: Include feature registry checklist items
  - [ ] 10.3: Include callback handler checklist items
  - [ ] 10.4: Include pre-deployment validation steps

- [ ] **Task 11:** Documentation and examples (AC: #9)
  - [ ] 11.1: Update ADR-004 status to "Phases 2-3 Implemented"
  - [ ] 11.2: Add code examples for adding new feature with callbacks
  - [ ] 11.3: Document callback registry patterns
  - [ ] 11.4: Create quick reference guide

- [ ] **Task 12:** Regression testing (AC: #10)
  - [ ] 12.1: Test all account management callbacks work
  - [ ] 12.2: Test all expense logging callbacks work
  - [ ] 12.3: Test UI action callbacks work
  - [ ] 12.4: Verify AI prompt accuracy unchanged
  - [ ] 12.5: Full E2E testing in dev environment

## Dev Notes

### Architecture Patterns

**Callback Registry Pattern:**
- Centralized handler mapping eliminates scattered logic
- Type safety prevents runtime "handler not found" errors
- Compile-time validation catches missing implementations
- Clear separation: constants → registry → handlers → webhook

**Handler Organization:**
```
convex/lib/
├── callbackRegistry.ts       # Central registry + routing
├── callbackHandlers/
│   ├── account.ts            # Account management
│   ├── expense.ts            # Expense logging  
│   ├── income.ts             # Income logging (future)
│   └── ui.ts                 # UI actions
└── constants.ts              # Patterns only (no logic)
```

**Type Safety Enforcement:**
```typescript
// Compile error if pattern has no handler
type MissingHandlers = Exclude<PatternKeys, HandlerKeys>;
const _check: MissingHandlers = never; // ← TypeScript fails here
```

### Testing Strategy

**Integration Tests:**
- Validate feature registry consistency
- Validate callback handler completeness
- Run as part of CI/CD pipeline
- Fast execution (< 2 seconds)

**Pre-Commit Hooks:**
- Block commits with validation failures
- Provide actionable error messages
- Lightweight checks (< 5 seconds)

### Refactoring Approach

**Phase 2 Sequence:**
1. Create registry infrastructure (empty)
2. Extract handlers one category at a time (account → expense → ui)
3. Register each handler immediately after extraction
4. Test each category before moving to next
5. Refactor webhook.ts only after all handlers extracted
6. Add compile-time validation last

**Risk Mitigation:**
- Keep old webhook.ts code commented during refactor
- Deploy to dev environment after each task
- Full E2E test before production deployment
- Rollback plan: revert to pre-refactor commit

### Performance Considerations

- Registry lookup is O(1) (hash map)
- Faster than long if/else chains
- No performance degradation expected
- Pre-commit hooks optimized (run only changed tests)

### Compatibility Notes

**Backward Compatibility:**
- All existing callback patterns remain unchanged
- Handler behavior identical to original implementation
- Zero breaking changes to user experience
- Refactoring is purely internal improvement

**Future Extensibility:**
- Easy to add new callback categories
- Clear pattern for new features
- Self-documenting through registry
- Scales to 100+ callback patterns

### Code Quality Standards

- 100% TypeScript type coverage
- All handlers have JSDoc comments
- Error messages include actionable guidance
- Logging for debugging (structured with pino)

### Project Structure Notes

**Files Created:**
- `convex/lib/callbackRegistry.ts` (150 lines)
- `convex/lib/callbackHandlers/account.ts` (200 lines)
- `convex/lib/callbackHandlers/expense.ts` (250 lines)
- `convex/lib/callbackHandlers/ui.ts` (50 lines)
- `tests/integration/ai-prompts.test.ts` (100 lines)
- `tests/integration/callback-handlers.test.ts` (80 lines)

**Files Modified:**
- `convex/telegram/webhook.ts` (remove ~150 lines, add ~20 lines)
- `.husky/pre-commit` (add test commands)
- `docs/stories/TEMPLATE.md` (add checklist section)
- `docs/decisions/ADR-004-ai-prompt-callback-management.md` (update status)

**Total Code:**
- ~830 lines new code
- ~130 lines removed code
- Net: +700 lines

### Estimated Effort

**Phase 2:** 2-3 hours
- Task 1-2: 45 min
- Task 3-4: 45 min
- Task 5: 30 min
- Task 6: 30 min

**Phase 3:** 3-4 hours
- Task 7-8: 2 hours (writing tests)
- Task 9: 30 min (hooks)
- Task 10-11: 1.5 hours (docs)
- Task 12: 1 hour (testing)

**Total:** 5-7 hours

### Success Metrics

**Before This Story:**
- ~4-5 hours debugging time per sprint on callback/prompt issues
- Manual validation before each deployment
- Bugs discovered in production

**After This Story:**
- Zero callback handler bugs (caught at compile time)
- Zero AI prompt sync bugs (caught by tests)
- Automated validation (< 5 sec per commit)
- 4-5 hours saved per sprint (~20 hours/month)

### References

- [Source: docs/decisions/ADR-004-ai-prompt-callback-management.md#Phase 2]
- [Source: docs/decisions/ADR-004-ai-prompt-callback-management.md#Phase 3]
- [Source: docs/stories/story-3.1.md#Senior Developer Review - Action Items]
- [Source: docs/stories/story-1.1.md#Completion Notes - Pattern established]
- [Source: docs/stories/story-2.5.md#Completion Notes - Callback pattern used]

## Dev Agent Record

### Context Reference

- `docs/stories/story-context-TD-001.xml` - Generated 2025-10-18

### Agent Model Used

<!-- Will be recorded during implementation -->

### Debug Log References

<!-- Will be added during implementation -->

### Completion Notes List

<!-- Will be added during implementation -->

### File List

<!-- Will be added during implementation -->
