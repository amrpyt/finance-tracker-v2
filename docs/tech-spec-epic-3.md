# Technical Specification: Expense & Income Logging with AI + UX Polish

Date: 2025-10-18
Author: Amr
Epic ID: 3
Status: Draft

---

## Overview

Epic 3 delivers the core value proposition of Finance Tracker v2.0: natural language transaction logging powered by AI with a delightful, conversational user experience. This epic transforms expense and income tracking from a tedious data-entry task into a seamless conversation, leveraging RORK Toolkit AI for intent detection and entity extraction in both Arabic and English.

The epic consists of 9 user stories split into two categories:
- **Core AI Features (Stories 3.1-3.5):** AI-powered expense/income logging, confirmation workflows, auto-categorization with 85%+ accuracy, and robust transaction storage
- **UX Polish (Stories 3.6-3.9):** Typing indicators, status messages, emoji reactions, and response variations that create a natural, engaging conversation flow

This epic builds upon the foundation laid in Epic 1 (bot infrastructure, database schema) and Epic 2 (account management) to deliver the primary user workflow that will drive daily engagement and retention.

## Objectives and Scope

### Objectives

1. **Enable Natural Language Transaction Logging**: Users log expenses and income through conversational Arabic/English text without rigid command syntax
2. **Achieve 85%+ AI Categorization Accuracy**: Automatic category assignment reduces manual data entry and user friction
3. **Deliver Sub-5-Second Transaction Workflow**: Complete end-to-end transaction logging (AI extraction → confirmation → storage) in under 5 seconds
4. **Create Delightful UX**: Typing indicators, status messages, emoji reactions, and varied responses make the bot feel responsive and conversational
5. **Maintain Data Integrity**: Confirmation workflows prevent AI errors from corrupting financial data
6. **Support High Transaction Volume**: Handle 100K+ transactions per user with efficient storage and querying

### In Scope

✅ **Core Transaction Features**
- Natural language expense logging (Arabic/English)
- Natural language income logging (Arabic/English)
- AI-powered entity extraction (amount, category, description, account)
- Confirmation workflow with AI-extracted details preview
- Manual correction mechanism if AI misinterprets
- Automatic account balance updates
- Transaction timestamp capture

✅ **AI & Categorization**
- RORK Toolkit integration for intent detection
- Category auto-assignment with 85%+ accuracy target
- Bilingual support (Arabic/English with context awareness)
- Conversation context retention across messages
- Fallback to Gemini/Groq if RORK unavailable

✅ **UX Enhancements**
- Typing indicators during AI processing (`sendChatAction('typing')`)
- Status messages ("💭 Analyzing...", "✅ Saved!") with auto-delete
- Emoji reactions on user messages (💰 income, 💸 expense, ✅ success)
- Response variation templates for natural conversation feel
- Sub-500ms status message display

✅ **Data Storage**
- Transaction persistence in Convex `transactions` table
- Indexed queries for fast retrieval (by user, date, account, category)
- Soft delete support for audit trail
- Transaction history with full metadata

### Out of Scope

❌ **Transaction Management** (Epic 5)
- Transaction history browsing/pagination
- Search and filtering
- Edit/delete existing transactions
- Transaction undo beyond confirmation step

❌ **Analytics & Insights** (Epic 10)
- Spending analysis and trends
- Category breakdowns with charts
- Budget tracking (Epic 6)
- Predictive insights

❌ **Advanced Features**
- Voice message input (deferred - complexity)
- Receipt photo upload (future enhancement)
- Recurring transaction setup (Epic 8)
- Split transactions (future feature)
- Multi-currency transactions (future feature)

❌ **External Integrations**
- Bank account sync (out of MVP scope)
- Credit card statement import (future)
- Export functionality (Epic 5)

## System Architecture Alignment

Epic 3 implementation aligns with the established architecture patterns:

**Serverless Monolith Pattern**: All transaction logic implemented as Convex mutations/queries within single deployment, leveraging automatic scaling for concurrent users.

**AI Integration Strategy**: Follows the dual-purpose AI pattern defined in Architecture:
- **Intent Detection**: RORK `/text/llm/` endpoint with simple OpenAI-style format for routing to `log_expense` or `log_income` handlers
- **Natural Conversation**: RORK `/text/llm/` endpoint for free-form responses when intent is unclear or user is having casual conversation
- **Implementation Note**: All parsers (nlParser.ts, parseExpenseIntent.ts, parseIncomeIntent.ts) use `/text/llm/` NOT `/agent/chat`
- **No Tool Calling**: AI detects intent, our code executes business logic for predictability and debugging

**Core Components Referenced**:
- `convex/telegram/webhook.ts` - HTTP entry point for all messages
- `convex/ai/detectIntent.ts` - RORK intent detection action
- `convex/ai/generateResponse.ts` - Natural language response generation
- `convex/transactions/create.ts` - Transaction persistence mutation
- `convex/accounts/updateBalance.ts` - Atomic balance updates
- `convex/messages/create.ts` - Conversation history storage

