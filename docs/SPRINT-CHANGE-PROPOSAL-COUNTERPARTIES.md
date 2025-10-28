# Sprint Change Proposal: Transaction Counterparty Tracking

**Date:** 2025-10-18  
**Submitted By:** Scrum Master (Bob)  
**Change Scope:** Minor (Direct Adjustment)  
**Affected Epic:** Epic 3 - AI Transaction Logging

---

## 1. Issue Summary

### Problem Statement
The current transaction system (`transactions` table in `convex/schema.ts`) does not capture who money was received from or sent to. Users cannot answer questions like "ما كل الفلوس اللي بعتها للصيدلية X؟" without manually parsing free-form descriptions.

### Discovery Context
- **Triggering Story:** Story 3.2 (AI Income Logging) during post-deployment testing
- **User Feedback:** "لو قولت خدت فلوس من ابويا 1000 جنيه مش هيبقي مكتوب من - الي؟"
- **Issue Type:** New requirement emerged from user testing

### Evidence
- Transaction history shows only generic descriptions without structured counterparty data
- Search/filter operations cannot target specific payers or recipients
- Users must rely on memory or manual note-taking to track money flow between parties

---

## 2. Impact Analysis

### Epic Impact
- **Epic 3 (Current):** Requires Story 3.3 addition. Stories 3.1 and 3.2 remain unchanged.
- **Future Epics:** No blocking impact. May enhance Epic 5 (Reports & Analytics) when implemented.

### Story Impact
- **Story 3.1 (Expense Logging):** No changes required; will benefit from counterparty fields when available
- **Story 3.2 (Income Logging):** No changes required; will benefit from counterparty fields when available
- **Story 3.3 (NEW):** Required to implement counterparty tracking

### Artifact Conflicts

#### Data Model (`convex/schema.ts`)
- **Current State:** `transactions` table has no counterparty fields
- **Required Change:** Add optional `peerName: v.optional(v.string())` and `peerDirection: v.optional(v.union(v.literal("from"), v.literal("to")))`
- **Impact:** Additive only; existing records remain valid

#### Architecture (`docs/tech-spec-epic-3.md`)
- **Data Model Section:** Document new fields and indexes
- **AI Parsing Section:** Document extraction of counterparties from NL input
- **Query Section:** Document new `findByPeer` query capability

#### PRD (`docs/PRD.md`)
- **FR3 - Transaction Logging:** Add counterparty tracking as optional enhancement
- **MVP Scope:** No change—counterparties are non-blocking enhancement

#### Mutations & Commands
- `convex/transactions/createExpense.ts`: Accept optional `peerName`
- `convex/transactions/createIncome.ts`: Accept optional `peerName`
- `convex/commands/logExpenseCommand.ts`: Thread counterparties through flow
- `convex/commands/logIncomeCommand.ts`: Thread counterparties through flow

#### AI Parsing & Prompts
- `convex/ai/nlParser.ts`: Add counterparty extraction examples
- `convex/ai/parseExpenseIntent.ts`: Extract `peerName` and `peerDirection`
- `convex/ai/parseIncomeIntent.ts`: Extract `peerName` and `peerDirection`
- Prompt patterns:
  - Arabic: "دفعت 50 للصيدلية" → `{peerName: "الصيدلية", peerDirection: "to"}`
  - English: "received 200 from Ahmed" → `{peerName: "Ahmed", peerDirection: "from"}`

#### UI/Telegram Messages
- `convex/lib/responseHelpers.ts`: Render "من {peerName}" or "إلى {peerName}" in confirmations and history
- Confirmation messages: Display counterparty when present
- Success messages: Include counterparty in transaction summary
- History queries: Show counterparties in transaction lists

### Technical Impact
- **Database:** Two optional fields + two indexes (negligible storage/performance impact)
- **Code Changes:** ~8 files across parsers, mutations, commands, and UI helpers
- **API:** No breaking changes; all additions are backward compatible
- **Deployment:** Standard Convex deployment; no migration scripts needed

