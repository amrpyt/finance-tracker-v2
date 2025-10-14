# Finance-Tracker-v2.0 Product Requirements Document (PRD)

**Author:** Amr
**Date:** 2025-10-12
**Project Level:** Level 3 (Full Product)
**Project Type:** Mobile application (Telegram bot)
**Target Scale:** 12-40 stories, 2-5 epics, full PRD + architect handoff

---

## Description, Context and Goals

### Project Overview

**Finance Tracker v2.0** is a next-generation personal finance management system delivered entirely through Telegram, enabling users to track expenses, income, accounts, loans, budgets, and financial goals through natural language conversations with an AI agent. Built on a 100% serverless Convex architecture, the system provides real-time data synchronization, intelligent insights, and a completely conversational interface that eliminates traditional forms and complex UIs.

**Key Innovation:** Zero-friction financial tracking through a familiar chat interface, powered by AI (RORK Toolkit) that understands context, automatically categorizes transactions, and provides proactive financial insights—all without requiring app installation or learning complex interfaces.

**Target Market:** Arabic-speaking individuals and families (ages 22-50) seeking comprehensive, accessible personal finance management without installing dedicated apps. Primary users are young professionals, families, and small business owners in Middle East and North Africa regions.

**Current Status:** Greenfield project starting from scratch with clean architecture. Previous implementation attempts were unsuccessful; v2.0 represents a complete rebuild with proper planning, incremental feature delivery, and focus on core functionality before advanced features.

**Unique Value Propositions:**
1. **Zero Installation** - Works in Telegram, which users already have
2. **AI-Powered Understanding** - Natural language processing via RORK understands context without rigid commands
3. **Arabic-First** - Native Arabic support with cultural context
4. **Conversational UX** - No forms, buttons, or complex navigation
5. **100% Serverless** - Pure Convex architecture with automatic scaling
6. **Comprehensive Features** - Beyond basic tracking: budgets, goals, reminders, analytics, loan tracking
7. **Real-time Sync** - Instant updates across all devices

### Deployment Intent

**Production SaaS Application** targeting 5,000+ active users within 6 months of v2.0 launch.

**Deployment Strategy:**
- **Phase 1 (Weeks 1-4):** Foundation & Core Features (Epic 1-3) - Basic expense/income tracking with accounts
- **Phase 2 (Weeks 5-12):** Extended Features (Epic 4-7) - Loans, transaction history, budgets, savings goals
- **Phase 3 (Weeks 13-20):** Advanced Features (Epic 8-10) - Recurring transactions, bill reminders, analytics
- **Phase 4 (6+ months):** Multi-user support, family accounts, premium tier

**Infrastructure:**
- 100% serverless Convex Cloud deployment
- Automatic scaling to handle concurrent users
- 99.5% uptime SLA requirement
- Real-time data synchronization across devices

**Go-to-Market:**
- Organic growth through user sharing (viral coefficient target: 0.4+)
- Arabic-speaking communities in Middle East and North Africa
- No paid marketing initially - focus on product excellence and word-of-mouth

### Context

**The Problem:**
Traditional finance apps require installation, account creation, and learning new interfaces—creating significant friction for daily logging. Most finance trackers have complex UIs that users abandon within weeks. Arabic speakers lack comprehensive personal finance tools in their native language. Manual categorization of expenses is tedious and often skipped. Tracking loans to friends/family is informal and easily forgotten. Without proactive insights or budget planning, users overspend and miss savings opportunities. The result: 70% of people who download finance apps stop using them within a month, leading to lost money through uncollected loans, forgotten expenses, poor financial decisions, and lack of planning.

**Why Now:**
With rising cost of living and economic uncertainty, personal financial awareness and planning are critical. People need comprehensive tools that fit into their existing habits (messaging) rather than requiring new behaviors. Telegram's massive adoption in Arabic-speaking regions (200M+ users globally) provides the perfect platform. Modern serverless architectures (Convex) and AI capabilities (RORK Toolkit) now make it feasible to build sophisticated conversational interfaces that understand natural language without rigid commands. The convergence of these factors—user need, platform availability, and technical capability—creates the perfect moment to deliver a finance management system that people will actually use daily.

**Market Opportunity:**
The personal finance app market is growing at 12% CAGR, but existing solutions fail Arabic-speaking users. Competitors either lack Arabic support, require app installation, or provide only basic tracking without budgets, goals, or loan management. Our conversational, Telegram-native approach eliminates the primary barrier to adoption (installation friction) while our comprehensive feature set addresses the full spectrum of personal finance needs. Early user research indicates strong demand for loan tracking (peer-to-peer lending is culturally significant) and budget planning tools that work through simple conversations.

### Goals

**1. User Acquisition & Retention**
- Acquire 5,000 active users within 6 months of v2.0 launch
- Achieve 50% user retention rate after 30 days
- Maintain 70% weekly engagement (users logging at least one transaction per week)
- Achieve 25% month-over-month user growth through organic sharing

**2. Feature Adoption & Engagement**
- 60% of users utilize at least 3 major features (accounts, budgets, loans)
- 40% of users create at least one monthly budget
- 30% of users set at least one savings goal
- 50% of users track at least one loan
- Average 25+ transactions logged per user per month

**3. Performance & Reliability**
- Maintain 99.5% system uptime
- AI agent responds within 2 seconds (95th percentile)
- 85%+ accuracy in AI transaction categorization
- Support 5,000+ concurrent users without performance degradation
- Zero critical bugs or data loss incidents

**4. User Experience Excellence**
- Achieve 4.5+ star rating via in-bot feedback
- Time to first transaction < 2 minutes from bot start
- 40% Daily Active Users (DAU) of total user base
- Users report bot is "more comprehensive than other finance apps"

**5. Financial Awareness & Impact**
- Users gain clear visibility into spending patterns within first week
- 60% of budget users stay within budget limits
- Users achieve savings goals 40% faster than without tracking
- Reduce "forgotten expenses" and uncollected loans by 70%

## Requirements

### Functional Requirements

#### FR1: User Onboarding & Authentication
- Telegram-based authentication using user's Telegram ID
- Simple /start command initiates bot interaction
- Welcome message with quick tutorial (< 2 minutes)
- Language preference selection (Arabic/English)
- Privacy policy acknowledgment
- First-time user guidance for creating initial account

#### FR2: Account Management
- Create multiple accounts (bank, cash, credit card, digital wallet)
- Each account has: name, type, currency, initial balance
- View all accounts with current balances
- Edit account details (name, type)
- Archive/delete accounts (soft delete with transaction preservation)
- Set default account for quick transactions
- Account balance automatically updates with transactions