**Database Schema Utilized**:
- `transactions` table with indexes: `by_user`, `by_user_date`, `by_account`, `by_user_category`
- `accounts` table for balance updates via `by_user_active` index
- `messages` table for conversation context retention
- `userProfiles` table for language preference and default account

**Performance Constraints**:
- < 2 second AI response time (95th percentile) per Architecture NFR1
- < 5 second end-to-end transaction logging per PRD FR3
- < 500ms database query execution per Architecture NFR1
- Support 5,000+ concurrent users without degradation per Architecture scalability target

**Technology Alignment**:
- TypeScript 5.6.3 with strict mode for type safety
- Convex reactive database with automatic indexing
- RORK Toolkit SDK (primary) with Gemini/Groq fallbacks
- Zod 3.23.8 for AI output validation and entity schemas
- date-fns 3.6.0 for date parsing from natural language

**Security & Privacy**:
- User data isolation via `userId` scoping on all queries
- Minimal AI context (only current message + recent history, no full transaction history)
- Soft deletes preserve audit trail per Architecture principle
- Data encrypted at rest/transit via Convex defaults

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner |
|--------|----------------|--------|---------|-------|
| **telegram/webhook** | HTTP entry point for all Telegram messages | Telegram webhook payload (JSON) | HTTP 200 response | Convex HTTP Action |
| **ai/detectIntent** | RORK intent detection with structured output | `{ message: string, history: Message[], language: string }` | `{ intent: string, entities: object, confidence: number }` | Convex Action |
| **ai/generateResponse** | Natural language response generation | `{ intent: string, result: any, language: string, history: Message[] }` | `{ text: string }` | Convex Action |
| **transactions/create** | Persist transaction and update balance | `{ userId, accountId, type, amount, category, description, date }` | `{ transactionId, newBalance }` | Convex Mutation |
| **transactions/getRecent** | Retrieve recent transactions | `{ userId, limit?, accountId? }` | `Transaction[]` | Convex Query |
| **accounts/getById** | Get account details | `{ accountId }` | `Account` | Convex Query |
| **accounts/updateBalance** | Atomic balance update | `{ accountId, delta }` | `{ newBalance }` | Convex Mutation |
| **messages/create** | Store conversation history | `{ userId, role, content, metadata? }` | `{ messageId }` | Convex Mutation |
| **messages/getRecent** | Retrieve conversation context | `{ userId, limit }` | `Message[]` | Convex Query |
| **telegram/sendMessage** | Send message to user | `{ chatId, text, parseMode?, replyMarkup? }` | `{ messageId }` | Convex Action |
| **telegram/sendChatAction** | Show typing indicator | `{ chatId, action: 'typing' }` | `{ success: boolean }` | Convex Action |
| **telegram/reactToMessage** | Add emoji reaction | `{ chatId, messageId, emoji }` | `{ success: boolean }` | Convex Action |
| **categories/suggest** | AI category suggestion with validation | `{ description: string, language: string }` | `{ category: string, confidence: number }` | Convex Action |
| **ux/responseVariations** | Get varied response template | `{ template: string, language: string }` | `{ text: string }` | Convex Query |

**Module Dependencies:**

```
webhook.ts
  ├─> ai/detectIntent.ts (RORK API)
  ├─> messages/getRecent.ts (context)
  ├─> telegram/sendChatAction.ts (typing indicator)
  └─> Route based on intent:
      ├─> transactions/create.ts
      │   ├─> accounts/updateBalance.ts
      │   └─> messages/create.ts
      ├─> ai/generateResponse.ts (unknown intent)
      └─> telegram/sendMessage.ts
          └─> telegram/reactToMessage.ts (UX polish)
```

### Data Models and Contracts

### Transaction Entity

```typescript
interface Transaction {
  _id: Id<"transactions">;           // Convex auto-generated
  _creationTime: number;              // Convex auto-generated
  
  // Core fields
  userId: Id<"users">;                // Foreign key to users table
  accountId: Id<"accounts">;          // Foreign key to accounts table
  type: "expense" | "income";         // Transaction type
  amount: number;                     // Positive decimal (2 decimal places)
  category: string;                   // From category taxonomy
  description: string;                // User-provided or AI-extracted
  
  // Temporal
  date: number;                       // Transaction date (Unix timestamp, can be backdated)
  createdAt: number;                  // Record creation timestamp
  updatedAt?: number;                 // Last modification timestamp
  
  // Metadata
  aiConfidence?: number;              // AI categorization confidence (0-1)
  isDeleted: boolean;                 // Soft delete flag
  metadata?: {                        // Optional metadata
    originalInput?: string;           // User's original message
    correctionCount?: number;         // Times user corrected AI
  };
}
```

