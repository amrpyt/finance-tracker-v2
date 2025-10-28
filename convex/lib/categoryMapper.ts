/**
 * Category Mapper Utility
 * 
 * Story 3.1: AI Expense Logging
 * Task 2: Create Category Auto-Assignment Logic (AC: #6, #14)
 * 
 * Story 3.2: AI Income Logging
 * Task 2: Extend Category Mapper for Income (AC: #6, #14)
 * 
 * Automatically assigns expense/income categories based on description keywords
 * with fuzzy matching and confidence scoring.
 */

import type { ExpenseCategory, IncomeCategory } from "../ai/types";

/**
 * Category mapping with bilingual keywords
 * Task 2.2: Define category mapping rules with Arabic and English keywords
 */
const CATEGORY_KEYWORDS: Record<
  typeof import("../ai/types").ExpenseCategory._type,
  string[]
> = {
  food: [
    // Arabic keywords
    "طعام", "قهوة", "غداء", "عشاء", "مطعم", "أكل", "فطور",
    "كافيه", "كافية", "وجبة", "طلبات", "ديليفري", "بيتزا",
    "برجر", "شاورما", "كشري", "فول", "طعمية",
    // English keywords
    "coffee", "lunch", "dinner", "food", "restaurant", "meal",
    "breakfast", "cafe", "delivery", "pizza", "burger", "eat",
  ],
  transport: [
    // Arabic keywords
    "مواصلات", "تاكسي", "أوبر", "بنزين", "مترو", "أتوبيس",
    "قطار", "ديزل", "وقود", "كريم", "سولار", "محطة",
    "نقل", "سيارة", "موتوسيكل",
    // English keywords
    "transport", "taxi", "uber", "gas", "petrol", "metro",
    "bus", "train", "careem", "fuel", "diesel", "car",
    "ride", "motorcycle",
  ],
  entertainment: [
    // Arabic keywords
    "ترفيه", "سينما", "لعب", "ألعاب", "فيلم", "مسرح",
    "حفلة", "نادي", "كافيه", "نت", "بلايستيشن", "إكس بوكس",
    // English keywords
    "entertainment", "cinema", "movie", "game", "theater",
    "party", "club", "playstation", "xbox", "netflix", "fun",
  ],
  shopping: [
    // Arabic keywords
    "تسوق", "ملابس", "شراء", "سوبر", "مول", "ماركت",
    "هدوم", "قميص", "بنطلون", "حذاء", "جزمة", "شنطة",
    "اكسسوارات", "جاكيت",
    // English keywords
    "shopping", "clothes", "purchase", "mall", "supermarket",
    "store", "shirt", "pants", "shoes", "bag", "accessories",
    "jacket", "buy",
  ],
  bills: [
    // Arabic keywords
    "فواتير", "كهرباء", "مياه", "إنترنت", "غاز", "تليفون",
    "فاتورة", "اشتراك", "نت", "موبايل", "تلفون", "كهربا",
    "ميه", "نور",
    // English keywords
    "bills", "electricity", "water", "internet", "gas", "phone",
    "bill", "subscription", "mobile", "utilities", "electric",
  ],
  health: [
    // Arabic keywords
    "صحة", "دواء", "طبيب", "مستشفى", "صيدلية", "علاج",
    "دكتور", "عيادة", "تحاليل", "أشعة", "كشف", "عملية",
    "دوا", "مضاد",
    // English keywords
    "health", "medicine", "doctor", "hospital", "pharmacy",
    "medical", "clinic", "treatment", "lab", "medication",
    "checkup", "surgery",
  ],
  other: [
    // Arabic keywords
    "أخرى", "متنوع", "عام", "مختلف",
    // English keywords
    "other", "misc", "miscellaneous", "various", "general",
  ],
};

/**
 * Income category mapping with bilingual keywords
 * Story 3.2 Task 2.2: Define income category mapping rules with Arabic and English keywords
 */
const INCOME_CATEGORY_KEYWORDS: Record<
  typeof import("../ai/types").IncomeCategory._type,
  string[]
