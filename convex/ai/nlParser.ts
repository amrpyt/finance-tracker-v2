/**
 * Natural Language Parser using RORK Toolkit API
 * 
 * Provides intent detection and entity extraction for account management
 * commands in Arabic and English.
 * 
 * Architecture Decision: Using RORK direct API (not npm package)
 * See: docs/decisions/ADR-001-nl-parsing-strategy.md
 */

import { action } from "../_generated/server";
import { v } from "convex/values";
import pino from "pino";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  IntentDetectionResult,
  CreateAccountEntities,
  UnifiedIntentDetectionResult,
  LogExpenseEntities,
  type RorkMessage,
  type RorkChatRequest,
  type RorkChatResponse,
} from "./types";
import { generateFeatureList, generatePlannedFeaturesList } from "./prompts";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Parse user message for account management intent and entities
 * 
 * @param userMessage - Natural language message from user
 * @param language - User's preferred language (ar/en)
 * @returns Intent detection result with extracted entities
 * 
 * Examples:
 * - "أنشئ حساب محفظة برصيد 500 جنيه" → create_account, {type: "cash", balance: 500}
 * - "Create bank account named Savings" → create_account, {type: "bank", name: "Savings"}
 * - "Show my accounts" → view_accounts, {}
 */
export const parseAccountIntent = action({
  args: {
    userMessage: v.string(),
    language: v.union(v.literal("ar"), v.literal("en")),
    conversationHistory: v.optional(v.array(v.any())), // Recent messages for context retention
  },
  handler: async (_ctx, args): Promise<IntentDetectionResult> => {
    const startTime = Date.now();

    try {
      // Get RORK API URL from environment
      const rorkUrl = process.env.RORK_TOOLKIT_URL || "https://toolkit.rork.com";

      logger.info({
        userMessage: args.userMessage.substring(0, 50),
        language: args.language,
      }, "Parsing account intent with RORK");

      // Build system prompt for account management with JSON output
      const systemPrompt = args.language === "ar"
        ? `أنت محلل نوايا (Intent Detector) للحسابات المالية. مهمتك الوحيدة: تحليل الرسالة وإرجاع JSON فقط.

⚠️ تحذير: لا تكتب أي نص عادي. لا ترد على المستخدم. فقط JSON.

📋 الميزات المتاحة حالياً:
${generateFeatureList("ar")}

⏳ الميزات المخطط لها (غير متاحة بعد):
${generatePlannedFeaturesList("ar")}

أنواع الحسابات:
- bank: حساب بنكي (بنك، بنكي، instapay، انستا باي)
- cash: محفظة نقدية (محفظة، كاش)
- credit_card: بطاقة ائتمان (بطاقة، فيزا، ماستر كارد)
- digital_wallet: محفظة رقمية (فودافون كاش، أورانج كاش)

العملات المتاحة:
- EGP: الجنيه المصري
- USD: الدولار الأمريكي
- SAR: الريال السعودي
- EUR: اليورو

النوايا المتاحة:
- create_account: إنشاء حساب جديد (أنشئ، اعمل، عاوز حساب)
- view_accounts: عرض الحسابات (أرني، اعرض، شوف الحسابات)
- edit_account: تعديل حساب (عدل، غير، تعديل الحساب)
- delete_account: حذف حساب (احذف، امسح الحساب)
- set_default_account: تعيين حساب افتراضي (اجعل افتراضي، غير الافتراضي، خلي المحفظة افتراضية)

أمثلة لتعديل الحساب:
- "عدل حساب المحفظة" → edit_account
- "غير اسم البنك" → edit_account
- "تعديل حساب البنك" → edit_account

أمثلة لتعيين الحساب الافتراضي:
- "اجعل الحساب الافتراضي" → set_default_account
- "غير الحساب الافتراضي" → set_default_account
- "خلي المحفظة افتراضية" → set_default_account
- "خلي محفظة فودافون كاش هو الاساسي" → set_default_account
- "خلي البنك هو الاساسي" → set_default_account
- "اجعل حساب البنك الافتراضي" → set_default_account

أرجع JSON فقط بهذا الشكل الدقيق:
{
  "intent": "create_account" | "view_accounts" | "edit_account" | "delete_account" | "set_default_account" | "unknown",
  "confidence": رقم بين 0 و 1,
  "entities": {
    // For create_account:
    "accountType": "bank" | "cash" | "credit_card" | "digital_wallet",
    "accountName": "اسم الحساب إن وجد",
    "initialBalance": رقم إن وجد,
    "currency": "EGP" | "USD" | "SAR" | "EUR",
    // For edit_account:
    "accountName": "اسم الحساب المراد تعديله",
    "newName": "الاسم الجديد إن وجد",
    "newType": "النوع الجديد إن وجد",
    // For set_default_account:
    "accountName": "اسم الحساب إن وجد"
  },
  "language": "ar"
}

⚠️ مهم جداً: لا تكتب أي شيء غير JSON. لا تحيي المستخدم. لا تشرح. فقط JSON.`
        : `You are an Intent Detector for financial account management. Your ONLY job: analyze the message and return JSON.

⚠️ WARNING: Do NOT write any conversational text. Do NOT respond to the user. ONLY JSON.

📋 Currently Available Features:
${generateFeatureList("en")}

⏳ Planned Features (Not Yet Available):
${generatePlannedFeaturesList("en")}

Account types:
- bank: Bank account (bank, instapay)
- cash: Cash wallet
- credit_card: Credit card
- digital_wallet: Digital wallet (Vodafone Cash, Orange Cash)

Currencies:
- EGP: Egyptian Pound
- USD: US Dollar
- SAR: Saudi Riyal
- EUR: Euro

Available intents:
- create_account: Create new account (create, add, new account)
- view_accounts: View accounts (show, list, view accounts)
- edit_account: Edit account (edit, change, update account)
- delete_account: Delete account (delete, remove account)
- set_default_account: Set default account (set default, make default, change default)

Edit account examples:
- "edit my wallet account" → edit_account
- "change bank account name" → edit_account
- "update account" → edit_account

Set default account examples:
- "set default account" → set_default_account
- "make wallet default" → set_default_account
- "change default account" → set_default_account
- "make Vodafone Cash the default" → set_default_account
- "set bank as default" → set_default_account
- "make this account default" → set_default_account

Return ONLY JSON in this EXACT format:
{
  "intent": "create_account" | "view_accounts" | "edit_account" | "delete_account" | "set_default_account" | "unknown",
  "confidence": number between 0 and 1,
  "entities": {
    // For create_account:
    "accountType": "bank" | "cash" | "credit_card" | "digital_wallet",
    "accountName": "name if provided",
    "initialBalance": number if provided,
    "currency": "EGP" | "USD" | "SAR" | "EUR",
    // For edit_account:
    "accountName": "account name to edit",
    "newName": "new name if provided",
    "newType": "new type if provided",
    // For set_default_account:
    "accountName": "account name if provided"
  },
  "language": "en"
}

⚠️ CRITICAL: Return ONLY JSON. No greetings. No explanations. ONLY JSON.`;

      // Build conversation history for context (if provided)
      const historyMessages: RorkMessage[] = [];
      if (args.conversationHistory && args.conversationHistory.length > 0) {
        logger.info({
          historyLength: args.conversationHistory.length,
          historyPreview: args.conversationHistory.slice(0, 3).map(m => ({
            role: m.role,
            content: m.content.substring(0, 50)
          }))
        }, "Including conversation history for context");
        
        args.conversationHistory.forEach((msg: any, idx: number) => {
          historyMessages.push({
            id: `history_${idx}`,
            role: msg.role === "user" ? "user" : "assistant",
            parts: [{ type: "text", text: msg.content }],
          });
        });
      }

      // Build RORK messages with history (Vercel AI SDK v5 format)
      const messages: RorkMessage[] = [
        {
          id: "system_001",
          role: "system",
          parts: [
            {
              type: "text",
              text: systemPrompt,
            },
          ],
        },
        ...historyMessages, // Include conversation history for context
        {
          id: "user_current",
          role: "user",
          parts: [
            {
              type: "text",
              text: args.userMessage,
            },
          ],
        },
      ];

      // Build RORK request for /text/llm/ endpoint (per documentation)
      // Convert from Vercel AI SDK v5 format to simple format
      const simplifiedMessages = messages.map(msg => {
        const firstPart = msg.parts[0];
        const content = 'text' in firstPart ? firstPart.text : '';
        return {
          role: msg.role,
          content
        };
      });

      const rorkRequest = {
        messages: simplifiedMessages,
      };

      // Call RORK API using correct endpoint
      logger.info({ 
        endpoint: `${rorkUrl}/text/llm/`,
        messageCount: simplifiedMessages.length,
      }, "Calling RORK /text/llm/ API for intent detection");

      const response = await fetch(`${rorkUrl}/text/llm/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rorkRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ 
          status: response.status, 
          statusText: response.statusText,
          errorBody: errorText.substring(0, 200),
        }, "RORK API returned error");
        throw new Error(`RORK API error: ${response.status} ${response.statusText}`);
      }

      // RORK /text/llm/ returns simple JSON response (not streaming)
      const data = await response.json();
      
      logger.info({ 
        completionPreview: data.completion?.substring(0, 150),
        completionLength: data.completion?.length,
      }, "Received RORK response");

      if (!data.completion) {
        throw new Error("No completion in RORK response");
      }

      // Extract JSON from response (AI might add markdown code blocks)
      let jsonText = data.completion.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\s*/g, '').replace(/```\s*$/g, '');
      }

      // Parse JSON response
      const result = JSON.parse(jsonText) as IntentDetectionResult;

      const processingTime = Date.now() - startTime;
      logger.info({
        intent: result.intent,
        confidence: result.confidence,
        language: result.language,
        processingTimeMs: processingTime,
      }, "Intent parsed successfully from RORK");

      // Validate result with Zod
      return IntentDetectionResult.parse(result);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        processingTimeMs: processingTime,
      }, "Intent parsing failed");

      // Fallback to regex-based parsing for simple cases
      return fallbackIntentDetection(args.userMessage, args.language);
    }
  },
});