**Validation Schema (Zod):**

```typescript
const TransactionSchema = z.object({
  userId: v.id("users"),
  accountId: v.id("accounts"),
  type: z.enum(["expense", "income"]),
  amount: z.number().positive().max(1000000000), // Max 1 billion
  category: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  date: z.number().int().positive(),
  aiConfidence: z.number().min(0).max(1).optional(),
  isDeleted: z.boolean().default(false),
  metadata: z.object({
    originalInput: z.string().optional(),
    correctionCount: z.number().int().min(0).optional()
  }).optional()
});
```

### AI Intent Entity

```typescript
interface TransactionIntent {
  intent: "log_expense" | "log_income" | "unknown";
  confidence: number;                 // 0-1, threshold: 0.7
  entities: {
    amount?: number;                  // Extracted amount
    category?: string;                // Suggested category
    description?: string;             // Transaction description
    accountId?: Id<"accounts">;       // Target account (from default or context)
    date?: number;                    // Parsed date ("yesterday" → timestamp)
  };
  needsConfirmation: boolean;         // Always true for transactions
  clarificationNeeded?: string;       // If entities incomplete
}
```

### Message Entity (Conversation History)

```typescript
interface Message {
  _id: Id<"messages">;
  _creationTime: number;
  
  userId: Id<"users">;
  role: "user" | "assistant" | "system";
  content: string;                    // Message text
  
  metadata?: {
    intent?: string;                  // Detected intent
    entities?: object;                // Extracted entities
    aiConfidence?: number;            // Confidence score
    responseTime?: number;            // Processing latency (ms)
    hasReaction?: boolean;            // Emoji reaction added
  };
  
  createdAt: number;
}
```

### Category Taxonomy

**Expense Categories (Arabic + English):**

```typescript
const EXPENSE_CATEGORIES = [
  { id: "food", ar: "طعام", en: "Food", emoji: "🍔" },
  { id: "transport", ar: "مواصلات", en: "Transport", emoji: "🚗" },
  { id: "shopping", ar: "تسوق", en: "Shopping", emoji: "🛍️" },
  { id: "entertainment", ar: "ترفيه", en: "Entertainment", emoji: "🎬" },
  { id: "bills", ar: "فواتير", en: "Bills", emoji: "💡" },
  { id: "healthcare", ar: "صحة", en: "Healthcare", emoji: "🏥" },
  { id: "education", ar: "تعليم", en: "Education", emoji: "📚" },
  { id: "coffee", ar: "قهوة", en: "Coffee", emoji: "☕" },
  { id: "groceries", ar: "بقالة", en: "Groceries", emoji: "🛒" },
  { id: "other", ar: "أخرى", en: "Other", emoji: "💰" }
] as const;
```

**Income Categories:**

```typescript
const INCOME_CATEGORIES = [
  { id: "salary", ar: "راتب", en: "Salary", emoji: "💼" },
  { id: "freelance", ar: "عمل حر", en: "Freelance", emoji: "💻" },
  { id: "business", ar: "مشروع", en: "Business", emoji: "🏢" },
  { id: "investment", ar: "استثمار", en: "Investment", emoji: "📈" },
  { id: "gift", ar: "هدية", en: "Gift", emoji: "🎁" },
  { id: "other", ar: "أخرى", en: "Other", emoji: "💰" }
] as const;
```

### Response Variation Templates

```typescript
const CONFIRMATION_TEMPLATES = {
  ar: [
    "تمام! 👌",
    "تم! ✨",
    "فهمت! 👍",
    "واضح! ✅",
    "ممتاز! 🎯"
  ],
  en: [
    "Done! ✨",
    "Got it! 👍",
    "Perfect! 🎯",
    "Saved! ✅",
    "All set! 👌"
  ]
};

const SUCCESS_TEMPLATES = {
  ar: [
    "✅ تم تسجيل {type}",
    "✅ {type} مسجل بنجاح",
    "👍 تم حفظ {type}"
  ],
  en: [
    "✅ {type} logged",
    "✅ {type} saved successfully",
    "👍 {type} recorded"
  ]
};
```

### APIs and Interfaces

### RORK Toolkit API Endpoints

**1. Intent Detection Endpoint**

```
POST https://toolkit.rork.com/text/llm/
Content-Type: application/json
# Note: Simple OpenAI-style format, no Bearer token in current implementation

Request Body:
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "id": "system_001",
      "role": "system",
      "parts": [{
        "type": "text",
        "text": "You are a financial transaction parser..."
      }]
    },
    {
      "id": "user_001",
      "role": "user",
      "parts": [{
        "type": "text",
        "text": "دفعت 50 جنيه على القهوة"
      }]
    }
  ]
}

Response (SSE Stream):
event: text-delta
data: {"type":"text-delta","textDelta":"{\"intent\":\"log_expense\"..."}

Parsed Result:
{
  "intent": "log_expense",
  "confidence": 0.95,
  "entities": {
    "amount": 50,
    "category": "coffee",
    "description": "قهوة"
  },
  "needsConfirmation": true
}
```

