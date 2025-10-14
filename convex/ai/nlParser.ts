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
  type RorkMessage,
  type RorkChatRequest,
  type RorkChatResponse,
} from "./types";

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
        ? `أنت مساعد ذكي لإدارة الحسابات المالية. حلل رسالة المستخدم واستخرج النية (intent) والمعلومات المطلوبة (entities).

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

أرجع الرد بصيغة JSON فقط بهذا الشكل:
{
  "intent": "create_account" | "view_accounts" | "edit_account" | "delete_account" | "unknown",
  "confidence": رقم بين 0 و 1,
  "entities": {
    "accountType": "bank" | "cash" | "credit_card" | "digital_wallet",
    "accountName": "اسم الحساب إن وجد",
    "initialBalance": رقم إن وجد,
    "currency": "EGP" | "USD" | "SAR" | "EUR"
  },
  "language": "ar"
}

لا ترجع أي شيء غير JSON.`
        : `You are a smart financial account management assistant. Analyze the user's message and extract intent and entities.

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

Return ONLY JSON in this exact format:
{
  "intent": "create_account" | "view_accounts" | "edit_account" | "delete_account" | "unknown",
  "confidence": number between 0 and 1,
  "entities": {
    "accountType": "bank" | "cash" | "credit_card" | "digital_wallet",
    "accountName": "name if provided",
    "initialBalance": number if provided,
    "currency": "EGP" | "USD" | "SAR" | "EUR"
  },
  "language": "en"
}

Return ONLY JSON, nothing else.`;

      // Build RORK messages (Vercel AI SDK v5 format)
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
        {
          id: "user_001",
          role: "user",
          parts: [
            {
              type: "text",
              text: args.userMessage,
            },
          ],
        },
      ];

      // Build RORK request WITHOUT tools - just get JSON in text response
      const rorkRequest = {
        model: "gpt-4o-mini",
        messages,
      };

      // Call RORK API
      logger.info({ 
        endpoint: `${rorkUrl}/agent/chat`,
        model: rorkRequest.model,
        messageCount: messages.length,
      }, "Calling RORK API (without tools - JSON in text)");

      const response = await fetch(`${rorkUrl}/agent/chat`, {
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

      // RORK returns streaming SSE data
      const responseText = await response.text();
      
      logger.info({ 
        responsePreview: responseText.substring(0, 150),
        responseLength: responseText.length,
      }, "Received RORK streaming response");

      // Parse SSE data and extract text deltas
      const lines = responseText.split('\n').filter(line => line.startsWith('data: ') && !line.includes('[DONE]'));
      let fullText = '';
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line.replace('data: ', ''));
          if (data.type === 'text-delta' && data.delta) {
            fullText += data.delta;
          }
        } catch (e) {
          // Skip invalid JSON lines
        }
      }
      
      logger.info({ 
        fullText: fullText.substring(0, 200),
        textLength: fullText.length,
      }, "Extracted text from SSE stream");

      if (!fullText) {
        throw new Error("No text content in RORK response");
      }

      // Extract JSON from response (AI might add markdown code blocks)
      let jsonText = fullText.trim();
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

  // Unknown intent - return low confidence instead of throwing error
  logger.info({ message: normalized }, "No pattern matched - returning unknown intent");
  
  return {
    intent: "unknown",
    confidence: 0.3,
    entities: {},
    language,
  };
}
