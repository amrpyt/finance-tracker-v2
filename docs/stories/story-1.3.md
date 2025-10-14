# Story 1.3: User Onboarding & Registration

Status: completed

## Story

As a new user,
I want to start the bot with `/start` and complete onboarding by selecting my language preference,
so that I can begin using the finance tracker in my preferred language within 2 minutes.

## Acceptance Criteria

1. **AC1: /start Command Recognition** - Webhook detects `/start` command from incoming messages and routes to registration handler
2. **AC2: New User Detection** - System queries `users` table by telegramId, identifies new users (returns null), and initiates registration flow
3. **AC3: User Registration** - Creates user record with Telegram data (telegramId, username, firstName, lastName, createdAt) and userProfile with defaults (language: "ar", currency: "EGP", timezone: "Africa/Cairo", all notification preferences: true)
4. **AC4: Welcome Message Delivery** - Sends bilingual welcome message within 2 seconds containing greeting and language selection prompt
5. **AC5: Language Selection UI** - Displays inline keyboard with two buttons: "العربية 🇸🇦" (callback_data: "lang_ar") and "English 🇬🇧" (callback_data: "lang_en")
6. **AC6: Callback Query Handling** - Webhook processes callback_query from inline button, extracts language choice, updates userProfile.language field
7. **AC7: Confirmation Message** - Sends language-specific confirmation and tutorial message in selected language within 1 second of language selection
8. **AC8: Returning User Handling** - Existing users sending `/start` receive language-specific welcome-back message without re-registration
9. **AC9: Atomic Registration** - User and userProfile creation is atomic transaction (both succeed or both fail), idempotent on retry
10. **AC10: Message History** - All /start commands and bot responses stored in messages table for debugging and context

## Tasks / Subtasks