**2. Natural Conversation Endpoint**

```
POST https://toolkit.rork.com/text/llm/
Content-Type: application/json

Request Body:
{
  "messages": [
    { "role": "system", "content": "You are a helpful financial assistant..." },
    { "role": "user", "content": "ازيك" }
  ]
}

Response:
{
  "completion": "أهلاً وسهلاً! أنا تمام، إنت عامل إيه؟ 😊"
}
```

### Telegram Bot API Endpoints

**1. Send Message**

```
POST https://api.telegram.org/bot{token}/sendMessage

Request Body:
{
  "chat_id": "123456789",
  "text": "✅ تم تسجيل المصروف\n💰 50 جنيه - قهوة",
  "parse_mode": "Markdown"
}

Response:
{
  "ok": true,
  "result": {
    "message_id": 456,
    "chat": { "id": 123456789 },
    "text": "..."
  }
}
```

**2. Send Chat Action (Typing Indicator)**

```
POST https://api.telegram.org/bot{token}/sendChatAction

Request Body:
{
  "chat_id": "123456789",
  "action": "typing"
}

Response:
{
  "ok": true,
  "result": true
}
```

**3. Set Message Reaction (Emoji)**

```
POST https://api.telegram.org/bot{token}/setMessageReaction

Request Body:
{
  "chat_id": "123456789",
  "message_id": 456,
  "reaction": [{"type": "emoji", "emoji": "💸"}]
}

Response:
{
  "ok": true,
  "result": true
}
```

### Convex Internal APIs

**Mutation: transactions.create**

```typescript
export default mutation({
  args: {
    userId: v.id("users"),
    accountId: v.id("accounts"),
    type: v.union(v.literal("expense"), v.literal("income")),
    amount: v.number(),
    category: v.string(),
    description: v.string(),
    date: v.optional(v.number()),
    aiConfidence: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // Validation
    // Create transaction
    // Update account balance (atomic)
    // Return transaction ID and new balance
  }
});

Usage:
await ctx.runMutation(api.transactions.create, {
  userId: "user123",
  accountId: "acc456",
  type: "expense",
  amount: 50,
  category: "coffee",
  description: "قهوة",
  aiConfidence: 0.95
});

Returns:
{ transactionId: "txn789", newBalance: 4950 }
```

**Query: transactions.getRecent**

```typescript
export default query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    accountId: v.optional(v.id("accounts"))
  },
  handler: async (ctx, args) => {
    // Query with index by_user_date (descending)
    // Filter by accountId if provided
    // Return transactions
  }
});

Usage:
await ctx.runQuery(api.transactions.getRecent, {
  userId: "user123",
  limit: 10
});

Returns:
[
  { _id: "txn789", type: "expense", amount: 50, ... },
  { _id: "txn788", type: "income", amount: 1000, ... }
]
```

### Workflows and Sequencing

### Workflow 1: Expense Logging (Happy Path)

```
┌─────────────────────────────────────────────────────────────┐
│ USER: "دفعت 50 جنيه على القهوة"                             │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
                 [Telegram Webhook]
                        ↓
           webhook.ts receives message
                        ↓
              ┌─────────┴─────────┐
              ↓                   ↓
    sendChatAction('typing')   getRecent messages (context)
              ↓                   ↓
              └─────────┬─────────┘
                        ↓
              ai/detectIntent (RORK)
              - Input: message + context
              - Output: { intent: "log_expense", entities: {...} }
                        ↓
              Intent Router (switch)
                        ↓
              Case: "log_expense"
                        ↓
              ┌─────────┴─────────┐
              ↓                   ↓
    Get default account      Validate entities
    (if not specified)       (amount, category)
              ↓                   ↓
              └─────────┬─────────┘
                        ↓
              Show Confirmation Message
              "📝 هل هذا صحيح؟
               💰 المبلغ: 50 جنيه
               📁 الفئة: قهوة
               📝 الوصف: قهوة
               🏦 الحساب: محفظتي"
                        ↓
              Store pending confirmation
              (in-memory or DB)
                        ↓
              WAIT for user response
                        ↓
┌───────────────────────┴───────────────────────┐
↓                                               ↓
USER: "نعم"                                  USER: "لا"
↓                                               ↓
Retrieve pending confirmation                Ask for correction
↓                                               ↓
transactions.create mutation                 Store "needs_correction"
- Insert transaction                          ↓
- Update account balance (atomic)           WAIT for corrected input
↓                                               ↓
Get response variation                       (Handle as new transaction)
"✅ تم تسجيل المصروف"
↓
Add emoji reaction 💸
↓
messages.create (store conversation)
↓
sendMessage to user
"✅ تم تسجيل المصروف
 💰 50 جنيه - قهوة
 💼 رصيدك: 4,950 جنيه"
↓
DONE (Total: 3-5 seconds)
```

