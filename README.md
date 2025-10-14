# Finance Tracker v2.0

Personal finance management system via Telegram bot with AI-powered natural language processing.

## Prerequisites

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

## Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [Convex Documentation](https://docs.convex.dev)
- [Convex HTTP Actions Guide](https://docs.convex.dev/functions/http-actions)

## License

ISC

---

**Status**: Foundation setup complete - webhook implementation in progress
