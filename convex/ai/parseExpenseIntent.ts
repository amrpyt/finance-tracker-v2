/**
 * Expense Intent Parser
 * 
 * Story 3.1: AI Expense Logging
 * Task 1: Create Expense Intent Parser (AC: #1, #2, #3, #4, #16)
 * 
 * Uses RORK AI for natural language parsing of expense logging messages
 * in Arabic and English with fallback regex patterns.
 */

import { action } from "../_generated/server";
import { v } from "convex/values";
import {
  ExpenseIntentDetectionResult,
  ExpenseIntent,
  LogExpenseEntities,
  ExpenseCategory,
  type RorkMessage,
} from "./types";
import logger from "../lib/logger";

/**
 * Parse expense intent from natural language message
 * 
 * AC1: Natural Language Input - Arabic/English conversational text
 * AC2: AI Entity Extraction - 85%+ accuracy for amount, category, description, account
 * AC3: Intent Detection - Detects log_expense with 85%+ confidence
 * AC4: Bilingual Support - Arabic and English with equivalent accuracy
 * AC16: Fallback Regex - Falls back if RORK API fails
 * 
 * Examples:
 * - "دفعت 50 جنيه على القهوة" → {intent: log_expense, amount: 50, category: food, description: "القهوة"}
 * - "spent 20 on coffee" → {intent: log_expense, amount: 20, category: food, description: "coffee"}
 * - "صرفت 100 على المواصلات أمس" → {intent: log_expense, amount: 100, category: transport, date: "أمس"}
 */