---

## 3. Recommended Approach

### Selected Path: **Direct Adjustment (Option 1)**

Add Story 3.3 within Epic 3 structure with additive schema changes and parser enhancements.

### Rationale
- **Effort:** Low-Medium (1-2 days of development)
- **Risk:** Low (optional fields, backward compatible, no data migration)
- **Timeline Impact:** None—fits within current sprint capacity
- **Team Impact:** Positive—clean enhancement without disruption
- **Business Value:** High—enables powerful search and clearer transaction history

### Alternatives Considered
- **Option 2 (Rollback):** Not viable—no need to revert Stories 3.1/3.2
- **Option 3 (MVP Review):** Not necessary—this is an enhancement, not a blocker

### Effort Estimate
- Schema updates: 0.5 day
- Parser enhancements: 1 day
- Mutation/command wiring: 0.5 day
- UI/message updates: 0.5 day
- Testing: 0.5 day
- **Total: 3 days**

### Risk Assessment
- **Technical Risk:** Low (additive changes only)
- **Data Risk:** None (optional fields, no migration)
- **User Impact Risk:** None (pure enhancement)
- **Performance Risk:** Low (indexed queries, minimal overhead)

---

## 4. Detailed Change Proposals

### Change 1: Data Model (`convex/schema.ts`)

**Section:** Transactions Table Definition

**BEFORE:**
```typescript
transactions: defineTable({
  userId: v.id("users"),
  accountId: v.id("accounts"),
  type: v.union(v.literal("expense"), v.literal("income")),
  amount: v.number(),
  category: v.string(),
  description: v.optional(v.string()),
  date: v.number(),
  isDeleted: v.boolean(),
  deletedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_date", ["userId", "date"])
  .index("by_account", ["accountId"])
  .index("by_user_category", ["userId", "category"])
  .index("by_user_type", ["userId", "type"]),
```

**AFTER:**
```typescript
transactions: defineTable({
  userId: v.id("users"),
  accountId: v.id("accounts"),
  type: v.union(v.literal("expense"), v.literal("income")),
  amount: v.number(),
  category: v.string(),
  description: v.optional(v.string()),
  date: v.number(),
  peerName: v.optional(v.string()), // NEW: Counterparty name
  peerDirection: v.optional(v.union(v.literal("from"), v.literal("to"))), // NEW: Direction
  isDeleted: v.boolean(),
  deletedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_date", ["userId", "date"])
  .index("by_account", ["accountId"])
  .index("by_user_category", ["userId", "category"])
  .index("by_user_type", ["userId", "type"])
  .index("by_user_peerName", ["userId", "peerName"]) // NEW
  .index("by_user_peerDir", ["userId", "peerName", "peerDirection"]), // NEW
```

**Justification:** Optional fields preserve backward compatibility while enabling counterparty tracking. Indexes support fast filtering by counterparty.

---

### Change 2: Expense Mutation (`convex/transactions/createExpense.ts`)

**Section:** Args Schema

**BEFORE:**
```typescript
args: {
  userId: v.id("users"),
  accountId: v.id("accounts"),
  amount: v.number(),
  category: v.string(),
  description: v.optional(v.string()),
  date: v.number(),
},
```

**AFTER:**
```typescript
args: {
  userId: v.id("users"),
  accountId: v.id("accounts"),
  amount: v.number(),
  category: v.string(),
  description: v.optional(v.string()),
  date: v.number(),
  peerName: v.optional(v.string()), // NEW
},
```

**Section:** Transaction Insert

**BEFORE:**
```typescript
const transactionId = await ctx.db.insert("transactions", {
  userId: args.userId,
  accountId: args.accountId,
  type: "expense",
  amount: validatedAmount,
  category: args.category,
  description: args.description,
  date: args.date,
  isDeleted: false,
  createdAt: Date.now(),
});
```

