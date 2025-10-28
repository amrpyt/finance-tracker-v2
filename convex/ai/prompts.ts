/**
 * Centralized AI System Prompts and Feature Registry
 * 
 * ADR-004: Single Source of Truth for AI-Visible Features
 * 
 * CRITICAL RULE: Every new feature MUST update FEATURE_REGISTRY before merging
 * 
 * This file prevents recurring issues where:
 * - New features deploy but AI says "under development"
 * - AI prompts become out of sync with actual capabilities
 * - No validation catches discrepancies until production
 * 
 * Historical Issues:
 * - Story 1.1: Account creation not mentioned in prompts
 * - Story 2.5: Delete account said "under development" after deployment
 * - Story 3.1: Expense logging missing from AI feature list
 * 
 * Solution: Single source of truth that generates prompts dynamically
 */

/**
 * Feature Registry
 * 
 * Structure:
 * - category.action: Feature identifier
 * - available: true = deployed and working, false = planned/under development
 * - since: Version when feature was released (story number)
 * - storyId: Reference to story that implemented it
 * - description: User-facing feature description (used in prompts)
 * - planned: Version when feature is planned (only for unavailable features)
 */
export const FEATURE_REGISTRY = {
  accounts: {
    create: {
      available: true,
      since: "1.1",
      storyId: "1.1",
      description: "Create new financial accounts (bank, cash, credit card, digital wallet)",
    },
    view: {
      available: true,
      since: "1.1",
      storyId: "1.1",
      description: "View all accounts with balances and account details",
    },
    edit: {
      available: true,
      since: "2.3",
      storyId: "2.3",
      description: "Edit account name and type",
    },
    delete: {
      available: true,
      since: "2.5",
      storyId: "2.5",
      description: "Delete accounts with transaction validation and confirmation",
    },
    setDefault: {
      available: true,
      since: "2.4",
      storyId: "2.4",
      description: "Set default account for quick transactions",
    },
  },
  expenses: {
    log: {
      available: true,
      since: "3.1",
      storyId: "3.1",
      description: "Log expenses using natural language in Arabic or English with AI parsing",
    },
    edit: {
      available: false,
      planned: "3.3",
      description: "Edit expense amount, category, description (planned)",
    },
    delete: {
      available: false,
      planned: "3.4",
      description: "Delete expense transactions (planned)",
    },
    view: {
      available: false,
      planned: "5.1",
      description: "View expense history and search transactions (planned)",
    },
  },
  income: {
    log: {
      available: true,
      since: "3.2",
      storyId: "3.2",
      description: "Log income transactions with natural language in Arabic or English with AI parsing",
    },
    view: {
      available: false,
      planned: "5.1",
      description: "View income history (planned)",
    },
  },
  budgets: {
    create: {
      available: false,
      planned: "6.1",
      description: "Create monthly budgets by category (planned)",
    },
    view: {
      available: false,
      planned: "6.1",
      description: "View budget progress and alerts (planned)",
    },
  },
  loans: {
    create: {
      available: false,
      planned: "4.1",
      description: "Track loans to friends and family (planned)",
    },
    recordPayment: {
      available: false,
      planned: "4.2",
      description: "Record loan payments (planned)",
    },
    view: {
      available: false,
      planned: "4.3",
      description: "View active loans and payment history (planned)",
    },
  },
  reports: {
    view: {
      available: false,
      planned: "10.1",
      description: "Financial reports and analytics (planned)",
    },
    export: {
      available: false,
      planned: "10.2",
      description: "Export data to CSV/PDF (planned)",
    },
  },
} as const;

/**
 * Generate list of available features for AI system prompts
 * 
 * Returns formatted list of features that ARE currently working
 * Use this in system prompts so AI knows what it can do
 * 
 * @param language - User's language preference (ar or en)
 * @returns Formatted string of available features
 */
export function generateFeatureList(language: "ar" | "en"): string {
  const available = Object.entries(FEATURE_REGISTRY)
    .flatMap(([category, actions]) =>
      Object.entries(actions)
        .filter(([_, info]) => info.available)
        .map(([action, info]) => ({
          category,
          action,
          description: info.description,
          since: info.since,
        }))
    );

  if (language === "ar") {
    return available
      .map(
        (f) =>
          `✅ ${translateFeature(f.description, "ar")} - متاح منذ الإصدار ${f.since}`
      )
      .join("\n");
  } else {
    return available
      .map((f) => `✅ ${f.description} - Available since v${f.since}`)
      .join("\n");
  }
}

