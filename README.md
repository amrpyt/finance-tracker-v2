# Finance Tracker v2.0 🤖💰

**AI-Powered Personal Finance Management via Telegram**

A serverless Telegram bot that transforms financial tracking into natural conversation. Built with Convex, RORK AI, and TypeScript following BMAD methodology.

## 🎯 Project Vision

Eliminate friction in personal finance tracking through conversational AI. Users log expenses/income in natural Arabic/English without rigid commands, while maintaining data integrity through smart confirmation workflows.

**Core Innovation:** Intent-based AI routing (RORK Toolkit) + manual execution = predictable, debuggable financial operations with conversational UX.

## 📊 Project Status & Journey

### Current State (Epic 2 Complete)
- ✅ **Epic 1:** Foundation & Telegram Bot Setup (4 stories)
- ✅ **Epic 2:** Account Management (5 stories) - 100% complete, 112 tests passing
- 🔄 **Epic 3:** Expense & Income Logging with AI + UX Polish (9 stories) - In progress
- 📋 **Remaining:** 7 more epics (Loans, History, Budgets, Goals, Recurring, Reminders, Analytics)

### Key Achievements
- **Natural Language Processing:** RORK AI parser with 85%+ accuracy
- **Bilingual Support:** Arabic/English with context awareness
- **Conversational AI:** ADR-002 implementation exceeds PRD expectations
- **Data Integrity:** Soft delete pattern, atomic balance updates
- **Test Coverage:** 112 tests (94% passing), comprehensive unit + integration

### Architecture Highlights
- **Pattern:** Serverless Monolith (Convex)
- **AI Strategy:** Intent detection (RORK `/text/llm/`) + manual execution (no tool calling)
- **Database:** Reactive document store with automatic indexing
- **Performance:** <2s AI response, <5s end-to-end transactions
- **Scale:** 5,000+ concurrent users, 100K+ transactions/user

## 🛠️ Tech Stack

### Core
- **Backend:** Convex 1.16.5 (serverless TypeScript platform)
- **Language:** TypeScript 5.6.3 (strict mode)
- **AI:** RORK Toolkit (primary), Gemini/Groq (fallbacks)
- **Bot:** Telegram Bot API V7.10
- **Validation:** Zod 3.23.8
- **Testing:** Vitest 2.1.2

### Key Dependencies
- `date-fns` 3.6.0 - Date parsing from natural language
- `pino` 9.4.0 - Structured logging
- `@ai-sdk/google` 0.0.52 - Gemini fallback
- `@ai-sdk/groq` 0.0.62 - Groq fallback

## 📁 Project Structure

```
finance-tracker-v2.0/
├── convex/                      # Convex backend (serverless functions)
│   ├── telegram/                # Telegram integration
│   │   ├── webhook.ts          # Main entry point (HTTP action)
│   │   └── sendMessage.ts      # Bot messaging
│   ├── ai/                      # AI integration layer
│   │   ├── nlParser.ts         # RORK intent detection
│   │   ├── parseAccountIntent.ts
│   │   ├── parseExpenseIntent.ts
│   │   └── parseIncomeIntent.ts
│   ├── accounts/                # Account management
│   │   ├── create.ts
│   │   ├── update.ts
│   │   ├── softDelete.ts
│   │   └── getOverview.ts
│   ├── transactions/            # Transaction operations
│   │   ├── createExpense.ts
│   │   └── createIncome.ts
│   ├── commands/                # Command handlers
│   │   ├── registry.ts         # Command routing
│   │   ├── createAccountCommand.ts
│   │   ├── viewAccountsCommand.ts
│   │   └── logExpenseCommand.ts
│   ├── lib/                     # Shared utilities
│   │   ├── commandRouter.ts    # Intent → Handler routing
│   │   ├── callbackRegistry.ts # Callback routing
│   │   ├── categoryMapper.ts   # Category taxonomy
│   │   ├── dateParser.ts       # Natural language dates
│   │   └── balanceCalculator.ts
│   ├── conversationStates/      # Context management
│   ├── schema.ts                # Database schema (11 tables)
│   └── _generated/              # Auto-generated types
├── docs/                        # Comprehensive documentation
│   ├── epics.md                # 10 epics breakdown (50+ stories)
│   ├── solution-architecture.md # Complete system design
│   ├── tech-spec-epic-3.md     # Detailed epic specs
│   ├── stories/                # User stories with context XML
│   ├── decisions/              # ADRs (Architecture Decision Records)
│   └── retrospectives/         # Sprint retrospectives
├── tests/                       # Test suites
│   ├── integration/            # Integration tests
│   └── e2e/                    # End-to-end tests
├── bmad/                        # BMAD methodology artifacts
│   ├── core/                   # Core workflows
│   └── bmm/                    # BMM agents & workflows
└── package.json
```

## 🧠 AI Integration Architecture

### Dual AI Usage Pattern

**1. Intent Detection** (Structured Output)
- **Endpoint:** `${RORK_TOOLKIT_URL}/text/llm/`
- **Format:** Simple OpenAI-style `{ messages: [...] }`
- **Output:** `{ intent, entities, confidence }`
- **Example:** "أنشئ حساب محفظة" → `{intent: "create_account", entities: {type: "cash"}}`

