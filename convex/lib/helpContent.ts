/**
 * Help Content Generator
 * 
 * Generates bilingual help messages for /help command.
 * Pure function (no DB calls) for optimal performance (< 1 second target).
 * 
 * AC3: Bilingual Help Content
 * AC4: Arabic Help Message
 * AC5: English Help Message
 * AC7: Help Message Formatting
 */

/**
 * Generate help message in specified language
 * 
 * @param language - User's preferred language ("ar" or "en")
 * @returns Formatted help message with emoji and sections
 * 
 * Performance: Pure function, executes in < 1ms
 */
export function generateHelpMessage(language: "ar" | "en"): string {
  if (language === "ar") {
    return generateArabicHelp();
  } else {
    return generateEnglishHelp();
  }
}

/**
 * Generate Arabic help message
 * 
 * AC4: Arabic help includes available commands, upcoming features, support
 * AC7: Uses emoji for visual hierarchy
 */
function generateArabicHelp(): string {
  return `📚 *مساعدة بوت تتبع المصروفات*

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
ابدأ الآن بإرسال /start لإعداد حسابك!`;
}

/**
 * Generate English help message
 * 
 * AC5: English help mirrors Arabic content
 * AC7: Uses emoji for visual hierarchy
 */
function generateEnglishHelp(): string {
  return `📚 *Finance Tracker Bot Help*

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
Start now by sending /start to set up your account!`;
}