export const parseExpenseIntent = action({
  args: {
    userMessage: v.string(),
    language: v.union(v.literal("ar"), v.literal("en")),
    conversationHistory: v.optional(v.array(v.any())), // Recent messages for context retention (AC17)
  },
  handler: async (_ctx, args): Promise<ExpenseIntentDetectionResult> => {
    const startTime = Date.now();

    try {
      // Get RORK API URL from environment
      const rorkUrl = process.env.RORK_TOOLKIT_URL || "https://toolkit.rork.com";

      logger.info({
        userMessage: args.userMessage.substring(0, 50),
        language: args.language,
      }, "Parsing expense intent with RORK");

      // Build system prompt for expense logging with JSON output (Task 1.3, 1.4)
      const systemPrompt = args.language === "ar"
        ? `أنت محلل نوايا (Intent Detector) للمصروفات والإيرادات. مهمتك الوحيدة: تحليل الرسالة وإرجاع JSON فقط.

⚠️ تحذير: لا تكتب أي نص عادي. لا ترد على المستخدم. فقط JSON.

الفئات المتاحة للمصروفات:
- food: طعام، قهوة، غداء، عشاء، مطعم، أكل، فطور
- transport: مواصلات، تاكسي، أوبر، بنزين، مترو، أتوبيس، قطار
- entertainment: ترفيه، سينما، لعب، ألعاب، فيلم، مسرح
- shopping: تسوق، ملابس، شراء، سوبر ماركت، مول
- bills: فواتير، كهرباء، مياه، إنترنت، غاز، تليفون
- health: صحة، دواء، طبيب، مستشفى، صيدلية، علاج
- other: أخرى، متنوع، غير ذلك

النوايا المتاحة:
- log_expense: تسجيل مصروف (دفعت، صرفت، اشتريت، جبت، خلصت، دفعت فلوس)
- log_income: تسجيل إيراد (استلمت، قبضت، جاني فلوس)
- unknown: غير معروف

أمثلة للمصروفات:
- "دفعت 50 جنيه على القهوة" → log_expense, amount: 50, category: food, description: "القهوة"
- "صرفت 100 على المواصلات" → log_expense, amount: 100, category: transport, description: "المواصلات"
- "اشتريت دواء ب 80 جنيه" → log_expense, amount: 80, category: health, description: "دواء"
- "جبت شامبو ب 30" → log_expense, amount: 30, category: shopping, description: "شامبو"
- "جبت ازازة مايه ب 50" → log_expense, amount: 50, category: food, description: "ازازة مايه"
- "اشتريت هدوم ب 200" → log_expense, amount: 200, category: shopping, description: "هدوم"
- "دفعت 200 للكهرباء أمس" → log_expense, amount: 200, category: bills, description: "الكهرباء", date: "أمس"
- "خلصت 30 جنيه على تاكسي من حساب المحفظة" → log_expense, amount: 30, category: transport, description: "تاكسي", accountName: "المحفظة"

التواريخ النسبية:
- "أمس" = yesterday
- "اليوم" = today
- "الأسبوع اللي فات" = last week
- "يوم الإثنين" = Monday (last/next)
- "يومين فاتوا" = two days ago

أرجع JSON فقط بهذا الشكل الدقيق:
{
  "intent": "log_expense" | "log_income" | "unknown",
  "confidence": رقم بين 0 و 1 (يجب أن يكون >= 0.85 للمصروفات المؤكدة),
  "entities": {
    "amount": رقم موجب (المبلغ),
    "category": "food" | "transport" | "entertainment" | "shopping" | "bills" | "health" | "other",
    "description": "وصف المصروف (نص حر)",
    "accountName": "اسم الحساب إن وجد",
    "date": "التاريخ النسبي إن وجد (أمس، اليوم، إلخ)"
  },
  "language": "ar"
}

⚠️ مهم جداً: 
- لا تكتب أي شيء غير JSON
- confidence يجب أن يكون >= 0.85 إذا كنت متأكد من المصروف
- amount يجب أن يكون رقم موجب فقط (مثال: 30 وليس "30")
- استخرج الأرقام من النص بدقة: "ب 30" = 30, "ب٣٠" = 30
- category يجب أن تكون من القائمة المحددة فقط`
        : `You are an Intent Detector for expense and income tracking. Your ONLY job: analyze the message and return JSON.

⚠️ WARNING: Do NOT write any conversational text. Do NOT respond to the user. ONLY JSON.

Available expense categories:
- food: food, coffee, lunch, dinner, restaurant, breakfast, meal
- transport: transport, taxi, uber, gas, petrol, metro, bus, train
- entertainment: entertainment, cinema, movie, game, theater, fun
- shopping: shopping, clothes, purchase, mall, supermarket, store
- bills: bills, electricity, water, internet, gas, phone, utilities
- health: health, medicine, doctor, hospital, pharmacy, medical
- other: other, miscellaneous, various

Available intents:
- log_expense: Log an expense (spent, paid, bought, purchased)
- log_income: Log income (received, earned, got money)
- unknown: Unknown intent

Expense examples:
- "spent 20 on coffee" → log_expense, amount: 20, category: food, description: "coffee"
- "paid 50 for lunch" → log_expense, amount: 50, category: food, description: "lunch"
- "bought medicine for 30" → log_expense, amount: 30, category: health, description: "medicine"
- "paid 100 for electricity yesterday" → log_expense, amount: 100, category: bills, description: "electricity", date: "yesterday"
- "spent 15 on taxi from wallet account" → log_expense, amount: 15, category: transport, description: "taxi", accountName: "wallet"

Relative dates:
- "yesterday" = yesterday
- "today" = today
- "last week" = last week
- "Monday" = Monday (last/next)
- "two days ago" = two days ago

Return ONLY JSON in this EXACT format:
{
  "intent": "log_expense" | "log_income" | "unknown",
  "confidence": number between 0 and 1 (should be >= 0.85 for confident expense detection),
  "entities": {
    "amount": positive number (the amount),
    "category": "food" | "transport" | "entertainment" | "shopping" | "bills" | "health" | "other",
    "description": "expense description (free text)",
    "accountName": "account name if specified",
    "date": "relative date if specified (yesterday, today, etc.)"
  },
  "language": "en"
}

⚠️ CRITICAL:
- Return ONLY JSON, nothing else
- confidence must be >= 0.85 if you're confident about the expense
- amount must be a positive number only (example: 30 not "30")
- Extract numbers accurately: "for 30" = 30, "b 30" = 30
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

      // Call RORK API using /text/llm/ endpoint with 10-second timeout (Action Item #3)
      logger.info({ 
        endpoint: `${rorkUrl}/text/llm/`,
        messageCount: simplifiedMessages.length,
      }, "Calling RORK /text/llm/ API for expense intent detection");

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
      }, "Expense intent parsed successfully from RORK");

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
      }, "Expense intent parsing failed, falling back to regex");

      // Task 1.7: Fallback to regex-based parsing (AC16, AC20)
      // This handles both API failures and timeouts
      return fallbackExpenseDetection(args.userMessage, args.language);
    }
  },
});

/**
 * Fallback expense detection using regex patterns
 * Used when RORK API fails or is unavailable
 * 
 * Task 1.7: AC16 - Fallback Regex for amount extraction
 */
function fallbackExpenseDetection(
  message: string,
  language: "ar" | "en"
): ExpenseIntentDetectionResult {
  const normalized = message.toLowerCase().trim();

  logger.warn({ message: normalized }, "Using fallback regex parsing for expense");

  // Task 1.7: Regex patterns for expense detection
  const expensePatterns = {
    ar: /(دفعت|صرفت|اشتريت|خلصت|دفعت فلوس)/i,
    en: /(spent|paid|bought|purchased|paid for)/i,
  };

  if (expensePatterns[language].test(normalized)) {
    // Task 1.7: Extract amount using regex - /\d+\.?\d*/
    const amountMatch = normalized.match(/(\d+(?:\.\d+)?)/);
    
    // If no amount found, return unknown intent instead of log_expense with amount=0
    if (!amountMatch) {
      logger.warn({ message: normalized }, "Expense pattern matched but no amount found");
      return {
        intent: "unknown",
        confidence: 0.0,
        entities: {},
        language,
      };
    }
    
    const amount = parseFloat(amountMatch[1]);

    // Try to extract category from keywords
    let category: typeof ExpenseCategory._type | undefined;
    
    // Food keywords
    if (/(قهوة|طعام|غداء|عشاء|مطعم|أكل|فطور|coffee|food|lunch|dinner|restaurant|meal|breakfast)/i.test(normalized)) {
      category = "food";
    }
    // Transport keywords
    else if (/(مواصلات|تاكسي|أوبر|بنزين|مترو|transport|taxi|uber|gas|petrol|metro|bus)/i.test(normalized)) {
      category = "transport";
    }
    // Entertainment keywords
    else if (/(ترفيه|سينما|لعب|ألعاب|فيلم|entertainment|cinema|movie|game|theater)/i.test(normalized)) {
      category = "entertainment";
    }
    // Shopping keywords
    else if (/(تسوق|ملابس|شراء|سوبر|shopping|clothes|mall|store|purchase)/i.test(normalized)) {
      category = "shopping";
    }
    // Bills keywords
    else if (/(فواتير|كهرباء|مياه|إنترنت|غاز|bills|electricity|water|internet|utilities)/i.test(normalized)) {
      category = "bills";
    }
    // Health keywords
    else if (/(صحة|دواء|طبيب|مستشفى|صيدلية|health|medicine|doctor|hospital|pharmacy)/i.test(normalized)) {
      category = "health";
    }

    // Extract description (simple approach: take text after amount)
    const description = message.substring(0, 100); // Truncate long descriptions

    return {
      intent: "log_expense",
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