### Workflow 2: Income Logging

```
USER: "استلمت راتب 5000 جنيه"
  ↓
Telegram Webhook
  ↓
sendChatAction('typing')
  ↓
ai/detectIntent
  Output: { intent: "log_income", entities: { amount: 5000, category: "salary" } }
  ↓
Confirmation Message
  "📝 هل هذا صحيح؟
   💰 المبلغ: 5000 جنيه
   📁 الفئة: راتب
   🏦 الحساب: بنك مصر"
  ↓
USER: "نعم"
  ↓
transactions.create (type: "income")
  - Insert transaction
  - INCREASE account balance
  ↓
Add emoji reaction 💰
  ↓
sendMessage
  "✅ تم تسجيل الدخل
   💰 5000 جنيه - راتب
   💼 رصيدك: 9,950 جنيه"
```

### Workflow 3: AI Clarification Flow

```
USER: "دفعت على القهوة" (amount missing)
  ↓
ai/detectIntent
  Output: {
    intent: "log_expense",
    entities: { category: "coffee" },  // No amount!
    clarificationNeeded: "amount"
  }
  ↓
Bot: "كم دفعت على القهوة؟"
  ↓
USER: "خمسين جنيه"
  ↓
ai/detectIntent (with context)
  Output: {
    intent: "provide_amount",
    entities: { amount: 50 }
  }
  ↓
Merge with previous context
  { amount: 50, category: "coffee", description: "قهوة" }
  ↓
Show confirmation
  ↓
(Continue normal flow)
```

### Workflow 4: UX Polish Sequence

```
Timing Breakdown (Target: < 5 seconds total)

00:000ms - User sends message
00:050ms - Webhook receives message
00:100ms - sendChatAction('typing') executed
           [User sees "typing..." indicator]
00:150ms - getRecent messages (context loaded)
00:200ms - detectIntent API call starts
01:500ms - RORK returns intent (1.3s AI latency)
01:550ms - Route to handler, validate entities
01:600ms - Show confirmation message
           [Status: "💭 جاري التحليل..." - auto-delete]
01:650ms - Wait for user response

-- User thinks and responds (variable time) --

10:000ms - User responds "نعم"
10:050ms - Retrieve pending confirmation
10:100ms - transactions.create mutation starts
10:300ms - Transaction inserted + balance updated (200ms DB)
10:350ms - Generate response variation
10:400ms - Add emoji reaction 💸
10:500ms - sendMessage with success message
           [Status: "✅ تم الحفظ!" - auto-delete after 2s]
10:550ms - messages.create (conversation stored)

TOTAL: ~4.5 seconds (from initial message to final response)
```

### Sequence Diagram: Complete Transaction Flow

```
User      Telegram    Webhook     AI/RORK    Database    Account
 │           │           │            │          │          │
 │──msg──────>│           │            │          │          │
 │           │──webhook──>│            │          │          │
 │           │           │──typing────>│          │          │
 │<──"..."───│           │            │          │          │
 │           │           │──context───>│          │          │
 │           │           │<──messages─>│          │          │
 │           │           │──detect─────>│         │          │
 │           │           │            │─RORK     │          │
 │           │           │<──intent────│         │          │
 │           │           │──validate───>│         │          │
 │<──confirm─│<──────────│            │          │          │
 │           │           │            │          │          │
 │──"نعم"────>│           │            │          │          │
 │           │──webhook──>│            │          │          │
 │           │           │──create─────>│         │          │
 │           │           │            │──insert──>│          │
 │           │           │            │──update──>│─────────>│
 │           │           │            │<──balance─│<─────────│
 │           │           │<──txn_id────│          │          │
 │           │           │──react──────>│         │          │
 │<──💸──────│<──────────│            │          │          │
 │<──success─│<──────────│            │          │          │
 │           │           │──store──────>│         │          │
 │           │           │            │──save────>│          │
```

## Non-Functional Requirements

### Performance

**Target: < 5 seconds end-to-end** (user message to success confirmation)

**Breakdown:**
- AI Intent Detection: < 2s (95th percentile) via RORK API
- Database Operations: < 500ms (99th percentile) using Convex indexes
- Typing Indicator: < 100ms display after webhook
- Status Messages: < 500ms display
- Emoji Reactions: < 200ms after transaction save

**Optimization Strategies:**
- Parallel operations (typing indicator + context loading)
- Indexed queries (by_user_date, by_account)
- Minimal AI context (last 5 messages only)
- Response template caching
- Atomic balance updates (single mutation)
- AI fallback chain (RORK → Gemini → Groq)

