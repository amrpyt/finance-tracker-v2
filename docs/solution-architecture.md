# Finance Tracker v2.0 - Solution Architecture

**Project:** Finance-Tracker-v2.0  
**Author:** Winston (Architect) for Amr  
**Date:** 2025-10-12  
**Version:** 1.0  

---

## Executive Summary

Finance Tracker v2.0 is a comprehensive personal finance management system delivered through Telegram, leveraging 100% serverless architecture built on Convex. The system provides AI-powered natural language understanding for zero-friction financial tracking in Arabic and English.

**Key Characteristics:**
- **Architecture:** Serverless Monolith (single Convex deployment)
- **AI Strategy:** Intent-based routing with manual execution (no tool calling)
- **Repository:** Monorepo
- **Target Scale:** 5,000+ concurrent users, 100K+ transactions per user
- **Performance:** < 2 second response time (95th percentile)

**Architecture Philosophy:** Prioritizes simplicity, reliability, and maintainability over complex distributed patterns. Intent detection uses AI for understanding, but all business logic execution is in our code for predictability and debugging.

---

## Technology Stack and Decisions

### Core Technologies

| Category | Technology | Version | Rationale |
|----------|-----------|---------|-----------|
| **Backend Runtime** | Convex | 1.16.5 | Serverless TypeScript platform with reactive database, automatic scaling, zero infrastructure. |
| **Language** | TypeScript | 5.6.3 | Type safety, excellent IDE support, compile-time error checking. |
| **Database** | Convex Built-in | Platform | Reactive document database with automatic indexing and real-time subscriptions. |

### AI/NLP Layer

| Category | Technology | Version | Rationale |
|----------|-----------|---------|-----------|
| **Primary AI SDK** | RORK Toolkit SDK | Latest | Native Vercel AI SDK v5 format, Zod tool definitions, image generation, STT capabilities. |
| **AI Abstraction** | Vercel AI SDK v5 | 3.4.0 | Unified interface for multiple providers, structured outputs with Zod, easy switching. |
| **Fallback AI #1** | Google Gemini (@ai-sdk/google) | 0.0.52 | Free tier (Flash model), excellent quality, fast responses. |
| **Fallback AI #2** | Groq (@ai-sdk/groq) | 0.0.62 | Free tier, extremely fast inference (Llama 3.1 70B). |
| **Schema Validation** | Zod | 3.23.8 | Type-safe validation for AI outputs, entities, database mutations. |

### Integration & Communication

| Category | Technology | Version | Rationale |
|----------|-----------|---------|-----------|
| **Bot Platform** | Telegram Bot API | V7.10 | Cross-platform, 200M+ users in MENA, webhook support, rich formatting. |
| **Chart Generation** | QuickChart API | SaaS | Free tier 50K charts/month, generates PNG images for Telegram. |
| **HTTP Client** | Fetch API | Native | Built-in to Node.js 18+, no external dependencies. |

### Data & Utilities

| Category | Technology | Version | Rationale |
|----------|-----------|---------|-----------|
| **Date Handling** | date-fns | 3.6.0 | Lightweight, tree-shakeable, excellent date manipulation. AI parses natural language, date-fns calculates. |
| **CSV Generation** | csv-stringify | 6.5.0 | Fast, streaming CSV writer for data export. |
| **PDF Generation** | PDFKit (optional) | 0.15.0 | Node.js PDF library for report generation. Alternative: QuickChart API. |
| **Logging** | Pino | 9.4.0 | Fastest JSON logger for Node.js, low overhead, structured logs. |
| **Error Tracking** | Sentry | 8.33.1 | Free tier 5K errors/month, rich context, stack traces. |

### Development & Testing

| Category | Technology | Version | Rationale |
|----------|-----------|---------|-----------|
| **Testing Framework** | Vitest | 2.1.2 | Fast, Vite-based, modern API, excellent TypeScript support. |
| **Type Checking** | TypeScript | 5.6.3 | Strict mode enabled, compile-time error detection. |
| **Code Formatting** | Prettier | 3.3.3 | Consistent code style, auto-formatting. |
| **Linting** | ESLint | 9.12.0 | Catch errors, enforce best practices. |

### Cost Management

| Service | Tier | Monthly Cost | Limits |
|---------|------|--------------|--------|
| Convex | Free/Pro | $0-25 | Free: 1M calls/month, 1GB storage |
| RORK Toolkit | Pay-per-use | $0-30 | Based on usage |
| Gemini (Fallback) | Free | $0 | 60 req/min free tier |
| Groq (Fallback) | Free | $0 | 30 req/min free tier |
| QuickChart | Free | $0 | 50K charts/month |
| Sentry | Free | $0 | 5K errors/month |
| Telegram | Free | $0 | No charges |
| **TOTAL** | | **$0-55/month** | Well within $100 budget |

---

## System Architecture

### Data Flow

```
User Message → Telegram → Convex Webhook
  ↓
AI Intent Detection (RORK/Gemini): Returns { intent, entities, confidence }
  ↓
Manual Router (Our Code): switch(intent) → Call appropriate function
  ↓
Database Update: Mutation/Query execution
  ↓
AI Response Generation: Natural language response
  ↓
Telegram Delivery
```


**Layer 1: HTTP Actions (Entry Points)**
- `telegram/webhook.ts` - Receives all Telegram messages
- `telegram/setWebhook.ts` - One-time webhook registration

**Layer 2: Actions (External API Calls)**
- `ai/detectIntent.ts` - RORK/Gemini API (structured output)
- `ai/generateResponse.ts` - RORK/Gemini API (text generation)
- `ai/transcribeVoice.ts` - RORK STT API (voice-to-text)
- `telegram/sendMessage.ts` - Telegram Bot API
- `telegram/downloadVoice.ts` - Telegram Bot API (file download)
- `analytics/generateChart.ts` - QuickChart API

**Layer 3: Mutations (Database Writes)**
- `transactions/create.ts` - Insert transaction, update balance
- `accounts/create.ts` - Create account
- `loans/create.ts` - Record loan
{{ ... }}
- `budgets/create.ts` - Create budget
- `reminders/create.ts` - Schedule reminder

**Layer 4: Queries (Database Reads)**
- `accounts/getBalance.ts` - Current balance
- `transactions/search.ts` - Filter transactions
- `loans/list.ts` - Active loans
- `budgets/getProgress.ts` - Budget tracking

**Layer 5: Database (11 Tables)**
- users, userProfiles, accounts, transactions
- loans, loanPayments, budgets, savingsGoals
- recurringTransactions, reminders, messages

**Layer 6: Scheduled Jobs (Convex Cron)**
- `reminders/checkScheduled.ts` - Daily midnight
- `recurring/processScheduled.ts` - Daily 3am

---

## AI Integration Architecture

### Dual AI Usage Pattern (Updated 2025-10-16)