#### FR3: Expense & Income Logging via Natural Language
- Log expenses through conversational input (e.g., "دفعت 50 جنيه على القهوة")
- Log income through conversational input (e.g., "استلمت راتب 5000")
- AI (RORK) extracts: amount, category, description, account
- Confirmation message showing extracted details before saving
- Support for both Arabic and English inputs
- Manual correction if AI misinterprets
- Automatic categorization with 85%+ accuracy
- Transaction timestamp captured automatically

#### FR4: Balance & Overview
- Instant balance check via command or natural question
- View total balance across all accounts
- View individual account balances
- Visual balance display with account breakdown
- Real-time balance updates after each transaction
- Net worth calculation (assets minus liabilities)

#### FR5: Loan Tracking System
- Create loan records: borrower name, amount, date, optional due date
- Track money lent to friends/family
- Record partial loan payments with automatic balance calculation
- View all active loans with outstanding amounts
- View loan payment history
- Automatic loan status (Active/Paid) based on balance
- Optional reminders for overdue loans
- Loan summary: total lent, total outstanding, total repaid

#### FR6: Transaction History & Search
- View recent transactions (last 10, 20, 50)
- Filter transactions by date range (week, month, year, custom)
- Filter by account, category, or transaction type (expense/income)
- Search transactions by description or amount
- View detailed transaction information
- Sort transactions by date, amount, or category
- Pagination for large transaction lists

#### FR7: Transaction Management
- Edit transaction details (amount, category, description, date)
- Delete transactions (soft delete with audit trail)
- Undo recent transaction (within 5 minutes)
- Duplicate transaction for recurring entries
- Add notes/tags to transactions
- Attach receipt reference (text description)

#### FR8: Budget Planning & Tracking
- Create monthly budgets by category
- Set budget amounts for each spending category
- Real-time tracking of spending vs. budget
- Budget progress visualization (percentage used)
- Alerts when approaching budget limit (80%, 90%, 100%)
- Notifications when budget exceeded
- Monthly budget performance reports
- Budget templates based on spending patterns
- Carry-over unused budget to next month (optional)

#### FR9: Savings Goals
- Create savings goals with target amount and deadline
- Name and describe each goal
- Track progress toward goals with visual indicators
- Log contributions to specific goals
- Calculate estimated time to reach goal based on savings rate
- Goal achievement notifications and celebrations
- Multiple concurrent goals support
- Edit or delete goals
- View goal history and completion rate

#### FR10: Recurring Transactions
- Define recurring income (salary, freelance payments)
- Define recurring expenses (rent, subscriptions, utilities)
- Set recurrence pattern (daily, weekly, monthly, yearly)
- Automatic transaction creation on schedule
- Notifications before recurring transaction is logged
- Edit, pause, or delete recurring transactions
- View all active recurring transactions
- Manual trigger for recurring transaction if needed

#### FR11: Bill Reminders & Notifications
- Create bill records with due dates
- Set reminder timing (1 day, 3 days, 1 week before)
- Proactive notifications before bill due dates
- Mark bills as paid (creates expense transaction)
- Track bill payment history
- Recurring bill support (monthly utilities, annual subscriptions)
- Overdue bill alerts
- View upcoming bills calendar

#### FR12: Analytics & Insights
- Weekly/monthly spending analysis
- Category breakdown with percentages
- Income vs. expenses comparison (net cash flow)
- Spending trends over time (line charts)
- Top spending categories (pie charts)
- Month-over-month comparisons
- Predictive spending insights based on patterns
- Personalized savings recommendations
- Budget adherence score
- Financial health summary
- **Dashboard-style presentation option** for all analytics queries

#### FR13: Chart Generation & Visualization
- **Interactive chart options** after spending/analytics queries (e.g., "Show as chart?")
- **Dashboard-quality visual design** with professional styling
- Pie charts for category breakdown
- Bar charts for weekly/monthly comparisons
- Line charts for spending trends over time
- Visual balance overview across accounts
- Budget progress bars with percentage indicators
- Savings goal progress indicators
- **Multiple chart styles available** (modern, minimal, colorful themes)
- Charts generated via QuickChart API with premium templates
- Charts delivered as high-quality images in Telegram
- **Quick visualization access** from natural language queries (e.g., "كم صرفت الأسبوع ده؟" → text summary + "عرض كجراف؟" option)
- Mobile-optimized charts for perfect Telegram viewing
- Chart customization options (colors, formats, data ranges)

#### FR14: Data Export
- Export transaction history to Excel (CSV)
- Export to PDF for record-keeping
- Date range selection for export
- Include all transaction details
- Account summary in export
- Budget and goal data in export
- Privacy-preserving export (no sensitive data leaks)

#### FR15: AI Conversational Interface
- Natural language understanding via RORK Toolkit
- Context-aware responses
- Confirmation patterns for all actions
- Error recovery through rephrasing
- Proactive suggestions based on user behavior
- Help command for guidance
- Conversational tone (not robotic)
- Emoji usage for visual clarity

#### FR16: Notifications & Alerts
- Budget limit alerts (80%, 90%, 100%, exceeded)
- Bill payment reminders
- Loan repayment reminders (optional)
- Savings goal milestones
- Recurring transaction confirmations
- Weekly spending summaries
- Monthly financial reports
- Customizable notification preferences

#### FR17: Settings & Preferences
- Language preference (Arabic/English)
- Default account selection
- Notification preferences (enable/disable by type)
- Currency preference
- Date format preference
- Privacy settings
- Data export/backup options
- Account deletion with data export

### Non-Functional Requirements

#### NFR1: Performance
- **Response Time:** AI agent responds within 2 seconds for 95% of interactions
- **Transaction Logging:** Complete expense/income logging in < 5 seconds end-to-end
- **Balance Queries:** Return balance information in < 1 second
- **Chart Generation:** Generate and deliver charts within 3 seconds
- **Concurrent Users:** Support 5,000+ simultaneous users without degradation
- **Database Queries:** All queries complete in < 500ms
- **Message Processing:** Handle Telegram webhook within 1 second

#### NFR2: Scalability
- **User Growth:** Architecture supports scaling from 100 to 100,000+ users
- **Transaction Volume:** Handle 100,000+ transactions per user without performance impact
- **Serverless Architecture:** Automatic scaling via Convex Cloud
- **No Infrastructure Management:** Zero manual scaling or server provisioning
- **Cost Efficiency:** Stay within $0-100/month budget through free tier optimization
- **Rate Limit Handling:** Graceful degradation if approaching Convex/Telegram limits