**Scalability:** 5,000+ concurrent users, 100K+ transactions/user via Convex auto-scaling

### Security

**Authentication:** Telegram-based (user ID verification), webhook signature validation

**Data Isolation:** All queries scoped by userId, no cross-user access

**Privacy:**
- Minimal AI context (current + last 5 messages, not full history)
- No PII to AI (amounts/categories only)
- Encryption at rest/transit (Convex AES-256)
- Soft deletes preserve audit trail

**Secrets Management:** Environment variables encrypted in Convex (TELEGRAM_BOT_TOKEN, RORK_API_KEY)

**Input Validation:** Zod schemas validate all inputs before database writes

### Reliability/Availability

**Uptime Target:** 99.5% via Convex SLA

**Error Handling:**
- AI API retry (2 attempts with exponential backoff)
- Telegram API retry (3 attempts)
- Automatic fallback: RORK → Gemini → Groq

**Graceful Degradation:**
- RORK down → Gemini fallback
- All AI down → Prompt user to rephrase
- Telegram down → Queue and retry
- Typing indicator fails → Skip (minor UX impact)

**Data Durability:** Convex automatic backups (daily, 30-day retention), soft deletes, ACID transactions

### Observability

**Logging:** Structured logs (info/warn/error) with userId, operation, latency, AI provider

**Key Metrics:**
- Transaction success rate (target: > 95%)
- AI detection accuracy (target: > 80% confidence)
- Response time p95 (target: < 5s)
- AI provider errors (alert: > 5%)
- Confirmation acceptance rate (target: > 80%)

**Monitoring:** Convex dashboard (function execution, errors, query latency)

**Error Tracking:** Sentry integration for exception capture with context

**Health Check:** /health endpoint monitors database, AI providers, Telegram API

## Dependencies and Integrations

### External Dependencies

| Dependency | Version | Purpose | Fallback |
|------------|---------|---------|----------|
| **RORK Toolkit** | Latest | AI intent detection + conversation | Gemini (free tier) |
| **Google Gemini** | Flash 1.5 | Fallback AI #1 | Groq |
| **Groq** | Llama 3.1 70B | Fallback AI #2 | None (last resort) |
| **Telegram Bot API** | V7.10 | Message sending/receiving | None (critical) |
| **Convex** | 1.16.5+ | Backend + database | None (core) |
| **Zod** | 3.23.8 | Schema validation | N/A |
| **date-fns** | 3.6.0 | Date parsing | Native Date() |

### Internal Dependencies (From Previous Epics)

**Epic 1:** webhook.ts, sendMessage.ts, users table, schema.ts
**Epic 2:** accounts/getById, accounts/getDefault, userProfiles/getByUserId

### New Components to Create

- `ai/detectIntent.ts` - RORK intent detection
- `ai/generateResponse.ts` - Natural conversation
- `transactions/create.ts` - Transaction persistence
- `transactions/getRecent.ts` - Query transactions
- `messages/create.ts` - Conversation storage
- `messages/getRecent.ts` - Context retrieval
- `telegram/sendChatAction.ts` - Typing indicators
- `telegram/reactToMessage.ts` - Emoji reactions
- `ux/responseVariations.ts` - Response templates

## Acceptance Criteria (Authoritative)

### Story 3.1: AI Expense Logging
1. Arabic expense message extracts amount, category, description correctly
2. English expense message extracts correctly
3. Typing indicator displays within 100ms
4. AI detection completes within 2 seconds (95th percentile)
5. Confirmation message shows extracted details
6. User confirms → Transaction saved, balance updated
7. Success message shows new balance within 5 seconds total
8. Handles amounts up to 1 billion

### Story 3.2: AI Income Logging
1. Arabic/English income messages extract correctly
2. Income transactions saved with type="income"
3. Balance increases (not decreases)
4. Income-specific emoji (💰) used
5. Income categories distinguished (salary, freelance, business, gift)

### Story 3.3: Confirmation Workflow
1. Every transaction shows confirmation before saving
2. Confirmation displays: amount, category, description, account
3. "نعم"/"yes" → Transaction saved
4. "لا"/"no" → Cancelled, asks correction
5. No transaction saved without explicit confirmation

### Story 3.4: Auto-Categorization
1. 85%+ category accuracy on common expenses
2. Both Arabic and English inputs categorized correctly
3. AI confidence score stored with transaction
4. Low confidence (< 0.7) triggers clarification
5. 10 expense categories + 6 income categories supported

### Story 3.5: Transaction Storage
1. All transactions stored with required fields
2. Indexed by user, date, account, category
3. Soft delete implemented (isDeleted flag)
4. Handles 100K+ transactions/user without degradation
5. Balance updates atomic
6. No duplicates from webhook retries