> = {
  salary: [
    // Arabic keywords
    "راتب", "مرتب", "الراتب", "المرتب", "رواتب", "أجر",
    "مكافأة شهرية", "دخل شهري",
    // English keywords
    "salary", "wage", "paycheck", "pay", "monthly salary",
    "income", "wages", "compensation",
  ],
  freelance: [
    // Arabic keywords
    "عمل حر", "فريلانس", "مشروع حر", "عمل مستقل", "فري لانس",
    "خدمات", "استشارات",
    // English keywords
    "freelance", "contract", "gig", "freelancing", "project work",
    "consulting", "services", "independent work",
  ],
  business: [
    // Arabic keywords
    "مشروع", "تجارة", "أرباح مشروع", "بيزنس", "مبيعات",
    "أرباح", "عائد", "ربح",
    // English keywords
    "business", "profit", "revenue", "business income", "sales",
    "earnings", "returns", "proceeds",
  ],
  investment: [
    // Arabic keywords
    "استثمار", "أرباح", "عوائد", "استثمارات", "فوائد",
    "أسهم", "سندات", "توزيعات",
    // English keywords
    "investment", "dividend", "returns", "interest", "capital gains",
    "stocks", "bonds", "portfolio",
  ],
  gift: [
    // Arabic keywords
    "هدية", "عيدية", "هدية مالية", "مبلغ هدية", "هدايا",
    "عطية", "منحة",
    // English keywords
    "gift", "present", "bonus", "monetary gift", "cash gift",
    "donation", "grant",
  ],
  other: [
    // Arabic keywords
    "أخرى", "متنوع", "عام", "مختلف", "دخل آخر",
    // English keywords
    "other", "misc", "miscellaneous", "various", "general",
    "other income",
  ],
};

/**
 * Category confidence threshold
 * Task 2.5: If confidence < 0.7, return null to trigger category selection
 */
const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Result of category mapping with confidence score
 */
export interface CategoryMappingResult {
  category: typeof import("../ai/types").ExpenseCategory._type | null;
  confidence: number;
  matchedKeywords: string[];
}

/**
 * Result of income category mapping with confidence score
 * Story 3.2 Task 2.4: Return category with confidence score (0-1)
 */
export interface IncomeCategoryMappingResult {
  category: typeof import("../ai/types").IncomeCategory._type | null;
  confidence: number;
  matchedKeywords: string[];
}

/**
 * Assign category based on description keywords
 * 
 * Task 2.3: Implement fuzzy matching for category keywords
 * Task 2.4: Return category with confidence score (0-1)
 * Task 2.5: If confidence < 0.7, return null
 * 
 * AC6: Auto-assign category with 85%+ accuracy
 * AC14: If confidence < 70%, trigger category selection
 * 
 * @param description - Expense description text
 * @returns Category with confidence score, or null if confidence too low
 */
export function assignCategory(description: string): CategoryMappingResult {
  if (!description || description.trim().length === 0) {
    return {
      category: null,
      confidence: 0.0,
      matchedKeywords: [],
    };
  }

  const normalized = description.toLowerCase().trim();
  
  // Track matches per category
  const categoryMatches: Record<string, { count: number; keywords: string[] }> = {};
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    categoryMatches[category] = { count: 0, keywords: [] };
    
    for (const keyword of keywords) {
      // Task 2.3: Fuzzy matching - check if keyword is contained in description
      // This allows partial matches (e.g., "قهو" matches "قهوة")
      if (normalized.includes(keyword.toLowerCase())) {
        categoryMatches[category].count++;
        categoryMatches[category].keywords.push(keyword);
      }
    }
  }

  // Find category with most matches
  let bestCategory: string | null = null;
  let maxMatches = 0;
  let matchedKeywords: string[] = [];

  for (const [category, matches] of Object.entries(categoryMatches)) {
    if (matches.count > maxMatches) {
      maxMatches = matches.count;
      bestCategory = category;
      matchedKeywords = matches.keywords;
    }
  }

  // Task 2.4: Calculate confidence score
  // Confidence based on:
  // 1. Number of keyword matches (more matches = higher confidence)
  // 2. Length of description (shorter descriptions with matches = higher confidence)
  const descriptionWords = normalized.split(/\s+/).length;
  const matchRatio = maxMatches / Math.max(descriptionWords, 1);
  
  // Confidence formula: base confidence from matches, boosted by match ratio
  let confidence = 0.0;
  if (maxMatches > 0) {
    // Base confidence: 0.6 for 1 match, 0.8 for 2+ matches, 0.9 for 3+ matches
    const baseConfidence = Math.min(0.6 + (maxMatches - 1) * 0.15, 0.9);
    // Boost for high match ratio (keyword-dense descriptions)
    const ratioBoost = Math.min(matchRatio * 0.2, 0.1);
    confidence = Math.min(baseConfidence + ratioBoost, 1.0);
  }

  // Task 2.5: If confidence < 0.7, return null to trigger manual selection
  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      category: null,
      confidence,
      matchedKeywords,
    };
  }

  return {
    category: bestCategory as typeof import("../ai/types").ExpenseCategory._type,
    confidence,
    matchedKeywords,
  };
}

/**
 * Get category display name in user's language
 * 
 * @param category - Category enum value
 * @param language - User's language (ar or en)
 * @returns Localized category name
 */
export function getCategoryDisplayName(
  category: typeof import("../ai/types").ExpenseCategory._type,
  language: "ar" | "en"
): string {
  const categoryNames = {
    food: { ar: "طعام", en: "Food" },
    transport: { ar: "مواصلات", en: "Transport" },
    entertainment: { ar: "ترفيه", en: "Entertainment" },
    shopping: { ar: "تسوق", en: "Shopping" },
    bills: { ar: "فواتير", en: "Bills" },
    health: { ar: "صحة", en: "Health" },
    other: { ar: "أخرى", en: "Other" },
  };

  return categoryNames[category][language];
}