/**
 * Generate list of planned features for AI system prompts
 * 
 * Returns formatted list of features that are NOT yet implemented
 * Use this so AI can tell users "coming soon" instead of making up features
 * 
 * @param language - User's language preference (ar or en)
 * @returns Formatted string of planned features
 */
export function generatePlannedFeaturesList(language: "ar" | "en"): string {
  const planned = Object.entries(FEATURE_REGISTRY)
    .flatMap(([category, actions]) =>
      Object.entries(actions)
        .filter(([_, info]) => !info.available && "planned" in info)
        .map(([action, info]) => ({
          category,
          action,
          description: info.description,
          planned: (info as any).planned,
        }))
    );

  if (language === "ar") {
    return planned
      .map(
        (f) =>
          `⏳ ${translateFeature(f.description, "ar")} - مخطط للإصدار ${f.planned}`
      )
      .join("\n");
  } else {
    return planned
      .map((f) => `⏳ ${f.description} - Planned for v${f.planned}`)
      .join("\n");
  }
}

/**
 * Translate feature descriptions to Arabic
 * 
 * Quick translations for common features
 * Expand as needed for new features
 */
function translateFeature(description: string, language: "ar"): string {
  if (language !== "ar") return description;

  const translations: Record<string, string> = {
    "Create new financial accounts (bank, cash, credit card, digital wallet)":
      "إنشاء حسابات مالية جديدة (بنك، نقدية، بطاقة ائتمان، محفظة رقمية)",
    "View all accounts with balances and account details":
      "عرض جميع الحسابات مع الأرصدة والتفاصيل",
    "Edit account name and type": "تعديل اسم الحساب ونوعه",
    "Delete accounts with transaction validation and confirmation":
      "حذف الحسابات مع التحقق من المعاملات والتأكيد",
    "Set default account for quick transactions":
      "تعيين حساب افتراضي للمعاملات السريعة",
    "Log expenses using natural language in Arabic or English with AI parsing":
      "تسجيل المصروفات باللغة الطبيعية (العربية أو الإنجليزية) مع تحليل الذكاء الاصطناعي",
    "Edit expense amount, category, description (planned)":
      "تعديل مبلغ المصروف أو الفئة أو الوصف (مخطط)",
    "Delete expense transactions (planned)": "حذف معاملات المصروفات (مخطط)",
    "View expense history and search transactions (planned)":
      "عرض سجل المصروفات والبحث في المعاملات (مخطط)",
    "Log income transactions with natural language in Arabic or English with AI parsing":
      "تسجيل الإيرادات باللغة الطبيعية بالعربية أو الإنجليزية مع التحليل الذكي",
    "View income history (planned)": "عرض سجل الإيرادات (مخطط)",
    "Create monthly budgets by category (planned)":
      "إنشاء ميزانيات شهرية حسب الفئة (مخطط)",
    "View budget progress and alerts (planned)":
      "عرض تقدم الميزانية والتنبيهات (مخطط)",
    "Track loans to friends and family (planned)":
      "تتبع القروض للأصدقاء والعائلة (مخطط)",
    "Record loan payments (planned)": "تسجيل دفعات القروض (مخطط)",
    "View active loans and payment history (planned)":
      "عرض القروض النشطة وسجل الدفعات (مخطط)",
    "Financial reports and analytics (planned)":
      "التقارير المالية والتحليلات (مخطط)",
    "Export data to CSV/PDF (planned)": "تصدير البيانات إلى CSV/PDF (مخطط)",
  };

  return translations[description] || description;
}

/**
 * Check if a specific feature is available
 * 
 * Use this in code to conditionally enable/disable features
 * 
 * @param category - Feature category (e.g., "expenses")
 * @param action - Feature action (e.g., "log")
 * @returns true if feature is available, false otherwise
 */
export function isFeatureAvailable(
  category: keyof typeof FEATURE_REGISTRY,
  action: string
): boolean {
  const categoryActions = FEATURE_REGISTRY[category] as any;
  if (!categoryActions) return false;

  const feature = categoryActions[action];
  return feature?.available === true;
}

/**
 * Get feature metadata
 * 
 * Returns full feature information for a specific feature
 * Useful for logging, analytics, or conditional logic
 */
export function getFeatureInfo(
  category: keyof typeof FEATURE_REGISTRY,
  action: string
): any {
  const categoryActions = FEATURE_REGISTRY[category] as any;
  return categoryActions?.[action] || null;
}