#### NFR3: Reliability & Availability
- **Uptime:** 99.5% system availability (< 4 hours downtime per month)
- **Data Durability:** Zero data loss through Convex's built-in redundancy
- **Error Recovery:** Automatic retry for transient failures
- **Graceful Degradation:** Core features (logging, balance) work even if AI/charts unavailable
- **Backup:** Automatic database backups via Convex
- **Disaster Recovery:** Recovery Point Objective (RPO) < 1 hour

#### NFR4: Security & Privacy
- **Authentication:** Telegram-based authentication (no passwords to manage)
- **Data Isolation:** Complete user data isolation in Convex database
- **Encryption:** Data encrypted at rest and in transit (Convex default)
- **No Third-Party Sharing:** User financial data never shared with external parties
- **API Security:** Secure webhook validation for Telegram integration
- **RORK API:** Minimal data sent to AI (only transaction text, no full history)
- **Audit Trail:** Soft deletes maintain transaction history for auditing

#### NFR5: Usability
- **Time to First Transaction:** New users log first transaction in < 2 minutes
- **Learning Curve:** Zero training required - conversational interface is intuitive
- **Error Messages:** Clear, actionable error messages in user's language
- **Confirmation Patterns:** All destructive actions require confirmation
- **Help Accessibility:** /help command available at any time
- **Visual Clarity:** Emoji and formatting enhance readability
- **Accessibility:** Support for screen readers via Telegram's accessibility features

#### NFR6: Localization & Internationalization
- **Primary Language:** Full Arabic support (native interface and AI understanding)
- **Secondary Language:** Complete English support
- **Language Switching:** Users can switch languages anytime via settings
- **Cultural Context:** AI understands Arabic financial terminology and cultural norms
- **Date/Number Formats:** Respect regional preferences for dates and numbers
- **Currency Display:** Support for local currency symbols and formatting

#### NFR7: Maintainability
- **Code Quality:** TypeScript with strict type checking throughout
- **Architecture:** Clean separation of concerns (handlers, actions, database)
- **Documentation:** Inline code documentation and API specifications
- **Testing:** Unit tests for critical business logic
- **Monitoring:** Error tracking and performance monitoring via Convex dashboard
- **Deployment:** Zero-downtime deployments via Convex
- **Version Control:** Git-based workflow with clear commit history

#### NFR8: Compliance & Data Governance
- **Data Ownership:** Users own their data and can export anytime
- **Right to Deletion:** Users can delete account and all data permanently
- **Data Retention:** Unlimited transaction history unless user deletes
- **Privacy Policy:** Clear privacy policy presented during onboarding
- **Terms of Service:** User agreement for bot usage
- **GDPR Considerations:** Export and deletion capabilities for compliance readiness

#### NFR9: Integration & Extensibility
- **Telegram API:** Stable integration via official Bot API
- **RORK Toolkit API:** Reliable AI integration with fallback for failures
- **QuickChart API:** Chart generation with graceful degradation if unavailable
- **Webhook Reliability:** Handle Telegram webhook retries and duplicates
- **API Versioning:** Support for future Convex and Telegram API updates
- **Extensibility:** Architecture allows adding new features without major refactoring

#### NFR10: Monitoring & Observability
- **Error Tracking:** All errors logged with context for debugging
- **Performance Metrics:** Track response times, query performance, API latency
- **User Analytics:** Track feature adoption, engagement, retention (privacy-preserving)
- **System Health:** Monitor Convex function execution, database performance
- **Alert Thresholds:** Notifications for critical errors or performance degradation
- **Usage Patterns:** Understand peak usage times for capacity planning

#### NFR11: Cost Management
- **Budget Constraint:** Operate within $0-100/month budget
- **Free Tier Optimization:** Maximize use of Convex free tier (1M function calls/month)
- **API Cost Control:** Monitor RORK API usage to avoid unexpected costs
- **Efficient Queries:** Optimize database queries to minimize function executions
- **Chart Caching:** Cache frequently requested charts to reduce API calls
- **Cost Alerts:** Notifications if approaching budget limits

#### NFR12: User Experience Consistency
- **Response Tone:** Consistent conversational tone across all interactions
- **Emoji Usage:** Standardized emoji for visual hierarchy (💰 money, 🏦 accounts, 📊 charts)
- **Message Format:** Consistent formatting for similar message types
- **Error Handling:** Uniform error recovery patterns
- **Confirmation Style:** Consistent confirmation messages for all actions
- **Brand Voice:** Friendly, helpful, non-judgmental financial assistant persona

## User Journeys

### Journey 1: New User Onboarding & First Transaction

**Persona:** Ahmed, 28-year-old professional in Cairo, wants to start tracking expenses

**Goal:** Get started with the bot and log first expense within 2 minutes

**Steps:**
1. **Discovery:** Ahmed hears about the bot from a friend, searches for it on Telegram
2. **Initiation:** Sends `/start` command to the bot
3. **Welcome:** Bot responds with friendly greeting in Arabic, explains what it does
4. **Language Selection:** Bot asks language preference (Arabic/English), Ahmed selects Arabic
5. **Privacy:** Bot presents brief privacy policy, Ahmed acknowledges
6. **First Account Setup:** Bot guides Ahmed to create his first account
   - Bot: "لنبدأ بإنشاء حسابك الأول. ما نوع الحساب؟ (محفظة، بنك، بطاقة ائتمان)"
   - Ahmed: "محفظة"
   - Bot: "ممتاز! ما اسم المحفظة؟"
   - Ahmed: "محفظتي"
   - Bot: "كم الرصيد الحالي؟"
   - Ahmed: "500 جنيه"
   - Bot confirms: "✅ تم إنشاء حساب 'محفظتي' برصيد 500 جنيه"
7. **Quick Tutorial:** Bot explains how to log expenses: "يمكنك الآن تسجيل المصروفات بكتابة جملة عادية مثل: دفعت 50 جنيه على القهوة"
8. **First Transaction:** Ahmed logs his first expense
   - Ahmed: "دفعت 30 جنيه على الغداء"
   - Bot extracts details and confirms: "📝 هل هذا صحيح؟\n💰 المبلغ: 30 جنيه\n📁 الفئة: طعام\n📝 الوصف: الغداء\n🏦 الحساب: محفظتي"
   - Ahmed: "نعم"
   - Bot: "✅ تم تسجيل المصروف. رصيدك الحالي: 470 جنيه"
