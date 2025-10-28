<!--
SYNC IMPACT REPORT:
Version Change: [INITIAL] → 1.0.0
Modified Principles: Initial constitution creation
Added Sections: All (Core Principles, Architecture Standards, Quality Gates, Governance)
Templates Requiring Updates: ✅ Updated (plan-template.md, spec-template.md, tasks-template.md)
Follow-up TODOs: None
-->

# Finance Tracker V2 Constitution

## Core Principles

### I. Feature-Based Organization (BMAD Pattern) - NON-NEGOTIABLE

All application code MUST reside in the `/bmad` folder following the Build-Measure-Analyze-Deploy pattern:

- **Feature Modules**: All features in `/bmad/features/[feature-name]/` containing components, hooks, types, and business logic
- **Shared Components**: Reusable UI components in `/bmad/components/`
- **Utilities**: Helper functions in `/bmad/lib/`
- **Type Definitions**: Shared types in `/bmad/types/`
- **No Flat Structure**: Code MUST NOT be scattered in root or arbitrary folders

**Rationale**: Feature-based organization ensures modularity, maintainability, and clear boundaries. It prevents code sprawl and makes features independently testable and deployable.

### II. Real-Time First Architecture - NON-NEGOTIABLE

All data operations MUST use Convex's real-time capabilities:

- **Subscriptions**: Use `useQuery` for all data fetching (auto-subscribes to changes)
- **Mutations**: Use `useMutation` for all write operations
- **Optimistic Updates**: UI MUST update immediately before server confirmation
- **WebSocket-Based**: Persistent connection for instant sync across devices
- **No REST Polling**: Traditional polling patterns are FORBIDDEN

**Rationale**: Real-time architecture provides superior UX with instant updates, reduces server load, and simplifies state management by eliminating manual cache invalidation.

### III. Type Safety & Validation - NON-NEGOTIABLE

TypeScript strict mode and runtime validation are MANDATORY:

- **TypeScript Strict Mode**: `strict: true` in tsconfig.json - NO implicit any, strict null checks
- **Zod Schemas**: Runtime validation for ALL forms and API inputs
- **Convex Auto-Generated Types**: Use generated types from schema - NO manual type duplication
- **Interface-First**: Define TypeScript interfaces BEFORE implementation
- **Zero TypeScript Errors**: Build MUST fail on TypeScript errors

**Rationale**: Type safety catches bugs at compile time, Zod ensures runtime safety, and auto-generated types eliminate sync issues between schema and code.

### IV. Component Composition & UI Standards

UI components MUST follow established patterns:

- **shadcn/ui Foundation**: Use shadcn/ui components as base - NO custom implementations of existing components
- **Composition Over Inheritance**: Build complex UIs from simple, composable components
- **Explicit Props**: All component props MUST have TypeScript interfaces
- **Controlled Components**: Forms MUST use React Hook Form + Zod validation
- **Separation of Concerns**: UI components separate from business logic (use custom hooks)
- **Tailwind Utility-First**: Use Tailwind classes - NO inline styles or CSS modules
- **Lucide Icons**: Use Lucide React for all icons

**Rationale**: Consistent UI patterns reduce cognitive load, improve maintainability, and ensure accessibility. shadcn/ui provides battle-tested components with proper a11y.

### V. Testing Discipline

E2E testing with Playwright is the PRIMARY testing strategy:

- **E2E Focus**: Playwright tests for ALL critical user journeys
- **User-Centric**: Test from user perspective - NOT implementation details
- **Test Location**: All tests in `/tests` folder (e2e, integration, unit)
- **Fixtures**: Reusable test setup and data in `/tests/e2e/fixtures/`
- **CI/CD Gate**: Tests MUST pass before merge - NO exceptions
- **Critical Flows**: Authentication, CRUD operations, real-time sync, form validation, error handling

**Rationale**: E2E tests provide highest confidence that features work end-to-end. They catch integration issues that unit tests miss and validate actual user experience.

### VI. Code Quality & Standards

Code quality is enforced through automation:

