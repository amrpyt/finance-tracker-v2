/**
 * Date Parser Utility
 * 
 * Story 3.1: AI Expense Logging
 * Task 3: Create Date Parser (AC: #12)
 * 
 * Parses natural language dates in Arabic and English
 * to Unix timestamps for transaction records.
 */

import { 
  subDays, 
  subWeeks, 
  subMonths,
  startOfDay,
  endOfDay,
  previousMonday,
  previousTuesday,
  previousWednesday,
  previousThursday,
  previousFriday,
  previousSaturday,
  previousSunday,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
  isToday,
  isFuture,
} from "date-fns";

/**
 * Parse natural language date to Unix timestamp
 * 
 * Task 3.2: Use date-fns for date calculations
 * Task 3.3: Parse Arabic relative dates
 * Task 3.4: Parse English relative dates
 * Task 3.5: Parse day names
 * Task 3.6: Default to current timestamp if no date mentioned
 * Task 3.7: Return Unix timestamp
 * 
 * AC12: Date Support - Extract dates from natural language
 * 
 * Examples:
 * - "أمس" → yesterday
 * - "اليوم" → today
 * - "الأسبوع اللي فات" → last week (7 days ago)
 * - "يوم الإثنين" → last Monday (or next if today is Monday)
 * - "yesterday" → yesterday
 * - "two days ago" → 2 days ago
 * - "" → current timestamp (default)
 * 
 * @param dateText - Natural language date string (optional)
 * @returns Unix timestamp in milliseconds
 */
export function parseRelativeDate(dateText?: string): number {
  // Task 3.6: Default to current timestamp if no date mentioned
  if (!dateText || dateText.trim().length === 0) {
    return Date.now();
  }

  const normalized = dateText.toLowerCase().trim();
  const now = new Date();

  // Task 3.3: Parse Arabic relative dates
  
  // "اليوم" = today
  if (/(اليوم|النهارده|النهاردة)/i.test(normalized)) {
    return startOfDay(now).getTime();
  }

  // "أمس" = yesterday
  if (/(أمس|امس|إمس|البارحة|البارح)/i.test(normalized)) {
    return startOfDay(subDays(now, 1)).getTime();
  }

  // "أول أمس" / "قبل يومين" = two days ago
  if (/(أول أمس|اول امس|قبل يومين|يومين فاتوا)/i.test(normalized)) {
    return startOfDay(subDays(now, 2)).getTime();
  }

  // "الأسبوع اللي فات" / "الأسبوع الماضي" = last week (7 days ago)
  if (/(الأسبوع اللي فات|الاسبوع اللي فات|الأسبوع الماضي|الاسبوع الماضي|الأسبوع ده|اسبوع فات)/i.test(normalized)) {
    return startOfDay(subWeeks(now, 1)).getTime();
  }

  // "الشهر اللي فات" / "الشهر الماضي" = last month
  if (/(الشهر اللي فات|الشهر الماضي|شهر فات)/i.test(normalized)) {
    return startOfDay(subMonths(now, 1)).getTime();
  }

  // Task 3.5: Parse Arabic day names
  // "يوم الإثنين" = Monday (last or next)
  if (/(الإثنين|الاثنين|اتنين)/i.test(normalized)) {
    return getDayOfWeek(now, "monday");
  }

  if (/(الثلاثاء|الثلاثا|تلات)/i.test(normalized)) {
    return getDayOfWeek(now, "tuesday");
  }

  if (/(الأربعاء|الاربعاء|اربع)/i.test(normalized)) {
    return getDayOfWeek(now, "wednesday");
  }

  if (/(الخميس|خميس)/i.test(normalized)) {
    return getDayOfWeek(now, "thursday");
  }

  if (/(الجمعة|الجمعه|جمعة)/i.test(normalized)) {
    return getDayOfWeek(now, "friday");
  }

  if (/(السبت|سبت)/i.test(normalized)) {
    return getDayOfWeek(now, "saturday");
  }

  if (/(الأحد|الاحد|حد)/i.test(normalized)) {
    return getDayOfWeek(now, "sunday");
  }

  // Task 3.4: Parse English relative dates
  
  // "today" = today
  if (/(today|this day)/i.test(normalized)) {
    return startOfDay(now).getTime();
  }

  // "yesterday" = yesterday
  if (/yesterday/i.test(normalized)) {
    return startOfDay(subDays(now, 1)).getTime();
  }

  // "two days ago", "2 days ago" = 2 days ago
  const daysAgoMatch = normalized.match(/(\d+)\s+days?\s+ago/i);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    return startOfDay(subDays(now, days)).getTime();
  }

  // "last week" = 7 days ago
  if (/(last week|past week|previous week)/i.test(normalized)) {
    return startOfDay(subWeeks(now, 1)).getTime();
  }

  // "last month" = 30 days ago
  if (/(last month|past month|previous month)/i.test(normalized)) {
    return startOfDay(subMonths(now, 1)).getTime();
  }

  // Task 3.5: Parse English day names
  if (/monday/i.test(normalized)) {
    return getDayOfWeek(now, "monday");
  }

  if (/tuesday/i.test(normalized)) {
    return getDayOfWeek(now, "tuesday");
  }

  if (/wednesday/i.test(normalized)) {
    return getDayOfWeek(now, "wednesday");
  }

  if (/thursday/i.test(normalized)) {
    return getDayOfWeek(now, "thursday");
  }

  if (/friday/i.test(normalized)) {
    return getDayOfWeek(now, "friday");
  }

  if (/saturday/i.test(normalized)) {
    return getDayOfWeek(now, "saturday");
  }

  if (/sunday/i.test(normalized)) {
    return getDayOfWeek(now, "sunday");
  }

  // Task 3.6: Default to current timestamp if parsing fails
  return Date.now();
}

