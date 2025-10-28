/**
 * Unified Natural Language Parser using RORK Toolkit API
 * 
 * Performance Optimization: Single AI call detects ALL intent types
 * - Account management (create, view, edit, delete, set_default)
 * - Expense logging
 * - Income logging
 * 
 * Replaces sequential waterfall pattern that called 3 separate parsers
 * Performance improvement: ~9 seconds → ~2 seconds
 */

import { action } from "../_generated/server";
import { v } from "convex/values";
import {
  UnifiedIntentDetectionResult,
  type RorkMessage,
} from "./types";
import logger from "../lib/logger";

/**
 * Parse user message for ANY intent type in a single RORK API call
 * 
 * @param userMessage - Natural language message from user
 * @param language - User's preferred language (ar/en)
 * @param conversationHistory - Recent messages for context
 * @returns Unified intent detection result with extracted entities
 * 
 * Examples:
 * - "أنشئ حساب محفظة" → create_account
 * - "دفعت 50 جنيه على القهوة" → log_expense
 * - "جالي 500 هدية" → log_income
 */
export const parseUnifiedIntent = action({
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
      }, "Parsing unified intent with RORK (single call for all intents)");

      // Comprehensive system prompt covering ALL intent types
      const systemPrompt = args.language === "ar"
        ? `أنت محلل نوايا (Intent Detector) شامل لتطبيق إدارة مالية. مهمتك الوحيدة: تحليل الرسالة وإرجاع JSON فقط.

⚠️ تحذير: لا تكتب أي نص عادي. لا ترد على المستخدم. فقط JSON.

═══ النوايا المتاحة ═══

📁 **إدارة الحسابات:**
- create_account: إنشاء حساب (أنشئ، اعمل، عاوز حساب)
- view_accounts: عرض الحسابات (أرني، اعرض، شوف الحسابات)
- edit_account: تعديل حساب (عدل، غير الحساب)
- delete_account: حذف حساب (احذف، امسح الحساب)
- set_default_account: تعيين افتراضي (اجعل افتراضي، خلي المحفظة افتراضية)

💸 **المصروفات:**
- log_expense: تسجيل مصروف (دفعت، صرفت، اشتريت، جبت، خلصت)

💰 **الإيرادات:**
- log_income: تسجيل إيراد (استلمت، قبضت، حصلت على، جاني، وصلني)

❓ **غير معروف:**
- unknown: لم أفهم النية

═══ الفئات المتاحة ═══

**فئات المصروفات:**
- food: طعام، قهوة، غداء، عشاء، مطعم
- transport: مواصلات، تاكسي، أوبر، بنزين
- entertainment: ترفيه، سينما، ألعاب
- shopping: تسوق، ملابس، شراء، سوبر ماركت
- bills: فواتير، كهرباء، مياه، إنترنت
- health: صحة، دواء، طبيب، صيدلية
- other: أخرى

**فئات الإيرادات:**
- salary: راتب، مرتب
- freelance: عمل حر، فريلانس
- business: مشروع، تجارة، أرباح
- investment: استثمار، عوائد
- gift: هدية، عيدية
- other: دخل آخر

**أنواع الحسابات:**
- bank: حساب بنكي (بنك، بنكي، instapay)
- cash: محفظة نقدية (محفظة، كاش)
- credit_card: بطاقة ائتمان (فيزا، ماستر)
- digital_wallet: محفظة رقمية (فودافون كاش، أورانج)

═══ أمثلة ═══

**حسابات:**
"أنشئ محفظة برصيد 1000" → create_account, {type: "cash", balance: 1000}
"أرني حساباتي" → view_accounts, {}

**مصروفات:**
"دفعت 50 جنيه على القهوة" → log_expense, {amount: 50, category: "food"}
"اشتريت دواء ب 80" → log_expense, {amount: 80, category: "health"}

**إيرادات:**
"جالي 500 هدية من أبويا" → log_income, {amount: 500, category: "gift"}
"استلمت راتب 5000" → log_income, {amount: 5000, category: "salary"}

═══ التنسيق المطلوب ═══

أرجع JSON فقط بهذا الشكل الدقيق:
{
  "intent": "create_account" | "view_accounts" | "edit_account" | "delete_account" | "set_default_account" | "log_expense" | "log_income" | "unknown",
  "confidence": رقم بين 0 و 1,
  "entities": {
    // حسب نوع النية - راجع الأمثلة
  },
  "language": "ar"
}

⚠️ **قواعد مهمة:**
- لا تكتب أي شيء غير JSON
- confidence >= 0.85 للنوايا المؤكدة
- amount دائماً رقم موجب (500 وليس "500")
- استخرج الأرقام بدقة: "ب 50" = 50, "٥٠٠" = 500
- category من القوائم المحددة فقط`
        : `You are a comprehensive Intent Detector for a finance management app. Your ONLY job: analyze the message and return JSON.

⚠️ WARNING: Do NOT write any conversational text. Do NOT respond to the user. ONLY JSON.

═══ Available Intents ═══

📁 **Account Management:**
- create_account: Create account (create, make, new account)
- view_accounts: View accounts (show, list, view accounts)
- edit_account: Edit account (edit, modify, change account)
- delete_account: Delete account (delete, remove account)
- set_default_account: Set default (make default, set as default)

💸 **Expenses:**
- log_expense: Log expense (spent, paid, bought, purchased)

💰 **Income:**
- log_income: Log income (received, earned, got paid, got money)

❓ **Unknown:**
- unknown: Intent not understood

═══ Available Categories ═══

**Expense Categories:**
- food: food, coffee, lunch, dinner, restaurant
- transport: transport, taxi, uber, gas, metro
- entertainment: entertainment, cinema, movie, game
- shopping: shopping, clothes, mall, store
- bills: bills, electricity, water, internet
- health: health, medicine, doctor, pharmacy
- other: other, miscellaneous

**Income Categories:**
- salary: salary, wage, paycheck, pay
- freelance: freelance, contract, gig work
- business: business, profit, revenue
- investment: investment, dividend, returns
- gift: gift, present, bonus
- other: other income

**Account Types:**
- bank: bank account
- cash: cash wallet
- credit_card: credit card
- digital_wallet: digital wallet

═══ Examples ═══

**Accounts:**
"Create wallet with 1000 balance" → create_account, {type: "cash", balance: 1000}
"Show my accounts" → view_accounts, {}

**Expenses:**
"Spent 50 on coffee" → log_expense, {amount: 50, category: "food"}
"Bought medicine for 80" → log_expense, {amount: 80, category: "health"}

**Income:**
"Got 500 gift from dad" → log_income, {amount: 500, category: "gift"}
"Received salary 5000" → log_income, {amount: 5000, category: "salary"}

═══ Required Format ═══

Return ONLY JSON in this EXACT format:
{
  "intent": "create_account" | "view_accounts" | "edit_account" | "delete_account" | "set_default_account" | "log_expense" | "log_income" | "unknown",
  "confidence": number between 0 and 1,
  "entities": {
    // Intent-specific entities - see examples
  },
  "language": "en"
}

⚠️ **Critical Rules:**
- Return ONLY JSON, nothing else
- confidence >= 0.85 for confident detections
- amount must be positive number (500 not "500")
- Extract numbers accurately: "for 50" = 50
- category must be from specified lists only`;

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

      // Convert to simple format for /text/llm/ endpoint
      const simplifiedMessages = messages.map(msg => {
        const firstPart = msg.parts[0];
        const content = 'text' in firstPart ? firstPart.text : '';
        return { role: msg.role, content };
      });

      // Call RORK API with 10-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${rorkUrl}/text/llm/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: simplifiedMessages }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`RORK API error: ${response.status}`);
        }

        const data = await response.json();
        
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

        const result = JSON.parse(jsonText);

        const processingTime = Date.now() - startTime;
        
        // DEBUG: Log raw result BEFORE Zod validation
        logger.info({
          rawJSON: jsonText.substring(0, 500),
          rawResult: result,
          rawEntities: result.entities,
        }, "[UNIFIED PARSER DEBUG] Raw AI response BEFORE Zod validation");

        logger.info({
          intent: result.intent,
          confidence: result.confidence,
          language: result.language,
          processingTimeMs: processingTime,
        }, "Unified intent parsed successfully from RORK (single call)");

        // Validate with Zod
        const validated = UnifiedIntentDetectionResult.parse(result);
        
        // DEBUG: Log AFTER Zod validation
        logger.info({
          validatedEntities: validated.entities,
          hasAmount: 'amount' in validated.entities,
        }, "[UNIFIED PARSER DEBUG] After Zod validation");
        
        return validated;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        isTimeout,
        processingTimeMs: processingTime,
      }, "Unified intent parsing failed");

      // Return unknown intent on failure
      return {
        intent: "unknown",
        confidence: 0.0,
        entities: {},
        language: args.language,
      };
    }
  },
});