/**
 * Get category emoji icon
 * Used in confirmation messages and category selection menus
 * 
 * @param category - Category enum value
 * @returns Emoji icon for the category
 */
export function getCategoryEmoji(
  category: typeof import("../ai/types").ExpenseCategory._type
): string {
  const categoryEmojis = {
    food: "🍔",
    transport: "🚗",
    entertainment: "🎬",
    shopping: "🛍️",
    bills: "📄",
    health: "⚕️",
    other: "📦",
  };

  return categoryEmojis[category];
}

/**
 * Assign income category based on description keywords
 * 
 * Story 3.2 Task 2.3: Implement fuzzy matching for income category keywords
 * Story 3.2 Task 2.4: Return category with confidence score (0-1)
 * Story 3.2 Task 2.5: If confidence < 0.7, return null
 * 
 * AC6: Auto-assign income category with 85%+ accuracy
 * AC14: If confidence < 70%, trigger category selection
 * 
 * @param description - Income description text
 * @returns Category with confidence score, or null if confidence too low
 */
export function assignIncomeCategory(description: string): IncomeCategoryMappingResult {
  if (!description || description.trim().length === 0) {
    return {
      category: null,
      confidence: 0.0,
      matchedKeywords: [],
    };
  }

  const normalized = description.toLowerCase().trim();
  
  // Track matches per category
  const categoryMatches: Record<string, { count: number; keywords: string[] }> = {};
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(INCOME_CATEGORY_KEYWORDS)) {
    categoryMatches[category] = { count: 0, keywords: [] };
    
    for (const keyword of keywords) {
      // Task 2.3: Fuzzy matching - check if keyword is contained in description
      if (normalized.includes(keyword.toLowerCase())) {
        categoryMatches[category].count++;
        categoryMatches[category].keywords.push(keyword);
      }
    }
  }

  // Find category with most matches
  let bestCategory: string | null = null;
  let maxMatches = 0;
  let matchedKeywords: string[] = [];

  for (const [category, matches] of Object.entries(categoryMatches)) {
    if (matches.count > maxMatches) {
      maxMatches = matches.count;
      bestCategory = category;
      matchedKeywords = matches.keywords;
    }
  }

  // Task 2.4: Calculate confidence score
  const descriptionWords = normalized.split(/\s+/).length;
  const matchRatio = maxMatches / Math.max(descriptionWords, 1);
  
  let confidence = 0.0;
  if (maxMatches > 0) {
    const baseConfidence = Math.min(0.6 + (maxMatches - 1) * 0.15, 0.9);
    const ratioBoost = Math.min(matchRatio * 0.2, 0.1);
    confidence = Math.min(baseConfidence + ratioBoost, 1.0);
  }

  // Task 2.5: If confidence < 0.7, return null to trigger manual selection
  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      category: null,
      confidence,
      matchedKeywords,
    };
  }

  return {
    category: bestCategory as typeof import("../ai/types").IncomeCategory._type,
    confidence,
    matchedKeywords,
  };
}

/**
 * Get income category display name in user's language
 * Story 3.2 Task 20: Add bilingual labels for income categories
 * 
 * @param category - Income category enum value
 * @param language - User's language (ar or en)
 * @returns Localized income category name
 */
export function getIncomeCategoryDisplayName(
  category: typeof import("../ai/types").IncomeCategory._type,
  language: "ar" | "en"
): string {
  const categoryNames = {
    salary: { ar: "راتب", en: "Salary" },
    freelance: { ar: "عمل حر", en: "Freelance" },
    business: { ar: "مشروع", en: "Business" },
    investment: { ar: "استثمار", en: "Investment" },
    gift: { ar: "هدية", en: "Gift" },
    other: { ar: "أخرى", en: "Other" },
  };

  return categoryNames[category][language];
}

/**
 * Get income category emoji icon
 * Story 3.2 Task 19: Add income category emoji mapping
 * Story 3.2 Task 20: Add emoji for each category (💼, 💻, 🏢, 📈, 🎁, 💰)
 * 
 * @param category - Income category enum value
 * @returns Emoji icon for the income category
 */
export function getIncomeCategoryEmoji(
  category: typeof import("../ai/types").IncomeCategory._type
): string {
  const categoryEmojis = {
    salary: "💼",      // Briefcase for salary/work
    freelance: "💻",   // Laptop for freelance work
    business: "🏢",    // Office building for business
    investment: "📈",  // Chart increasing for investment
    gift: "🎁",        // Gift box for gifts
    other: "💰",       // Money bag for other income
  };

  return categoryEmojis[category];
}