9. **Success:** Ahmed successfully logged his first transaction in under 2 minutes

**Decision Points:**
- Language choice (Arabic/English)
- Account type selection
- Confirmation or correction of AI-extracted transaction details

**Success Metrics:**
- Time to first transaction < 2 minutes
- User completes onboarding without confusion
- First transaction logged successfully

---

### Journey 2: Monthly Budget Planning & Tracking

**Persona:** Layla, 32-year-old marketing manager, wants to control spending and save money

**Goal:** Create monthly budget, track spending, and receive alerts when approaching limits

**Steps:**
1. **Budget Intent:** Layla has been using the bot for 2 weeks, decides to create a budget
   - Layla: "أريد إنشاء ميزانية شهرية"
2. **Budget Creation:** Bot guides her through budget setup
   - Bot: "رائع! سأساعدك في إنشاء ميزانية. لأي شهر؟"
   - Layla: "أكتوبر"
   - Bot: "حسناً، لنحدد الميزانية لكل فئة. كم تريدين تخصيص للطعام؟"
   - Layla: "2000 جنيه"
   - Bot: "وللمواصلات؟"
   - Layla: "500 جنيه"
   - Bot continues for other categories (entertainment, shopping, bills, etc.)
3. **Budget Confirmation:** Bot summarizes total budget
   - Bot: "📊 ميزانية أكتوبر:\n🍔 طعام: 2000 جنيه\n🚗 مواصلات: 500 جنيه\n🎬 ترفيه: 300 جنيه\n🛍️ تسوق: 1000 جنيه\n💡 فواتير: 800 جنيه\n\n💰 إجمالي الميزانية: 4600 جنيه\n\nهل تريدين حفظ هذه الميزانية؟"
   - Layla: "نعم"
4. **Daily Spending:** Throughout the month, Layla logs expenses as usual
   - Each transaction automatically tracked against budget
5. **Budget Alerts:** Bot sends proactive notifications
   - Day 15: "⚠️ لقد استخدمت 80% من ميزانية الطعام (1600/2000 جنيه)"
   - Day 20: "🚨 لقد تجاوزت ميزانية الترفيه! (350/300 جنيه)"
6. **Budget Check:** Layla checks budget status anytime
   - Layla: "كيف حال ميزانيتي؟"
   - Bot shows progress bars for each category with percentages
7. **Month-End Report:** On October 31st, bot sends summary
   - Bot: "📊 تقرير ميزانية أكتوبر:\n✅ طعام: 1850/2000 (92%)\n✅ مواصلات: 450/500 (90%)\n❌ ترفيه: 450/300 (150%)\n✅ تسوق: 800/1000 (80%)\n✅ فواتير: 800/800 (100%)\n\n🎯 التزمت بـ 4 من 5 فئات!"
8. **Adjustment:** Layla adjusts November budget based on insights
   - Increases entertainment budget, decreases food budget

**Decision Points:**
- Budget amounts for each category
- Whether to adjust budget mid-month
- Response to budget alerts (reduce spending or accept overage)

**Success Metrics:**
- 40% of users create at least one budget
- 60% of budget users stay within limits
- Users report better spending awareness

---

### Journey 3: Loan Tracking & Collection

**Persona:** Omar, 35-year-old engineer, frequently lends money to friends and family

**Goal:** Track loans given to others and ensure repayment

**Steps:**
1. **Lending Money:** Omar lends money to his friend Khaled
   - Omar physically gives 1000 EGP to Khaled
   - Omar logs it in bot: "أقرضت خالد 1000 جنيه"
2. **Loan Creation:** Bot recognizes loan intent
   - Bot: "📋 هل تريد تسجيل هذا كقرض؟\n👤 المقترض: خالد\n💰 المبلغ: 1000 جنيه\n📅 التاريخ: 2025-10-12\n\nهل تريد تحديد موعد استحقاق؟"
   - Omar: "نعم، بعد شهر"
   - Bot: "✅ تم تسجيل القرض. موعد الاستحقاق: 2025-11-12"
3. **Loan Tracking:** Omar can view all active loans anytime
   - Omar: "أرني القروض"
   - Bot: "📋 القروض النشطة:\n\n1. 👤 خالد\n💰 المبلغ: 1000 جنيه\n📅 الاستحقاق: 2025-11-12 (30 يوم متبقي)\n📊 الحالة: نشط\n\n💵 إجمالي القروض المستحقة: 1000 جنيه"
4. **Partial Payment:** Khaled pays back 400 EGP
   - Omar: "خالد دفع 400 جنيه من القرض"
   - Bot: "✅ تم تسجيل الدفعة\n👤 خالد\n💰 دفع: 400 جنيه\n💵 المتبقي: 600 جنيه\n📊 الحالة: نشط"
5. **Reminder:** Bot sends reminder as due date approaches
   - Bot (Nov 10): "⏰ تذكير: قرض خالد (600 جنيه) يستحق خلال يومين"
6. **Full Repayment:** Khaled pays remaining amount
   - Omar: "خالد دفع 600 جنيه"
   - Bot: "🎉 تم سداد القرض بالكامل!\n👤 خالد\n💰 المبلغ الأصلي: 1000 جنيه\n✅ تم السداد: 1000 جنيه\n📊 الحالة: مسدد"
7. **Loan History:** Omar can review past loans
   - Omar: "أرني سجل القروض"
   - Bot shows all loans (active and paid) with payment history

**Decision Points:**
- Whether to set due date for loan
- Whether to enable reminders
- When to record partial payments

**Success Metrics:**
- 50% of users track at least one loan
- Users report 70% reduction in forgotten loans
- Loan collection rate improves

---

### Journey 4: Savings Goal Achievement

**Persona:** Fatima, 26-year-old teacher, wants to save for vacation

**Goal:** Set savings goal, track progress, and achieve target amount

**Steps:**
1. **Goal Setting:** Fatima decides to save for summer vacation
   - Fatima: "أريد إنشاء هدف ادخار"
   - Bot: "رائع! ما هو هدفك؟"
   - Fatima: "رحلة صيفية"
   - Bot: "كم المبلغ المستهدف؟"
   - Fatima: "5000 جنيه"
   - Bot: "متى تريدين الوصول لهذا الهدف؟"
   - Fatima: "يونيو 2026"
   - Bot: "✅ تم إنشاء هدف 'رحلة صيفية'\n💰 الهدف: 5000 جنيه\n📅 الموعد: يونيو 2026\n⏱️ المدة: 8 أشهر\n\n💡 لتحقيق هدفك، احفظي 625 جنيه شهرياً"
