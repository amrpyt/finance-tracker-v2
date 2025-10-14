# ADR-001: Natural Language Parsing Strategy for Epic 2

**Date:** 2025-10-13  
**Status:** Accepted  
**Deciders:** Amr (Product Owner), Winston (Architect), Amelia (Developer)  
**Context:** Epic 1 Preparation Sprint - Deciding parsing approach for Epic 2 (Account Management)

---

## Decision

**Use RORK AI Toolkit for natural language parsing starting in Epic 2 (Account Management)**, instead of waiting until Epic 3 (Transaction Logging).

---

## Context

Epic 2 requires parsing user commands for account management:
- "أنشئ حساب محفظة برصيد 500 جنيه"
- "Create cash account with 200 EGP"
- "عندي 1000 جنيه في البنك"

Two options were evaluated:

### Option A: Simple Regex Patterns
- Fast (<1ms), free, works offline
- Limited flexibility - requires specific command formats
- Users must follow rigid patterns
- Estimated: 4-6 hours per story

### Option B: RORK AI Integration (Early)
- Natural language understanding with context awareness
- Flexible - understands various phrasings
- Consistent UX from Epic 2 onwards
- Estimated: 8-10 hours per story (includes AI integration overhead)

---

## Decision Rationale

**Why RORK AI (Option B)?**

1. **User Experience Consistency**
   - Users shouldn't learn "command syntax" for accounts but natural language for transactions
   - Conversational interface from day 1 aligns with PRD vision
   - "Zero learning curve" principle (PRD NFR5: Usability)

2. **Avoid Rework**
   - Epic 3 requires AI for transaction logging ("دفعت 50 جنيه على القهوة")
   - Implementing regex in Epic 2 means rewriting in Epic 3
   - Early integration spreads learning curve across 2 epics

3. **Competitive Differentiation**
   - Natural language for ALL features (not just transactions) is unique value prop
   - PRD Key Innovation: "AI-Powered Understanding - Natural language processing via RORK understands context without rigid commands"

4. **Technical Preparation**
   - Epic 2 is perfect testbed for RORK integration patterns
   - Lower complexity than transaction logging (fewer entities to extract)
   - Establishes prompt engineering patterns for Epic 3+

5. **Arabic Language Support**
   - Regex patterns for Arabic are complex and error-prone
   - RORK handles Arabic natively with same quality as English
   - Bilingual support is core requirement (PRD NFR6)

---

## Consequences

### Positive:
- ✅ Consistent natural language UX from Epic 2 onwards
- ✅ No rework needed in Epic 3
- ✅ Better Arabic language support
- ✅ Establishes AI integration patterns early
- ✅ Aligns with PRD vision: "conversational interface that feels like chatting with helpful friend"

### Negative:
- ⚠️ Epic 2 stories will take longer (8-10h vs 4-6h per story)
- ⚠️ Requires RORK API key and setup in Epic 2
- ⚠️ Response time will be slower (~500ms for AI vs <1ms for regex)
- ⚠️ Dependency on external API (RORK Toolkit)
- ⚠️ Need error handling for AI failures

### Mitigation Strategies:

1. **Performance**: Cache common patterns, implement optimistic UI updates
2. **Reliability**: Fallback to command detection if AI fails
3. **Cost**: Monitor RORK API usage, implement rate limiting if needed
4. **Complexity**: Create reusable AI integration module for Epic 3+

---

## Implementation Notes

### Epic 2 Integration Tasks:
1. Set up RORK API credentials in Convex environment
2. Create `convex/lib/nlParser.ts` with RORK integration
3. Define account management intents and entities
4. Implement prompt engineering for account operations
5. Add fallback handling for AI failures
6. Create integration tests for various phrasings

### Story Impact:
- **Story 2.1: Create Account** - Add RORK integration overhead (+4h)
- **Story 2.2: View Accounts** - Reuse RORK patterns (minimal overhead)
- **Story 2.3: Edit Account** - Reuse RORK patterns (minimal overhead)
- **Story 2.4: Default Account** - Reuse RORK patterns (minimal overhead)

### Epic 3 Preparation:
- RORK integration patterns established
- Prompt engineering experience gained
- AI error handling proven
- Can focus on transaction-specific logic

---

## Alternatives Considered

### Hybrid Approach (Regex + AI fallback)
- Use regex for simple patterns, AI for complex
- **Rejected**: Creates inconsistent UX, doubles implementation effort

### Delay AI until Epic 3
- Use regex for Epic 2, introduce AI in Epic 3
- **Rejected**: Violates PRD vision, requires rework, inconsistent UX

---

## References

- [PRD.md] - FR15: AI Conversational Interface
- [PRD.md] - NFR5: Usability - Zero learning curve
- [PRD.md] - NFR6: Localization - Full Arabic support
- [solution-architecture.md] - AI Integration Layer
- [epic-1-retro-2025-10-13.md] - Preparation Sprint discussion

---

## Review and Approval

- **Proposed By:** Winston (Architect)
- **Decided By:** Amr (Product Owner)
- **Date:** 2025-10-13
- **Next Review:** After Epic 2 Story 2.1 completion (validate decision with real implementation)

---

## Status Updates

**2025-10-13:** Decision accepted. RORK AI will be integrated starting Epic 2.