**Philosophy:** AI for TWO distinct purposes - Intent Detection + Natural Conversation

```typescript
User Message
    ↓
AI Intent Detector (parseAccountIntent)
    ↓
┌──────────────┬───────────────┬──────────────┐
│              │               │              │
create_       view_          unknown         
account       accounts       intent          
│              │               │              
↓              ↓               ↓              
Handler       Handler    AI Conversation     
                        (generateContextualResponse)
                              ↓
                         Natural Reply
```

**1. Intent Detection** (Structured Output)
- **Purpose:** Route to specific business logic handlers
- **API:** RORK `/text/llm/` endpoint (Simple OpenAI-style format)
- **ACTUAL IMPLEMENTATION:** Uses `/text/llm/` NOT `/agent/chat` - see nlParser.ts, parseExpenseIntent.ts
- **Output:** JSON with intent, entities, confidence
- **Example:** "أنشئ حساب محفظة" → `{intent: "create_account", entities: {type: "cash"}}`

**2. Conversational AI** (Free-form Response)
- **Purpose:** Handle greetings, questions, general conversation
- **API:** RORK `/text/llm/` (Simple OpenAI-style format)
- **Output:** Plain text natural response
- **Example:** "ازيك" → "أهلاً وسهلاً! أنا تمام الحمد لله، إنت عامل إيه؟"

**IMPORTANT NOTE:** Both intent detection and conversation use the SAME `/text/llm/` endpoint with simple message format. The `/agent/chat` endpoint mentioned in early designs was NOT implemented.

### Why No Tool Calling?

**Intent Detection Approach:**
- LLMs are unreliable at tool execution
- Hard to debug when tools fail
- Loss of control over business logic
- Non-deterministic behavior

**Our Approach:** AI for understanding, manual code for execution

```typescript
// Step 1: AI detects intent with structured output
const intent = await detectIntent(userMessage);
// Returns: { intent: "log_expense", entities: { amount: 50, category: "food" } }

// Step 2: OUR code routes and executes (reliable, debuggable)
switch(intent.intent) {
  case "log_expense":
    await ctx.runMutation(api.transactions.create, intent.entities);
    break;
  case "unknown":
    // NEW: Route to conversational AI instead of error
    const response = await generateContextualResponse(userMessage, language);
    return response;
  // ... more cases
}

// Step 3: Send confirmation/response
await sendMessage(chatId, response);
```

### Intent Schema

```typescript
const IntentSchema = z.object({
  intent: z.enum([
    'log_expense', 'log_income', 'check_balance',
    'create_budget', 'view_budget', 'create_loan', 
    'record_loan_payment', 'view_loans', 'create_reminder',
    'view_reminders', 'create_goal', 'add_goal_contribution',
    'view_goals', 'view_transactions', 'create_account',
    'view_accounts', 'get_analytics', 'export_data',
    'casual_chat', 'help', 'unknown'
  ]),
  confidence: z.number().min(0).max(1),
  entities: z.object({
    amount: z.number().positive().optional(),
    category: z.string().optional(),
    date: z.string().optional(), // AI parses "next Monday" → "2025-10-14"
    exportFormat: z.enum(['csv', 'pdf']).optional(),
    dataType: z.enum(['transactions', 'accounts', 'budgets', 'loans', 'goals']).optional(),
    // ... more entities
  }),
  needsConfirmation: z.boolean(),
  clarificationNeeded: z.string().optional()
});
```

### RORK API Endpoints Usage

**ACTUAL IMPLEMENTATION (as of 2025-10-18):**

We use ONLY ONE endpoint for everything: **`/text/llm/`**

```typescript
// Used for: parseAccountIntent(), parseExpenseIntent(), parseIntent(), generateContextualResponse()
// Format: Simple OpenAI-style (same for all use cases)
const rorkUrl = process.env.RORK_TOOLKIT_URL || "https://toolkit.rork.com";
const response = await fetch(`${rorkUrl}/text/llm/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ]
  })
});

// Response: Simple JSON { completion: "..." }
const data = await response.json();
return data.completion; // Parse as JSON for structured intent, or use as-is for conversation
```

**Why `/text/llm/` for everything?**
- Simpler request format (OpenAI-style vs Vercel AI SDK v5)
- Works reliably for both structured JSON output and natural conversation
- No need for SSE streaming complexity
- Proven in production (all existing parsers use it)

**Original Design (NOT implemented):**
The architecture originally mentioned `/agent/chat` with Vercel AI SDK v5 format, but this was never implemented. All actual code uses `/text/llm/` for simplicity.

**For New Stories:**
Always reference `/text/llm/` endpoint. Check nlParser.ts or parseExpenseIntent.ts for current implementation pattern.

### AI Provider Abstraction

```typescript
// Supports switching between RORK, Gemini, Groq via env variable
const provider = process.env.AI_PROVIDER; // "rork" | "google" | "groq"

if (provider === 'rork') {
  result = await rorkGenerateObject({ messages, schema });
} else if (provider === 'google') {
  result = await aiGenerateObject({ model: google('gemini-1.5-flash'), schema });
} else if (provider === 'groq') {
  result = await aiGenerateObject({ model: groq('llama-3.1-70b-versatile'), schema });
}
```

### Fallback Strategy

If primary provider fails, automatically try fallback providers in order:
1. RORK (primary)
2. Google Gemini (free tier)
3. Groq (free tier)

All providers return same schema format, ensuring consistent behavior.

---

## Voice-to-Text Integration (Epic 3 Enhancement)

### Overview

Voice messages enable hands-free transaction logging, making it faster and more natural for users to record expenses and income, especially in Arabic where typing can be slower.

**User Experience (High Confidence):**
```
User: [Sends voice message] "دفعت خمسين جنيه على القهوة"
  ↓
[Transcription with high confidence] "دفعت خمسين جنيه على القهوة"
  ↓
[Process immediately - no verification needed]
  ↓
[AI Intent Detection] { intent: "log_expense", amount: 50, category: "food" }
  ↓
Bot: "✅ تم تسجيل المصروف\n💰 50 جنيه - طعام"
```

**User Experience (Low Confidence):**
```
User: [Sends voice message] "دفعت... [unclear]... القهوة"
  ↓
[Transcription with low confidence] "دفعت شيء على القهوة"
  ↓
Bot: "🎤 سمعت: 'دفعت شيء على القهوة'"
     "هل هذا صحيح؟ (نعم/لا)"
  ↓
User: "لا، دفعت خمسين"
  ↓
Bot: "✅ تم تسجيل المصروف - 50 جنيه"
```

### Architecture Components

#### 1. Voice Message Detection

**Telegram Webhook Payload:**
```json
{
  "message": {
    "message_id": 123,
    "from": { "id": 12345, "first_name": "Amr" },
    "voice": {
      "file_id": "AwACAgIAAxkBAAIC...",
      "file_unique_id": "AgADzQQAAg...",
      "duration": 3,
      "mime_type": "audio/ogg",
      "file_size": 12345
    }
  }
}
```

#### 2. Voice Processing Flow

```
Telegram Voice Message
  ↓