### Story 3.6-3.9: UX Polish
1. Typing indicators appear during AI processing
2. Status messages ("💭 Analyzing...", "✅ Saved!") display
3. Emoji reactions (💸 expense, 💰 income, ✅ success) added
4. Response variations feel natural (5+ templates per language)

### Cross-Story Criteria
- ✅ End-to-end < 5 seconds (95th percentile)
- ✅ Bilingual support (Arabic + English)
- ✅ AI fallback chain works automatically
- ✅ Data integrity maintained
- ✅ 5,000+ concurrent users supported

## Traceability Mapping

| AC | Acceptance Criteria | Component | Test Approach |
|----|---------------------|-----------|---------------|
| 3.1.1 | Arabic extraction | ai/detectIntent | Send "دفعت 50 جنيه على القهوة" → Assert amount=50, category=coffee |
| 3.1.3 | Typing < 100ms | sendChatAction | Mock webhook → Assert timing |
| 3.1.4 | AI < 2s | detectIntent | 100 requests → Assert p95 < 2000ms |
| 3.1.6 | User confirms | transactions/create | Send "نعم" → Assert DB insert |
| 3.1.7 | Atomic balance | updateBalance | Assert balance decreased atomically |
| 3.2.1 | Income extraction | detectIntent | Send "استلمت راتب 5000" → Assert intent=log_income |
| 3.2.3 | Income emoji | reactToMessage | Assert 💰 reaction added |
| 3.2.5 | Balance increases | updateBalance | Assert balance increased for income |
| 3.3.1 | Confirmation required | sendMessage | Assert confirmation shown before save |
| 3.3.3 | Yes saves | transactions/create | User confirms → Assert DB insert |
| 3.3.4 | No cancels | sendMessage | User "لا" → Assert no DB insert |
| 3.4.1 | 85% accuracy | detectIntent | Test 100 samples → Assert 85+ correct |
| 3.4.3 | Confidence stored | transactions/create | Assert aiConfidence field populated |
| 3.5.1 | Required fields | transactions/create | Assert all fields stored correctly |
| 3.5.4 | 100K+ scale | getRecent | Insert 100K → Query → Assert < 500ms |
| 3.5.5 | Atomic updates | updateBalance | Concurrent updates → Assert consistency |
| 3.6.1 | Typing indicator | sendChatAction | Assert indicator shown during AI |
| 3.7.1 | Status messages | sendMessage | Assert "💭 Analyzing..." displayed |
| 3.8.1 | Emoji reactions | reactToMessage | Assert 💸/💰/✅ reactions added |
| 3.9.1 | Response variations | responseVariations | Assert random selection from pool |

## Risks, Assumptions, Open Questions

### Risks

**R1: AI Categorization Accuracy < 85%**
- **Impact:** High (core feature quality)
- **Probability:** Medium
- **Mitigation:** Test with 1000+ real samples before launch, allow user corrections, track accuracy metrics

**R2: RORK API Costs Exceed Budget**
- **Impact:** High (financial viability)
- **Probability:** Medium
- **Mitigation:** Monitor daily spend, implement Gemini fallback (free tier), optimize prompt size

**R3: AI Response Time > 2 Seconds**
- **Impact:** Medium (user experience)
- **Probability:** Low
- **Mitigation:** Fallback to Groq (faster inference), cache common patterns, show typing indicator

**R4: Conversation Context Insufficient**
- **Impact:** Medium (AI accuracy)
- **Probability:** Medium
- **Mitigation:** Increase context window from 5 to 10 messages if needed, implement session state

**R5: Webhook Duplicate Messages**
- **Impact:** High (data integrity)
- **Probability:** Low
- **Mitigation:** Implement deduplication logic (check last message within 5s window)

### Assumptions

**A1:** RORK Toolkit API remains stable and available (no breaking changes)
**A2:** Telegram Bot API supports emoji reactions (setMessageReaction endpoint available)
**A3:** Users have stable internet connection for real-time interaction
**A4:** Convex free tier (1M calls/month) sufficient for initial user base
**A5:** Arabic NLP quality from RORK comparable to English
**A6:** Users willing to confirm transactions (not expecting fully automatic logging)
**A7:** 5-message context window sufficient for intent detection
**A8:** Account management (Epic 2) completed and stable before starting Epic 3

### Open Questions

**Q1:** Should we support voice message input in Epic 3 or defer to Epic 4?
- **Decision:** Defer to Epic 3.5 or separate epic (complexity + STT API integration)

**Q2:** What confidence threshold should trigger clarification? (0.6? 0.7? 0.8?)
- **Decision:** Start with 0.7, adjust based on production metrics

**Q3:** How long should pending confirmations remain valid before timeout?
- **Decision:** 5 minutes timeout, then clear pending state

