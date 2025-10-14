# Deployment Guide - Finance Tracker v2.0

## Overview

Finance Tracker v2.0 is deployed on Convex, a serverless backend platform. This guide covers deployment to both development and production environments.

## Prerequisites

- Node.js 18.0.0+
- npm or yarn
- Convex account (https://convex.dev)
- Telegram bot registered via BotFather

## Environment Setup

### 1. Development Environment

Development uses Convex's dev deployment with hot reloading.

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

On first run, you'll be prompted to:
1. Log in to Convex (opens browser)
2. Select or create a project
3. Choose a deployment name

The dev server:
- Watches `convex/` directory for changes
- Auto-reloads functions on file save
- Generates TypeScript types in `convex/_generated/`
- Provides a local URL for testing

**Dev URL format**: `https://your-project-name.convex.cloud/...`

### 2. Production Environment

Production deployment is a separate Convex deployment with stable configuration.

```bash
# Build and deploy to production
npm run build
```

This command:
1. Compiles TypeScript with strict checks
2. Deploys functions to Convex production
3. Returns a stable production URL

**Production URL format**: `https://your-deployment-name.convex.site/...`

## Configuration

### Convex Environment Variables

Environment variables are managed in the Convex Dashboard.

**Required Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Bot token from BotFather | `123456:ABC-DEF1234ghIkl-zyx` |

**Setting Environment Variables**:

1. Go to https://dashboard.convex.dev
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Click **Add Variable**
5. Enter key and value
6. Click **Save**

⚠️ **Important**: Redeploy after adding/changing environment variables:
```bash
npm run build  # Production
# or
npm run dev    # Development (will restart)
```

### Optional Configuration

**Logging Level** (optional):
```
LOG_LEVEL=info  # Options: debug, info, warn, error
```

## Deployment Workflow

### Initial Deployment

**Step 1: Prepare Code**
```bash
# Ensure all dependencies are installed
npm install

# Run linting
npm run lint

# Format code
npm run format
```

**Step 2: Deploy to Development**
```bash
# Start dev environment
npm run dev
```

Test your functions in development before promoting to production.

**Step 3: Configure Environment Variables**
1. Go to Convex Dashboard → Settings → Environment Variables
2. Add `TELEGRAM_BOT_TOKEN`
3. Save changes

**Step 4: Deploy to Production**
```bash
# Deploy to production
npm run build
```

**Step 5: Register Webhook**
```bash
# Get production URL from Convex dashboard
PROD_URL="https://your-deployment.convex.site"

# Register webhook
curl -X POST "$PROD_URL/telegram/setWebhook"
```

**Step 6: Verify Deployment**
```bash
# Check webhook registration
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"

# Send test message to bot on Telegram
# Check logs in Convex Dashboard
```

---

### Updates and Hotfixes

**For regular updates**:
```bash
# Make code changes
# Test in development
npm run dev

# Deploy to production when ready
npm run build
```

**For urgent hotfixes**:
```bash
# Make minimal fix
# Deploy directly to production
npm run build

# Verify fix in logs
# Monitor for errors
```

---

### Rollback Procedure

Convex maintains deployment history. To rollback:

1. Go to Convex Dashboard
2. Navigate to **Deployments** tab
3. Find previous working deployment
4. Click **Restore**

**Alternative - Code Rollback**:
```bash
# Revert code changes
git revert <commit-hash>

# Redeploy
npm run build
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All code changes committed to git
- [ ] Dependencies updated in `package.json`
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] Environment variables configured in Convex Dashboard

### Deployment

- [ ] Development deployment tested (`npm run dev`)
- [ ] Production deployment successful (`npm run build`)
- [ ] Webhook registered with Telegram
- [ ] Test message sent to bot
- [ ] Logs visible in Convex Dashboard

### Post-Deployment

- [ ] Webhook URL verified in Telegram
- [ ] Test messages processed successfully
- [ ] Response time < 500ms (check logs)
- [ ] No errors in Convex Dashboard logs
- [ ] Documentation updated

---

## Monitoring

### Real-Time Logs

**Development**:
```bash
npm run dev
# Logs appear in terminal
```

**Production**:
1. Go to Convex Dashboard
2. Select your project
3. Click **Logs** tab
4. Filter by function: `telegram/webhook` or `telegram/setWebhook`

### Log Analysis

**Check processing time**:
```bash
# Look for "processingTimeMs" in logs
# Target: < 500ms per webhook
```

**Monitor errors**:
```bash
# Filter logs by level: "error"
# Review stack traces and context
```

**Performance metrics**:
- Average processing time
- Error rate
- Request volume
- Concurrent request handling

---

## Convex Dashboard Features

### Functions Tab
- View all deployed functions
- Test functions directly
- See function signatures

### Data Tab
- Browse database tables (future stories)
- Run queries
- Export data

### Logs Tab
- Real-time function logs
- Filter by function, level, or time
- Search log content

### Settings Tab
- Environment Variables
- Project configuration
- Team management

---

## Multi-Environment Strategy

### Development
- **Purpose**: Active development and testing
- **URL**: `https://your-project.convex.cloud`
- **Command**: `npm run dev`
- **Bot**: Use a separate test bot (optional)

### Production
- **Purpose**: Live user traffic
- **URL**: `https://your-project.convex.site`
- **Command**: `npm run build`
- **Bot**: Your production bot

### Best Practices

1. **Always test in dev first** - Use `npm run dev` to validate changes
2. **Use separate bots** - Create a test bot for development (optional)
3. **Monitor production logs** - Check for errors after deployment
4. **Use git tags** - Tag production deployments for easy rollback

---

## CI/CD Integration (Future Enhancement)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Convex

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Lint
        run: npm run lint
      
      - name: Build and Deploy
        run: npm run build
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
```

**Setup**:
1. Get deploy key from Convex Dashboard → Settings → Deploy Keys
2. Add as GitHub secret: `CONVEX_DEPLOY_KEY`
3. Push to main branch triggers deployment

---

## Troubleshooting

### Deployment Fails

**Error**: "Authentication failed"
```bash
# Re-authenticate with Convex
npx convex login

# Try deploying again
npm run build
```

**Error**: "TypeScript compilation failed"
```bash
# Check for type errors
npx tsc --noEmit

# Fix errors and redeploy
```

### Webhook Not Working After Deployment

1. **Verify environment variables**:
   - Check `TELEGRAM_BOT_TOKEN` in Convex Dashboard
   - Redeploy after adding variables

2. **Re-register webhook**:
   ```bash
   curl -X POST "$PROD_URL/telegram/setWebhook"
   ```

3. **Check webhook info**:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```

### Function Not Found

- Ensure function is exported in `convex/` directory
- Check `convex.json` configuration
- Redeploy: `npm run build`

### Environment Variable Not Available

- Add variable in Convex Dashboard
- **Important**: Redeploy after adding variables
- Verify with test function

---

## Performance Optimization

### Cold Start Reduction

Convex functions have minimal cold start time (<100ms). To optimize:

1. Keep functions small and focused
2. Avoid large dependencies
3. Use lazy imports for optional features

### Concurrent Request Handling

Convex automatically scales to handle concurrent requests. No configuration needed.

**Tested capacity**: 100+ concurrent webhook requests (Story 1.1 AC5)

---

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate bot token regularly** - Update in BotFather and Convex Dashboard
3. **Monitor logs for suspicious activity** - Set up alerts (future)
4. **Use HTTPS only** - Convex enforces by default
5. **Validate all inputs** - Use Zod schemas (implemented in Story 1.1)

---

## Support and Resources

- **Convex Documentation**: https://docs.convex.dev
- **Convex Discord**: https://convex.dev/community
- **Telegram Bot API**: https://core.telegram.org/bots/api
- **Project Repository**: [Your GitHub URL]

---

**Last Updated**: 2025-10-12  
**Story**: 1.1 - Telegram Bot Registration & Webhook Setup