- **Conventional Commits**: MUST use prefixes (feat:, fix:, docs:, refactor:, test:, chore:)
- **Pre-commit Hooks**: Husky + lint-staged runs automatically - NO bypassing
- **ESLint**: Zero warnings policy - fix or disable with justification
- **Prettier**: Automatic formatting - NO manual formatting debates
- **No Console Logs**: Remove before commit (except `console.error` for error handling)
- **Zero TypeScript Errors**: Build fails on errors - NO `@ts-ignore` without justification

**Rationale**: Automated quality gates prevent technical debt accumulation and ensure consistency across the codebase. Conventional commits enable automated changelog generation.

### VII. Database Schema & API Design

Convex schema and API patterns are strictly defined:

- **Schema Definition**: All tables in `/convex/schema.ts` with proper indexes
- **Relationships**: Use document IDs for references (e.g., `userId: v.string()`)
- **Indexes**: Define for ALL common query patterns
- **Mutations**: For ALL write operations (create, update, delete)
- **Queries**: For ALL read operations (list, get, search)
- **Validators**: Zod schemas at API boundary - NO unvalidated inputs
- **No Direct DB Access**: Frontend MUST use Convex functions - NO direct database queries

**Current Tables**: `users`, `transactions`, `categories`, `counterparties`

**Rationale**: Centralized schema prevents data inconsistencies. Convex functions provide security boundary and enable real-time subscriptions. Indexes ensure query performance at scale.

### VIII. Performance & Security Requirements

Non-functional requirements are MANDATORY:

**Performance Targets**:
- Page load: < 2 seconds
- Transaction list: < 1 second
- Form submission: < 500ms response
- Real-time sync: < 100ms latency
- Support: 10,000+ transactions per user

**Security Requirements**:
- All API calls authenticated (Clerk)
- User data isolated (userId filter in ALL queries)
- Input validation (Zod schemas)
- XSS prevention (React escaping)
- HTTPS only (enforced by Vercel)

**Rationale**: Performance directly impacts user satisfaction and retention. Security requirements protect user data and prevent common vulnerabilities.

## Architecture Standards

### Technology Stack (LOCKED)

The following stack is FIXED for this project:

- **Frontend**: Next.js 15.1.6 (App Router) + TypeScript 5.7.2
- **Backend**: Convex 1.18.2 (Real-time BaaS)
- **Authentication**: Clerk 6.11.1
- **UI Framework**: Tailwind CSS 3.4.17 + shadcn/ui + Radix UI
- **Form Handling**: React Hook Form + Zod
- **Testing**: Playwright 1.49.1
- **Code Quality**: ESLint + Prettier + Husky + lint-staged
- **Deployment**: Vercel (Frontend) + Convex Cloud (Backend)

**Changes Require**: Architecture Decision Record (ADR) + team approval

### Code Organization Patterns

**Feature Structure**:
```
bmad/features/[feature-name]/
├── components/     # Feature-specific UI components
├── hooks/          # Custom React hooks (useFeatureName)
├── types/          # Feature-specific TypeScript types
└── utils/          # Feature-specific utilities
```