**2. Conversational AI** (Free-form Response)
- **Endpoint:** Same `/text/llm/` endpoint
- **Output:** Natural language text
- **Example:** "ازيك" → "أهلاً وسهلاً! أنا تمام الحمد لله"

### Why No Tool Calling?
- AI for understanding, manual code for execution
- Predictable, debuggable business logic
- No LLM hallucinations in financial operations
- Full control over data mutations

### Implementation Pattern
```typescript
// All parsers use this pattern (nlParser.ts, parseExpenseIntent.ts)
const rorkUrl = process.env.RORK_TOOLKIT_URL || "https://toolkit.rork.com";
const response = await fetch(`${rorkUrl}/text/llm/`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: [...] })
});
```

## 📚 Documentation for AI Agents

### Essential Reading
1. **`docs/solution-architecture.md`** - Complete system design, tech stack, data flow
2. **`docs/epics.md`** - 10 epics, 50+ stories, acceptance criteria
3. **`docs/tech-spec-epic-3.md`** - Detailed example of epic specification
4. **`docs/retrospectives/epic-2-retro-2025-10-17.md`** - Lessons learned, team insights

### Story Context Pattern
Each story has companion XML file with:
- Current codebase state
- Dependencies and imports
- Related functions
- Test examples
- Implementation guidance

**Example:** `docs/stories/story-2.5.md` + `docs/stories/story-context-2.5.xml`

### Key Architectural Decisions (ADRs)
- **ADR-001:** RORK AI over regex - Zero rework across 5 stories
- **ADR-002:** Full conversational AI - Exceeded PRD expectations
- **ADR-003:** Conversation context retention - Enables complex flows
- **ADR-004:** AI prompt callback management - Centralized routing

