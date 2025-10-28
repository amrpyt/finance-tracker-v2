/**
 * Income Intent Parser
 * 
 * Story 3.2: AI Income Logging
 * Task 1: Extend Income Intent Parser (AC: #1, #2, #3, #4, #16)
 * 
 * Uses RORK AI for natural language parsing of income logging messages
 * in Arabic and English with fallback regex patterns.
 */

import { action } from "../_generated/server";
import { v } from "convex/values";
import {
  ExpenseIntentDetectionResult,
  LogIncomeEntities,
  IncomeCategory,
  type RorkMessage,
} from "./types";
import logger from "../lib/logger";

/**
 * Parse income intent from natural language message
 * 
 * AC1: Natural Language Input - Arabic/English conversational text
 * AC2: AI Entity Extraction - 85%+ accuracy for amount, category, description, account
 * AC3: Intent Detection - Detects log_income with 85%+ confidence
 * AC4: Bilingual Support - Arabic and English with equivalent accuracy
 * AC16: Fallback Regex - Falls back if RORK API fails
 * 
 * Examples:
 * - "استلمت راتب 5000 جنيه" → {intent: log_income, amount: 5000, category: salary, description: "راتب"}
 * - "received 500 freelance payment" → {intent: log_income, amount: 500, category: freelance, description: "freelance payment"}
 * - "حصلت على 200 من عمل حر" → {intent: log_income, amount: 200, category: freelance, description: "عمل حر"}
 */