**Naming Conventions**:
- Components: PascalCase (e.g., `TransactionForm.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useTransactions.ts`)
- Utilities: camelCase (e.g., `formatCurrency.ts`)
- Types/Interfaces: PascalCase (e.g., `Transaction`, `TransactionInput`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_TRANSACTION_AMOUNT`)

### State Management Strategy

- **Server State**: Convex queries (real-time subscriptions)
- **Local UI State**: React `useState` for component-local state
- **Form State**: React Hook Form for all forms
- **NO Global State**: Redux, Zustand, Context API for global state are FORBIDDEN

**Rationale**: Convex handles server state, React handles UI state. Additional state management adds complexity without benefit.

### Error Handling Patterns

- **Async Operations**: Try-catch blocks for ALL async operations
- **User Feedback**: Toast notifications for success/error messages
- **Error Boundaries**: React error boundaries for component errors
- **Graceful Degradation**: Offline mode with clear messaging
- **Logging**: `console.error` for errors, NO `console.log` in production

## Quality Gates

### Pre-Implementation Gates

MUST pass BEFORE starting implementation:

1. ✅ Feature spec reviewed and approved
2. ✅ Technical plan documented in `/specs/[###-feature-name]/plan.md`
3. ✅ No constitutional violations (or justified in Complexity Tracking)
4. ✅ Integration points identified and documented
5. ✅ Convex schema changes reviewed (if applicable)

### During Implementation Gates

MUST maintain throughout development:

6. ✅ TypeScript strict mode (zero errors)
7. ✅ ESLint passes (zero warnings)
8. ✅ Prettier formatted (automatic via pre-commit)
9. ✅ E2E tests written for new features
10. ✅ Optimistic updates implemented for mutations
11. ✅ Real-time sync working (test across browser tabs)
12. ✅ Loading states for all async operations
13. ✅ Error handling with user-friendly messages

### Pre-Merge Gates

MUST pass BEFORE merging to main:

14. ✅ All Playwright tests pass (`npm run test:e2e`)
15. ✅ No `console.log` statements (except `console.error`)
16. ✅ Conventional commit messages
17. ✅ Documentation updated (README, feature docs)
18. ✅ No breaking changes to existing features (or migration plan)
19. ✅ Performance targets met (measure with Lighthouse/Playwright)
20. ✅ Security checklist completed (auth, validation, data isolation)

### Post-Deployment Gates

MUST verify AFTER deployment:

21. ✅ Production smoke tests pass
22. ✅ Real-time sync working in production
23. ✅ No console errors in production
24. ✅ Performance monitoring shows acceptable metrics

## Development Workflow

### Feature Development Process

1. **Specification**: Create feature spec using `/speckit.specify`
2. **Planning**: Generate implementation plan using `/speckit.plan`
3. **Task Generation**: Create tasks using `/speckit.tasks`
4. **Implementation**: Execute tasks following BMAD pattern
5. **Testing**: Write and run E2E tests
6. **Review**: Code review + constitutional compliance check
7. **Merge**: Merge to main after all gates pass
8. **Deploy**: Automatic deployment via Vercel + Convex

### Git Workflow

- **Branch Naming**: `[###-feature-name]` (e.g., `001-transaction-filters`)
- **Commit Messages**: Conventional commits (feat:, fix:, docs:, refactor:, test:, chore:)
- **PR Requirements**: Description, testing evidence, constitutional compliance
- **Review Process**: At least one approval required
- **Merge Strategy**: Squash and merge to keep history clean

### Testing Workflow

1. **Write Tests First**: E2E tests before implementation (TDD optional but encouraged)
2. **Run Locally**: `npm run test:e2e` before pushing
3. **CI/CD**: Tests run automatically on PR
4. **Fix Failures**: NO merging with failing tests
5. **Update Tests**: When requirements change, update tests FIRST

## Governance

### Constitutional Authority

This constitution supersedes all other development practices and guidelines. When conflicts arise:

1. Constitution takes precedence
2. Architecture Decision Records (ADRs) provide context for exceptions
3. Team discussion required for amendments

### Amendment Process

To amend this constitution:

1. **Proposal**: Create ADR documenting proposed change and rationale
2. **Discussion**: Team review and discussion
3. **Approval**: Consensus or majority vote
4. **Update**: Update constitution with version bump
5. **Migration**: Create migration plan if breaking changes
6. **Communication**: Announce changes to all team members

### Versioning Policy

Constitution follows semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Backward incompatible governance/principle removals or redefinitions
- **MINOR**: New principle/section added or materially expanded guidance
- **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements

### Compliance Review

- **PR Reviews**: All PRs MUST verify constitutional compliance
- **Complexity Justification**: Violations MUST be justified in `plan.md` Complexity Tracking section
- **Periodic Audits**: Quarterly review of codebase for constitutional compliance
- **Refactoring**: Non-compliant code MUST be refactored or justified in ADR

### Exception Handling

Exceptions to constitutional principles:

1. **Document**: Create ADR explaining why exception is necessary
2. **Justify**: Explain why compliant approach is insufficient
3. **Time-Box**: Set deadline for bringing code into compliance (if temporary)
4. **Review**: Exceptions reviewed in quarterly audits

**Version**: 1.0.0 | **Ratified**: 2025-01-28 | **Last Amended**: 2025-01-28
