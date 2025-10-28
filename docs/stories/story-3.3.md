# Story 3.3: Transaction Counterparty Tracking

Status: Draft - Requires Product Approval

## Story

As a registered user reviewing my finances,
I want each expense or income transaction to store and display who money came from or went to,
so that I can quickly answer questions like "ما كل الفلوس اللي بعتها للصيدلية X؟" without guessing from free-form descriptions.

## Acceptance Criteria

1. **AC1: Counterparty Persistence**
   - Transactions saved through expense or income flows include optional fields `peerName` (text) and `peerDirection` ("from" | "to").
   - Existing transactions remain valid without requiring backfill.
2. **AC2: AI Extraction (Arabic & English)**
   - RORK `/text/llm/` parsing in `convex/ai/parseExpenseIntent.ts` and `convex/ai/parseIncomeIntent.ts` extracts counterparties from phrases like "دفعت 50 للصيدلية" or "received 200 from Ahmed" and returns `peerName` + direction with ≥80% confidence.
   - If counterparty is unclear, flow requests the user to clarify before confirmation.
3. **AC3: Confirmation & Logging Display**
   - Confirmation messages and success responses for expense/income show "من {peerName}" or "إلى {peerName}" when provided.
   - History queries render the same information so users see counterparties in transaction lists.
4. **AC4: Indexed Search by Counterparty**
   - Provide a Convex query (e.g., `transactions.findByPeer`) that filters by `userId`, `peerName`, optional `peerDirection` and returns results ordered by date.
   - Query is indexed and returns within existing performance envelope (<200ms for standard workloads).
5. **AC5: Test Coverage & Backward Compatibility**
   - Add unit/integration tests covering AI extraction, mutation persistence, history rendering, and counterparty filtering.
   - Existing tests for Story 3.1/3.2 continue to pass without modification.

## Tasks / Subtasks

- **Task 1: Schema & Index Update** (AC1, AC4)
  - [ ] Add optional `peerName` and `peerDirection` to `transactions` table in `convex/schema.ts` with new indexes (`by_user_peerName`, `by_user_peerDir`).
  - [ ] Regenerate Convex types if needed (`npx convex dev`).

- **Task 2: Mutation & Command Wiring** (AC1, AC3)
  - [ ] Update `convex/transactions/createExpense.ts` and `createIncome.ts` to accept/persist counterparties.
  - [ ] Thread `peerName` through `logExpenseCommand.ts` and `logIncomeCommand.ts`, including pending actions and success responses.

- **Task 3: AI Prompt & Parser Enhancements** (AC2)
  - [ ] Extend prompts in `convex/ai/nlParser.ts` plus `parseExpenseIntent.ts` / `parseIncomeIntent.ts` to instruct RORK `/text/llm/` to capture counterparty direction.
  - [ ] Add examples in Arabic/English and update Zod schemas to include `peerName`/`peerDirection`.
  - [ ] Implement fallback validation that asks user to clarify when counterparty missing but implied.

- **Task 4: UI/Message Rendering & Queries** (AC3, AC4)
  - [ ] Update confirmation builders in `convex/lib/responseHelpers.ts` (and related helpers) to show "من/إلى" when fields exist.
  - [ ] Implement `convex/transactions/findByPeer.ts` query leveraging new index and ensure history command uses it when filtering.

- **Task 5: Testing & Verification** (AC5)
  - [ ] Add parser unit tests (Arabic/English cases with counterparties).
  - [ ] Add integration tests for logging flows ensuring counterparties persist and render.
  - [ ] Add tests for counterparty query filtering and performance expectations.

## Open Questions

1. Should counterparty fields eventually become required for all transactions, or remain optional for cases like "رسوم بنكية"؟
2. Do we need UI affordances to edit a counterparty after saving a transaction?
3. Are there privacy constraints around displaying counterparties in shared contexts (e.g., shared account dashboards)?

---

**Approvals Needed:** Product/PO to approve scope and ACs before implementation begins.