export const parseIncomeIntent = action({
  args: {
    userMessage: v.string(),
    language: v.union(v.literal("ar"), v.literal("en")),
    conversationHistory: v.optional(v.array(v.any())), // Recent messages for context retention (AC17)
  },
  handler: async (_ctx, args): Promise<ExpenseIntentDetectionResult> => {
    const startTime = Date.now();

    try {
      // Get RORK API URL from environment (uses /text/llm/ endpoint per memory)
      const rorkUrl = process.env.RORK_TOOLKIT_URL || "https://toolkit.rork.com";

      logger.info({
        userMessage: args.userMessage.substring(0, 50),
        language: args.language,
      }, "Parsing income intent with RORK");

      // Build system prompt for income logging with JSON output (Task 1.3, 1.4)
      const systemPrompt = args.language === "ar"
        ? `أنت محلل نوايا (Intent Detector) للإيرادات والمصروفات. مهمتك الوحيدة: تحليل الرسالة وإرجاع JSON فقط.

⚠️ تحذير: لا تكتب أي نص عادي. لا ترد على المستخدم. فقط JSON.

الفئات المتاحة للإيرادات:
- salary: راتب، مرتب، الراتب، المرتب
- freelance: عمل حر، فريلانس، مشروع حر، freelancing
- business: مشروع، تجارة، أرباح مشروع، بيزنس
- investment: استثمار، أرباح، عوائد، استثمارات
- gift: هدية، عيدية، هدية مالية، مبلغ هدية
- other: أخرى، متنوع، غير ذلك، دخل آخر

النوايا المتاحة:
- log_income: تسجيل إيراد (استلمت، قبضت، حصلت على، جاني فلوس، وصلني، استلمت راتب)
- log_expense: تسجيل مصروف (دفعت، صرفت، اشتريت)
- unknown: غير معروف

أمثلة للإيرادات:
- "استلمت راتب 5000 جنيه" → log_income, amount: 5000, category: salary, description: "راتب"
- "حصلت على 200 من عمل حر" → log_income, amount: 200, category: freelance, description: "عمل حر"
- "جاني 1000 من مشروع" → log_income, amount: 1000, category: business, description: "مشروع"
- "استلمت هدية 500 جنيه" → log_income, amount: 500, category: gift, description: "هدية"
- "قبضت أرباح 300 من الاستثمار" → log_income, amount: 300, category: investment, description: "أرباح الاستثمار"
- "وصلني راتب 4000 أمس" → log_income, amount: 4000, category: salary, description: "راتب", date: "أمس"
- "استلمت 600 فريلانس على حساب المحفظة" → log_income, amount: 600, category: freelance, description: "فريلانس", accountName: "المحفظة"

التواريخ النسبية:
- "أمس" = yesterday
- "اليوم" = today
- "الأسبوع اللي فات" = last week
- "يوم الإثنين" = Monday (last/next)
- "يومين فاتوا" = two days ago

أرجع JSON فقط بهذا الشكل الدقيق:
{
  "intent": "log_income" | "log_expense" | "unknown",
  "confidence": رقم بين 0 و 1 (يجب أن يكون >= 0.85 للإيرادات المؤكدة),
  "entities": {
    "amount": رقم موجب (المبلغ),
    "category": "salary" | "freelance" | "business" | "investment" | "gift" | "other",
    "description": "وصف الإيراد (نص حر)",
    "accountName": "اسم الحساب إن وجد",
    "date": "التاريخ النسبي إن وجد (أمس، اليوم، إلخ)"
  },
  "language": "ar"
}

⚠️ مهم جداً: 
- لا تكتب أي شيء غير JSON
- confidence يجب أن يكون >= 0.85 إذا كنت متأكد من الإيراد
- amount يجب أن يكون رقم موجب فقط (مثال: 5000 وليس "5000")
- استخرج الأرقام من النص بدقة: "5000 جنيه" = 5000, "٥٠٠٠" = 5000
- category يجب أن تكون من القائمة المحددة فقط`
        : `You are an Intent Detector for income and expense tracking. Your ONLY job: analyze the message and return JSON.

⚠️ WARNING: Do NOT write any conversational text. Do NOT respond to the user. ONLY JSON.

Available income categories:
- salary: salary, wage, paycheck, monthly salary, pay
- freelance: freelance, contract, gig, freelancing, project work
- business: business, profit, revenue, business income, sales
- investment: investment, dividend, returns, interest, capital gains
- gift: gift, present, bonus, monetary gift, cash gift
- other: other, miscellaneous, various, other income

Available intents:
- log_income: Log income (received, earned, got paid, got money, income)
- log_expense: Log expense (spent, paid, bought, purchased)
- unknown: Unknown intent

Income examples:
- "received 500 freelance payment" → log_income, amount: 500, category: freelance, description: "freelance payment"
- "got paid 1000 salary" → log_income, amount: 1000, category: salary, description: "salary"
- "earned 200 from business" → log_income, amount: 200, category: business, description: "business"
- "received gift of 300" → log_income, amount: 300, category: gift, description: "gift"
- "got dividend 150" → log_income, amount: 150, category: investment, description: "dividend"
- "received salary 4000 yesterday" → log_income, amount: 4000, category: salary, description: "salary", date: "yesterday"
- "got 600 freelance payment to wallet account" → log_income, amount: 600, category: freelance, description: "freelance payment", accountName: "wallet"

Relative dates:
- "yesterday" = yesterday
- "today" = today
- "last week" = last week
- "Monday" = Monday (last/next)
- "two days ago" = two days ago

Return ONLY JSON in this EXACT format:
{
  "intent": "log_income" | "log_expense" | "unknown",
  "confidence": number between 0 and 1 (should be >= 0.85 for confident income detection),
  "entities": {
    "amount": positive number (the amount),
    "category": "salary" | "freelance" | "business" | "investment" | "gift" | "other",
    "description": "income description (free text)",
    "accountName": "account name if specified",
    "date": "relative date if specified (yesterday, today, etc.)"
  },
  "language": "en"
}

⚠️ CRITICAL:
- Return ONLY JSON, nothing else
- confidence must be >= 0.85 if you're confident about the income
- amount must be a positive number only (example: 500 not "500")
- Extract numbers accurately: "500 dollars" = 500, "for 500" = 500
- category must be from the specified list only`;

      // Build conversation history for context (AC17: Conversation Context)
      const historyMessages: RorkMessage[] = [];
      if (args.conversationHistory && args.conversationHistory.length > 0) {
        logger.info({
          historyLength: args.conversationHistory.length,
          historyPreview: args.conversationHistory.slice(0, 3).map((m: any) => ({
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

      // Build RORK messages with history
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

      // Build RORK request for /text/llm/ endpoint (Task 1.5)
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

      // Call RORK API using /text/llm/ endpoint with 10-second timeout
      logger.info({ 
        endpoint: `${rorkUrl}/text/llm/`,
        messageCount: simplifiedMessages.length,
      }, "Calling RORK /text/llm/ API for income intent detection");

      // AC19, AC20: Add 10-second timeout to prevent indefinite waits
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(`${rorkUrl}/text/llm/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(rorkRequest),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

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
      const result = JSON.parse(jsonText) as ExpenseIntentDetectionResult;

      const processingTime = Date.now() - startTime;
      logger.info({
        intent: result.intent,
        confidence: result.confidence,
        language: result.language,
        hasAmount: 'amount' in result.entities,
        hasCategory: 'category' in result.entities,
        processingTimeMs: processingTime,
      }, "Income intent parsed successfully from RORK");

      // Validate result with Zod (Task 1.2: Validate schema)
      return ExpenseIntentDetectionResult.parse(result);

      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      
      logger.error({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        isTimeout,
        processingTimeMs: processingTime,
      }, "Income intent parsing failed, falling back to regex");

      // Task 1.7: Fallback to regex-based parsing (AC16, AC20)
      // This handles both API failures and timeouts
      return fallbackIncomeDetection(args.userMessage, args.language);
    }
  },
});

/**
 * Fallback income detection using regex patterns
 * Used when RORK API fails or is unavailable
 * 
 * Task 1.7: AC16 - Fallback Regex for amount extraction
 */
function fallbackIncomeDetection(
  message: string,
  language: "ar" | "en"
): ExpenseIntentDetectionResult {
  const normalized = message.toLowerCase().trim();

  logger.warn({ message: normalized }, "Using fallback regex parsing for income");

  // Task 1.7: Regex patterns for income detection
  const incomePatterns = {
    ar: /(استلمت|قبضت|حصلت على|جاني|وصلني|استلمت راتب|قبضت راتب)/i,
    en: /(received|got paid|earned|got money|income)/i,
  };

  if (incomePatterns[language].test(normalized)) {
    // Task 1.7: Extract amount using regex - /\d+\.?\d*/
    const amountMatch = normalized.match(/(\d+(?:\.\d+)?)/);
    
    // If no amount found, return unknown intent instead of log_income with amount=0
    if (!amountMatch) {
      logger.warn({ message: normalized }, "Income pattern matched but no amount found");
      return {
        intent: "unknown",
        confidence: 0.0,
        entities: {},
        language,
      };
    }
    
    const amount = parseFloat(amountMatch[1]);

    // Try to extract category from keywords
    let category: typeof IncomeCategory._type | undefined;
    
    // Salary keywords
    if (/(راتب|مرتب|الراتب|المرتب|salary|wage|paycheck|pay)/i.test(normalized)) {
      category = "salary";
    }
    // Freelance keywords
    else if (/(عمل حر|فريلانس|مشروع حر|freelance|contract|gig|freelancing)/i.test(normalized)) {
      category = "freelance";
    }
    // Business keywords
    else if (/(مشروع|تجارة|أرباح مشروع|بيزنس|business|profit|revenue|sales)/i.test(normalized)) {
      category = "business";
    }
    // Investment keywords
    else if (/(استثمار|أرباح|عوائد|استثمارات|investment|dividend|returns|interest)/i.test(normalized)) {
      category = "investment";
    }
    // Gift keywords
    else if (/(هدية|عيدية|هدية مالية|gift|present|bonus)/i.test(normalized)) {
      category = "gift";
    }

    // Extract description (simple approach: take text after amount)
    const description = message.substring(0, 100); // Truncate long descriptions

    return {
      intent: "log_income",
      confidence: 0.6, // Lower confidence for fallback (Task 1.6)
      entities: {
        amount,
        category,
        description,
      },
      language,
    };
  }

  // Unknown intent
  return {
    intent: "unknown",
    confidence: 0.0,
    entities: {},
    language,
  };
}