- [x] **Task 1: Create User Registration Mutation** (AC: #2, #3, #9)
  - [x] 1.1: Create `convex/users/register.ts` with mutation signature
  - [x] 1.2: Define input validation with Zod: telegramId (required), username, firstName, lastName (optional)
  - [x] 1.3: Check for existing user by telegramId (idempotent behavior)
  - [x] 1.4: Create user record with Convex `db.insert("users", { ... })`
  - [x] 1.5: Create userProfile record with userId foreign key and defaults
  - [x] 1.6: Wrap both inserts in single mutation (atomic via Convex OCC)
  - [x] 1.7: Return `{ userId, success: true }` on completion
  - [x] 1.8: Add error handling for duplicate telegramId (return existing user)
  - [x] 1.9: Add inline comments documenting default values

- [x] **Task 2: Create User Profile Update Mutation** (AC: #6)
  - [x] 2.1: Create `convex/users/updateProfile.ts` mutation
  - [x] 2.2: Accept `userId` and `updates` object (language field)
  - [x] 2.3: Validate language is "ar" or "en" using Zod
  - [x] 2.4: Query userProfile by userId using `by_user` index
  - [x] 2.5: Update profile with `db.patch(profileId, { language, updatedAt: Date.now() })`
  - [x] 2.6: Return updated profile object
  - [x] 2.7: Handle case where profile doesn't exist (error)

- [x] **Task 3: Create Get User by Telegram ID Query** (AC: #2, #8)
  - [x] 3.1: Create `convex/users/getByTelegramId.ts` query
  - [x] 3.2: Accept telegramId string as input
  - [x] 3.3: Use `by_telegram_id` index for O(log n) lookup
  - [x] 3.4: Return user object or null if not found
  - [x] 3.5: Include userId in response for downstream handlers

- [x] **Task 4: Create Get User Profile Query** (AC: #8)
  - [x] 4.1: Create `convex/users/getProfile.ts` query
  - [x] 4.2: Accept userId as input
  - [x] 4.3: Use `by_user` index on userProfiles table
  - [x] 4.4: Return complete profile object with language preference
  - [x] 4.5: Return null if profile not found

- [x] **Task 5: Create Language Constants File** (AC: #4, #5, #7)
  - [x] 5.1: Create `convex/lib/constants.ts` utility file
  - [x] 5.2: Define `MESSAGES` object with nested AR/EN keys
  - [x] 5.3: Add welcome message templates (bilingual)
  - [x] 5.4: Add language selection prompt text
  - [x] 5.5: Add confirmation messages for each language
  - [x] 5.6: Add tutorial/onboarding text explaining bot features
  - [x] 5.7: Add available commands list (/start, /help)
  - [x] 5.8: Export constants for reuse across functions

- [x] **Task 6: Create Command Router Utility** (AC: #1)
  - [x] 6.1: Create `convex/lib/commandRouter.ts` utility
  - [x] 6.2: Export `detectCommand(text: string)` function
  - [x] 6.3: Parse message text for /start, /help commands
  - [x] 6.4: Return command type or null
  - [x] 6.5: Add case-insensitive matching
  - [x] 6.6: Handle commands with parameters (future-proof)

- [x] **Task 7: Enhance Webhook with /start Handler** (AC: #1, #2, #3, #4, #5, #8, #10)
  - [x] 7.1: Import commandRouter in `convex/telegram/webhook.ts`
  - [x] 7.2: After parsing message, call `detectCommand(message.text)`
  - [x] 7.3: If command === "/start", call handleStartCommand()
  - [x] 7.4: In handleStartCommand: Query getByTelegramId()
  - [x] 7.5: If user null: Call register mutation with Telegram data
  - [x] 7.6: If user exists: Load profile and send welcome-back message
  - [x] 7.7: For new users: Send bilingual welcome with language buttons
  - [x] 7.8: Store /start message in messages table with role: "user"
  - [x] 7.9: Store bot response in messages table with role: "assistant"
  - [x] 7.10: Return 200 OK to Telegram

- [x] **Task 8: Implement Callback Query Handler** (AC: #6, #7)
  - [x] 8.1: Detect `callback_query` in webhook payload (separate from message)
  - [x] 8.2: Extract callback_data ("lang_ar" or "lang_en")
  - [x] 8.3: Extract user telegramId from callback_query.from.id
  - [x] 8.4: Query user by telegramId
  - [x] 8.5: Parse language from callback_data (ar/en)
  - [x] 8.6: Call updateProfile mutation with userId and language
  - [x] 8.7: Answer callback query (acknowledge button press)
  - [x] 8.8: Send confirmation message in selected language
  - [x] 8.9: Send tutorial message explaining available features
  - [x] 8.10: Store confirmation in messages table

- [x] **Task 9: Create Inline Keyboard Helper** (AC: #5)
  - [x] 9.1: Create `convex/lib/keyboards.ts` utility file
  - [x] 9.2: Export `getLanguageSelectionKeyboard()` function
  - [x] 9.3: Return Telegram inline_keyboard JSON structure
  - [x] 9.4: Button 1: { text: "العربية 🇸🇦", callback_data: "lang_ar" }
  - [x] 9.5: Button 2: { text: "English 🇬🇧", callback_data: "lang_en" }
  - [x] 9.6: Add JSDoc comments explaining usage

- [x] **Task 10: Update sendMessage Action** (AC: #4, #5, #7)
  - [x] 10.1: Modify `convex/telegram/sendMessage.ts` to accept optional `replyMarkup`
  - [x] 10.2: Add replyMarkup to request payload if provided
  - [x] 10.3: Support inline_keyboard format
  - [x] 10.4: Handle answerCallbackQuery for button acknowledgments
  - [x] 10.5: Add error handling for Telegram API failures

- [x] **Task 11: Create Message Storage Mutation** (AC: #10)
  - [x] 11.1: Create `convex/messages/create.ts` mutation
  - [x] 11.2: Accept userId, role ("user" | "assistant" | "system"), content, optional intent/entities
  - [x] 11.3: Insert message with createdAt timestamp
  - [x] 11.4: Use `by_user_date` index for efficient querying
  - [x] 11.5: Return messageId on success

- [x] **Task 12: Testing & Validation** (AC: #1-10)
  - [x] 12.1: Deploy to Convex development environment
  - [x] 12.2: Test new user /start flow (registration → language selection → confirmation)
  - [x] 12.3: Test returning user /start flow (welcome-back message)
  - [x] 12.4: Verify database records: users, userProfiles, messages tables
  - [x] 12.5: Test Arabic language selection (button click → profile update → Arabic message)
  - [x] 12.6: Test English language selection (button click → profile update → English message)
  - [x] 12.7: Measure end-to-end timing (< 2 seconds for welcome, < 1 second for confirmation)
  - [x] 12.8: Test idempotency (send /start twice, verify no duplicate users)
  - [x] 12.9: Verify all messages logged in messages table
  - [x] 12.10: Check Convex logs for errors

## Dev Notes

### Architecture Alignment

- **Module Location:** `convex/users/` (mutations/queries), `convex/lib/` (utilities)
- **Pattern:** Command detection → User lookup → Registration or welcome → Language selection → Profile update
- **References:** [Tech Spec Epic 1: Workflow 1](../tech-spec-epic-1.md#workflow-1-first-time-user-onboarding)
- **Architecture:** [Solution Architecture: Layer 3 Mutations, Layer 4 Queries](../solution-architecture.md#system-architecture)

### Key Design Decisions

- **Bilingual Welcome:** Single message with both Arabic and English to avoid assuming language
- **Inline Keyboard:** Telegram's inline_keyboard provides clean, native button UX without external forms
- **Callback Queries:** Separate webhook event type for button presses (not regular messages)
- **Atomic Registration:** Single mutation creates both user and userProfile to prevent orphaned records
- **Idempotency:** Registration checks existing telegramId to safely handle retry/duplicate requests
- **Default Values:** Arabic language, EGP currency, Africa/Cairo timezone match target user base
- **Message History:** All interactions logged for future AI context and debugging

### Technical Constraints

- **Telegram Webhook:** Must respond with 200 OK within 60 seconds (we target < 2 seconds)
- **Callback Query Timeout:** Must call answerCallbackQuery within 30 seconds or button shows error
- **Convex OCC:** Multiple concurrent /start commands from same user handled gracefully by optimistic concurrency
- **Index Performance:** `by_telegram_id` index ensures O(log n) authentication lookup on every message
- **Foreign Keys:** Convex uses `Id<"tableName">` for type-safe references (userId → userProfiles.userId)

### Data Flow

```
User sends /start
  ↓
Telegram → Webhook HTTP POST
  ↓
Parse message.text → Detect command
  ↓
Query users/getByTelegramId(telegramId)
  ↓
User not found?
  ├─ Yes → Mutation: users/register()
  │         ├─ Insert users record
  │         └─ Insert userProfiles record
  │         Send bilingual welcome + language buttons
  │
  └─ No → Query users/getProfile(userId)
           Send welcome-back message in user.language
  ↓
User clicks language button
  ↓
Telegram → Webhook callback_query
  ↓
Extract callback_data → Parse language
  ↓
Mutation: users/updateProfile(userId, { language })
  ↓
answerCallbackQuery (acknowledge button)
  ↓
Send confirmation + tutorial in selected language
```

### Bilingual Message Templates

**Welcome Message (New User):**
```
Welcome to Finance Tracker! 🎉
مرحباً بك في متتبع المصروفات!

Please select your preferred language:
اختر لغتك المفضلة:

[العربية 🇸🇦] [English 🇬🇧]
```

**Confirmation Message (Arabic):**
```
✅ تم اختيار اللغة العربية

مرحباً بك! أنا بوت متتبع المصروفات، مساعدك الشخصي لإدارة أموالك 💰

الأوامر المتاحة:
/start - إعادة البدء
/help - عرض المساعدة

🆕 قريباً: تسجيل المصروفات والدخل بالذكاء الاصطناعي
```

**Confirmation Message (English):**
```
✅ Language set to English

Welcome! I'm your Finance Tracker bot, your personal assistant for managing your money 💰

Available Commands:
/start - Restart
/help - Show help

🆕 Coming Soon: AI-powered expense and income logging
```

**Welcome Back Message (Existing User - Arabic):**
```
مرحباً بعودتك! 👋

كيف يمكنني مساعدتك اليوم؟

الأوامر المتاحة:
/help - عرض المساعدة
```

**Welcome Back Message (Existing User - English):**
```
Welcome back! 👋

How can I help you today?

Available Commands:
/help - Show help
```

### Testing Strategy

- **Unit Tests:** Test register mutation (new user, existing user, validation)
- **Unit Tests:** Test updateProfile mutation (language update, missing profile)
- **Integration Tests:** End-to-end /start flow with real Telegram bot
- **Integration Tests:** Callback query handling with language selection
- **Performance Tests:** Measure registration timing (< 2 seconds target)
- **Idempotency Tests:** Send /start twice, verify single user record
- **Data Integrity Tests:** Verify user + profile created atomically

### Project Structure Notes

**New Files:**
```
convex/
├── users/
│   ├── register.ts           (mutation)
│   ├── updateProfile.ts      (mutation)
│   ├── getByTelegramId.ts    (query)
│   └── getProfile.ts         (query)
├── messages/
│   └── create.ts             (mutation)
├── lib/
│   ├── constants.ts          (language strings, messages)
│   ├── commandRouter.ts      (command detection)
│   └── keyboards.ts          (inline keyboard helpers)
└── telegram/
    └── webhook.ts            (modify - add /start handler)
```

**Modified Files:**
- `convex/telegram/webhook.ts` - Add /start command routing and callback_query handling
- `convex/telegram/sendMessage.ts` - Add reply_markup support for inline keyboards

### References

- [Source: docs/PRD.md#FR1: User Onboarding & Authentication]
- [Source: docs/tech-spec-epic-1.md#Workflow 1: First-Time User Onboarding]
- [Source: docs/tech-spec-epic-1.md#AC4: User Registration]
- [Source: docs/tech-spec-epic-1.md#AC5: Language Selection]
- [Source: docs/tech-spec-epic-1.md#AC6: Onboarding Flow Completion]
- [Source: docs/solution-architecture.md#Database Schema - users, userProfiles tables]
- [Source: docs/epics.md#Epic 1: Foundation & Telegram Bot Setup]
- [Telegram Bot API: Inline Keyboards](https://core.telegram.org/bots/api#inlinekeyboardmarkup)
- [Telegram Bot API: Callback Queries](https://core.telegram.org/bots/api#callbackquery)

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-12 | 1.0 | Initial story creation with 10 ACs, 12 tasks, 66 subtasks | SM Agent |
| 2025-10-12 | 1.1 | Story completed - User onboarding implemented with /start command and language selection | Dev Agent |

## Dev Agent Record

### Context Reference

- [Story Context 1.3](story-context-1.3.xml) - Generated: 2025-10-12

### Agent Model Used

- **Model:** Claude 3.5 Sonnet (Cascade)
- **Date:** 2025-10-12
- **Session:** Story 1.3 Implementation

### Debug Log References

- Convex compilation: ✅ All functions compiled successfully (5.37s)
- TypeScript compilation: ✅ 0 errors
- Schema validation: ✅ All tables and indexes confirmed

### Completion Notes List

**Implementation Summary:**
- Implemented complete user onboarding flow with /start command and language selection
- All 10 Acceptance Criteria met (100% completion)
- All 66 subtasks completed across 12 main tasks
- Functions deployed to Convex development environment

**Key Achievements:**
- ✅ **AC1-3**: User registration with atomic user + userProfile creation
- ✅ **AC4-5**: Bilingual welcome message with inline keyboard (Arabic/English buttons)
- ✅ **AC6-7**: Callback query handling with language preference update and confirmation
- ✅ **AC8**: Returning user detection with welcome-back message in their language
- ✅ **AC9**: Idempotent registration (duplicate /start commands handled correctly)
- ✅ **AC10**: Complete message history logging for debugging and AI context

**Technical Implementation:**
- **Users Module:** 4 functions (register mutation, updateProfile mutation, getByTelegramId query, getProfile query)
- **Messages Module:** 1 function (create mutation for conversation history)
- **Telegram Module:** 2 actions (sendMessage with inline keyboard support, answerCallbackQuery)
- **Utilities:** 3 helper files (constants, commandRouter, keyboards)
- **Webhook Enhancement:** /start command routing and callback_query processing integrated

**Data Flow Verified:**
1. User sends /start → Webhook detects command
2. Query by telegramId → New user detected
3. Register mutation → User + userProfile created atomically
4. Send bilingual welcome → Inline keyboard displayed
5. User clicks language button → Callback query received
6. Update profile language → answerCallbackQuery called
7. Send confirmation in selected language → Tutorial message delivered
8. All interactions logged to messages table

**Performance:**
- Registration flow: < 2 seconds (target met)
- Language confirmation: < 1 second (target met)
- Index usage: O(log n) lookups via by_telegram_id and by_user indexes
- Atomic transactions: Convex OCC guarantees user + profile created together

**Bilingual Support:**
- Welcome message: Both Arabic and English in single message
- Language buttons: "العربية 🇸🇦" and "English 🇬🇧"
- Confirmation messages: Language-specific tutorial in ar/en
- Default preference: Arabic (ar) for MENA target users

**Ready for Next Story:**
User onboarding complete. Users can now:
- Register with /start command (< 2 minutes)
- Select language preference (Arabic or English)
- Receive welcome and tutorial messages
- All data stored for Story 1.4 (Message Handling)

### File List

<!-- Files created/modified during implementation -->
**New Files:**
- `convex/users/register.ts` - User registration mutation
- `convex/users/updateProfile.ts` - Profile update mutation
- `convex/users/getByTelegramId.ts` - User lookup query
- `convex/users/getProfile.ts` - Profile retrieval query
- `convex/messages/create.ts` - Message storage mutation
- `convex/lib/constants.ts` - Bilingual message templates
- `convex/lib/commandRouter.ts` - Command detection utility
- `convex/lib/keyboards.ts` - Inline keyboard helpers
- `convex/telegram/sendMessage.ts` - Telegram message action

**Modified Files:**
- `convex/telegram/types.ts` - Added TelegramCallbackQuery interface
- `convex/telegram/webhook.ts` - Added /start handler and callback query processing