/**
 * Parse user message for ANY intent (account management OR transactions)
 * Task 13: Unified parser for performance optimization - single RORK call
 * 
 * @param userMessage - Natural language message from user
 * @param language - User's preferred language (ar/en)
 * @returns Unified intent detection result
 * 
 * Examples:
 * - "أنشئ حساب محفظة" → create_account
 * - "دفعت 50 جنيه على القهوة" → log_expense
 * - "استلمت 1000 جنيه راتب" → log_income
 * - "عرض حساباتي" → view_accounts
 */
export const parseIntent = action({
  args: {
    userMessage: v.string(),
    language: v.union(v.literal("ar"), v.literal("en")),
    conversationHistory: v.optional(v.array(v.any())),
  },
  handler: async (_ctx, args): Promise<UnifiedIntentDetectionResult> => {
    const startTime = Date.now();

    try {
      const rorkUrl = process.env.RORK_TOOLKIT_URL || "https://toolkit.rork.com";

      logger.info({
        userMessage: args.userMessage.substring(0, 50),
        language: args.language,
      }, "Parsing unified intent (account + transaction) with RORK");

      // Build comprehensive system prompt for ALL intent types
      const systemPrompt = args.language === "ar"
        ? `أنت محلل نوايا (Intent Detector) شامل. مهمتك الوحيدة: تحليل الرسالة وإرجاع JSON فقط.

⚠️ تحذير: لا تكتب أي نص عادي. لا ترد على المستخدم. فقط JSON.

📋 الميزات المتاحة حالياً:
${generateFeatureList("ar")}

⏳ الميزات المخطط لها (غير متاحة بعد):
${generatePlannedFeaturesList("ar")}

══════════════════════════════════════════════════════
📂 نوايا إدارة الحسابات:
══════════════════════════════════════════════════════

أنواع الحسابات:
- bank: حساب بنكي (بنك، بنكي، instapay، انستا باي)
- cash: محفظة نقدية (محفظة، كاش)
- credit_card: بطاقة ائتمان (بطاقة، فيزا، ماستر كارد)
- digital_wallet: محفظة رقمية (فودافون كاش، أورانج كاش)

النوايا:
- create_account: إنشاء حساب (أنشئ، اعمل، عاوز حساب)
- view_accounts: عرض الحسابات (أرني، اعرض، شوف الحسابات)
- edit_account: تعديل حساب (عدل، غير، تعديل الحساب)
- delete_account: حذف حساب (احذف، امسح الحساب)
- set_default_account: تعيين حساب افتراضي (اجعل افتراضي، خلي الحساب الاساسي)

══════════════════════════════════════════════════════
💰 نوايا المعاملات المالية:
══════════════════════════════════════════════════════

log_expense: تسجيل مصروف
أمثلة:
- "دفعت 50 جنيه على القهوة"
- "صرفت 100 على المواصلات"
- "اشتريت ملابس ب 200 جنيه"
- "دفعت فلوس 30 جنيه تاكسي"
- "أمس دفعت 75 على الغداء"
- "الأسبوع اللي فات صرفت 500 على تسوق"

الأنماط العربية للمصروف:
- "دفعت [amount] على/في [description]"
- "صرفت [amount] [description]"
- "اشتريت [description] ب [amount]"
- "دفعت فلوس [amount] [description]"

log_income: تسجيل دخل
أمثلة:
- "استلمت راتب 5000 جنيه"
- "قبضت 3000 جنيه راتب"
- "حصلت على 200 من عمل حر"
- "جاني 1000 من مشروع"
- "استلمت 500 هدية"
- "قبضت أرباح 300 من استثمار"

الأنماط العربية للدخل:
- "استلمت [amount] [description]"
- "قبضت [amount] [description]"
- "حصلت على [amount] من [description]"
- "جاني [amount] من [description]"

الفئات للدخل (income categories):
- salary: راتب، مرتب
- freelance: عمل حر، فريلانس
- business: مشروع، تجارة
- investment: استثمار، أرباح
- gift: هدية، عيدية
- other: أخرى

الفئات (categories):
- food: طعام، قهوة، مطعم، غداء، عشاء، إفطار
- transport: مواصلات، تاكسي، بنزين، أوبر، مترو
- entertainment: ترفيه، سينما، ألعاب، نادي
- shopping: تسوق، ملابس، شنطة، حذاء
- bills: فواتير، كهرباء، مياه، نت، موبايل
- health: صحة، دواء، طبيب، مستشفى
- other: أخرى

══════════════════════════════════════════════════════

أرجع JSON فقط بهذا الشكل الدقيق:
{
  "intent": "create_account" | "view_accounts" | "edit_account" | "delete_account" | "set_default_account" | "log_expense" | "log_income" | "unknown",
  "confidence": رقم بين 0 و 1,
  "entities": {
    // For create_account:
    "accountType": "bank" | "cash" | "credit_card" | "digital_wallet",
    "accountName": "اسم إن وجد",
    "initialBalance": رقم إن وجد,
    "currency": "EGP" | "USD" | "SAR" | "EUR",
    
    // For log_expense:
    "amount": رقم المبلغ (إجباري),
    "category": "food" | "transport" | "entertainment" | "shopping" | "bills" | "health" | "other",
    "description": "وصف المصروف",
    "accountName": "اسم الحساب إن ذُكر",
    "date": "أمس" | "اليوم" | "الأسبوع اللي فات" إن ذُكر,
    
    // For other intents: appropriate entities
  },
  "language": "ar"
}

⚠️ مهم جداً: لا تكتب أي شيء غير JSON. فقط JSON.`
        : `You are a comprehensive Intent Detector. Your ONLY job: analyze the message and return JSON.

⚠️ WARNING: Do NOT write any conversational text. ONLY JSON.

📋 Currently Available Features:
${generateFeatureList("en")}

⏳ Planned Features (Not Yet Available):
${generatePlannedFeaturesList("en")}

══════════════════════════════════════════════════════
📂 Account Management Intents:
══════════════════════════════════════════════════════

Account types:
- bank: Bank account
- cash: Cash wallet
- credit_card: Credit card
- digital_wallet: Digital wallet

Intents:
- create_account: Create account (create, add, new account)
- view_accounts: View accounts (show, list, display accounts)
- edit_account: Edit account (edit, change, update account)
- delete_account: Delete account (delete, remove account)
- set_default_account: Set default account (set default, make default)

══════════════════════════════════════════════════════
💰 Transaction Intents:
══════════════════════════════════════════════════════

log_expense: Log expense
Examples:
- "spent 20 on coffee"
- "paid 50 for lunch"
- "bought clothes for 200"
- "30 EGP for taxi"
- "yesterday paid 75 for dinner"
- "last week spent 500 on shopping"

English expense patterns:
- "spent [amount] on [description]"
- "paid [amount] for [description]"
- "bought [description] for [amount]"
- "[amount] [currency] [description]"

log_income: Log income
Examples:
- "received 500 freelance payment"
- "got paid 1000 salary"
- "earned 200 from business"
- "received 300 gift"
- "got dividend 150"

English income patterns:
- "received [amount] [description]"
- "got paid [amount] [description]"
- "earned [amount] from [description]"
- "got [amount] [description]"

Income categories:
- salary: salary, wage, paycheck
- freelance: freelance, contract, gig
- business: business, profit, revenue
- investment: investment, dividend, returns
- gift: gift, present, bonus
- other: other

Expense categories:
- food: food, coffee, restaurant, lunch, dinner
- transport: transport, taxi, gas, uber, metro
- entertainment: fun, cinema, games, club
- shopping: shopping, clothes, bag, shoes
- bills: bills, electricity, water, internet, mobile
- health: health, medicine, doctor, hospital
- other: other

══════════════════════════════════════════════════════

Return ONLY JSON in this EXACT format:
{
  "intent": "create_account" | "view_accounts" | "edit_account" | "delete_account" | "set_default_account" | "log_expense" | "log_income" | "unknown",
  "confidence": number between 0 and 1,
  "entities": {
    // For create_account:
    "accountType": "bank" | "cash" | "credit_card" | "digital_wallet",
    "accountName": "name if provided",
    "initialBalance": number if provided,
    "currency": "EGP" | "USD" | "SAR" | "EUR",
    
    // For log_expense:
    "amount": number (required),
    "category": "food" | "transport" | "entertainment" | "shopping" | "bills" | "health" | "other",
    "description": "expense description",
    "accountName": "account name if specified",
    "date": "yesterday" | "today" | "last week" if mentioned,
    
    // For other intents: appropriate entities
  },
  "language": "en"
}

⚠️ CRITICAL: Return ONLY JSON. No greetings. ONLY JSON.`;

      // Build conversation history
      const historyMessages: RorkMessage[] = [];
      if (args.conversationHistory && args.conversationHistory.length > 0) {
        args.conversationHistory.forEach((msg: any, idx: number) => {
          historyMessages.push({
            id: `history_${idx}`,
            role: msg.role === "user" ? "user" : "assistant",
            parts: [{ type: "text", text: msg.content }],
          });
        });
      }

      // Build RORK messages
      const messages: RorkMessage[] = [
        {
          id: "system_001",
          role: "system",
          parts: [{ type: "text", text: systemPrompt }],
        },
        ...historyMessages,
        {
          id: "user_current",
          role: "user",
          parts: [{ type: "text", text: args.userMessage }],
        },
      ];

      // Convert to simplified format
      const simplifiedMessages = messages.map(msg => {
        const firstPart = msg.parts[0];
        const content = 'text' in firstPart ? firstPart.text : '';
        return { role: msg.role, content };
      });

      // Call RORK API
      logger.info({ 
        endpoint: `${rorkUrl}/text/llm/`,
        messageCount: simplifiedMessages.length,
      }, "Calling RORK for unified intent detection");

      const response = await fetch(`${rorkUrl}/text/llm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: simplifiedMessages }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ 
          status: response.status, 
          statusText: response.statusText,
          errorBody: errorText.substring(0, 200),
        }, "RORK API returned error");
        throw new Error(`RORK API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      logger.info({ 
        completionPreview: data.completion?.substring(0, 150),
        completionLength: data.completion?.length,
      }, "Received RORK unified response");

      if (!data.completion) {
        throw new Error("No completion in RORK response");
      }

      // Extract JSON from response
      let jsonText = data.completion.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\s*/g, '').replace(/```\s*$/g, '');
      }

      // Parse JSON response
      const result = JSON.parse(jsonText) as UnifiedIntentDetectionResult;

      const processingTime = Date.now() - startTime;
      logger.info({
        intent: result.intent,
        confidence: result.confidence,
        language: result.language,
        processingTimeMs: processingTime,
      }, "Unified intent parsed successfully from RORK");

      // Validate result with Zod
      return UnifiedIntentDetectionResult.parse(result);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        processingTimeMs: processingTime,
      }, "Unified intent parsing failed - falling back to account parser");

      // Fallback to account-only parser if unified fails
      const accountResult = await fallbackIntentDetection(args.userMessage, args.language);
      
      // Convert to unified format
      return {
        intent: accountResult.intent as any, // Cast to unified type
        confidence: accountResult.confidence,
        entities: accountResult.entities,
        language: accountResult.language,
      };
    }
  },
});

/**
 * Fallback intent detection using regex patterns
 * Used when RORK API fails or is unavailable
 */
function fallbackIntentDetection(
  message: string,
  language: "ar" | "en"
): IntentDetectionResult {
  const normalized = message.toLowerCase().trim();

  logger.warn({ message: normalized }, "Using fallback regex parsing");

  // Simple regex patterns for create account
  const createPatterns = {
    ar: /(أنشئ|إنشاء|عمل|اعمل|اعن|عاوز)\s*.*?(حساب|محفظة|بنك|بنكي)/i,
    en: /(create|add|new|make)\s+.*?(account|wallet|bank)/i,
  };

  const viewPatterns = {
    ar: /(أرني|عرض|اعرض|شوف)\s+(حساب|الحسابات)/i,
    en: /(show|view|list|display)\s+(account|accounts)/i,
  };

  const editPatterns = {
    ar: /(عدل|غير|تعديل|تغيير)\s*.*?(حساب|المحفظة|البنك)/i,
    en: /(edit|change|update|modify)\s+.*?(account|wallet|bank)/i,
  };

  const setDefaultPatterns = {
    ar: /(اجعل|خلي|غير|عين)\s*.*?(افتراضي|الافتراضي|الاساسي|هو الاساسي|default)/i,
    en: /(set|make|change)\s+.*?(default|primary|the default|as default)/i,
  };

  // Task 12: Delete account patterns (AC18)
  const deletePatterns = {
    ar: /(احذف|امسح|حذف|مسح|إحذف|إمسح)/i,
    en: /(delete|remove|erase)/i,
  };

  if (createPatterns[language].test(normalized)) {
    // Extract account type
    let accountType: "cash" | "bank" | "credit_card" | "digital_wallet" = "cash";

    if (/محفظة|wallet|cash/i.test(normalized)) {
      accountType = "cash";
    } else if (/بنك|بنكي|bank|instapay|انستا\s*باي|انستاباي/i.test(normalized)) {
      accountType = "bank";
    } else if (/بطاقة|credit|card/i.test(normalized)) {
      accountType = "credit_card";
    } else if (/رقمية|digital|فودافون|vodafone/i.test(normalized)) {
      accountType = "digital_wallet";
    }

    // Extract balance
    const balanceMatch = normalized.match(/(\d+)\s*(?:جنيه|egp|pound|جنية)/i);
    const initialBalance = balanceMatch ? parseFloat(balanceMatch[1]) : undefined;

    return {
      intent: "create_account",
      confidence: 0.7, // Lower confidence for fallback
      entities: CreateAccountEntities.parse({
        accountType,
        initialBalance,
        currency: "EGP",
      }),
      language,
    };
  }

  if (viewPatterns[language].test(normalized)) {
    return {
      intent: "view_accounts",
      confidence: 0.7,
      entities: {},
      language,
    };
  }

  if (editPatterns[language].test(normalized)) {
    // Extract account name if mentioned
    let accountName: string | undefined;
    
    // Try to extract account name from common patterns
    const nameMatch = normalized.match(/(?:حساب|account)\s+(?:ال)?(\w+)/i);
    if (nameMatch && nameMatch[1]) {
      accountName = nameMatch[1];
    }

    return {
      intent: "edit_account",
      confidence: 0.7,
      entities: {
        accountName,
      },
      language,
    };
  }

  if (setDefaultPatterns[language].test(normalized)) {
    // Extract account name if mentioned
    let accountName: string | undefined;
    
    // Try to extract account name from common patterns
    const nameMatch = normalized.match(/(?:حساب|account|محفظة|wallet|بنك|bank)\s+(?:ال)?(\w+)/i);
    if (nameMatch && nameMatch[1]) {
      accountName = nameMatch[1];
    }

    return {
      intent: "set_default_account",
      confidence: 0.7,
      entities: {
        accountName,
      },
      language,
    };
  }

  // Task 12.4-12.5: Delete account fallback (AC18)
  logger.info({ 
    message: normalized, 
    language,
    deletePatternTest: deletePatterns[language].test(normalized),
    pattern: deletePatterns[language].toString()
  }, "Testing delete pattern");
  
  if (deletePatterns[language].test(normalized)) {
    logger.info({ message: normalized }, "Delete pattern matched!");
    // Extract account name/type if mentioned
    let accountName: string | undefined;
    let accountType: string | undefined;
    
    // Try to extract account name from common patterns
    const nameMatch = normalized.match(/(?:حساب|account)\s+(?:ال)?(\w+)/i);
    if (nameMatch && nameMatch[1]) {
      accountName = nameMatch[1];
    }
    
    // Try to extract account type
    if (/محفظة|wallet/i.test(normalized)) {
      accountType = "cash";
    } else if (/بنك|بنكي|bank/i.test(normalized)) {
      accountType = "bank";
    }

    return {
      intent: "delete_account",
      confidence: 0.6, // Task 12.5: Lower confidence for fallback
      entities: {
        accountName,
        accountType,
      },
      language,
    };
  }

  // Unknown intent - return low confidence instead of throwing error
  logger.info({ message: normalized }, "No pattern matched - returning unknown intent");
  
  return {
    intent: "unknown",
    confidence: 0.3,
    entities: {},
    language,
  };
}

/**
 * Generate contextual AI response for unknown intents
 * 
 * Makes the bot truly agentic by handling general conversation,
 * greetings, and unclear requests with helpful, natural responses.
 * 
 * @param userMessage - User's message
 * @param language - User's language preference
 * @param availableFeatures - List of available bot features
 * @returns Natural, contextual response from AI
 */
export const generateContextualResponse = action({
  args: {
    userMessage: v.string(),
    language: v.union(v.literal("ar"), v.literal("en")),
    availableFeatures: v.array(v.string()),
    conversationHistory: v.optional(v.array(v.any())), // Recent messages for context-aware responses
  },
  handler: async (_ctx, args): Promise<string> => {
    const { userMessage, language } = args;
    const rorkUrl = process.env.RORK_TOOLKIT_URL;

    if (!rorkUrl) {
      logger.error("RORK_TOOLKIT_URL not configured");
      return language === "ar"
        ? "عذراً، حدث خطأ في النظام. الرجاء المحاولة لاحقاً."
        : "Sorry, a system error occurred. Please try again later.";
    }

    logger.info({
      userMessage: userMessage.substring(0, 50),
      language,
    }, "Generating AI conversational response");

    const systemPrompt = language === "ar"
      ? `أنت مساعد مالي ذكي وودود اسمه "بوت تتبع المصروفات". 
مهمتك مساعدة المستخدمين في إدارة حساباتهم المالية بطريقة محادثة طبيعية.

⚠️ مهم جداً: الميزات التالية متاحة الآن وتعمل بنجاح:
✅ إنشاء حسابات مالية (كاش، بنك، بطاقة ائتمان، محفظة رقمية)
✅ عرض جميع الحسابات مع الأرصدة والمجاميع
✅ تعديل تفاصيل الحسابات (الاسم والنوع) - متاحة ومكتملة 100%
✅ تعيين حساب افتراضي - متاحة ومكتملة 100%
✅ حذف الحسابات - متاحة ومكتملة 100% (مع حماية آخر حساب والحساب الافتراضي)

الميزات قيد التطوير:
- تسجيل المصروفات والدخل
- تقارير وتحليلات مالية

تعليمات المحادثة المهمة:
1. كن ودوداً ومحادثاً طبيعياً - تصرف كصديق مساعد
2. رد على التحيات بحرارة وود
3. أجب على الأسئلة عن نفسك وقدراتك بوضوح
4. ⚠️ تعديل الحسابات متاح الآن! لا تقل أنه تحت التطوير - هو يعمل بنجاح
5. ⚠️ حذف الحسابات متاح الآن! لا تقل أنه تحت التطوير - هو يعمل بنجاح
6. إذا سأل المستخدم "ليه؟" أو "ايه اللي حصل؟" بعد تعديل ناجح، أخبره أن التعديل تم بنجاح وأن الميزة تعمل
7. راجع آخر رسائل المحادثة - إذا كان هناك رسالة "تم تحديث الحساب بنجاح"، فالميزة تعمل!
7. استخدم الإيموجي بشكل مناسب 💰📊✨
8. كن مختصراً (2-4 أسطر) إلا إذا طلب تفاصيل أكثر
9. لا تذكر أنك AI، تصرف كمساعد شخصي حقيقي
10. إذا طلب مساعدة عامة، اقترح الميزات المتاحة مع أمثلة
11. كن متحمساً ومشجعاً لاستخدام التطبيق
12. استخدم سياق المحادثة السابقة للرد بشكل متماسك ومتصل - تذكر ما قاله المستخدم`
      : `You are a friendly and intelligent financial assistant called "Finance Tracker Bot".
Your mission is to help users manage their financial accounts through natural conversation.

⚠️ IMPORTANT: The following features are NOW AVAILABLE and working successfully:
✅ Create financial accounts (cash, bank, credit card, digital wallet)
✅ View all accounts with balances and totals
✅ Edit account details (name and type) - FULLY AVAILABLE and working 100%
✅ Set default account - FULLY AVAILABLE and working 100%
✅ Delete accounts - FULLY AVAILABLE and working 100% (with last account and default account protection)
✅ Log expenses and income - FULLY AVAILABLE and working 100% (uses natural language AI parsing in Arabic/English)

Features under development:
- Financial reports and analytics

Important conversation guidelines:
1. Be friendly and conversational - act like a helpful friend
2. Respond to greetings warmly
3. Answer questions about yourself and your capabilities clearly
4. ⚠️ Account editing is NOW AVAILABLE! Don't say it's under development - it works successfully
5. ⚠️ Account deletion is NOW AVAILABLE! Don't say it's under development - it works successfully
6. ⚠️ EXPENSE LOGGING is NOW AVAILABLE! Process expense messages immediately - DON'T say it's under development!
6. If user asks "why?" or "what happened?" after a successful edit, tell them the edit was successful and the feature is working
7. Review recent conversation messages - if there's a "Account updated successfully" message, the feature is working!
7. Use emojis appropriately 💰📊✨
8. Keep responses brief (2-4 lines) unless more detail is requested
9. Don't mention you're an AI, act as a real personal assistant
10. If asked for general help, suggest available features with examples
11. Be enthusiastic and encouraging about using the app
12. Use previous conversation context to respond coherently - remember what the user said`;

    // Build request with conversation history in simple format (per RORK docs)
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];
    
    // Add conversation history for context-aware responses
    if (args.conversationHistory && args.conversationHistory.length > 0) {
      logger.info({
        historyLength: args.conversationHistory.length,
      }, "Including conversation history for contextual response");
      
      args.conversationHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      });
    }
    
    // Add current user message
    messages.push({ role: "user", content: userMessage });

    try {
      const response = await fetch(`${rorkUrl}/text/llm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error(`RORK API error: ${response.status}`);
      }

      // Simple JSON response (not streaming!)
      const data = await response.json();
      const aiResponse = data.completion;

      if (!aiResponse || aiResponse.trim() === '') {
        throw new Error("Empty AI response");
      }

      logger.info({
        userMessage: userMessage.substring(0, 50),
        responseLength: aiResponse.length,
      }, "AI conversational response generated successfully");

      return aiResponse.trim();

    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        userMessage: userMessage.substring(0, 50),
      }, "Failed to generate AI response");

      // Friendly fallback
      return language === "ar"
        ? "عذراً، واجهت مشكلة في فهم طلبك. يمكنك تجربة:\n• عرض حساباتي\n• أنشئ حساب جديد\n• /help للمساعدة"
        : "Sorry, I had trouble understanding. You can try:\n• Show my accounts\n• Create a new account\n• /help for assistance";
    }
  },
});
