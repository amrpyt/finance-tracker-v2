/**
 * Language Constants and Message Templates
 * 
 * Bilingual message templates for Arabic (ar) and English (en).
 * Used throughout the application for user-facing messages.
 * 
 * AC4: Welcome Message Delivery - Bilingual welcome with language prompt
 * AC5: Language Selection UI - Button text
 * AC7: Confirmation Message - Language-specific tutorial
 */

/**
 * Bilingual message templates
 * 
 * Each message has Arabic (ar) and English (en) versions.
 * Welcome message is intentionally bilingual (both languages in one message).
 */
export const MESSAGES = {
  // Bilingual welcome message for new users (AC4)
  // Shows both languages so user can understand before selecting
  WELCOME_NEW_USER: `Welcome to Finance Tracker! 🎉
مرحباً بك في متتبع المصروفات!

Please select your preferred language:
اختر لغتك المفضلة:`,

  // Language selection confirmation messages (AC7)
  LANGUAGE_SELECTED: {
    ar: `✅ تم اختيار اللغة العربية

مرحباً بك! أنا بوت متتبع المصروفات، مساعدك الشخصي لإدارة أموالك 💰

الأوامر المتاحة:
/start - إعادة البدء
/help - عرض المساعدة

🆕 قريباً: تسجيل المصروفات والدخل بالذكاء الاصطناعي`,

    en: `✅ Language set to English

Welcome! I'm your Finance Tracker bot, your personal assistant for managing your money 💰

Available Commands:
/start - Restart
/help - Show help

🆕 Coming Soon: AI-powered expense and income logging`,
  },

  // Welcome back messages for returning users (AC8)
  WELCOME_BACK: {
    ar: `مرحباً بعودتك! 👋

كيف يمكنني مساعدتك اليوم؟

الأوامر المتاحة:
/help - عرض المساعدة`,

    en: `Welcome back! 👋

How can I help you today?

Available Commands:
/help - Show help`,
  },

  // Help messages for /help command (Story 1.4 - AC4, AC5)
  HELP: {
    ar: `📚 *مساعدة بوت تتبع المصروفات*

مرحباً! أنا بوت متتبع المصروفات، مساعدك الشخصي لإدارة أموالك 💰

*الأوامر المتاحة:*
/start - إعادة البدء والتسجيل
/help - عرض هذه المساعدة

🆕 *الميزات القادمة:*
• تسجيل المصروفات والدخل بالذكاء الاصطناعي
• إنشاء حسابات متعددة (بنك، محفظة، بطاقة ائتمان)
• تتبع الميزانيات الشهرية
• أهداف الادخار والتخطيط المالي
• تتبع القروض الشخصية
• تقارير وتحليلات مالية متقدمة

💬 *الدعم والتواصل:*
إذا كان لديك أي استفسارات أو مشاكل، يمكنك التواصل معنا.

🎯 *نصيحة:*
ابدأ الآن بإرسال /start لإعداد حسابك!`,

    en: `📚 *Finance Tracker Bot Help*

Welcome! I'm the Finance Tracker bot, your personal assistant for managing your money 💰

*Available Commands:*
/start - Restart and register
/help - Show this help

🆕 *Coming Soon:*
• AI-powered expense and income logging
• Multiple accounts (bank, wallet, credit card)
• Monthly budget tracking
• Savings goals and financial planning
• Personal loan tracking
• Advanced financial reports and analytics

💬 *Support:*
If you have any questions or issues, feel free to contact us.

🎯 *Tip:*
Start now by sending /start to set up your account!`,
  },
};

/**
 * Language button text for inline keyboard (AC5)
 */
export const LANGUAGE_BUTTONS = {
  ARABIC: {
    text: "العربية 🇸🇦",
    callback_data: "lang_ar",
  },
  ENGLISH: {
    text: "English 🇬🇧",
    callback_data: "lang_en",
  },
};

/**
 * Command constants
 */
export const COMMANDS = {
  START: "/start",
  HELP: "/help",
};

/**
 * Callback query data patterns
 */
export const CALLBACK_PATTERNS = {
  LANGUAGE_PREFIX: "lang_",
  CONFIRM_ACCOUNT_PREFIX: "confirm_account_",
  CANCEL_ACCOUNT_PREFIX: "cancel_account_",
  ACCOUNT_TYPE_PREFIX: "create_account_type_",
  SET_DEFAULT_YES: "set_default_yes_",
  SET_DEFAULT_NO: "set_default_no_",
};

/**
 * Account Types with Labels and Emojis (Story 2.1 - AC2, AC7)
 */
export const ACCOUNT_TYPES = {
  bank: {
    ar: "حساب بنكي",
    en: "Bank Account",
    emoji: "🏦",
  },
  cash: {
    ar: "محفظة نقدية",
    en: "Cash Wallet",
    emoji: "💵",
  },
  credit_card: {
    ar: "بطاقة ائتمان",
    en: "Credit Card",
    emoji: "💳",
  },
  digital_wallet: {
    ar: "محفظة رقمية",
    en: "Digital Wallet",
    emoji: "📱",
  },
} as const;

