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
  // Updated: Story 2.4 - AC20 (Set default account documentation)
  // Updated: Story 3.1 - AC1 (Expense logging documentation)
  HELP: {
    ar: `📚 *مساعدة بوت تتبع المصروفات*

مرحباً! أنا بوت متتبع المصروفات، مساعدك الشخصي لإدارة أموالك 💰

*الأوامر المتاحة:*
/start - إعادة البدء والتسجيل
/help - عرض هذه المساعدة

✅ *إدارة الحسابات:*
• "أنشئ حساب محفظة برصيد 500 جنيه" - إنشاء حساب جديد
• "أرني حساباتي" - عرض جميع الحسابات مع الأرصدة
• "عدل حساب المحفظة" - تعديل اسم أو نوع الحساب
• "اجعل الحساب الافتراضي" - تعيين حساب افتراضي ⭐
• "غير الحساب الافتراضي" - تغيير الحساب الافتراضي
• "احذف حساب المحفظة" - حذف حساب (مع الاحتفاظ بسجل المعاملات)

💰 *تسجيل المصروفات (جديد):*
سجل مصروفاتك بلغة طبيعية - الذكاء الاصطناعي يفهمك!

*أمثلة:*
• "دفعت 50 جنيه على القهوة" 🍔
• "صرفت 100 على المواصلات" 🚗
• "اشتريت ملابس ب 200 جنيه" 🛍️
• "أمس دفعت 75 على الغداء"
• "الأسبوع اللي فات صرفت 500 على تسوق"

*المرونة في التعبير:*
استخدم أي أسلوب تفضله - "دفعت"، "صرفت"، "اشتريت"، "دفعت فلوس" - كلها تعمل! 🎯

*سير العمل:*
1️⃣ اكتب المصروف بلغة طبيعية
2️⃣ الذكاء الاصطناعي يستخرج المبلغ والفئة والوصف
3️⃣ تراجع التفاصيل وتؤكد أو تلغي
4️⃣ يُحدَّث رصيد حسابك فوراً

💡 *الحساب الافتراضي:*
الحساب الافتراضي يُستخدم تلقائياً عند تسجيل المعاملات دون تحديد حساب. يظهر بعلامة ⭐ في جميع القوائم.

💡 *حذف الحسابات:*
عند حذف حساب، يتم إخفاؤه من القائمة مع الاحتفاظ بجميع معاملاته للرجوع إليها. لا يمكن حذف آخر حساب أو الحساب الافتراضي.

❓ *كيف أسجل مصروف؟*
ببساطة اكتب مثل: "دفعت 30 جنيه على تاكسي" - والذكاء الاصطناعي يتولى الباقي! 🚀

💰 *تسجيل الدخل (جديد):*
سجل دخلك بلغة طبيعية - الذكاء الاصطناعي يفهمك!

*أمثلة:*
• "استلمت راتب 5000 جنيه" 💼
• "حصلت على 200 من عمل حر" 💻
• "جاني 1000 من مشروع" 🏢
• "أمس استلمت 300 هدية" 🎁
• "قبضت أرباح 500 من استثمار" 📈

*المرونة في التعبير:*
استخدم أي أسلوب تفضله - "استلمت"، "قبضت"، "حصلت على"، "جاني" - كلها تعمل! 🎯

❓ *كيف أسجل دخل؟*
ببساطة اكتب مثل: "استلمت راتب 5000 جنيه" - والذكاء الاصطناعي يتولى الباقي! 🚀

🆕 *الميزات القادمة:*
• تتبع الميزانيات الشهرية
• أهداف الادخار والتخطيط المالي
• تتبع القروض الشخصية
• تقارير وتحليلات مالية متقدمة

💬 *الدعم والتواصل:*
إذا كان لديك أي استفسارات أو مشاكل، يمكنك التواصل معنا.

🎯 *نصيحة:*
ابدأ بإنشاء حسابك الأول! سيصبح افتراضياً تلقائياً، ثم جرب تسجيل أول مصروف.`,

    en: `📚 *Finance Tracker Bot Help*

Welcome! I'm the Finance Tracker bot, your personal assistant for managing your money 💰

*Available Commands:*
/start - Restart and register
/help - Show this help

✅ *Account Management:*
• "Create cash account with 500 EGP" - Create new account
• "Show my accounts" - View all accounts with balances
• "Edit wallet account" - Edit account name or type
• "Set default account" - Set a default account ⭐
• "Change default account" - Change the default account
• "Delete wallet account" - Delete account (preserves transaction history)

💰 *Expense Logging (NEW):*
Log your expenses in natural language - AI understands you!

*Examples:*
• "spent 20 on coffee" 🍔
• "paid 50 for lunch" 🚗
• "bought clothes for 200" 🛍️
• "yesterday paid 75 for dinner"
• "last week spent 500 on shopping"

*Flexible Expression:*
Use any phrasing you prefer - "spent", "paid", "bought", "paid for" - they all work! 🎯

*Confirmation Workflow:*
1️⃣ Write your expense in natural language
2️⃣ AI extracts amount, category, and description
3️⃣ Review details and confirm or cancel
4️⃣ Your account balance updates instantly

💡 *Default Account:*
The default account is automatically used when logging transactions without specifying an account. It's marked with ⭐ in all lists.

💡 *Deleting Accounts:*
When you delete an account, it's hidden from the list while preserving all its transactions for reference. You cannot delete your last account or the default account.

❓ *How do I log an expense?*
Simply write something like: "spent 30 on taxi" - and AI handles the rest! 🚀

💰 *Income Logging (NEW):*
Log your income in natural language - AI understands you!

*Examples:*
• "received 500 freelance payment" 💻
• "got paid 1000 salary" 💼
• "earned 200 from business" 🏢
• "yesterday received 300 gift" 🎁
• "got dividend 150 from investment" 📈

*Flexible Expression:*
Use any phrasing you prefer - "received", "got paid", "earned", "got money" - they all work! 🎯

❓ *How do I log income?*
Simply write something like: "received 500 freelance payment" - and AI handles the rest! 🚀

🆕 *Coming Soon:*
• Monthly budget tracking
• Savings goals and financial planning
• Personal loan tracking
• Advanced financial reports and analytics

💬 *Support:*
If you have any questions or issues, feel free to contact us.

🎯 *Tip:*
Start by creating your first account! It will automatically become your default, then try logging your first expense.`,
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
 * Callback query data patterns (Story 3.1, 3.2)
 */
export const CALLBACK_PATTERNS = {
  LANGUAGE_PREFIX: "lang_",
  CONFIRM_ACCOUNT_PREFIX: "confirm_account_",
  CANCEL_ACCOUNT_PREFIX: "cancel_account_",
  ACCOUNT_TYPE_PREFIX: "create_account_type_",
  SET_DEFAULT_YES: "set_default_yes_",
  SET_DEFAULT_NO: "set_default_no_",
  // Story 3.1: Expense logging callbacks (Task 10-12)
  CONFIRM_EXPENSE_PREFIX: "confirm_expense_",
  EDIT_EXPENSE_PREFIX: "edit_expense_",
  CANCEL_EXPENSE_PREFIX: "cancel_expense_",
  SELECT_ACCOUNT_EXPENSE_PREFIX: "select_account_expense_",
  EDIT_EXPENSE_AMOUNT_PREFIX: "edit_expense_amount_",
  EDIT_EXPENSE_CATEGORY_PREFIX: "edit_expense_category_",
  EDIT_EXPENSE_DESCRIPTION_PREFIX: "edit_expense_description_",
  EDIT_EXPENSE_ACCOUNT_PREFIX: "edit_expense_account_",
  BACK_TO_CONFIRMATION_PREFIX: "back_to_confirmation_",
  // Story 3.2: Income logging callbacks (Task 19)
  CONFIRM_INCOME: "confirm_income_",
  CANCEL_INCOME: "cancel_income_",
  SELECT_ACCOUNT_INCOME: "select_account_income_",
} as const;

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
 * Inline Keyboard Button Labels (Story 2.1, 2.2)
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
  ADD_ACCOUNT: {
    ar: "➕ إضافة حساب",
    en: "➕ Add Account",
  },
  EDIT_ACCOUNT: {
    ar: "✏️ تعديل",
    en: "✏️ Edit",
  },
  REFRESH_ACCOUNTS: {
    ar: "🔄 تحديث",
    en: "🔄 Refresh",
  },
};

/**
 * Income Category Emoji Mapping (Story 3.2 Task 19.5)
 * Task 20: Add emoji for each category (💼, 💻, 🏢, 📈, 🎁, 💰)
 */
export const INCOME_CATEGORY_EMOJI = {
  salary: "💼",      // Briefcase for salary/work
  freelance: "💻",   // Laptop for freelance work
  business: "🏢",    // Office building for business
  investment: "📈",  // Chart increasing for investment
  gift: "🎁",        // Gift box for gifts
  other: "💰",       // Money bag for other income
} as const;