2. **Initial Contribution:** Fatima makes first contribution
   - Fatima: "أضف 500 جنيه للهدف"
   - Bot: "✅ تم إضافة 500 جنيه\n📊 التقدم: 500/5000 جنيه (10%)\n🎯 متبقي: 4500 جنيه"
3. **Progress Tracking:** Bot shows visual progress
   - Bot sends progress bar: "▓░░░░░░░░░ 10%"
4. **Regular Contributions:** Fatima adds money monthly
   - Month 2: 600 EGP → Progress: 22%
   - Month 3: 700 EGP → Progress: 36%
   - Bot celebrates milestones: "🎉 رائع! وصلت إلى 25% من هدفك!"
5. **Motivation:** Bot provides encouragement
   - "💪 أنت على الطريق الصحيح! بهذا المعدل ستحققين هدفك قبل الموعد بشهر"
6. **Goal Check:** Fatima checks progress anytime
   - Fatima: "كيف حال أهدافي؟"
   - Bot shows all goals with progress bars and estimated completion dates
7. **Goal Achievement:** After 7 months, Fatima reaches 5000 EGP
   - Bot: "🎊🎉 مبروك! لقد حققت هدف 'رحلة صيفية'!\n💰 المبلغ: 5000 جنيه\n⏱️ الوقت: 7 أشهر\n🏆 أنت ملتزمة ورائعة!"
8. **New Goal:** Encouraged by success, Fatima sets new goal for emergency fund

**Decision Points:**
- Goal amount and deadline
- Contribution frequency and amounts
- Whether to adjust goal if circumstances change

**Success Metrics:**
- 30% of users set at least one savings goal
- Users achieve goals 40% faster than without tracking
- Goal completion rate > 60%

---

### Journey 5: Quick Analytics with Dashboard-Style Visualization

**Persona:** Amr, 30-year-old developer, wants quick spending insights with visual clarity

**Goal:** Check weekly spending and view elegant dashboard-style charts

**Steps:**
1. **Quick Query:** Amr asks about his spending
   - Amr: "كم صرفت الأسبوع ده؟" (How much did I spend this week?)
2. **Text Summary:** Bot provides immediate text-based answer
   - Bot: "📊 مصروفات هذا الأسبوع:\n\n💰 الإجمالي: 1,250 جنيه\n\n📁 حسب الفئة:\n🍔 طعام: 450 جنيه (36%)\n🚗 مواصلات: 300 جنيه (24%)\n🎬 ترفيه: 200 جنيه (16%)\n🛍️ تسوق: 200 جنيه (16%)\n☕ مقاهي: 100 جنيه (8%)"
3. **Chart Option:** Bot offers visualization
   - Bot: "📊 عرض كجراف؟ (Show as chart?)\n1️⃣ Pie Chart - توزيع الفئات\n2️⃣ Bar Chart - مقارنة يومية\n3️⃣ Line Chart - الاتجاه الأسبوعي"
4. **Chart Selection:** Amr chooses pie chart
   - Amr: "1"
5. **Dashboard-Style Chart:** Bot generates and sends elegant chart
   - Professional pie chart with:
     - Modern color scheme
     - Clean typography
     - Percentage labels
     - Category icons
     - Total amount displayed
     - Dashboard-quality design
   - Bot: "📊 هذا توزيع مصروفاتك هذا الأسبوع"
6. **Additional Options:** Bot offers more visualizations
   - Bot: "تريد رؤية:\n📈 اتجاه الإنفاق؟\n📊 مقارنة مع الأسبوع الماضي؟\n💡 رؤى وتوصيات؟"
7. **Trend Analysis:** Amr requests trend
   - Amr: "اتجاه الإنفاق"
   - Bot sends line chart showing daily spending pattern with trend line
8. **Insights:** Bot provides AI-powered insights
   - Bot: "💡 ملاحظات:\n• إنفاقك على الطعام زاد 20% عن الأسبوع الماضي\n• أيام الخميس والجمعة هي الأعلى إنفاقاً\n• توصية: حاول تقليل وجبات المطاعم بوجبة واحدة أسبوعياً لتوفير 200 جنيه شهرياً"

**Decision Points:**
- Chart type selection (pie, bar, line)
- Whether to view additional analytics
- Whether to act on AI recommendations

**Success Metrics:**
- Users can access charts within 3 clicks
- 60%+ of analytics queries result in chart viewing
- Users report charts are "dashboard-quality"
- Chart generation time < 3 seconds

## UX Design Principles

### 1. Conversational-First Interface
**Principle:** Users communicate naturally without learning commands or navigating menus.
- Natural language understanding via AI (RORK Toolkit)
- No rigid command syntax required
- Context-aware responses that remember conversation flow
- Users can rephrase if bot misunderstands
- Conversational tone that feels like chatting with a helpful friend

### 2. Confirmation Before Action
**Principle:** All significant actions require explicit user confirmation to prevent errors.
- AI extracts transaction details → shows interpretation → asks "Is this correct?"
- Destructive actions (delete, edit) always confirm before executing
- Clear preview of what will happen before it happens
- Easy correction mechanism if AI misinterprets
- Undo option for recent actions (within 5 minutes)

### 3. Immediate Feedback
**Principle:** Users receive instant confirmation after every action.
- Transaction logged → immediate balance update shown
- Budget created → confirmation with summary
- Goal set → progress tracker displayed
- Visual indicators (✅ ❌ ⚠️) for status clarity
- Real-time updates across all devices via Convex

### 4. Progressive Disclosure
**Principle:** Show essential information first, advanced features on demand.
- New users see core features (log expense, check balance)
- Advanced features (budgets, goals, analytics) introduced gradually
- Help available but not intrusive
- Optional features don't overwhelm basic workflows
- Users discover features naturally through usage

### 5. Visual Hierarchy with Emoji
**Principle:** Use emoji strategically to enhance readability and create visual structure.
- 💰 Money/amounts
- 🏦 Accounts/banking
- 📊 Charts/analytics
- 🎯 Goals/targets
- ⚠️ Warnings/alerts
- ✅ Success/confirmation
- 📝 Transactions/logging
- Consistent emoji usage across all interactions

### 6. Bilingual Excellence
**Principle:** Full support for Arabic and English with cultural context awareness.
- Users choose preferred language during onboarding
- Can switch languages anytime via settings
- AI understands both languages equally well
- Arabic financial terminology and cultural norms respected
- Date/number formats adapt to language preference
- Right-to-left (RTL) text handling for Arabic