/**
 * Supported Currencies (Story 2.1 - AC2, AC9)
 */
export const CURRENCIES = {
  EGP: {
    ar: "جنيه مصري",
    en: "Egyptian Pound",
    symbol: "ج.م",
  },
  USD: {
    ar: "دولار أمريكي",
    en: "US Dollar",
    symbol: "$",
  },
  SAR: {
    ar: "ريال سعودي",
    en: "Saudi Riyal",
    symbol: "ر.س",
  },
  EUR: {
    ar: "يورو",
    en: "Euro",
    symbol: "€",
  },
} as const;

/**
 * Account Creation Messages (Story 2.1)
 */
export const ACCOUNT_MESSAGES = {
  // Confirmation message template (AC4)
  CONFIRMATION: {
    ar: (type: string, name: string, balance: number, currency: string) => 
      `📋 *تأكيد إنشاء حساب*\n\n` +
      `النوع: ${ACCOUNT_TYPES[type as keyof typeof ACCOUNT_TYPES]?.emoji} ${ACCOUNT_TYPES[type as keyof typeof ACCOUNT_TYPES]?.ar}\n` +
      `الاسم: ${name}\n` +
      `الرصيد الابتدائي: ${balance} ${currency}\n\n` +
      `هل تريد إنشاء هذا الحساب؟`,
    en: (type: string, name: string, balance: number, currency: string) =>
      `📋 *Confirm Account Creation*\n\n` +
      `Type: ${ACCOUNT_TYPES[type as keyof typeof ACCOUNT_TYPES]?.emoji} ${ACCOUNT_TYPES[type as keyof typeof ACCOUNT_TYPES]?.en}\n` +
      `Name: ${name}\n` +
      `Initial Balance: ${balance} ${currency}\n\n` +
      `Do you want to create this account?`,
  },

  // Success message template (AC7)
  SUCCESS: {
    ar: (type: string, name: string, balance: number, currency: string) =>
      `✅ *تم إنشاء الحساب بنجاح!*\n\n` +
      `${ACCOUNT_TYPES[type as keyof typeof ACCOUNT_TYPES]?.emoji} ${name}\n` +
      `الرصيد الحالي: ${balance} ${currency}`,
    en: (type: string, name: string, balance: number, currency: string) =>
      `✅ *Account Created Successfully!*\n\n` +
      `${ACCOUNT_TYPES[type as keyof typeof ACCOUNT_TYPES]?.emoji} ${name}\n` +
      `Current Balance: ${balance} ${currency}`,
  },

  // Default account prompt (AC6)
  SET_AS_DEFAULT: {
    ar: "هل تريد تعيين هذا الحساب كحساب افتراضي؟",
    en: "Do you want to set this account as default?",
  },

  // Clarification messages (AC13)
  CLARIFICATION: {
    LOW_CONFIDENCE: {
      ar: "عذراً، لم أفهم طلبك. هل تريد إنشاء حساب جديد؟",
      en: "Sorry, I didn't understand. Do you want to create a new account?",
    },
    SELECT_TYPE: {
      ar: "ما نوع الحساب الذي تريد إنشاءه؟",
      en: "What type of account do you want to create?",
    },
    ENTER_BALANCE: {
      ar: "أدخل الرصيد الابتدائي (أو اكتب 0 إذا كان الحساب فارغاً):",
      en: "Enter the initial balance (or type 0 if the account is empty):",
    },
  },

  // Error messages (AC13, AC14)
  ERRORS: {
    GENERAL: {
      ar: "عذراً، حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى.",
      en: "Sorry, an error occurred while processing your request. Please try again.",
    },
    CONFIRMATION_EXPIRED: {
      ar: "⏰ انتهت صلاحية التأكيد. أرسل طلبك مرة أخرى.",
      en: "⏰ Confirmation expired. Please send your request again.",
    },
    DUPLICATE_NAME: {
      ar: (name: string) => `❌ يوجد حساب بنفس الاسم "${name}". اختر اسماً مختلفاً.`,
      en: (name: string) => `❌ An account with the name "${name}" already exists. Choose a different name.`,
    },
  },

  // Accounts overview template (AC7)
  OVERVIEW_HEADER: {
    ar: "\n\n📊 *حساباتك:*",
    en: "\n\n📊 *Your Accounts:*",
  },
  OVERVIEW_TOTAL: {
    ar: (total: number, currency: string) => `\n\n💰 *إجمالي الرصيد:* ${total} ${currency}`,
    en: (total: number, currency: string) => `\n\n💰 *Total Balance:* ${total} ${currency}`,
  },
};

/**
 * Inline Keyboard Button Labels (Story 2.1)
 */
export const BUTTON_LABELS = {
  CONFIRM: {
    ar: "تأكيد ✅",
    en: "Confirm ✅",
  },
  CANCEL: {
    ar: "إلغاء ❌",
    en: "Cancel ❌",
  },
  YES: {
    ar: "نعم",
    en: "Yes",
  },
  NO: {
    ar: "لا",
    en: "No",
  },
};
