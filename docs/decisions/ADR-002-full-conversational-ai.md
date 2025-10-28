# ADR-002: Full Conversational AI Integration

**Date:** 2025-10-16  
**Status:** Accepted  
**Deciders:** Amr (Product Owner), Development Team  
**Context:** Post Story 2.2 Approval - Improving user experience with natural conversation

---

## Decision

**Implement full conversational AI using RORK Toolkit for ALL user interactions**, not just command intent detection. The bot should act like ChatGPT - responding naturally to greetings, questions, and general conversation.

---

## Context

After deploying Story 2.2 (View Accounts), we discovered the bot was rejecting normal human conversation:

### Problem Examples:
```
User: "hello"
Bot: "لم أفهم طلبك. استخدم /help..."

User: "ازيك"
Bot: "لم أفهم طلبك. استخدم /help..."

User: "اسمك ايه"
Bot: "لم أفهم طلبك. استخدم /help..."
```

This violated our PRD vision:
- **PRD FR15**: "AI Conversational Interface - feels like chatting with helpful friend"
- **PRD NFR5**: "Zero learning curve - users shouldn't need to memorize commands"

### Initial Implementation (ADR-001)
We were using AI **only** for intent detection:
- Detect "create_account" → Execute handler
- Detect "view_accounts" → Execute handler  
- Unknown intent → **Error message** ❌

This was too rigid and not conversational.

---

## Decision Rationale

### Why Full Conversational AI?

1. **User Experience Alignment**
   - Users expect to chat naturally with bots in 2025
   - ChatGPT has set the standard for conversational AI
   - Our PRD explicitly calls for "conversational interface"

2. **Reduce Friction**
   - No need to teach users specific commands
   - Users can ask questions about bot capabilities
   - Natural onboarding through conversation

3. **Competitive Differentiation**
   - Most finance bots use rigid commands
   - Natural conversation is our key differentiator
   - Aligns with "AI-powered" value proposition

4. **Bilingual Excellence**
   - AI handles Arabic/English tone naturally
   - Can match user's formality level
   - Understands Egyptian dialect ("ازيك")

5. **Extensibility**
   - Foundation for future features (help, tutorials, tips)
   - Can explain features conversationally
   - Easy to add new conversation capabilities

---

## Implementation

### Architecture: Dual AI Usage

```
User Message
    ↓
AI Intent Detector (parseAccountIntent)
    ↓
┌──────────────┬───────────────┬──────────────┐
│              │               │              │
create_       view_          unknown         
account       accounts       intent          
│              │               │              │
↓              ↓               ↓              │
Handler       Handler    AI Conversation     │
                        (generateContextualResponse)
                              ↓
                         Natural Reply
```

### Technical Details

**1. Intent Detection (Existing)**
- **Endpoint:** `/agent/chat` (Vercel AI SDK v5 format)
- **Purpose:** Route to specific handlers
- **Output:** Structured JSON with intent + entities

**2. Conversation (New)**
- **Endpoint:** `/text/llm/` (Simple OpenAI-style format)
- **Purpose:** Natural conversation for unknown intents
- **Output:** Plain text response

**Request Format:**
```javascript
{
  messages: [
    { role: "system", content: "<system prompt>" },
    { role: "user", content: "ازيك" }
  ]
}
```

**Response Format:**
```javascript
{
  completion: "أهلاً وسهلاً! أنا تمام الحمد لله..."
}
```

### System Prompt Design

**Arabic:**
```
أنت مساعد مالي ذكي وودود اسمه "بوت تتبع المصروفات"
- كن ودوداً ومحادثاً طبيعياً
- رد على التحيات بحرارة
- استخدم الإيموجي بشكل مناسب 💰
- كن مختصراً (2-4 أسطر)
- لا تذكر أنك AI، تصرف كمساعد شخصي
```

**English:**
```
You are a friendly financial assistant called "Finance Tracker Bot"
- Be friendly and conversational
- Respond to greetings warmly
- Use emojis appropriately 💰
- Keep responses brief (2-4 lines)
- Don't mention you're an AI, act as a personal assistant
```

---

## Consequences

### Positive ✅

- Natural, human-like interactions
- Zero learning curve for users
- Aligns perfectly with PRD vision
- Extensible for future conversation features
- Handles both Arabic and English naturally
- Users feel they're chatting with helpful friend

### Negative ⚠️

- Additional AI API calls for conversations
- Slightly higher latency (~500ms extra)
- Dependency on RORK API availability
- Need to manage conversation context (future)

### Mitigation Strategies

1. **Performance**: Conversation responses are brief, API calls are fast
2. **Reliability**: Graceful fallback to friendly error message
3. **Cost**: Monitor RORK usage, conversations are short
4. **Context**: For now, stateless. Future: conversation history

---

## Alternatives Considered

### 1. Pattern-Based Responses (Rejected)
```javascript
if (/hello|hi|ازيك/.test(msg)) {
  return "مرحباً! كيف يمكنني مساعدتك؟"
}
```

**Why Rejected:**
- Limited to predefined patterns
- Can't handle creative phrasings
- Not truly conversational
- Doesn't scale to complex questions

### 2. Hybrid Approach (Rejected)
Use patterns for simple greetings, AI for complex questions

**Why Rejected:**
- Inconsistent UX (sometimes smart, sometimes dumb)
- Doubles implementation effort
- Hard to maintain boundary between pattern/AI

---

## Success Metrics

### Before (Rigid):
```
User: "hello"
Bot: "لم أفهم طلبك..." ❌

User: "ازيك"
Bot: "لم أفهم طلبك..." ❌
```

### After (Conversational):
```
User: "hello"
Bot: "Hello! 👋 I'm your personal finance assistant..." ✅

User: "ازيك"
Bot: "أهلاً وسهلاً! أنا تمام الحمد لله، إنت عامل إيه؟" ✅

User: "عرفني عن نفسك"
Bot: "أنا بوت تتبع المصروفات، مساعدك الشخصي..." ✅
```

---

## References

- [PRD.md] - FR15: AI Conversational Interface
- [PRD.md] - NFR5: Usability - Zero learning curve
- [ADR-001] - NL Parsing Strategy (Intent Detection)
- [RORK-API-COMPLETE-GUIDE.md] - Text LLM endpoint documentation
- [Story 2.2] - View Accounts implementation

---

## Review and Approval

- **Proposed By:** Development Team
- **Decided By:** Amr (Product Owner)
- **Date:** 2025-10-16
- **Next Review:** After 1 week of production usage

---

## Status Updates

**2025-10-16:** Decision accepted. Full conversational AI deployed to production.