**AFTER:**
```typescript
const transactionId = await ctx.db.insert("transactions", {
  userId: args.userId,
  accountId: args.accountId,
  type: "expense",
  amount: validatedAmount,
  category: args.category,
  description: args.description,
  date: args.date,
  peerName: args.peerName, // NEW
  peerDirection: args.peerName ? "to" : undefined, // NEW: "to" for expenses
  isDeleted: false,
  createdAt: Date.now(),
});
```

**Justification:** Thread counterparty through mutation; set direction="to" for expenses.

---

### Change 3: Income Mutation (`convex/transactions/createIncome.ts`)

**Section:** Args Schema & Transaction Insert (similar to Change 2)

**Key Difference:**
```typescript
peerDirection: args.peerName ? "from" : undefined, // "from" for income
```

**Justification:** Income counterparties use direction="from" semantics.

---

### Change 4: AI Parser Prompts (`convex/ai/nlParser.ts`, `parseExpenseIntent.ts`, `parseIncomeIntent.ts`)

**Section:** System Prompt / Examples

**BEFORE (parseExpenseIntent.ts):**
```
Extract: amount, category, description, date
Examples:
- "دفعت 50 على قهوة" → {amount: 50, category: "food", description: "قهوة"}
```

**AFTER:**
```
Extract: amount, category, description, date, peerName, peerDirection
Examples:
- "دفعت 50 للصيدلية" → {amount: 50, category: "health", description: "صيدلية", peerName: "الصيدلية", peerDirection: "to"}
- "sent 100 to Ahmed" → {amount: 100, category: "other", description: "Ahmed", peerName: "Ahmed", peerDirection: "to"}
```

**Justification:** Train AI to extract counterparties from "من/إلى" or "from/to" patterns.

---

### Change 5: Confirmation & History Rendering (`convex/lib/responseHelpers.ts`)

**Section:** Transaction Display Functions

**BEFORE:**
```typescript
const message = `💸 ${amount} ${currency} - ${category}\n📝 ${description}`;
```

**AFTER:**
```typescript
let message = `💸 ${amount} ${currency} - ${category}\n📝 ${description}`;
if (peerName && peerDirection === "to") {
  message += `\n📤 إلى: ${peerName}`;
} else if (peerName && peerDirection === "from") {
  message += `\n📥 من: ${peerName}`;
}
```

**Justification:** Show counterparty in confirmation and history when present.

---

### Change 6: New Query (`convex/transactions/findByPeer.ts`)

**NEW FILE:**
```typescript
export const findByPeer = query({
  args: {
    userId: v.id("users"),
    peerName: v.string(),
    peerDirection: v.optional(v.union(v.literal("from"), v.literal("to"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("transactions")
      .withIndex("by_user_peerDir", (q) =>
        q.eq("userId", args.userId).eq("peerName", args.peerName)
      );
    
    if (args.peerDirection) {
      query = query.filter((q) => q.eq(q.field("peerDirection"), args.peerDirection));
    }
    
    const results = await query.collect();
    
    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      return results.filter((tx) => {
        if (args.startDate && tx.date < args.startDate) return false;
        if (args.endDate && tx.date > args.endDate) return false;
        return true;
      });
    }
    
    return results;
  },
});
```

**Justification:** Enable fast counterparty-based filtering for history queries.

---

### Change 7: Tech Spec Documentation (`docs/tech-spec-epic-3.md`)

**Section:** Data Model

**Add:**
```markdown
### Counterparty Tracking (Story 3.3)

Transactions optionally store counterparty information:
- `peerName`: Name of the person/entity (e.g., "الصيدلية", "بابا", "Ahmed")
- `peerDirection`: Direction of money flow ("from" for income, "to" for expenses)

Indexes:
- `by_user_peerName`: Fast lookup by userId + peerName
- `by_user_peerDir`: Fast lookup by userId + peerName + direction

**Use Cases:**
- "Show all money I sent to pharmacy X"
- "Show all income from Dad"
- Enhanced transaction history display with "من/إلى" labels
```