### 7. Zero Learning Curve
**Principle:** Users should accomplish tasks without training or documentation.
- Onboarding completes in < 2 minutes
- First transaction logged immediately after setup
- Intuitive conversational interface requires no manual
- Help available via /help command but rarely needed
- Error messages are clear and actionable
- Bot guides users through complex workflows

### 8. Proactive Intelligence
**Principle:** Bot anticipates needs and provides insights without being asked.
- Budget alerts when approaching limits (80%, 90%, 100%)
- Bill reminders before due dates
- Loan repayment reminders
- Weekly spending summaries
- Monthly financial reports
- AI-powered savings recommendations
- Spending pattern insights

### 9. Dashboard-Quality Visualizations
**Principle:** Analytics and charts should be elegant, professional, and instantly understandable.
- Interactive chart options after every analytics query
- Multiple chart types (pie, bar, line) for different insights
- Professional styling with modern color schemes
- Mobile-optimized for perfect Telegram viewing
- Quick access: text summary + "Show as chart?" option
- Charts feel like premium dashboard widgets
- Customizable themes and formats

### 10. Privacy-First Design
**Principle:** User financial data is sacred and must be protected at all costs.
- Complete data isolation per user in Convex
- No third-party data sharing ever
- Minimal data sent to AI (only transaction text, no history)
- Users own their data and can export anytime
- Right to deletion with complete data removal
- Transparent privacy policy during onboarding
- Secure Telegram authentication (no passwords)
- Encryption at rest and in transit (Convex default)

## Epics

The Finance Tracker v2.0 is organized into **10 epics** that deliver value incrementally. Each epic represents a significant capability that users can immediately benefit from.

### Epic 1: Foundation & Telegram Bot Setup
**Goal:** Establish core infrastructure and bot communication
**Value:** Users can interact with the bot and receive responses
**Timeline:** Week 1 (Foundation phase)

**Key Capabilities:**
- Telegram bot registration and webhook setup
- Convex project initialization and deployment
- Basic message handling and routing
- User registration and profile creation
- Language preference (Arabic/English)
- /start and /help commands

**Success Criteria:**
- Bot responds to messages within 2 seconds
- Users can complete onboarding in < 2 minutes
- Webhook handles 100+ concurrent messages

---

### Epic 2: Account Management
**Goal:** Enable users to create and manage multiple financial accounts
**Value:** Users can organize their money across different accounts
**Timeline:** Week 1-2 (Foundation phase)

**Key Capabilities:**
- Create accounts (bank, cash, credit card, digital wallet)
- View all accounts with current balances
- Edit account details
- Set default account for transactions
- Archive/delete accounts (soft delete)
- Account balance auto-updates with transactions

**Success Criteria:**
- Users can create first account in < 30 seconds
- Support for 10+ accounts per user
- Balance calculations are accurate to 2 decimal places

---

### Epic 3: Expense & Income Logging with AI
**Goal:** Natural language transaction logging with AI-powered extraction
**Value:** Users can log expenses/income in seconds through conversation
**Timeline:** Week 2-4 (Foundation phase)

**Key Capabilities:**
- AI-powered natural language understanding (RORK)
- Expense logging with automatic categorization
- Income logging with source tracking
- Transaction confirmation workflow
- Manual correction if AI misinterprets
- Automatic balance updates
- Transaction history storage
- Support for Arabic and English inputs

**Success Criteria:**
- 85%+ AI categorization accuracy
- Transaction logging completes in < 5 seconds
- Users can log 100+ transactions without issues

---

### Epic 4: Loan Tracking System
**Goal:** Track money lent to friends/family with payment management
**Value:** Users never forget loans and can track repayments easily
**Timeline:** Week 5-6 (Extended features phase)

**Key Capabilities:**
- Create loan records (borrower, amount, date, due date)
- Track active loans with outstanding balances
- Record partial loan payments
- Automatic balance calculation
- Loan status management (Active/Paid)
- View loan payment history
- Optional loan reminders
- Loan summary dashboard

**Success Criteria:**
- 50%+ of users track at least one loan
- Users report 70% reduction in forgotten loans
- Loan calculations are 100% accurate

---

### Epic 5: Transaction History & Search
**Goal:** Powerful transaction browsing and search capabilities
**Value:** Users can find any transaction quickly and review spending history
**Timeline:** Week 7-8 (Extended features phase)

**Key Capabilities:**
- View recent transactions (10, 20, 50)
- Filter by date range (week, month, year, custom)
- Filter by account, category, type
- Search by description or amount
- Sort by date, amount, category
- Pagination for large lists
- Transaction detail view
- Edit/delete transactions

**Success Criteria:**
- Search returns results in < 1 second
- Users can find any transaction in < 3 clicks
- Support for 100,000+ transactions per user

---

### Epic 6: Budget Planning & Tracking
**Goal:** Monthly budget creation with real-time tracking and alerts
**Value:** Users control spending and achieve financial discipline
**Timeline:** Week 9-10 (Extended features phase)

**Key Capabilities:**
- Create monthly budgets by category
- Real-time spending vs. budget tracking
- Budget progress visualization
- Alerts at 80%, 90%, 100% thresholds
- Notifications when budget exceeded
- Monthly budget performance reports
- Budget templates based on patterns
- Carry-over unused budget (optional)

**Success Criteria:**
- 40%+ of users create at least one budget
- 60% of budget users stay within limits
- Budget alerts delivered within 1 minute

---

### Epic 7: Savings Goals & Progress Tracking
**Goal:** Set and achieve savings goals with visual progress tracking
**Value:** Users stay motivated and achieve financial targets faster
**Timeline:** Week 11-12 (Extended features phase)

**Key Capabilities:**
- Create savings goals (name, amount, deadline)
- Track progress with visual indicators
- Log contributions to goals
- Calculate estimated completion time
- Goal achievement celebrations
- Multiple concurrent goals
- Edit/delete goals
- Goal history and completion rate

**Success Criteria:**
- 30%+ of users set at least one goal
- Users achieve goals 40% faster than without tracking
- Goal completion rate > 60%

---

### Epic 8: Recurring Transactions & Automation
**Goal:** Automate recurring income/expenses for hands-free tracking
**Value:** Users save time and never miss regular transactions
**Timeline:** Week 13-14 (Advanced features phase)

**Key Capabilities:**
- Define recurring income (salary, freelance)
- Define recurring expenses (rent, subscriptions, bills)
- Set recurrence pattern (daily, weekly, monthly, yearly)
- Automatic transaction creation on schedule
- Pre-transaction notifications
- Edit, pause, delete recurring transactions
- View all active recurring transactions
- Manual trigger option

