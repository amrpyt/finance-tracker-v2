# 🚀 دليل استخدام Spec-Kit مع Finance Tracker V2

> **دليل شامل لتطبيق Spec-Driven Development على مشروع Finance Tracker V2 الموجود**

---

## 📋 جدول المحتويات

1. [نظرة عامة على المشروع](#نظرة-عامة-على-المشروع)
2. [إعداد Spec-Kit](#إعداد-spec-kit)
3. [إنشاء Constitution للمشروع](#إنشاء-constitution-للمشروع)
4. [سيناريو كامل: إضافة ميزة جديدة](#سيناريو-كامل-إضافة-ميزة-جديدة)
5. [الـ Prompts الصحيحة](#الـ-prompts-الصحيحة)
6. [التعامل مع الأخطاء](#التعامل-مع-الأخطاء)
7. [Best Practices](#best-practices)

---

## 📊 نظرة عامة على المشروع

### معلومات المشروع الحالي

**المشروع:** Finance Tracker V2  
**الوصف:** A modern, real-time personal finance management application  
**النوع:** Brownfield (مشروع موجود)  
**الحالة:** 🚀 Production Ready (v2.0.0)

### 🛠️ التكنولوجيا المستخدمة

**Frontend Stack:**
- **Framework:** Next.js 15.1.6 (App Router)
- **Language:** TypeScript 5.7.2 (Strict Mode)
- **Styling:** Tailwind CSS 3.4.17
- **UI Components:** shadcn/ui + Radix UI
- **State Management:** React hooks + Convex real-time sync
- **Form Handling:** React Hook Form + Zod validation
- **Icons:** Lucide React

**Backend Stack:**
- **BaaS:** Convex 1.18.2 (Real-time database & serverless functions)
- **Authentication:** Clerk 6.11.1
- **API:** Convex mutations & queries (type-safe)
- **Real-time:** WebSocket-based subscriptions

**Testing & Quality:**
- **E2E Testing:** Playwright 1.49.1
- **Code Quality:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged
- **Commit Convention:** Conventional Commits

**Development Tools:**
- **Package Manager:** npm
- **Node Version:** 18.x or higher
- **Dev Server:** Next.js dev server + Convex dev
- **Deployment:** Vercel (Frontend) + Convex Cloud (Backend)

### 📦 الميزات الحالية

**✅ Core Features (Implemented):**
1. **Transaction Management**
   - Create, read, update, delete transactions
   - Real-time sync across devices
   - Optimistic updates for instant feedback
   - Transaction categories and counterparties
   - Search and filtering

2. **Category Management**
   - Predefined categories with icons
   - Custom category creation
   - Category-based filtering
   - Color-coded visualization

3. **Counterparty Management**
   - Track who you transact with
   - Auto-complete suggestions
   - Transaction history per counterparty

4. **Authentication & Authorization**
   - Secure sign-in with Clerk
   - User profile management
   - Multi-device support
   - Session management

5. **Real-time Sync**
   - Instant updates across all devices
   - Offline-first architecture
   - Conflict resolution
   - Optimistic UI updates

**🔄 In Progress:**
- Budget Management (Epic 2)
- Enhanced reporting features

**⏳ Planned:**
- Reports & Analytics (Epic 3)
- Multi-currency Support (Epic 4)
- Recurring Transactions
- Data export/import

### 📁 هيكل المشروع

```
finance-tracker-v2/
├── bmad/                      # Main application code (BMAD = Build, Measure, Analyze, Deploy)
│   ├── components/           # Shared UI components
│   ├── features/            # Feature-based modules
│   │   ├── transactions/   # Transaction management
│   │   ├── categories/     # Category management
│   │   └── counterparties/ # Counterparty management
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── types/              # TypeScript type definitions
├── convex/                  # Convex backend
│   ├── schema.ts           # Database schema
│   ├── transactions.ts     # Transaction API
│   ├── categories.ts       # Categories API
│   └── _generated/         # Auto-generated types
├── tests/                   # Playwright E2E tests
├── docs/                    # Documentation
│   ├── PRD.md              # Product Requirements
│   ├── solution-architecture.md
│   ├── epics.md            # Feature roadmap
│   └── decisions/          # Architecture Decision Records
└── public/                  # Static assets
```

### 🔗 الملفات المهمة للقراءة

**قبل البدء:**
1. `README.md` - نظرة عامة وإعداد المشروع
2. `docs/PRD.md` - متطلبات المنتج الكاملة
3. `docs/solution-architecture.md` - تفاصيل الـ Architecture
4. `docs/epics.md` - خارطة طريق الميزات

**للمطورين:**
5. `docs/DEVELOPER-GUIDE-AI-INTEGRATION.md` - دليل التطوير
6. `docs/DEPLOYMENT.md` - دليل النشر
7. `docs/decisions/` - قرارات تقنية موثقة

**الحالة الحالية:**
8. `TD-001-STATUS.md` - حالة المهام الحالية
9. `docs/TD-001-PROGRESS.md` - تقدم التطوير

### 🎯 الأنماط المعمارية المتبعة

1. **Feature-Based Organization**
   - كل feature في مجلد منفصل
   - Components, hooks, types معاً
   - Self-contained modules

2. **Real-time First**
   - Convex subscriptions للبيانات
   - Optimistic updates للـ UX
   - Automatic conflict resolution

3. **Type Safety**
   - TypeScript strict mode
   - Zod schemas للـ validation
   - Auto-generated types من Convex

4. **Component Patterns**
   - shadcn/ui للـ base components
   - Composition over inheritance
   - Props interfaces للـ type safety

5. **Testing Strategy**
   - E2E tests للـ critical flows
   - Focus on user journeys
   - Playwright للـ automation

---

## 🛠️ إعداد Spec-Kit

### الخطوة 1: تثبيت Spec-Kit

```bash
# 1. Install uv (إذا لم يكن مثبت)
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. Install Spec-Kit
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# 3. التحقق من التثبيت
specify --version
```

### الخطوة 2: Initialize في المشروع

```bash
# Navigate to project
cd d:/path/to/finance-tracker-v2

# Initialize Spec-Kit (Brownfield mode)
specify init --here --ai windsurf

# أو إذا كنت تستخدم Cursor
specify init --here --ai cursor-agent
```

**⚠️ ملاحظة:** سيسألك عن الـ merge مع الملفات الموجودة، اختر `Yes` للمتابعة.

### الخطوة 3: التحقق من الإعداد

```bash
# Check available tools
specify check
```

**يجب أن ترى:**
- ✅ Git installed
- ✅ Windsurf/Cursor CLI available
- ✅ Project initialized

---

## 📜 إنشاء Constitution للمشروع

### الخطوة الأولى: تشغيل الأمر

في Windsurf/Cursor، اكتب:

```
/speckit.constitution
```

### الـ Prompt الصحيح

```
Create a constitution for Finance Tracker V2 project with the following context:

## Project Overview
Finance Tracker V2 is a modern, real-time personal finance management application currently in production (v2.0.0).

**Tech Stack:**
- Frontend: Next.js 15.1.6 (App Router) + TypeScript 5.7.2 (Strict Mode)
- Backend: Convex 1.18.2 (Real-time BaaS with serverless functions)
- Authentication: Clerk 6.11.1
- UI Framework: Tailwind CSS 3.4.17 + shadcn/ui + Radix UI
- Form Handling: React Hook Form + Zod validation
- Testing: Playwright 1.49.1 for E2E tests
- Code Quality: ESLint + Prettier + Husky + lint-staged
- Deployment: Vercel (Frontend) + Convex Cloud (Backend)

## Current Architecture Principles

### 1. Feature-Based Organization (BMAD Pattern)
- All application code in `/bmad` folder (Build, Measure, Analyze, Deploy)
- Feature-based modules in `/bmad/features/`
- Each feature contains: components, hooks, types, and business logic
- Shared components in `/bmad/components/`
- Utility functions in `/bmad/lib/`
- Type definitions in `/bmad/types/`

**Example Structure:**
```
bmad/features/transactions/
├── components/          # Transaction UI components
├── hooks/              # useTransactions, useTransactionForm
├── types/              # Transaction interfaces
└── utils/              # Transaction-specific utilities
```

### 2. Real-time First Architecture
- **Convex Subscriptions:** All data fetching uses real-time subscriptions
- **Optimistic Updates:** UI updates immediately before server confirmation
- **Conflict Resolution:** Automatic handling of concurrent updates
- **WebSocket-Based:** Persistent connection for instant sync
- **Offline-First:** Local state with background sync

**Pattern:**
```typescript
// Use Convex queries (auto-subscribes)
const transactions = useQuery(api.transactions.list, { userId });

// Use Convex mutations with optimistic updates
const addTransaction = useMutation(api.transactions.create);
```

### 3. Type Safety & Validation
- **TypeScript Strict Mode:** No implicit any, strict null checks
- **Zod Schemas:** Runtime validation for all forms and API inputs
- **Convex Auto-Generated Types:** Type-safe API from schema
- **Interface-First:** Define interfaces before implementation

**Pattern:**
```typescript
// Define Zod schema
const transactionSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  // ...
});

// Auto-generate TypeScript type
type Transaction = z.infer<typeof transactionSchema>;
```

### 4. Component Patterns
- **shadcn/ui Base:** Use shadcn/ui components as foundation
- **Composition:** Build complex UIs from simple components
- **Props Interfaces:** Explicit TypeScript interfaces for all props
- **Controlled Components:** Forms use React Hook Form
- **Separation of Concerns:** UI components separate from business logic

**Pattern:**
```typescript
interface TransactionFormProps {
  onSubmit: (data: TransactionInput) => Promise<void>;
  initialData?: Transaction;
  isLoading?: boolean;
}

export function TransactionForm({ onSubmit, initialData, isLoading }: TransactionFormProps) {
  // Component implementation
}
```

### 5. API Layer (Convex)
- **Mutations:** For all write operations (create, update, delete)
- **Queries:** For all read operations (list, get, search)
- **Validators:** Zod schemas for input validation
- **Indexes:** Optimized database queries
- **Scheduled Functions:** For background jobs (future: recurring transactions)

**Pattern:**
```typescript
// convex/transactions.ts
export const create = mutation({
  args: { amount: v.number(), category: v.string(), /* ... */ },
  handler: async (ctx, args) => {
    // Validate, authorize, create
  },
});

export const list = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Fetch and return
  },
});
```

### 6. Testing Strategy
- **E2E Focus:** Playwright tests for critical user journeys
- **User-Centric:** Test from user perspective, not implementation
- **Test Files:** All tests in `/tests` folder
- **Fixtures:** Reusable test setup and data
- **CI/CD:** Tests run on every PR

**Critical Flows to Test:**
- User authentication (sign in/out)
- Transaction CRUD operations
- Category management
- Real-time sync across devices
- Form validation and error handling

### 7. Code Quality Standards
- **Conventional Commits:** feat:, fix:, docs:, refactor:, test:
- **Pre-commit Hooks:** Husky runs lint-staged
- **ESLint Rules:** Enforce code style and best practices
- **Prettier:** Automatic code formatting
- **No Console Logs:** Remove before commit (except errors)
- **TypeScript Errors:** Zero tolerance policy

### 8. Database Schema (Convex)
- **Schema Definition:** All tables in `/convex/schema.ts`
- **Relationships:** Use document IDs for references
- **Indexes:** Define for common queries
- **Migrations:** Handle schema changes carefully
- **Data Validation:** Zod schemas at API boundary

**Current Tables:**
- `users` - User profiles (synced with Clerk)
- `transactions` - Financial transactions
- `categories` - Transaction categories
- `counterparties` - Transaction counterparties

## Existing Patterns to Follow

### UI/UX Patterns
- Use shadcn/ui components for all UI elements
- Follow Tailwind utility-first approach
- Maintain consistent spacing (Tailwind scale)
- Use Lucide React for icons
- Implement loading states for all async operations
- Show optimistic updates for better UX
- Display error messages clearly

### Code Organization
- Feature folders contain all related code
- Hooks start with `use` prefix
- Components use PascalCase
- Utilities use camelCase
- Types/Interfaces use PascalCase
- Constants use UPPER_SNAKE_CASE

### State Management
- Convex queries for server state
- React useState for local UI state
- React Hook Form for form state
- No global state management (Redux, Zustand, etc.)

### Error Handling
- Try-catch in async operations
- Toast notifications for user feedback
- Error boundaries for component errors
- Graceful degradation for offline mode

## Quality Gates (Must Pass Before Merge)

### Pre-Implementation
1. ✅ Spec reviewed and approved
2. ✅ Technical plan documented
3. ✅ No constitutional violations
4. ✅ Integration points identified

### During Implementation
5. ✅ TypeScript strict mode (no errors)
6. ✅ ESLint passes (no warnings)
7. ✅ Prettier formatted
8. ✅ E2E tests written and passing
9. ✅ Optimistic updates implemented
10. ✅ Real-time sync working

### Pre-Merge
11. ✅ All tests pass (npm run test:e2e)
12. ✅ No console.log statements
13. ✅ Conventional commit messages
14. ✅ Documentation updated
15. ✅ No breaking changes to existing features

## Performance Requirements
- Page load: < 2 seconds
- Transaction list: < 1 second
- Form submission: < 500ms response
- Real-time sync: < 100ms latency
- Support 10,000+ transactions per user

## Security Requirements
- All API calls authenticated (Clerk)
- User data isolated (userId filter)
- Input validation (Zod schemas)
- XSS prevention (React escaping)
- HTTPS only (enforced by Vercel)

Please create a constitution that enforces these principles, patterns, and quality gates for all future development. The constitution should ensure consistency, maintainability, and high code quality.
```

### ما سيحدث

سيتم إنشاء ملف `.specify/memory/constitution.md` يحتوي على:
- **Article I-VI:** Shaping Principles (مبادئ التصميم)
- **Article VII-IX:** Pre-implementation Gates (بوابات الجودة)

---

## 🎯 سيناريو كامل: إضافة ميزة جديدة

### السيناريو: إضافة "Recurring Transactions" Feature

دعنا نضيف ميزة المعاملات المتكررة (Recurring Transactions) خطوة بخطوة.

---

### الخطوة 1: `/speckit.specify`

**الأمر:**
```
/speckit.specify
```

**الـ Prompt:**
```
Add Recurring Transactions feature to Finance Tracker V2

## User Story
As a user, I want to set up recurring transactions (like monthly rent, subscriptions, salary) so that I don't have to manually enter them every time.

## Requirements

### Core Functionality
1. **Create Recurring Transaction:**
   - Define transaction details (amount, category, counterparty)
   - Set recurrence pattern (daily, weekly, monthly, yearly)
   - Set start date and optional end date
   - Enable/disable recurring transaction

2. **Auto-generation:**
   - System automatically creates transactions based on schedule
   - Generated transactions appear in transaction list
   - User can edit/delete generated transactions without affecting template

3. **Management:**
   - View list of all recurring transactions
   - Edit recurring transaction (affects future only)
   - Delete recurring transaction
   - Pause/resume recurring transaction

### User Interface
- New "Recurring" tab in transactions page
- "Add Recurring Transaction" button
- Form with:
  - All standard transaction fields
  - Recurrence pattern selector
  - Start/end date pickers
  - Active/inactive toggle
- List view showing:
  - Transaction template details
  - Next scheduled date
  - Status (active/paused)
  - Edit/Delete actions

### Technical Requirements
- Must integrate with existing transaction system
- Must use Convex for real-time sync
- Must follow existing component patterns
- Must have Playwright E2E tests
- Must handle timezone correctly
- Must support optimistic updates

### Edge Cases
- Handle month-end dates (e.g., 31st of month)
- Handle leap years
- Handle deleted categories/counterparties
- Handle currency changes (if multi-currency enabled)

### Success Criteria
- User can create recurring transaction in < 30 seconds
- Auto-generation runs reliably
- No duplicate transactions created
- Performance: List loads in < 1 second
- All E2E tests pass

## Out of Scope (for this feature)
- Editing past generated transactions in bulk
- Complex recurrence patterns (e.g., "every 2nd Tuesday")
- Notifications for upcoming transactions
```

**ما سيحدث:**
- سيتم إنشاء branch جديد: `feature/recurring-transactions`
- سيتم إنشاء مجلد: `specs/001-recurring-transactions/`
- سيتم إنشاء ملف: `spec.md` بالمواصفات الكاملة

---

### الخطوة 2: `/speckit.clarify` (اختياري)

إذا كان في نقاط غير واضحة، استخدم:

```
/speckit.clarify
```

**الـ AI سيسأل أسئلة مثل:**
- "How should we handle timezone for recurring transactions?"
- "What happens if user changes transaction amount in template?"
- "Should we show history of generated transactions?"

**أجب على كل سؤال بوضوح** وسيتم تحديث `spec.md` تلقائياً.

---

### الخطوة 3: `/speckit.checklist` (اختياري - مهم!)

```
/speckit.checklist
```

**ما سيحدث:**
سيتم إنشاء checklist للتحقق من جودة المواصفات:

```
✅ Requirements Completeness Checklist:

1. [ ] Are all user roles clearly defined?
2. [ ] Are success criteria measurable?
3. [ ] Are error scenarios documented?
4. [ ] Are performance requirements specified?
5. [ ] Are security requirements addressed?
6. [ ] Are integration points identified?
7. [ ] Are data validation rules clear?
8. [ ] Are edge cases covered?
```

**راجع كل نقطة** وحدّث `spec.md` إذا لزم الأمر.

---

### الخطوة 4: `/speckit.plan`

**الأمر:**
```
/speckit.plan
```

**الـ Prompt:**
```
Create technical implementation plan for Recurring Transactions feature.

## Existing System Context

### Current Tech Stack
- Next.js 14 with App Router
- TypeScript (strict mode)
- Convex for backend (real-time BaaS)
- Clerk for authentication
- shadcn/ui components
- Tailwind CSS
- Playwright for testing

### Existing Code Structure
```
bmad/
├── components/          # Shared components
├── features/
│   ├── transactions/   # Existing transaction feature
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   └── categories/     # Existing categories
convex/
├── schema.ts           # Database schema
├── transactions.ts     # Transaction mutations/queries
└── _generated/         # Auto-generated types
```

### Existing Patterns to Follow
1. **Component Pattern:**
   - Feature folder contains all related code
   - Use shadcn/ui components
   - TypeScript interfaces for all props
   - Custom hooks for business logic

2. **Convex Pattern:**
   - Define schema in schema.ts
   - Mutations for writes (with validation)
   - Queries for reads (with indexes)
   - Use optimistic updates

3. **Testing Pattern:**
   - E2E tests in /tests folder
   - Test critical user flows
   - Use Playwright fixtures

### Integration Points
- Must integrate with existing transactions table
- Must use existing category system
- Must use existing counterparty system
- Must follow existing auth patterns (Clerk)

### Performance Requirements
- List view: < 1 second load time
- Form submission: < 500ms response
- Auto-generation: Run as background job
- Support 1000+ recurring transactions per user

### Database Considerations
- Convex doesn't support cron jobs natively
- Need to use Convex scheduled functions
- Must handle concurrent updates
- Must maintain referential integrity

Please create a detailed technical plan that:
1. Defines new database schema (Convex tables)
2. Lists all components to create
3. Defines API layer (mutations/queries)
4. Specifies testing strategy
5. Handles auto-generation logic
6. Follows existing patterns
7. Addresses performance requirements
```

**ما سيحدث:**
- سيتم إنشاء `plan.md` بالخطة التقنية الكاملة
- سيتم إنشاء `research.md` إذا كان في نقاط تحتاج بحث
- سيتم تحديث agent context

---

### الخطوة 5: `/speckit.analyze` (مهم جداً!)

```
/speckit.analyze
```

**ما سيحدث:**
- تحليل التناسق بين spec.md و plan.md
- التحقق من Constitutional compliance
- كشف أي تناقضات أو مشاكل

**مثال على النتائج:**
```
✅ PASS: All requirements covered in plan
✅ PASS: No constitutional violations
⚠️  WARNING: Performance requirement not explicitly tested
❌ CRITICAL: Missing error handling for timezone edge case
```

**إذا كان في CRITICAL findings:**
- ارجع لـ `/speckit.plan` وحدّث الخطة
- أو ارجع لـ `/speckit.specify` وحدّث المواصفات

---

### الخطوة 6: `/speckit.tasks`

```
/speckit.tasks
```

**ما سيحدث:**
سيتم إنشاء `tasks.md` بقائمة مهام مرتبة:

```markdown
# Implementation Tasks

## Phase 1: Database Schema
- [ ] Task 1.1: Define recurringTransactions table in schema.ts
- [ ] Task 1.2: Add indexes for efficient querying
- [ ] Task 1.3: Create migration script (if needed)

## Phase 2: Backend API
- [ ] Task 2.1: Create createRecurringTransaction mutation
- [ ] Task 2.2: Create updateRecurringTransaction mutation
- [ ] Task 2.3: Create deleteRecurringTransaction mutation
- [ ] Task 2.4: Create listRecurringTransactions query
- [ ] Task 2.5: Create generateScheduledTransactions scheduled function

## Phase 3: Frontend Components
- [ ] Task 3.1: Create RecurringTransactionForm component
- [ ] Task 3.2: Create RecurringTransactionList component
- [ ] Task 3.3: Create RecurringTransactionCard component
- [ ] Task 3.4: Add "Recurring" tab to transactions page

## Phase 4: Business Logic
- [ ] Task 4.1: Implement recurrence calculation logic
- [ ] Task 4.2: Handle timezone conversions
- [ ] Task 4.3: Implement optimistic updates

## Phase 5: Testing
- [ ] Task 5.1: Write E2E test for creating recurring transaction
- [ ] Task 5.2: Write E2E test for auto-generation
- [ ] Task 5.3: Write E2E test for editing/deleting
- [ ] Task 5.4: Test edge cases (month-end, leap year)

## Phase 6: Integration
- [ ] Task 6.1: Integrate with existing transaction list
- [ ] Task 6.2: Update navigation
- [ ] Task 6.3: Update documentation
```

---

### الخطوة 7: `/speckit.implement`

```
/speckit.implement
```

**ما سيحدث:**
- الـ AI سيبدأ تنفيذ المهام واحدة تلو الأخرى
- كل مهمة ستتبع TDD approach:
  1. كتابة الـ test أولاً
  2. تشغيل الـ test (يفشل)
  3. كتابة الكود
  4. تشغيل الـ test (ينجح)
  5. Commit

**مثال على التنفيذ:**
```
AI: Starting implementation...

[1/20] Task 1.1: Define recurringTransactions table in schema.ts
- Opening convex/schema.ts...
- Adding table definition...
- Running type generation...
- ✅ Types generated successfully
- Committed: "feat(schema): add recurringTransactions table"

[2/20] Task 1.2: Add indexes for efficient querying
- Adding index on userId...
- Adding index on nextRunDate...
- ✅ Indexes added
- Committed: "feat(schema): add indexes for recurring transactions"

[3/20] Task 2.1: Create createRecurringTransaction mutation
- Creating tests/recurring-transactions.spec.ts...
- Writing test: "should create recurring transaction"...
- Running test... ❌ FAILED (expected)
- Creating convex/recurringTransactions.ts...
- Implementing createRecurringTransaction...
- Running test... ✅ PASSED
- Committed: "feat(api): add createRecurringTransaction mutation"

...
```

---

## 📝 الـ Prompts الصحيحة

### عند `/speckit.specify`

**✅ جيد:**
```
Add [Feature Name] to [Project Name]

## User Story
As a [user type], I want to [goal] so that [benefit].

## Requirements
[Detailed requirements with sections]

## Technical Requirements
[Integration points, constraints, performance]

## Success Criteria
[Measurable outcomes]

## Out of Scope
[What's NOT included]
```

**❌ سيء:**
```
Add recurring transactions
```

---

### عند `/speckit.plan`

**✅ جيد:**
```
Create technical plan for [Feature]

## Existing System Context
- Current tech stack: [list]
- Existing code structure: [tree]
- Existing patterns: [describe]

## Integration Points
[What to integrate with]

## Performance Requirements
[Specific numbers]

## Constraints
[Technical limitations]

Please create plan that follows existing patterns.
```

**❌ سيء:**
```
Make a plan
```

---

### عند `/speckit.clarify`

**✅ جيد:**
عندما يسأل AI سؤال، أجب بوضوح:
```
Q: How should we handle timezone for recurring transactions?

A: Use UTC for storage and calculation. Convert to user's local timezone only for display. Store user's timezone preference in user settings. When generating transactions, calculate next run date in UTC, then check if it matches current date in user's timezone.
```

**❌ سيء:**
```
A: Use timezone
```

---

## 🎯 الميزات المتاحة للتطوير

### من `docs/epics.md` - الميزات المخططة

#### 🔄 Epic 2: Budget Management (In Progress)
**الوصف:** نظام إدارة الميزانيات الشهرية

**الميزات:**
- إنشاء ميزانيات لكل فئة (Category)
- تتبع الإنفاق مقابل الميزانية
- تنبيهات عند تجاوز الميزانية
- تقارير الميزانية الشهرية

**الأولوية:** High  
**الحالة:** 🔄 In Progress

---

#### ⏳ Epic 3: Reports & Analytics (Planned)
**الوصف:** تقارير وتحليلات مالية متقدمة

**الميزات:**
- تقارير الدخل والمصروفات
- رسوم بيانية تفاعلية
- تحليل الاتجاهات
- مقارنة الفترات الزمنية
- تصدير التقارير (PDF, CSV)

**الأولوية:** Medium  
**الحالة:** ⏳ Planned

---

#### ⏳ Epic 4: Multi-currency Support (Planned)
**الوصف:** دعم العملات المتعددة

**الميزات:**
- إضافة معاملات بعملات مختلفة
- تحويل العملات تلقائياً
- أسعار صرف محدثة
- عرض المجاميع بالعملة الأساسية

**الأولوية:** Low  
**الحالة:** ⏳ Planned

---

### 💡 أفكار ميزات إضافية

#### 1. Recurring Transactions (مقترح)
- معاملات متكررة تلقائياً
- جدولة شهرية/أسبوعية/يومية
- إدارة القوالب
- تعديل/إيقاف المعاملات المتكررة

#### 2. Data Export/Import (مقترح)
- تصدير البيانات (CSV, JSON, Excel)
- استيراد من تطبيقات أخرى
- نسخ احتياطي كامل
- استعادة البيانات

#### 3. Notifications System (مقترح)
- تنبيهات تجاوز الميزانية
- تذكير بالمعاملات المتكررة
- ملخص شهري
- تنبيهات مخصصة

#### 4. Tags & Labels (مقترح)
- إضافة tags للمعاملات
- تصنيف متعدد
- فلترة بالـ tags
- تقارير حسب الـ tags

#### 5. Attachments (مقترح)
- رفع صور الفواتير
- مرفقات PDF
- ربط الملفات بالمعاملات
- عرض المرفقات

---

### 🚀 كيف تختار ميزة للتطوير؟

#### معايير الاختيار:
1. **الأولوية:** High > Medium > Low
2. **التعقيد:** ابدأ بالميزات البسيطة
3. **التأثير:** ميزات تفيد أكثر المستخدمين
4. **التكامل:** سهولة التكامل مع النظام الحالي

#### الميزات المقترحة للبدء:

**للمبتدئين (Easy):**
- Data Export to CSV
- Transaction Tags
- Simple Notifications

**للمتوسطين (Medium):**
- Recurring Transactions
- Basic Reports
- Budget Alerts

**للمتقدمين (Hard):**
- Multi-currency Support
- Advanced Analytics
- Data Import from other apps

---

## 🐛 التعامل مع الأخطاء

### السيناريو 1: Tests فشلت بعد Implementation

```
Problem: Playwright tests failing after implementing recurring transactions

Solution:
1. Run: /speckit.analyze
2. Check if spec matches implementation
3. If spec is wrong: Update spec.md and re-run /speckit.plan
4. If implementation is wrong: Fix code and re-run tests
5. If test is wrong: Update test file
```

### السيناريو 2: Constitutional Violation

```
Problem: /speckit.analyze shows "CRITICAL: Violates Article III (Test-First)"

Solution:
1. Check which task violated TDD
2. Write tests first
3. Re-run /speckit.implement from that task
```

### السيناريو 3: Integration Issues

```
Problem: New feature breaks existing functionality

Solution:
1. Run existing E2E tests: npm run test:e2e
2. Identify which test failed
3. Check if spec mentioned integration point
4. If not: Update spec.md with integration requirements
5. Re-run /speckit.plan
6. Fix implementation
```

### السيناريو 4: Performance Issues

```
Problem: Feature is slow

Solution:
1. Check if performance requirements in spec.md
2. If not: Add them and re-run /speckit.plan
3. Run /speckit.analyze to check plan addresses performance
4. Implement optimizations
5. Add performance tests
```

---

## ✅ Best Practices

### 1. Always Start with Constitution
```bash
# First time in project
/speckit.constitution

# Document existing patterns before adding features
```

### 2. Be Specific in Specs
```
❌ "Add user management"
✅ "Add user profile editing with avatar upload, email change, and password reset"
```

### 3. Mention Existing Code
```
In /speckit.plan prompt:
"This project already has:
- Authentication with Clerk
- Transaction system in bmad/features/transactions
- Convex backend with real-time sync
Please integrate with these existing systems."
```

### 4. Use /speckit.analyze Before Implementing
```
Always run /speckit.analyze after /speckit.plan
Fix any CRITICAL findings before /speckit.implement
```

### 5. Commit Often
```
Let AI commit after each task
Don't try to do everything in one commit
```

### 6. Test Integration Points
```
In spec.md, explicitly mention:
"Must integrate with existing [X] system"
"Must not break existing [Y] functionality"
```

### 7. Document Decisions
```
After implementation, update:
- docs/solution-architecture.md (if architecture changed)
- docs/decisions/ (if made technical decision)
- README.md (if added new feature)
```

---

## 📚 الملفات المهمة في المشروع

### للقراءة قبل البدء:
1. `docs/PRD.md` - فهم المنتج
2. `docs/solution-architecture.md` - فهم الـ Architecture
3. `docs/epics.md` - فهم الميزات المخططة
4. `bmad/` - فهم الكود الموجود

### للتحديث بعد الإضافة:
1. `docs/epics.md` - إضافة Epic جديد أو تحديث حالة
2. `docs/solution-architecture.md` - إذا غيرت Architecture
3. `README.md` - إذا أضفت ميزة رئيسية
4. `docs/decisions/` - توثيق القرارات التقنية

---

## 🎯 Workflow الكامل (ملخص)

```mermaid
graph TD
    A[Initialize Spec-Kit] --> B[/speckit.constitution]
    B --> C[/speckit.specify]
    C --> D{Need Clarification?}
    D -->|Yes| E[/speckit.clarify]
    D -->|No| F[/speckit.checklist]
    E --> F
    F --> G[/speckit.plan]
    G --> H[/speckit.analyze]
    H --> I{Critical Issues?}
    I -->|Yes| G
    I -->|No| J[/speckit.tasks]
    J --> K[/speckit.implement]
    K --> L{Tests Pass?}
    L -->|No| M[Fix Issues]
    M --> K
    L -->|Yes| N[Done!]
```

---

## 🚀 مثال سريع: إضافة ميزة بسيطة

### الميزة: Add "Export to CSV" button

```bash
# 1. Specify
/speckit.specify
```
```
Add CSV export functionality to transactions list

## User Story
As a user, I want to export my transactions to CSV so that I can analyze them in Excel.

## Requirements
- Add "Export CSV" button in transactions page header
- Export includes: date, amount, category, counterparty, notes
- File name format: transactions_YYYY-MM-DD.csv
- Must respect current filters (date range, category, etc.)

## Technical Requirements
- Use existing transaction query
- Client-side CSV generation (no backend needed)
- Use papaparse library for CSV generation
- Must work with existing transaction types

## Success Criteria
- Button appears in header
- Click downloads CSV file
- CSV opens correctly in Excel
- Filtered transactions only included
```

```bash
# 2. Plan
/speckit.plan
```
```
Create plan for CSV export

## Existing Context
- Transactions displayed in bmad/features/transactions/components/TransactionList.tsx
- Transaction type defined in bmad/features/transactions/types/transaction.ts
- Current filters in useTransactionFilters hook

## Implementation
- Add button to TransactionList header
- Create useCSVExport custom hook
- Use papaparse for CSV generation
- Trigger download with blob URL

Please create minimal plan that follows existing patterns.
```

```bash
# 3. Analyze
/speckit.analyze

# 4. Tasks
/speckit.tasks

# 5. Implement
/speckit.implement
```

**الوقت المتوقع:** 15-30 دقيقة  
**النتيجة:** ميزة جاهزة مع tests!

---

## 📞 الدعم والمساعدة

### إذا واجهت مشكلة:

1. **راجع Error Recovery Guide** في `spec-kit-guide.md`
2. **استخدم `/speckit.analyze`** لكشف المشاكل
3. **اقرأ constitution.md** للتأكد من الالتزام بالمبادئ
4. **راجع الـ tasks.md** لمعرفة أين توقف التنفيذ

### الأخطاء الشائعة:

| الخطأ | السبب | الحل |
|-------|-------|------|
| "Constitutional violation" | لم تتبع TDD | اكتب tests أولاً |
| "Spec unclear" | المواصفات غير واضحة | استخدم `/speckit.clarify` |
| "Integration failed" | لم تذكر integration points | حدّث spec.md بنقاط التكامل |
| "Tests failing" | Implementation لا يطابق spec | راجع spec.md و plan.md |

---

## 🎉 الخلاصة

**Spec-Kit يساعدك في:**
- ✅ تنظيم التطوير بشكل منهجي
- ✅ ضمان جودة الكود (TDD)
- ✅ توثيق القرارات تلقائياً
- ✅ تجنب الأخطاء الشائعة
- ✅ الحفاظ على consistency في الكود

**الخطوات الأساسية:**
1. `/speckit.constitution` - مرة واحدة للمشروع
2. `/speckit.specify` - لكل ميزة جديدة
3. `/speckit.plan` - خطة تقنية
4. `/speckit.analyze` - تحقق من الجودة
5. `/speckit.tasks` - قائمة مهام
6. `/speckit.implement` - تنفيذ تلقائي

**ابدأ الآن!** 🚀

---

**تم إنشاء هذا الدليل بواسطة:** Cascade AI  
**التاريخ:** 2025-01-28  
**النسخة:** 1.0