/**
 * Get the most recent occurrence of a day of week
 * If today is that day, return today
 * Otherwise, return the previous occurrence
 * 
 * @param referenceDate - Reference date (usually now)
 * @param dayName - Day of week name
 * @returns Unix timestamp for that day
 */
function getDayOfWeek(referenceDate: Date, dayName: string): number {
  const dayFunctions = {
    monday: { prev: previousMonday, next: nextMonday },
    tuesday: { prev: previousTuesday, next: nextTuesday },
    wednesday: { prev: previousWednesday, next: nextWednesday },
    thursday: { prev: previousThursday, next: nextThursday },
    friday: { prev: previousFriday, next: nextFriday },
    saturday: { prev: previousSaturday, next: nextSaturday },
    sunday: { prev: previousSunday, next: nextSunday },
  };

  const functions = dayFunctions[dayName as keyof typeof dayFunctions];
  if (!functions) {
    return Date.now();
  }

  // Get previous occurrence of this day
  const targetDate = functions.prev(referenceDate);
  
  // Check if it's today
  if (isToday(targetDate)) {
    return startOfDay(targetDate).getTime();
  }

  // Return the previous occurrence
  return startOfDay(targetDate).getTime();
}

/**
 * Format Unix timestamp to human-readable date
 * Used in confirmation messages
 * 
 * @param timestamp - Unix timestamp in milliseconds
 * @param language - User's language (ar or en)
 * @returns Formatted date string
 */
export function formatDate(timestamp: number, language: "ar" | "en"): string {
  const date = new Date(timestamp);
  const now = new Date();

  // Check if today
  if (isToday(date)) {
    return language === "ar" ? "اليوم" : "Today";
  }

  // Check if yesterday
  const yesterday = subDays(now, 1);
  if (startOfDay(date).getTime() === startOfDay(yesterday).getTime()) {
    return language === "ar" ? "أمس" : "Yesterday";
  }

  // Format as date string
  if (language === "ar") {
    return date.toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}