**Success Criteria:**
- 50%+ of users set up at least one recurring transaction
- Automated transactions execute within 1 hour of schedule
- Zero missed recurring transactions

---

### Epic 9: Bill Reminders & Notifications
**Goal:** Proactive bill reminders to prevent late payments
**Value:** Users never miss bill payments and avoid late fees
**Timeline:** Week 15-16 (Advanced features phase)

**Key Capabilities:**
- Create bill records with due dates
- Set reminder timing (1 day, 3 days, 1 week before)
- Proactive notifications before due dates
- Mark bills as paid (creates expense transaction)
- Track bill payment history
- Recurring bill support
- Overdue bill alerts
- Upcoming bills calendar view

**Success Criteria:**
- 40%+ of users set up bill reminders
- Zero missed bill notifications
- Users report reduced late payments

---

### Epic 10: Advanced Analytics & Insights
**Goal:** Comprehensive spending analysis with AI-powered insights and dashboard-quality visualizations
**Value:** Users gain deep financial awareness and actionable recommendations
**Timeline:** Week 17-20 (Advanced features phase)

**Key Capabilities:**
- Weekly/monthly spending analysis
- Category breakdown with percentages
- Income vs. expenses (net cash flow)
- Spending trends over time
- Month-over-month comparisons
- **Dashboard-style chart visualizations** (pie, bar, line)
- **Interactive chart options** after analytics queries
- Predictive spending insights
- Personalized savings recommendations
- Budget adherence score
- Financial health summary
- **Multiple chart themes** (modern, minimal, colorful)

**Success Criteria:**
- 70%+ of users view analytics at least weekly
- 60%+ of analytics queries result in chart viewing
- Users report charts are "dashboard-quality"
- AI insights accuracy > 80%

---

**Epic Dependencies:**
- Epic 1 → Required for all other epics (foundation)
- Epic 2 → Required for Epic 3 (accounts needed for transactions)
- Epic 3 → Required for Epic 4-10 (transactions are core data)
- Epic 4-10 → Can be developed in parallel after Epic 3

**Total Estimated Timeline:** 20 weeks (5 months) for all 10 epics

_Detailed user stories, acceptance criteria, and technical specifications for each epic are documented in the separate `epics.md` file._

## Out of Scope

The following features are explicitly **out of scope** for Finance Tracker v2.0 MVP. They may be considered for future versions based on user feedback and market validation.

### Features Deferred to Future Versions

**Multi-User & Family Accounts (Phase 4)**
- Shared household finance management
- Family member roles and permissions
- Split expenses between family members
- Children's allowance tracking
- Shared budgets and goals
- **Rationale:** Adds significant complexity; focus on single-user experience first

**Multi-Currency Support**
- Support for multiple currencies with auto-conversion
- Real-time exchange rate updates
- Currency conversion history
- **Rationale:** Requires external API integration and adds complexity; single currency (EGP) sufficient for MVP

**Bank Integration & Auto-Import**
- Connect to bank APIs for automatic transaction import
- Automatic transaction categorization from bank data
- Real-time balance sync with bank accounts
- **Rationale:** Requires bank partnerships, compliance, and security infrastructure beyond MVP scope

**Receipt Scanning & OCR**
- Upload receipt images
- OCR extraction of amount and merchant
- Attach receipts to transactions
- **Rationale:** Requires image processing infrastructure and storage; manual entry sufficient for MVP

**Investment Tracking**
- Stock portfolio tracking
- Cryptocurrency holdings
- Investment performance analysis
- Dividend and capital gains tracking
- **Rationale:** Different domain requiring market data APIs; focus on personal finance first

**Web Dashboard**
- Browser-based interface for detailed analysis
- Desktop-optimized charts and reports
- Bulk transaction management
- **Rationale:** Telegram-first approach; web interface adds development overhead

**Mobile Native App**
- iOS and Android native applications
- Offline mode with sync
- Push notifications outside Telegram
- **Rationale:** Telegram bot provides cross-platform access; native apps require separate development

**Voice Input**
- Log transactions via voice messages
- Voice-to-text transcription
- Voice commands for queries
- **Rationale:** Adds complexity; text input sufficient for MVP

**Advanced Tax Features**
- Tax category mapping
- Tax report generation
- Export for tax filing software
- Tax deduction tracking
- **Rationale:** Requires tax law knowledge and varies by jurisdiction

**Merchant Recognition**
- Automatic merchant identification
- Merchant-based categorization
- Merchant spending patterns
- **Rationale:** Requires merchant database and pattern matching beyond MVP scope

**Community Features**
- Anonymous spending comparisons with similar users
- Community challenges and goals
- Social sharing of achievements
- **Rationale:** Adds privacy concerns and social complexity; focus on individual tracking first

**Credit Score Tracking**
- Monitor credit score changes
- Credit report integration
- Credit improvement recommendations
- **Rationale:** Requires third-party credit bureau integration

**Debt Management**
- Credit card debt tracking
- Loan repayment calculators
- Debt payoff strategies
- **Rationale:** Different from peer-to-peer loans; adds financial planning complexity

**Bill Splitting**
- Track shared expenses with roommates/friends
- Calculate who owes whom
- Settlement tracking
- **Rationale:** Adds multi-user complexity; focus on individual tracking first

**Custom Categories**
- User-defined expense/income categories
- Category hierarchies
- Category icons and colors
- **Rationale:** Predefined categories sufficient for MVP; custom categories add UX complexity

**Advanced Budgeting Methods**
- Zero-based budgeting
- Envelope budgeting system
- 50/30/20 rule automation
- **Rationale:** Simple category budgets sufficient for MVP

**Financial Coaching**
- AI-powered personalized financial advice
- Goal-based financial planning
- Retirement planning
- Emergency fund recommendations
- **Rationale:** Requires financial expertise and liability considerations

**API Access**
- Public API for third-party integrations
- Webhook notifications
- Developer documentation
- **Rationale:** Not needed until significant user base and demand

**Premium Tier**
- Paid subscription features
- Advanced analytics
- Priority support
- Unlimited accounts/transactions
- **Rationale:** Monetization deferred until product-market fit proven

### Technical Limitations Accepted for MVP

- **Single Currency:** EGP only (no multi-currency)
- **No Offline Mode:** Requires internet connection
- **Telegram Only:** No other messaging platforms (WhatsApp, etc.)
- **English/Arabic Only:** No other languages
- **Rate Limits:** Subject to Telegram (30 msg/sec) and Convex free tier (1M calls/month)
- **No Data Migration:** From v1.0 or other apps (clean start)
- **Basic Charts:** QuickChart API only (no interactive web charts)
- **No Real-time Collaboration:** Single user per account