Convex Webhook Handler (telegram/webhook.ts)
  ├─ Detects: message.voice exists
  ├─ Extracts: file_id
  └─ Calls: downloadVoice(file_id)
       ↓
Telegram API: getFile + download
  ├─ Get file_path from Telegram
  ├─ Download: https://api.telegram.org/file/bot<token>/<file_path>
  └─ Returns: audio file buffer
       ↓
RORK STT API (ai/transcribeVoice.ts)
  ├─ Endpoint: https://toolkit.rork.com/stt/transcribe/
  ├─ Method: POST (multipart/form-data)
  ├─ Body: { audio: file_buffer }
  └─ Returns: { text: string, language: string }
       ↓
Continue Normal Flow
  ├─ AI Intent Detection (transcribed text)
  ├─ Manual Routing
  ├─ Database Update
  └─ Response Generation
```

#### 3. Implementation Details

**Download Voice from Telegram:**
```typescript
// convex/telegram/downloadVoice.ts
export const downloadVoice = action({
  args: { fileId: v.string() },
  handler: async (ctx, args) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    // Step 1: Get file path from Telegram
    const fileResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getFile?file_id=${args.fileId}`
    );
    const fileData = await fileResponse.json();
    const filePath = fileData.result.file_path;
    
    // Step 2: Download file
    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    const audioResponse = await fetch(downloadUrl);
    const audioBuffer = await audioResponse.arrayBuffer();
    
    return { audioBuffer, filePath };
  }
});
```

**Transcribe with RORK STT:**
```typescript
// convex/ai/transcribeVoice.ts
export const transcribeVoice = action({
  args: { audioBuffer: v.any() },
  handler: async (ctx, args) => {
    // Create FormData
    const formData = new FormData();
    const blob = new Blob([args.audioBuffer], { type: 'audio/ogg' });
    formData.append('audio', blob, 'voice.ogg');
    
    // Call RORK STT API
    const response = await fetch('https://toolkit.rork.com/stt/transcribe/', {
      method: 'POST',
      body: formData
      // DO NOT set Content-Type header (auto-set by browser)
    });
    
    const result = await response.json();
    // Result: { text: string, language: string, confidence?: number }
    
    // Calculate confidence score (0-1)
    // RORK may provide confidence, otherwise estimate based on text quality
    const confidence = result.confidence || estimateConfidence(result.text);
    
    return {
      text: result.text,
      language: result.language,
      confidence
    };
  }
});

// Helper function to estimate confidence if not provided by STT API
function estimateConfidence(text: string): number {
  // Heuristics for confidence:
  // - Length: Very short or very long may indicate issues
  // - Special chars: Too many may indicate noise
  // - Word count: At least 2 words expected for transactions
  
  const wordCount = text.trim().split(/\s+/).length;
  const hasNumbers = /\d/.test(text);
  const specialCharRatio = (text.match(/[^\w\s]/g) || []).length / text.length;
  
  if (wordCount < 2) return 0.4; // Too short
  if (wordCount > 50) return 0.5; // Too long for typical transaction
  if (specialCharRatio > 0.3) return 0.5; // Too noisy
  if (!hasNumbers && wordCount < 5) return 0.6; // Likely missing amount
  
  return 0.9; // High confidence
}
```

**Updated Webhook Handler (Confidence-Based):**
```typescript
// convex/telegram/webhook.ts (enhanced)
export const webhook = httpAction(async (ctx, request) => {
  const body = await request.json();
  const message = body.message;
  const userId = message.from.id.toString();
  
  let userMessage: string;
  let requiresVerification = false;
  const CONFIDENCE_THRESHOLD = 0.75; // 75% confidence minimum
  
  // Handle voice messages
  if (message?.voice) {
    // Download voice file
    const { audioBuffer } = await ctx.runAction(api.telegram.downloadVoice, {
      fileId: message.voice.file_id
    });
    
    // Transcribe to text with confidence score
    const transcription = await ctx.runAction(api.ai.transcribeVoice, {
      audioBuffer
    });
    
    userMessage = transcription.text;
    const confidence = transcription.confidence;
    
    // Decision: High confidence → Process immediately
    //           Low confidence → Ask for verification
    if (confidence < CONFIDENCE_THRESHOLD) {
      requiresVerification = true;
      
      // Store pending transcription in user session (or database)
      await ctx.runMutation(api.messages.storePendingVerification, {
        userId,
        transcription: userMessage,
        confidence
      });
      
      // Ask user to verify
      const userLanguage = await getUserLanguage(ctx, userId);
      const verificationMessage = userLanguage === 'ar'
        ? `🎤 سمعت: "${userMessage}"\n\nهل هذا صحيح؟ (نعم/لا)`
        : `🎤 I heard: "${userMessage}"\n\nIs this correct? (yes/no)`;
      
      await sendMessage(userId, verificationMessage);
      return new Response('OK'); // Wait for user confirmation
    }
    
    // High confidence: proceed immediately
    
  } else if (message?.text) {
    // Check if this is a verification response (yes/no)
    const pendingVerification = await ctx.runQuery(api.messages.getPendingVerification, {
      userId
    });
    
    if (pendingVerification) {
      const response = message.text.toLowerCase().trim();
      
      if (response === 'نعم' || response === 'yes') {
        // User confirmed transcription
        userMessage = pendingVerification.transcription;
        await ctx.runMutation(api.messages.clearPendingVerification, { userId });
        
      } else if (response === 'لا' || response === 'no') {
        // User rejected transcription, ask for correction
        const userLanguage = await getUserLanguage(ctx, userId);
        const correctionMessage = userLanguage === 'ar'
          ? "حسناً، اكتب الرسالة الصحيحة:"
          : "Okay, please type the correct message:";
        
        await sendMessage(userId, correctionMessage);
        await ctx.runMutation(api.messages.clearPendingVerification, { userId });
        return new Response('OK');
        
      } else {
        // User is providing correction
        userMessage = message.text;
        await ctx.runMutation(api.messages.clearPendingVerification, { userId });
      }
    } else {
      // Normal text message
      userMessage = message.text;
    }
    
  } else {
    return new Response('OK');
  }
  
  // Continue with normal AI processing (same for all paths)
  const userLanguage = await getUserLanguage(ctx, userId);
  const history = await ctx.runQuery(api.messages.getRecent, { userId, limit: 5 });
  
  const intent = await detectIntent(userMessage, history, userLanguage, userId);
  const result = await executeIntent(ctx, intent, userId, userLanguage);
  const response = await generateResponse(intent, result, userLanguage, history);
  
  // Save conversation
  await ctx.runMutation(api.messages.create, {
    userId,
    role: 'user',
    content: userMessage,
    isVoiceMessage: message?.voice ? true : false
  });
  await ctx.runMutation(api.messages.create, {
    userId,
    role: 'assistant',
    content: response
  });
  
  await sendMessage(userId, response);
  
  return new Response('OK');
});
```

### Supported Voice Formats

RORK STT API supports:
- ✅ **OGG** (Telegram default for voice messages)
- ✅ **MP3**
- ✅ **M4A**
- ✅ **WAV**
- ✅ **WEBM**

Telegram voice messages are sent as `.ogg` files with Opus codec, which is natively supported.

### Error Handling & Confidence Threshold

**Confidence-Based Processing:**

```
Confidence Score >= 0.75 (75%)
  → Process immediately (no verification)
  → Fast UX, minimal friction

Confidence Score < 0.75 (75%)
  → Ask for verification
  → Show transcription: "هل قلت: [text]؟"
  → Wait for yes/no/correction
```

**Error Scenarios:**

1. **Voice file too long** (> 60 seconds)
   - Validation: Check `message.voice.duration` before processing
   - Response (AR): "الرسالة الصوتية طويلة جداً. الحد الأقصى دقيقة واحدة"
   - Response (EN): "Voice message too long. Maximum 60 seconds"

2. **Transcription failed** (RORK STT API error)
   - Retry once with exponential backoff
   - If still fails, ask user to type
   - Response (AR): "عفواً، لم أتمكن من فهم الرسالة الصوتية. هل يمكنك الكتابة؟"
   - Response (EN): "Sorry, couldn't understand voice message. Can you type it?"

3. **Low confidence transcription** (< 75%)
   - Show transcription to user for verification
   - Response (AR): `🎤 سمعت: "[text]"\n\nهل هذا صحيح؟ (نعم/لا)`
   - Response (EN): `🎤 I heard: "[text]"\n\nIs this correct? (yes/no)`
   - Store in pending verification state
   - Next message processes verification response

4. **Network timeout** (> 10 seconds)
   - Retry once, then fallback to error message
   - Response (AR): "حدث خطأ. حاول مرة أخرى"
   - Response (EN): "Error occurred. Try again"

5. **Empty transcription** (STT returns blank)
   - Treat as failed transcription
   - Response (AR): "لم أسمع شيئاً. حاول مرة أخرى"
   - Response (EN): "Couldn't hear anything. Try again"

### Performance Considerations

**Latency:**
- Voice download: ~500ms (depends on file size)
- RORK STT: ~1-2 seconds (for 5-second voice message)
- AI processing: ~1 second
- **Total:** ~3-4 seconds (acceptable for voice)

**File Size Limits:**
- Telegram voice messages: Max 20 MB
- Practical limit: 1 minute = ~100-200 KB
- No storage needed (process and discard)

### Privacy & Security

**Data Handling:**
- ✅ Voice files downloaded temporarily (not stored)
- ✅ Sent to RORK STT immediately
- ✅ Transcribed text stored in `messages` table (same as typed messages)
- ✅ Original audio NOT stored in database
- ✅ RORK STT doesn't retain audio after transcription

**User Control:**
- Users can disable voice messages (use text only)
- Voice transcription history visible in conversation
- Can delete conversation history (clears transcriptions)

### UX Enhancements

**High Confidence Flow (Seamless):**
```
User: [Voice] "دفعت خمسين جنيه على القهوة"
     ↓ (2-3 seconds)
Bot: "✅ تم تسجيل المصروف\n💰 50 جنيه - طعام\nرصيدك: 4,950 جنيه"
```
- No intermediate messages
- Fast, frictionless experience
- Transcription happens silently

**Low Confidence Flow (Verification):**
```
User: [Voice with background noise/unclear]
     ↓
Bot: "🎤 سمعت: 'دفعت شيء على القهوة'"
     "هل هذا صحيح؟ (نعم/لا)"
     ↓
User: "لا، دفعت خمسين"
     ↓
Bot: "✅ تم تسجيل المصروف - 50 جنيه"
```
- Shows transcription only when confidence low
- Gives user chance to correct
- Maintains accuracy without frustrating users

**Confidence Tuning:**
- Threshold: 0.75 (75%) - Adjustable based on user feedback
- Too low → More verification requests (slower UX)
- Too high → More errors processed (wrong data)
- Monitor accuracy metrics to optimize

**Multi-language Support:**
- RORK STT auto-detects language (Arabic/English)
- Works seamlessly with bilingual users
- Language preference applied to response
- Verification prompts match detected language

### Epic 3 Updates

**New Stories:**
- **Story 3.9:** Support voice message input
- **Story 3.10:** Voice message transcription via RORK STT with confidence scores
- **Story 3.11:** Confidence-based routing (high → process, low → verify)
- **Story 3.12:** Handle verification flow (yes/no/correction)
- **Story 3.13:** Handle voice transcription errors and retries

**Updated Epic 3 Story Count:** 13 stories (was 8)

### Testing Checklist

**High Confidence Tests:**
- [ ] Clear Arabic voice → Confidence >= 0.75 → Processes immediately
- [ ] Clear English voice → Confidence >= 0.75 → Processes immediately
- [ ] Voice "دفعت خمسين جنيه على القهوة" → Transaction created without verification
- [ ] Response time < 4 seconds for high confidence

**Low Confidence Tests:**
- [ ] Voice with background noise → Confidence < 0.75 → Asks verification
- [ ] Unclear/mumbled voice → Shows transcription for confirmation
- [ ] User responds "نعم" → Processes original transcription
- [ ] User responds "لا" → Asks for typed correction
- [ ] User types correction → Processes corrected text

**Error Handling Tests:**
- [ ] Voice > 60 seconds → Rejected with error message
- [ ] RORK STT API timeout → Retries once, then error
- [ ] Empty transcription → Error: "Couldn't hear anything"
- [ ] Network failure → Graceful error message

**Integration Tests:**
- [ ] High confidence voice + log expense → Transaction created
- [ ] Low confidence voice + verification + log expense → Transaction created
- [ ] Voice history stored in messages table with `isVoiceMessage: true`
- [ ] Pending verifications cleared after processing
- [ ] Bilingual voices (AR/EN mix) → Handles gracefully

**UX Tests:**
- [ ] High confidence: No intermediate messages shown
- [ ] Low confidence: Shows transcription + verification prompt
- [ ] Confidence threshold 0.75 can be adjusted via config
- [ ] Voice transcription accuracy > 90% for clear audio

---

## Data Architecture

### Database Schema (Complete)

Convex uses document-based storage with runtime validation. Below is the complete schema for all 11 tables.

**Schema Principles:**
1. **Soft Deletes:** `isDeleted` flag preserves audit trail
2. **Timestamps:** All tables have `createdAt`, updated tables have `updatedAt`
3. **User Isolation:** All data scoped by `userId` with indexes
4. **Comprehensive Indexes:** Every query path has supporting index

### Table Definitions

#### users (Core)
```typescript
{
  telegramId: string,        // Unique Telegram user ID
  username?: string,         // Telegram @username
  firstName?: string,
  lastName?: string,
  createdAt: number          // Unix timestamp
}
Indexes: by_telegram_id
```

#### userProfiles (Settings)
```typescript
{
  userId: Id<"users">,
  language: "ar" | "en",
  defaultAccountId?: Id<"accounts">,
  notificationPreferences: {
    budgetAlerts: boolean,
    billReminders: boolean,
    loanReminders: boolean,
    goalMilestones: boolean,
    weeklyReports: boolean
  },
  currency: string,          // "EGP"
  timezone: string,          // "Africa/Cairo"
  updatedAt: number
}
Indexes: by_user
```

#### accounts (Financial Accounts)
```typescript
{
  userId: Id<"users">,
  name: string,              // "Cash Wallet"
  type: "bank" | "cash" | "credit_card" | "digital_wallet",
  balance: number,           // Current balance
  currency: string,
  isDefault: boolean,        // One default per user
  isDeleted: boolean,        // Soft delete
  createdAt: number,
  updatedAt: number
}
Indexes: by_user, by_user_active, by_user_default
```

#### transactions (Core Data)
```typescript
{
  userId: Id<"users">,
  accountId: Id<"accounts">,
  type: "expense" | "income",
  amount: number,            // Positive number
  category: string,          // "food", "transport", etc.
  description: string,
  date: number,              // Transaction date (can be backdated)
  isDeleted: boolean,
  createdAt: number,
  updatedAt?: number
}
Indexes: by_user, by_user_date, by_account, by_user_category, by_user_type, by_user_active
```

#### loans (Peer-to-Peer Lending)
```typescript
{
  userId: Id<"users">,       // Lender
  borrowerName: string,
  originalAmount: number,
  remainingAmount: number,   // Updated on payments
  dueDate?: number,
  status: "active" | "paid" | "overdue",
  notes?: string,
  isDeleted: boolean,
  createdAt: number,
  updatedAt: number
}
Indexes: by_user, by_user_status, by_user_active
```

#### loanPayments
```typescript
{
  loanId: Id<"loans">,
  userId: Id<"users">,
  amount: number,
  paymentDate: number,
  notes?: string,
  createdAt: number
}
Indexes: by_loan, by_user
```

#### budgets (Monthly Budgets)
```typescript
{
  userId: Id<"users">,
  month: number,             // 1-12
  year: number,
  categories: Array<{
    category: string,
    limit: number,
    spent: number            // Updated on transactions
  }>,
  totalLimit: number,
  totalSpent: number,
  createdAt: number,
  updatedAt: number
}
Indexes: by_user, by_user_period
```

#### savingsGoals
```typescript
{
  userId: Id<"users">,
  name: string,              // "Summer Vacation"
  description?: string,
  targetAmount: number,
  currentAmount: number,     // Updated on contributions
  deadline?: number,
  status: "active" | "achieved" | "cancelled",
  isDeleted: boolean,
  createdAt: number,
  updatedAt: number
}
Indexes: by_user, by_user_status, by_user_active
```

#### goalContributions
```typescript
{
  goalId: Id<"savingsGoals">,
  userId: Id<"users">,
  amount: number,
  contributionDate: number,
  notes?: string,
  createdAt: number
}
Indexes: by_goal, by_user
```

#### recurringTransactions (Automation)
```typescript
{
  userId: Id<"users">,
  accountId: Id<"accounts">,
  type: "expense" | "income",
  amount: number,
  category: string,
  description: string,
  recurrencePattern: "daily" | "weekly" | "monthly" | "yearly",
  nextExecutionDate: number,
  isActive: boolean,         // Can be paused
  createdAt: number,
  updatedAt: number
}
Indexes: by_user, by_next_execution, by_user_active
```

#### reminders (Custom + Bills)
```typescript
{
  userId: Id<"users">,
  type: "bill" | "loan_payment" | "custom" | "budget_check",
  title: string,             // "Pay Ahmed"
  description?: string,
  scheduledDate: number,     // When to send reminder
  isCompleted: boolean,
  relatedEntityId?: string,  // Link to loan/bill/budget
  createdAt: number,
  completedAt?: number
}
Indexes: by_user, by_scheduled_date, by_user_pending
```

#### messages (Conversation History)
```typescript
{
  userId: Id<"users">,
  role: "user" | "assistant" | "system",
  content: string,           // Message text (or transcription from voice)
  isVoiceMessage?: boolean,  // True if originated from voice input
  intent?: string,           // Detected intent (for debugging)
  entities?: any,            // Extracted entities
  createdAt: number
}
Indexes: by_user, by_user_date
```

### Index Rationale

| Index | Supports Query | Epic |
|-------|----------------|------|
| `users.by_telegram_id` | Lookup user on every message | All |
| `accounts.by_user_active` | List active accounts | Epic 2 |
| `transactions.by_user_date` | Date range filtering | Epic 5 |
| `transactions.by_user_category` | Category breakdown | Epic 10 |
| `loans.by_user_status` | Active loans list | Epic 4 |
| `budgets.by_user_period` | Current month budget | Epic 6 |
| `reminders.by_scheduled_date` | Cron job lookup | Epic 9 |
| `recurringTransactions.by_next_execution` | Cron job lookup | Epic 8 |

---

## Proposed Source Tree

```
Finance-Tracker-v2.0/
│
├── convex/                           # All backend code
│   │
│   ├── schema.ts                     # Database schema (all 11 tables)
│   ├── convex.json                   # Convex configuration
│   │
│   ├── telegram/                     # Telegram integration
│   │   ├── webhook.ts                # HTTP Action: receives messages (text + voice)
│   │   ├── sendMessage.ts            # Action: sends messages to Telegram
│   │   ├── downloadVoice.ts          # Action: download voice message from Telegram
│   │   └── setWebhook.ts             # HTTP Action: webhook registration
│   │
│   ├── ai/                           # AI provider abstraction
│   │   ├── config.ts                 # getAIProvider() - switches providers
│   │   ├── intentDetector.ts         # detectIntent() with Zod schema
│   │   ├── responseGenerator.ts      # generateResponse() natural language
│   │   ├── transcribeVoice.ts        # Action: RORK STT (voice-to-text)
│   │   ├── schemas.ts                # IntentSchema and other Zod schemas
│   │   └── fallback.ts               # Multi-provider fallback logic
│   │
│   ├── users/                        # User management
│   │   ├── register.ts               # Mutation: create user
│   │   ├── updateProfile.ts          # Mutation: update language, settings
│   │   ├── getProfile.ts             # Query: fetch user profile
│   │   └── delete.ts                 # Mutation: account deletion
│   │
│   ├── accounts/                     # Account management (Epic 2)
│   │   ├── create.ts                 # Mutation
│   │   ├── update.ts                 # Mutation
│   │   ├── delete.ts                 # Mutation (soft delete)
│   │   ├── setDefault.ts             # Mutation
│   │   ├── list.ts                   # Query: all accounts
│   │   ├── getById.ts                # Query
│   │   └── getTotalBalance.ts        # Query
│   │
│   ├── transactions/                 # Transaction logging (Epic 3, 5, 7)
│   │   ├── create.ts                 # Mutation: log expense/income
│   │   ├── update.ts                 # Mutation: edit transaction
│   │   ├── delete.ts                 # Mutation: soft delete
│   │   ├── getRecent.ts              # Query: last N transactions
│   │   ├── search.ts                 # Query: filter by date/category/account
│   │   ├── getByDateRange.ts         # Query
│   │   └── getByCategory.ts          # Query
│   │
│   ├── loans/                        # Loan tracking (Epic 4)
│   │   ├── create.ts                 # Mutation
│   │   ├── update.ts                 # Mutation
│   │   ├── recordPayment.ts          # Mutation: partial payment
│   │   ├── list.ts                   # Query: all loans
│   │   ├── getById.ts                # Query
│   │   ├── getPaymentHistory.ts      # Query
│   │   └── getSummary.ts             # Query: total lent, outstanding
│   │
│   ├── budgets/                      # Budget planning (Epic 6)
│   │   ├── create.ts                 # Mutation
│   │   ├── update.ts                 # Mutation
│   │   ├── delete.ts                 # Mutation
│   │   ├── getCurrent.ts             # Query: current month
│   │   ├── getProgress.ts            # Query: spending vs limits
│   │   ├── checkThresholds.ts        # Query: check alert conditions
│   │   └── sendAlert.ts              # Action: Telegram notification
│   │
│   ├── goals/                        # Savings goals (Epic 7)
│   │   ├── create.ts                 # Mutation
│   │   ├── update.ts                 # Mutation
│   │   ├── delete.ts                 # Mutation
│   │   ├── addContribution.ts        # Mutation
│   │   ├── list.ts                   # Query
│   │   ├── getProgress.ts            # Query
│   │   └── getEstimatedCompletion.ts # Query
│   │
│   ├── recurring/                    # Recurring transactions (Epic 8)
│   │   ├── create.ts                 # Mutation
│   │   ├── update.ts                 # Mutation
│   │   ├── pause.ts                  # Mutation
│   │   ├── delete.ts                 # Mutation
│   │   ├── list.ts                   # Query
│   │   └── processScheduled.ts       # Cron: daily 3am
│   │
│   ├── reminders/                    # Reminders system (Epic 9)
│   │   ├── create.ts                 # Mutation
│   │   ├── update.ts                 # Mutation
│   │   ├── delete.ts                 # Mutation
│   │   ├── markComplete.ts           # Mutation
│   │   ├── list.ts                   # Query
│   │   ├── getUpcoming.ts            # Query
│   │   ├── checkScheduled.ts         # Cron: daily midnight
│   │   └── sendReminder.ts           # Action: Telegram notification
│   │
│   ├── analytics/                    # Analytics & charts (Epic 10)
│   │   ├── getSpendingByPeriod.ts    # Query
│   │   ├── getCategoryBreakdown.ts   # Query
│   │   ├── getIncomeVsExpenses.ts    # Query
│   │   ├── getTrends.ts              # Query
│   │   ├── generateChart.ts          # Action: QuickChart API
│   │   ├── generateInsights.ts       # Action: AI-powered insights
│   │   ├── exportCSV.ts              # Action: Generate CSV export
│   │   └── exportPDF.ts              # Action: Generate PDF report (via QuickChart)
│   │
│   ├── messages/                     # Conversation history
│   │   ├── create.ts                 # Mutation: store message
│   │   ├── getRecent.ts              # Query: last N messages
│   │   ├── deleteHistory.ts          # Mutation: clear history
│   │   ├── storePendingVerification.ts  # Mutation: save low-confidence transcription
│   │   ├── getPendingVerification.ts    # Query: check if user has pending verification
│   │   └── clearPendingVerification.ts  # Mutation: clear verification state
│   │
│   └── lib/                          # Shared utilities
│       ├── errors.ts                 # AppError class, error factory
│       ├── validation.ts             # Zod schemas for mutations
│       ├── constants.ts              # Categories, currencies
│       ├── intentRouter.ts           # Manual intent routing
│       └── helpers.ts                # Common utilities
│
├── docs/                             # Documentation
│   ├── PRD.md                        # Product requirements
│   ├── epics.md                      # Epic breakdown
│   ├── solution-architecture.md      # This document
│   └── project-workflow-analysis.md  # Project classification
│
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── .gitignore
└── README.md
```

### File Naming Conventions

- **Mutations:** Verb names (`create.ts`, `update.ts`, `delete.ts`)
- **Queries:** Noun or getter names (`list.ts`, `getById.ts`, `getProgress.ts`)
- **Actions:** Verb + noun (`sendMessage.ts`, `generateChart.ts`)
- **Cron:** Task + "Scheduled" (`processScheduled.ts`, `checkScheduled.ts`)

---

## Cross-Cutting Concerns

### Error Handling

**Strategy:** Custom error class with bilingual messages

```typescript
// convex/lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    public messageEn: string,
    public messageAr: string,
    public statusCode: number = 400
  ) {
    super(messageEn);
  }
  
  getLocalizedMessage(language: 'ar' | 'en'): string {
    return language === 'ar' ? this.messageAr : this.messageEn;
  }
}

// Error factory
export const Errors = {
  MISSING_AMOUNT: new AppError(
    'MISSING_AMOUNT',
    'Amount is required',
    'المبلغ مطلوب',
    400
  ),
  ACCOUNT_NOT_FOUND: new AppError(
    'ACCOUNT_NOT_FOUND',
    'Account not found',
    'الحساب غير موجود',
    404
  ),
  // ... more errors
};
```

### Logging

**Strategy:** Structured JSON logging with Pino

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  }
});