**Section:** AI Parsing

**Add:**
```markdown
### Counterparty Extraction

RORK `/text/llm/` parsers extract counterparties from natural language:

**Arabic Patterns:**
- "دفعت 50 للصيدلية" → peerName="الصيدلية", direction="to"
- "استلمت 1000 من بابا" → peerName="بابا", direction="from"

**English Patterns:**
- "sent 200 to Carrefour" → peerName="Carrefour", direction="to"
- "received 500 from Ahmed" → peerName="Ahmed", direction="from"

**Confidence Threshold:** 80% (same as other entity extraction)
```

---

### Change 8: PRD Update (`docs/PRD.md`)

**Section:** FR3 - Transaction Logging

**BEFORE:**
```markdown
Users can log expenses and income using natural language in Arabic or English.
```

**AFTER:**
```markdown
Users can log expenses and income using natural language in Arabic or English, optionally specifying counterparties (e.g., "من بابا" or "إلى الصيدلية") for clearer transaction history and advanced filtering capabilities.
```

---

## 5. Implementation Handoff

### Change Scope Classification
**Minor** - Direct implementation by development team within current sprint.

### Handoff Recipients
- **Primary:** Development Team (Implementation)
- **Secondary:** QA Team (Testing)
- **Notify:** Product Owner (Feature enhancement awareness)

### Development Tasks
1. Update `convex/schema.ts` with new fields and indexes
2. Extend `createExpense.ts` and `createIncome.ts` mutations
3. Update AI parsers (`nlParser.ts`, `parseExpenseIntent.ts`, `parseIncomeIntent.ts`)
4. Thread counterparties through `logExpenseCommand.ts` and `logIncomeCommand.ts`
5. Update confirmation builders and response helpers
6. Implement `findByPeer` query
7. Add unit tests for parser extraction
8. Add integration tests for full flow
9. Update Tech Spec documentation

### Testing Requirements
- **Unit Tests:** Parser extraction (Arabic/English counterparties)
- **Integration Tests:** Full logging flow with counterparties
- **Query Tests:** `findByPeer` performance and accuracy
- **Regression Tests:** Verify Stories 3.1/3.2 still pass
- **Manual QA:** Telegram bot confirmation and history display

### Success Criteria
- [ ] Schema deployed with new fields and indexes
- [ ] AI parsers extract counterparties with ≥80% accuracy
- [ ] Confirmations display "من/إلى" when present
- [ ] `findByPeer` query returns results in <200ms
- [ ] All existing tests pass
- [ ] Story 3.3 marked "Done" with DoD complete

### Timeline
- **Estimated Effort:** 3 days
- **Target Completion:** Within current sprint
- **Dependencies:** None (no blocking dependencies)

---

## 6. Risk Mitigation

### Identified Risks
1. **Parser accuracy:** AI may not consistently extract counterparties
2. **User confusion:** Users may not understand when to specify counterparties
3. **Data quality:** Inconsistent counterparty names (e.g., "الصيدلية" vs "صيدلية X")

### Mitigation Strategies
1. **Parser accuracy:** Add extensive test cases; monitor confidence scores; provide examples in error messages
2. **User confusion:** Make fields optional; provide clear examples; don't enforce unless user provides counterparty
3. **Data quality:** Document that counterparties are free-form; consider future normalization/autocomplete in post-MVP

---

## 7. Approval & Sign-off

### Proposal Status
**✅ APPROVED** - 2025-10-18 8:59 PM

### Required Approvals
- [x] Product Owner: Scope and priority approval
- [x] Tech Lead: Technical approach approval
- [x] User (Amr): Final go/no-go decision - **APPROVED Option 1 (Direct Adjustment)**

### Next Steps Upon Approval
1. Move Story 3.3 to "Ready for Development"
2. Assign to development team
3. Begin implementation (Task 1: Schema updates)
4. Daily standup check-ins on progress

---

**End of Sprint Change Proposal**
