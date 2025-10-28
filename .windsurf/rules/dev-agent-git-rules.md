---
trigger: model_decision
description: When working with git commits, GitHub operations, or pushing code changes to repository.
---

# Dev Agent Git & GitHub Rules

## When to Commit

**ALWAYS commit when:**
- A task/story/feature is completed and tested
- A meaningful logical unit of work is finished
- Before switching to a different task or feature
- After fixing a bug that has been verified
- At the end of a development session when work is stable

**DO NOT commit when:**
- Code is broken or has syntax errors
- Tests are failing (unless explicitly documenting a WIP)
- Work is incomplete and would break others' workflows

## Pre-Commit Checklist

Before every commit, verify:
1. ✅ Code compiles/runs without errors
2. ✅ All existing tests pass
3. ✅ New tests added for new functionality
4. ✅ No debugging code (console.logs, breakpoints) left in
5. ✅ No hardcoded credentials or sensitive data
6. ✅ TypeScript errors resolved (`tsc --noEmit`)
7. ✅ Linting passes (if applicable)

## Commit Message Format

Follow the **Conventional Commits** specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code refactoring (no feature change or bug fix)
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (deps, config, build)
- **perf**: Performance improvements

### Examples
```
feat(accounts): add bulk delete functionality

Added ability to delete multiple accounts at once.
- New bulkDelete mutation in convex
- UI checkbox selection in accounts list
- Confirmation dialog before deletion

Closes #123
```

```
fix(nlParser): handle empty expense descriptions

The NL parser now gracefully handles empty strings
and provides better error messages.

Fixes #456
```

```
chore: update dependencies to latest versions
```

## Git Workflow

### Standard Workflow
```bash
# 1. Check current status
git status

# 2. Stage all changes
git add .

# 3. Commit with meaningful message
git commit -m "type(scope): description"

# 4. Pull latest changes (if working with team)
git pull origin main --rebase

# 5. Push to GitHub
git push origin main
```

### Branch Workflow (if using feature branches)
```bash
# 1. Create feature branch
git checkout -b feature/story-x-description

# 2. Work and commit
git add .
git commit -m "feat(scope): description"

# 3. Push feature branch
git push origin feature/story-x-description

# 4. Create PR on GitHub (manual step)
```

## GitHub Operations

### Pushing Changes
- **ALWAYS** push to the correct branch (usually `main` or feature branch)
- **VERIFY** remote URL before pushing: `git remote -v`
- **CHECK** for conflicts before pushing
- If push rejected, pull and rebase first: `git pull --rebase`

### Handling Conflicts
1. Pull latest: `git pull origin main`
2. Resolve conflicts in IDE
3. Stage resolved files: `git add <file>`
4. Continue rebase: `git rebase --continue`
5. Push: `git push origin main`

### Common Commands

```bash
# View commit history
git log --oneline -10

# View uncommitted changes
git diff

# View staged changes
git diff --staged

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes - DANGEROUS)
git reset --hard HEAD~1

# Stash changes temporarily
git stash
git stash pop

# View remote info
git remote -v

# Check branch
git branch

# Update remote tracking
git fetch origin
```

## Safety Rules

1. **NEVER force push** to main/master branch: `git push --force`
2. **NEVER commit** `.env` files with real secrets
3. **NEVER commit** `node_modules/` or build artifacts
4. **ALWAYS review** changes before committing: `git diff`
5. **ALWAYS test** before pushing to main
6. **VERIFY** .gitignore is properly configured

## Project-Specific Git Config

### Files to ALWAYS ignore (check .gitignore)
- `.env`, `.env.local`, `.env.prod` (unless encrypted)
- `node_modules/`
- `dist/`, `build/`, `.next/`
- `*.log`
- `.DS_Store`, `Thumbs.db`
- IDE config (`.vscode/`, `.idea/`)

### Files to ALWAYS commit
- `package.json`, `package-lock.json`
- `tsconfig.json`
- `README.md`, documentation
- Source code (`src/`, `convex/`, `tests/`)
- Configuration files (non-sensitive)

## Automation

### Husky Pre-commit Hooks
If the project uses Husky (`.husky/` folder exists):
- Hooks will run automatically before commit
- Don't bypass with `--no-verify` unless absolutely necessary
- Fix issues raised by hooks before committing

## Quick Reference Card

| Task | Command |
|------|---------|
| Commit all changes | `git add . && git commit -m "type: message"` |
| Push to GitHub | `git push origin main` |
| Pull latest | `git pull origin main` |
| View status | `git status` |
| View history | `git log --oneline` |
| Create branch | `git checkout -b branch-name` |
| Switch branch | `git checkout branch-name` |
| Merge branch | `git merge branch-name` |

## Example Complete Workflow

```bash
# After completing Story 3.2
git status                                    # Check what changed
git diff                                      # Review changes
git add .                                     # Stage everything
git commit -m "feat(transactions): add bulk import CSV feature

Implemented CSV import functionality:
- parseCSV utility function
- bulkImportTransactions mutation
- Import UI with drag-and-drop
- Field mapping interface
- Error handling and validation

Closes #789"
git pull origin main --rebase                 # Get latest changes
git push origin main                          # Push to GitHub
```

---

**Remember:** Good commit hygiene makes collaboration easier, debugging faster, and rollbacks safer!