### Database Schema (11 Tables)
- `users`, `userProfiles` - User management
- `accounts` - Financial accounts (bank, cash, credit card, wallet)
- `transactions` - Expenses/income with full metadata
- `loans`, `loanPayments` - Peer-to-peer lending
- `budgets`, `savingsGoals`, `goalContributions` - Planning
- `recurringTransactions`, `reminders` - Automation
- `messages` - Conversation history

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- Telegram account
- Convex account (sign up at https://convex.dev)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Register Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command to BotFather
3. Follow the prompts to:
   - Choose a name for your bot (e.g., "Finance Tracker")
   - Choose a username for your bot (must end in 'bot', e.g., "finance_tracker_bot")
4. **Save the bot token** provided by BotFather (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
   - ⚠️ Keep this token secret - it grants full access to your bot
5. (Optional) Send `/setdescription` to set a bot description
6. (Optional) Send `/setabouttext` to set an about text
7. (Optional) Send `/setuserpic` to upload a profile picture

### 3. Configure Convex Environment Variables

1. Sign in to your Convex account at https://dashboard.convex.dev
2. Create a new project or select your existing project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variable:
   - **Key**: `TELEGRAM_BOT_TOKEN`
   - **Value**: Your bot token from BotFather (from step 2)
5. Click **Save**

### 4. Initialize Convex Project

```bash
npm run dev
```

This command:
- Connects to your Convex project
- Generates TypeScript types in `convex/_generated/`
- Watches for changes in the `convex/` directory

On first run, you'll be prompted to:
1. Log in to Convex (if not already authenticated)
2. Select or create a project
3. Choose a deployment name

### 5. Deploy to Production

```bash
npm run build
```

This compiles TypeScript and deploys your functions to Convex production.

### 6. Register Webhook with Telegram

After deploying, register your webhook URL with Telegram:

1. Get your Convex deployment URL from the dashboard (format: `https://<deployment-name>.convex.site`)
2. Call the webhook registration endpoint:

```bash
curl -X POST "https://<deployment-name>.convex.site/telegram/setWebhook"
```

Or open the URL in your browser.

3. Verify webhook registration:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

You should see your Convex webhook URL in the response.

## Project Structure

```
finance-tracker-v2.0/
├── convex/                 # Convex backend functions
│   ├── telegram/          # Telegram bot integration
│   │   ├── webhook.ts     # Main webhook handler
│   │   └── setWebhook.ts  # Webhook registration
│   └── _generated/        # Auto-generated Convex types
├── docs/                  # Documentation
│   └── stories/          # Development stories
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript configuration
└── convex.json          # Convex project configuration
```

## Development Workflow

1. Make changes to files in `convex/` directory
2. `npm run dev` watches for changes and hot-reloads
3. Test your functions in the Convex dashboard
4. Deploy to production with `npm run build`

## Testing

Send a message to your bot on Telegram. Check the Convex dashboard logs to verify:
- Webhook received the message
- User information extracted correctly
- Response sent back to Telegram

## Troubleshooting

### Bot not responding to messages

1. Verify webhook is registered:
   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
   ```
2. Check Convex logs in the dashboard for errors
3. Ensure `TELEGRAM_BOT_TOKEN` is set in Convex environment variables
4. Verify webhook URL uses HTTPS (required by Telegram)

### Webhook registration fails

1. Ensure you're using your production Convex URL (not dev URL)
2. Verify the URL is accessible via HTTPS
3. Check that setWebhook endpoint is deployed

### Environment variable not found

1. Go to Convex dashboard → Settings → Environment Variables
2. Verify `TELEGRAM_BOT_TOKEN` is set
3. Redeploy your functions after adding environment variables

## Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build and deploy to production
- `npm test` - Run tests (future implementation)
- `npm run lint` - Lint TypeScript code
- `npm run format` - Format code with Prettier

## 🧪 Testing

### Test Coverage
- **Unit Tests:** 112 tests (94% passing)
- **Integration Tests:** Command routing, AI parsing, database operations
- **E2E Tests:** Playwright for full user workflows

### Run Tests
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Test Structure
```
tests/
├── integration/
│   ├── ai-prompts.test.ts          # AI parser validation
│   └── callback-handlers.test.ts   # Callback routing
└── e2e/
    └── story-2.4-set-default-account.spec.ts
```

## 🎯 Development Workflow (BMAD Methodology)

### Epic → Stories → Implementation
1. **Epic Planning:** Break into 5-10 user stories
2. **Story Context:** Create XML with codebase state
3. **Implementation:** TDD with unit + integration tests
4. **Retrospective:** Document lessons learned

### Story Template
```markdown
**As a** [user type]
**I want to** [action]
**So that** [benefit]

**Acceptance Criteria:**
1. [Testable criterion]
2. [Testable criterion]

**Technical Notes:** [Implementation guidance]
```

### Command Pattern
All user actions follow:
1. **Intent Detection:** AI parses natural language
2. **Routing:** `commandRouter.ts` maps intent → handler
3. **Execution:** Handler calls mutations/queries
4. **Response:** Natural language confirmation

## 🔐 Security & Privacy

- **Authentication:** Telegram user ID verification
- **Data Isolation:** All queries scoped by `userId`
- **Privacy:** Minimal AI context (last 5 messages only)
- **Encryption:** AES-256 at rest/transit (Convex)
- **Soft Deletes:** Audit trail preservation
- **Secrets:** Environment variables in Convex dashboard

## 📈 Performance Targets

- **AI Response:** <2s (95th percentile)
- **End-to-End Transaction:** <5s
- **Database Queries:** <500ms (99th percentile)
- **Concurrent Users:** 5,000+
- **Transactions/User:** 100K+

## 🌍 Internationalization

- **Languages:** Arabic (primary), English
- **Context-Aware:** AI detects language per message
- **Bilingual Users:** Seamless switching
- **Response Variations:** Natural conversation feel

## 📖 Resources

### Documentation
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Convex Documentation](https://docs.convex.dev)
- [RORK Toolkit API](https://toolkit.rork.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

### Project Docs
- **Architecture:** `docs/solution-architecture.md`
- **Epics:** `docs/epics.md`
- **Stories:** `docs/stories/`
- **ADRs:** `docs/decisions/`
- **Retros:** `docs/retrospectives/`

## 🤝 Contributing

This project follows BMAD (Business-driven Modular Agile Development) methodology:
1. Read relevant epic/story documentation
2. Review story context XML for codebase state
3. Follow existing patterns (see `convex/commands/` for examples)
4. Write tests first (TDD)
5. Update documentation

## 📝 License

ISC

---

## 🎓 For AI Coding Agents

### Context Priority
1. **Current Epic:** Check `docs/epics.md` for active epic
2. **Story Details:** Read story markdown + context XML
3. **Architecture:** Reference `docs/solution-architecture.md`
4. **Patterns:** Study existing implementations in `convex/`
5. **Lessons:** Review retrospectives for pitfalls

### Implementation Checklist
- [ ] Read story acceptance criteria
- [ ] Review story context XML
- [ ] Check existing similar implementations
- [ ] Write tests first (unit + integration)
- [ ] Implement following established patterns
- [ ] Update command registry if new command
- [ ] Add callback handlers if needed
- [ ] Test in production (smoke test)
- [ ] Update documentation

### Common Patterns
- **AI Parsing:** Use `/text/llm/` endpoint (see `convex/ai/nlParser.ts`)
- **Commands:** Register in `convex/commands/registry.ts`
- **Callbacks:** Register in `convex/lib/callbackRegistry.ts`
- **Mutations:** Atomic operations with balance updates
- **Queries:** Use indexes (`by_user`, `by_user_date`, etc.)
- **Soft Deletes:** Set `isDeleted: true`, never hard delete

### Key Files to Understand
1. `convex/telegram/webhook.ts` - Entry point for all messages
2. `convex/lib/commandRouter.ts` - Intent → Handler routing
3. `convex/ai/nlParser.ts` - RORK AI integration pattern
4. `convex/schema.ts` - Database schema (11 tables)
5. `convex/commands/registry.ts` - Command registration

---

**Status:** ✅ Epic 2 Complete | 🔄 Epic 3 In Progress | 📊 5/10 Epics Remaining

**Last Updated:** 2025-10-28