### Assumptions & Dependencies

These items are **out of scope** but represent assumptions that must hold true:

- Users have Telegram installed and use it regularly
- Users have reliable internet connectivity
- RORK Toolkit API remains available and affordable
- Convex free tier is sufficient for initial user base
- Users trust storing financial data in a bot
- No regulatory compliance required for personal finance tracking (not a financial institution)

---

## Next Steps

### Immediate Actions (This Week)

**1. Architecture & Technical Design** ⚡ **CRITICAL NEXT STEP**
- **Action:** Start architecture workflow with architect in new context
- **Command:** `/architect` or workflow `3-solutioning`
- **Input Documents:** This PRD, epics.md, product brief, project-workflow-analysis.md
- **Expected Output:** solution-architecture.md with:
  - Convex database schema for all tables (users, accounts, transactions, loans, budgets, goals, etc.)
  - API structure and integration points (RORK, Telegram, QuickChart)
  - Data flow diagrams
  - Security and authentication design
  - Performance optimization strategies
  - Deployment architecture
- **Timeline:** 1-2 weeks
- **Why Critical:** Cannot begin development without technical architecture

**2. UX Specification (Recommended)**
- **Action:** Create detailed UX specification for conversational interface
- **Command:** workflow `plan-project` → select "UX specification"
- **Focus Areas:**
  - Conversation flows for all features
  - Message templates and formatting
  - Error handling and recovery patterns
  - Emoji usage standards
  - Chart visualization designs
  - Arabic/English localization
- **Timeline:** 1 week (can run parallel with architecture)
- **Why Recommended:** Ensures consistent user experience across all interactions

**3. Review & Stakeholder Approval**
- **Action:** Review PRD and epics with stakeholders
- **Participants:** Product owner, development team, architect
- **Focus:** Validate scope, priorities, success metrics
- **Timeline:** 2-3 days

### Phase 1: Planning & Design (Weeks 1-2)

**4. Technical Specifications**
- Create detailed tech specs for Epic 1-3 (Foundation)
- Define database schema with architect
- Design API contracts for RORK integration
- Plan Telegram webhook implementation
- Document error handling strategies

**5. Development Environment Setup**
- Initialize Convex project
- Set up TypeScript configuration
- Configure development and production environments
- Set up version control (Git)
- Create CI/CD pipeline

**6. Sprint Planning**
- Break Epic 1-3 into 2-week sprints
- Refine user stories with acceptance criteria
- Estimate story points
- Assign stories to sprints
- Define Definition of Done

### Phase 2: Foundation Development (Weeks 3-6)

**7. Epic 1-3 Implementation**
- Week 3-4: Epic 1 (Bot setup) + Epic 2 (Accounts)
- Week 5-6: Epic 3 (AI transaction logging)
- Daily standups and progress tracking
- Continuous testing and deployment

**8. Testing & Quality Assurance**
- Unit tests for business logic
- Integration tests for Telegram webhook
- End-to-end testing of user flows
- Performance testing (response times, concurrent users)
- Security testing (data isolation, authentication)

### Phase 3: Extended Features (Weeks 7-14)

**9. Epic 4-7 Implementation**
- Week 7-8: Epic 4 (Loans) + Epic 5 (History/Search)
- Week 9-10: Epic 6 (Budgets)
- Week 11-12: Epic 7 (Goals)
- Week 13-14: Epic 8 (Recurring)

**10. User Testing & Feedback**
- Beta testing with 10-20 users
- Collect feedback on usability and features
- Iterate based on user insights
- Monitor performance and errors

### Phase 4: Advanced Features & Launch (Weeks 15-20)

**11. Epic 9-10 Implementation**
- Week 15-16: Epic 9 (Bill reminders)
- Week 17-20: Epic 10 (Analytics & dashboard charts)

**12. Launch Preparation**
- Final security audit
- Performance optimization
- Documentation (user guide, help content)
- Marketing materials
- Launch plan

**13. Production Launch**
- Soft launch to small user group
- Monitor system performance
- Gradual rollout to target audience
- Track success metrics

### Ongoing Activities

**Monitoring & Analytics**
- Track user engagement metrics
- Monitor system performance
- Error tracking and resolution
- User feedback collection

**Iteration & Improvement**
- Weekly sprint retrospectives
- Continuous feature refinement
- Bug fixes and optimizations
- Plan Phase 4 features based on feedback

---

## Critical Path

```
PRD Complete ✅
    ↓
Architecture Design ⚡ ← YOU ARE HERE
    ↓
Tech Specs + Sprint Planning
    ↓
Epic 1-3 Development (Foundation)
    ↓
Epic 4-7 Development (Extended)
    ↓
Epic 8-10 Development (Advanced)
    ↓
Launch 🚀
```

**Next Immediate Action:** Start architecture workflow with `/architect` command

---

## Document Status

- [x] **PRD Complete** - Comprehensive requirements documented
- [x] **Goals Defined** - 5 strategic goals with measurable outcomes
- [x] **Requirements Documented** - 17 FRs + 12 NFRs covering all features
- [x] **User Journeys Created** - 5 detailed journeys with Arabic examples
- [x] **UX Principles Established** - 10 principles including dashboard visualizations
- [x] **Epics Defined** - 10 epics with ~40 user stories across 3 phases
- [x] **Out of Scope Clarified** - Clear boundaries for MVP
- [x] **Next Steps Outlined** - Architecture phase is critical next step
- [ ] **Stakeholder Approval** - Pending review and sign-off
- [ ] **Architecture Design** - Awaiting architect consultation
- [ ] **Ready for Development** - After architecture and tech specs complete

**Documents Generated:**
- ✅ `PRD.md` - This comprehensive product requirements document
- ✅ `epics.md` - Detailed epic breakdown with user stories
- ✅ `project-workflow-analysis.md` - Project classification and routing decisions
- ✅ `technical-decisions-template.md` - Technical preferences captured (dashboard charts)

**Next Critical Action:** Start architecture workflow (`/architect`) to design Convex database schema, API structure, and technical implementation plan.

---

_This PRD adapts to project level Level 3 (Full Product) - providing appropriate detail without overburden._

**Document Version:** 1.0  
**Last Updated:** 2025-10-12  
**Author:** Amr (Product Manager: John)  
**Status:** Complete - Ready for Architecture Phase