**Q4:** Should we allow editing transactions immediately after save?
- **Decision:** Out of scope for Epic 3, covered in Epic 5 (Transaction Management)

**Q5:** How to handle multi-currency transactions?
- **Decision:** Out of scope for MVP, single currency per account

**Q6:** Should typing indicators persist for full AI processing or just initial phase?
- **Decision:** Show during entire AI detection phase (1-2s), disappear when confirmation shown

**Q7:** How to measure 85% categorization accuracy in production?
- **Decision:** Track user corrections during confirmation phase, calculate accuracy = (accepted / total)

**Q8:** Should we implement message queuing for failed Telegram API calls?
- **Decision:** Yes, retry 3x with exponential backoff, then log error (user can resend)

## Test Strategy Summary

### Unit Tests

**AI Layer:**
- detectIntent with Arabic/English inputs
- Category suggestion accuracy
- Confidence score calculation
- Intent schema validation (Zod)
- Response variation selection

**Database Layer:**
- Transaction create mutation
- Balance update atomicity
- Account retrieval by userId
- Message storage and retrieval
- Query performance with indexes

**Business Logic:**
- Confirmation workflow state machine
- Amount extraction from text
- Category mapping (Arabic ↔ English)
- Date parsing from natural language
- Duplicate message detection

### Integration Tests

**End-to-End Flows:**
1. Complete expense logging (Arabic)
2. Complete income logging (English)
3. Confirmation → Yes → Transaction saved
4. Confirmation → No → Cancelled
5. Clarification flow (missing amount)
6. User correction flow

**API Integrations:**
- RORK intent detection (mock + real)
- Telegram sendMessage (mock)
- Telegram sendChatAction (mock)
- Convex mutations (real)
- Convex queries (real)

**Error Scenarios:**
- RORK API timeout → Gemini fallback
- Gemini failure → Groq fallback
- All AI providers down → User prompt
- Database write failure → Retry logic
- Telegram API error → Retry + log

### Performance Tests

**Latency:**
- AI detection: 100 requests → p50, p95, p99 latency
- Database queries: 1000 queries → p99 < 500ms
- End-to-end: 50 flows → p95 < 5 seconds

**Load:**
- 100 concurrent users → No errors
- 1000 concurrent users → Monitor response times
- 10K transactions → Query performance maintained

**Scalability:**
- Insert 100K transactions per user → Query still fast
- 5000 concurrent webhook calls → No dropped messages

### Acceptance Tests (User Stories)

**Story 3.1:** Arabic expense "دفعت 50 جنيه على القهوة" → Transaction saved with correct details
**Story 3.2:** English income "Received salary 5000" → Income transaction, balance increased
**Story 3.3:** Confirmation flow → User says no → Transaction cancelled, asks correction
**Story 3.4:** Category accuracy → Test 100 samples → 85+ categorized correctly
**Story 3.5:** 100K transactions → Query recent → Response < 500ms
**Story 3.6:** Typing indicator → Appears within 100ms of message
**Story 3.7:** Status messages → "💭 Analyzing..." shown, auto-deleted
**Story 3.8:** Emoji reactions → 💸 on expense, 💰 on income
**Story 3.9:** Response variations → 5 consecutive transactions show different messages

### Test Data

**Expense Samples (Arabic):**
- "دفعت 50 جنيه على القهوة"
- "اشتريت بقالة ب 200 جنيه"
- "دفعت فاتورة الكهرباء 150"

**Expense Samples (English):**
- "Paid 50 EGP for coffee"
- "Bought groceries for 200 EGP"
- "Electricity bill 150"

**Income Samples:**
- "استلمت راتب 5000 جنيه"
- "Received freelance payment 1000 EGP"

**Edge Cases:**
- Missing amount: "دفعت على القهوة"
- Missing category: "دفعت 50 جنيه"
- Very large amount: "دفعت 1000000000 جنيه"
- Ambiguous input: "خمسين"

### Test Coverage Targets

- **Unit Tests:** 80%+ code coverage
- **Integration Tests:** All critical paths covered
- **Performance Tests:** All NFRs validated
- **Acceptance Tests:** All 9 stories passed

### Testing Tools

- **Unit:** Vitest (Jest-compatible, fast)
- **Integration:** Vitest + Convex test environment
- **E2E:** Playwright (manual trigger, not CI)
- **Load:** Artillery or k6 (optional)
- **Monitoring:** Convex dashboard + Sentry

### Definition of Done

✅ All unit tests passing (80%+ coverage)
✅ All integration tests passing
✅ All 9 user stories acceptance criteria met
✅ Performance tests meet NFR targets (< 5s end-to-end)
✅ AI categorization accuracy > 85% on test set
✅ No critical bugs or data integrity issues
✅ Code reviewed and merged to main
✅ Deployed to production and smoke tested