// Usage
logger.info({ userId, intent }, 'Intent detected');
logger.error({ error, userId }, 'Failed to create transaction');
```

### Validation

**Strategy:** Zod schemas at function boundaries

```typescript
// convex/lib/validation.ts
export const CreateTransactionSchema = z.object({
  userId: z.string(),
  accountId: z.string(),
  type: z.enum(['expense', 'income']),
  amount: z.number().positive().max(1000000),
  category: z.string().min(1),
  description: z.string().max(500)
});

// Usage in mutation
export const create = mutation({
  args: { /* Convex validators */ },
  handler: async (ctx, args) => {
    // Additional validation
    const validated = CreateTransactionSchema.parse(args);
    // Proceed with validated data
  }
});
```

### Authentication

**Strategy:** Telegram-based authentication (no passwords)

Every message includes Telegram user ID. On first message:
1. Look up user by `telegramId` in database
2. If not found, create user record
3. Store user ID in all subsequent operations

**Security:** Telegram webhook signature verification prevents impersonation.

### Monitoring

**Tools:**
- **Sentry:** Error tracking with stack traces, user context
- **Convex Dashboard:** Function execution logs, performance metrics
- **Pino Logs:** Structured logs for debugging

**Metrics to Track:**
- AI provider success/failure rates
- Response times (p50, p95, p99)
- Error rates by type
- User engagement (daily active users)
- Feature adoption (% using budgets, goals, loans)

---

## Data Export Architecture (FR14 / NFR8)

### Overview

Users need ability to export financial data for:
- **Tax preparation:** Annual income/expense reports
- **Data portability:** GDPR compliance requirement
- **External analysis:** Use in Excel/Google Sheets
- **Backup:** Personal data archival

### Export Capabilities

#### 1. CSV Export

**Supported Data Types:**
- All transactions (filtered by date range)
- Account balances (snapshot)
- Budget summaries (by month)
- Loan records with payment history
- Savings goal progress

**Format:**
```csv
Date,Type,Category,Amount,Account,Description
2025-10-12,Expense,Food,50.00,Cash Wallet,Lunch
2025-10-11,Income,Salary,5000.00,Bank Account,Monthly salary
...
```

**Implementation:**
```typescript
// convex/analytics/exportCSV.ts
export const exportCSV = action({
  args: { 
    userId: v.string(),
    dataType: v.union(
      v.literal("transactions"),
      v.literal("accounts"),
      v.literal("budgets"),
      v.literal("loans"),
      v.literal("goals")
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // 1. Fetch data from database (via queries)
    const data = await ctx.runQuery(/* appropriate query */);
    
    // 2. Convert to CSV format
    const csvContent = convertToCSV(data);
    
    // 3. Upload to temporary storage or send directly
    // Option A: Send as Telegram document
    await sendTelegramDocument(args.userId, csvContent, 'export.csv');
    
    // Option B: Generate download link (requires file hosting)
    // const url = await uploadToStorage(csvContent);
    // return { url, expiresIn: 3600 };
    
    return { success: true };
  }
});
```

**Telegram Integration:**
- User types: "Export my transactions for October"
- AI detects intent: `export_data`
- Bot generates CSV
- Sends as file attachment in Telegram chat
- File auto-expires after download or 24 hours

#### 2. PDF Reports

**Report Types:**
- **Monthly Statement:** Summary of income, expenses, balances
- **Budget Report:** Budget vs actual with charts
- **Annual Summary:** Year-end financial overview
- **Loan Summary:** All active loans with payment schedules

**Format:**
- Professional PDF layout
- Bilingual support (Arabic/English)
- Includes charts (via QuickChart)
- User branding (name, date range)

**Implementation Strategy:**

**Option A: QuickChart PDF Endpoint (Recommended)**
```typescript
// convex/analytics/exportPDF.ts
export const exportPDF = action({
  args: { 
    userId: v.string(),
    reportType: v.union(
      v.literal("monthly_statement"),
      v.literal("budget_report"),
      v.literal("annual_summary"),
      v.literal("loan_summary")
    ),
    month: v.optional(v.number()),
    year: v.number()
  },
  handler: async (ctx, args) => {
    // 1. Fetch data
    const data = await fetchReportData(ctx, args);
    
    // 2. Generate charts via QuickChart
    const charts = await generateCharts(data);
    
    // 3. Build HTML template
    const htmlContent = buildReportHTML(data, charts, language);
    
    // 4. Convert to PDF via QuickChart or alternative
    // QuickChart has experimental PDF endpoint
    const pdfUrl = await fetch('https://quickchart.io/html-to-pdf', {
      method: 'POST',
      body: JSON.stringify({ html: htmlContent })
    });
    
    // 5. Send to user
    await sendTelegramDocument(args.userId, pdfUrl, 'report.pdf');
    
    return { success: true };
  }
});
```

**Option B: PDFKit (Node.js library)**
```typescript
// If QuickChart PDF doesn't meet needs
import PDFDocument from 'pdfkit';

const generatePDF = async (data) => {
  const doc = new PDFDocument();
  doc.fontSize(20).text('Finance Report', { align: 'center' });
  doc.fontSize(12).text(`Period: ${startDate} - ${endDate}`);
  // ... add tables, charts, etc.
  return doc;
};
```

### Architecture Components

```
User: "Export my October transactions"
  ↓
AI Intent Detection: { intent: "export_data", format: "csv", period: "October" }
  ↓
Intent Router: case "export_data" → analytics/exportCSV.ts
  ↓
Export Action:
  1. Query transactions (October filter)
  2. Convert to CSV format
  3. Generate temporary file
  4. Send via Telegram sendDocument API
  ↓
User receives: finance_export_2025_10.csv (in Telegram chat)
```

### Data Privacy & Compliance

**GDPR Compliance:**
- ✅ **Right to Data Portability:** CSV export enables data transfer
- ✅ **Right to Access:** Users can export all their data
- ✅ **Right to Erasure:** Combined with soft deletes, users can request full deletion after export

**Security:**
- Exports only include user's own data (userId scoped)
- No shared exports (each user gets their own data)
- Files sent directly to user's Telegram (private chat)
- No long-term storage of export files

**Rate Limiting:**
- Max 5 exports per day per user (prevent abuse)
- Max file size: 20 MB (Telegram document limit)

### Technology Additions

| Technology | Purpose | Version | Notes |
|-----------|---------|---------|-------|
| **csv-stringify** | CSV generation | 6.5.0 | Fast, streaming CSV writer |
| **PDFKit** (optional) | PDF generation | 0.15.0 | Node.js PDF library (if not using QuickChart PDF) |
| **QuickChart PDF API** | PDF generation | N/A (API) | HTML-to-PDF conversion (experimental) |

### User Experience

**CSV Export Flow:**
```
User: "أريد تصدير معاملات أكتوبر" (Export October transactions)
  ↓
Bot: "جاري تجهيز ملف CSV..." (Preparing CSV file...)
  ↓
Bot: [Sends file: transactions_october_2025.csv]
     "✅ تم التصدير! الملف يحتوي على 45 معاملة" 
     (Exported! File contains 45 transactions)
```

**PDF Report Flow:**
```
User: "أريد تقرير شهري" (I want monthly report)
  ↓
Bot: "لأي شهر؟" (Which month?)
  ↓
User: "أكتوبر" (October)
  ↓
Bot: "جاري إنشاء التقرير..." (Creating report...)
     [Processing: 5-10 seconds for chart generation + PDF]
  ↓
Bot: [Sends file: monthly_report_october_2025.pdf]
     "✅ تقريرك جاهز! يحتوي على ملخص المصروفات والرسوم البيانية"
     (Your report is ready! Contains expense summary and charts)
```

### Implementation Priority

**Phase 1 (MVP):**
- ✅ CSV export for transactions
- ✅ Basic date range filtering

**Phase 2:**
- ✅ CSV export for all data types (accounts, budgets, loans, goals)
- ✅ Monthly PDF statement

**Phase 3:**
- ✅ Advanced PDF reports with charts
- ✅ Annual summary reports
- ✅ Custom date range exports

### Epic Assignment

**Add to Epic 10 (Analytics & Insights):**
- Story 10.9: Export transactions to CSV
- Story 10.10: Generate monthly PDF statement
- Story 10.11: Custom date range exports

**Updated Epic 10 Story Count:** 11 stories (was 8)

---

## Implementation Guidance

### Phase 1: Foundation (Weeks 1-4)

**Epic 1: Bot Setup**
1. Create Convex project: `npx convex init`
2. Set up Telegram bot via @BotFather
3. Implement `telegram/webhook.ts` HTTP action
4. Register webhook with Telegram
5. Test message reception and echo bot

**Epic 2: Accounts**
1. Define `accounts` table in schema
2. Implement mutations (create, update, delete)
3. Implement queries (list, getBalance)
4. Add AI intent for "create account"
5. Test account CRUD via Telegram

**Epic 3: Transactions + AI**
1. Define `transactions` table
2. Implement AI intent detection (RORK/Gemini setup)
3. Create intent router with "log_expense" case
4. Implement transaction creation with balance update
5. Test end-to-end: message → AI → database → response

### Phase 2: Extended Features (Weeks 5-12)

**Epics 4-7** (Loans, History, Budgets, Goals)
- Follow same pattern: Schema → Mutations → Queries → AI Intent → Test
- Each epic is independent after Epic 3 is complete

### Phase 3: Advanced Features (Weeks 13-20)

**Epic 8-9** (Recurring, Reminders)
- Add Convex cron jobs
- Test scheduled execution

**Epic 10** (Analytics)
- Implement aggregation queries
- Integrate QuickChart API
- Cache charts for performance

### Development Workflow

1. **Schema First:** Define table structure
2. **Mutations/Queries:** Implement database operations
3. **AI Intent:** Add new intent to schema
4. **Router:** Add case to intent router
5. **Test:** Manual testing via Telegram
6. **Unit Tests:** Write Vitest tests for business logic

### Deployment

```bash
# Development
npx convex dev

# Production
npx convex deploy

# Environment variables (set via Convex dashboard)
AI_PROVIDER=rork
RORK_API_KEY=xxx
GOOGLE_GENERATIVE_AI_API_KEY=xxx
GROQ_API_KEY=xxx
TELEGRAM_BOT_TOKEN=xxx
SENTRY_DSN=xxx
```

### Testing Strategy

**Unit Tests (Vitest):**
- Test business logic functions (validation, calculations)
- Test intent router logic
- Test error handling

**Integration Tests:**
- Test database mutations/queries
- Test AI provider switching
- Test webhook handling

**Manual Testing:**
- User journeys via Telegram
- Edge cases (empty messages, invalid amounts)
- Multi-language testing (Arabic/English)

---

## Architecture Decision Records (ADRs)

### ADR-001: Intent Detection Without Tool Calling

**Status:** Accepted  
**Date:** 2025-10-12

**Context:**
LLMs support tool/function calling where AI directly invokes functions. However, this approach has reliability issues.

**Decision:**
Use intent detection with structured output (Zod schema), then manual routing in our code.

**Rationale:**
- LLMs hallucinate tool calls (unreliable)
- Hard to debug when tools fail
- Loss of control over business logic
- Non-deterministic behavior

**Consequences:**
- ✅ Full control over execution
- ✅ Easy debugging
- ✅ Deterministic, testable
- ❌ Slightly more code (manual router)

---

### ADR-002: Serverless Monolith Over Microservices

**Status:** Accepted  
**Date:** 2025-10-12

**Context:**
Could architect as microservices (separate services for accounts, transactions, loans, etc.)

**Decision:**
Single Convex deployment with domain-organized functions.

**Rationale:**
- 5,000 users doesn't require microservices complexity
- Most features share data (transactions, accounts, users)
- Simpler to develop and test
- Lower operational overhead
- Convex functions already isolated and scalable

**Consequences:**
- ✅ Simple deployment
- ✅ Easy code sharing
- ✅ Fast development
- ❌ All features in one deployment (acceptable at this scale)

---

### ADR-003: AI Provider Abstraction Layer

**Status:** Accepted  
**Date:** 2025-10-12

**Context:**
Need flexibility to switch between RORK, Gemini, Groq based on availability and cost.

**Decision:**
Create unified interface that works with RORK SDK and AI SDK v5.

**Rationale:**
- Provider outages should not break system
- Cost optimization by switching to free tiers
- Evaluate quality across providers
- Easy A/B testing

**Consequences:**
- ✅ Flexible provider switching
- ✅ Automatic fallback on failure
- ✅ Cost control
- ❌ Slight abstraction overhead (minimal)

---

### ADR-004: Soft Deletes for Audit Trail

**Status:** Accepted  
**Date:** 2025-10-12

**Context:**
Need to handle user-initiated deletions (transactions, accounts, loans).

**Decision:**
Use `isDeleted: boolean` flag instead of physical deletion.

**Rationale:**
- Preserve audit trail for financial data
- Allow "undo" functionality
- Investigate discrepancies
- Compliance readiness (GDPR allows logical deletion)

**Consequences:**
- ✅ Full audit trail
- ✅ Undo capability
- ✅ Data integrity
- ❌ Queries must filter `isDeleted: false` (handled by indexes)

---

### ADR-005: Date Handling Split (AI + date-fns)

**Status:** Accepted  
**Date:** 2025-10-12

**Context:**
Users enter dates in natural language ("next Monday", "tomorrow"). Need reliable parsing and calculation.

**Decision:**
- AI parses natural language → ISO date string
- date-fns handles calculations (ranges, formatting)

**Rationale:**
- AI good at natural language understanding
- date-fns reliable for date math
- Separation of concerns

**Consequences:**
- ✅ Natural language support
- ✅ Reliable calculations
- ✅ Best of both worlds

---

## Next Steps

1. **Immediate:** Review and approve this architecture
2. **Week 1:** Set up Convex project + Telegram bot
3. **Week 2-4:** Implement Epic 1-3 (Foundation)
4. **Week 5-12:** Extended features (Epic 4-7)
5. **Week 13-20:** Advanced features (Epic 8-10)
6. **Ongoing:** Monitoring, optimization, user feedback

---

**Document Status:** ✅ Complete and Ready for Implementation  
**Next Action:** Begin Epic 1 implementation (Convex + Telegram setup)  
**Estimated Timeline:** 20 weeks to full v2.0 launch
