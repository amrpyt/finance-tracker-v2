/**
 * Command Router Utility
 * 
 * Detects and parses bot commands from user messages.
 * Supports case-insensitive matching and future command parameters.
 * 
 * AC1: /start Command Recognition - Detects /start from incoming messages
 */

import { COMMANDS } from "./constants";

export type CommandType = "start" | "help" | "view_accounts" | "edit_account" | "set_default_account" | "delete_account" | null;

/**
 * Detect command from message text
 * 
 * @param text - Message text from user
 * @returns Command type or null if no command detected
 * 
 * Examples:
 * - "/start" → "start"
 * - "/START" → "start" (case-insensitive)
 * - "/help" → "help"
 * - "hello" → null (not a command)
 * - undefined → null (no text)
 */
export function detectCommand(text: string | undefined): CommandType {
  if (!text) {
    return null;
  }

  // Normalize to lowercase for case-insensitive matching
  const normalized = text.trim().toLowerCase();

  // Match /start command
  if (normalized === COMMANDS.START.toLowerCase() || normalized.startsWith("/start ")) {
    return "start";
  }

  // Match /help command
  if (normalized === COMMANDS.HELP.toLowerCase() || normalized.startsWith("/help ")) {
    return "help";
  }

  // No command detected
  return null;
}

/**
 * Extract command parameters (future-proof for commands with arguments)
 * 
 * @param text - Message text
 * @returns Array of parameters after command
 * 
 * Example:
 * - "/start referral123" → ["referral123"]
 * - "/start" → []
 */
export function extractCommandParams(text: string): string[] {
  const parts = text.trim().split(/\s+/);
  
  // Remove command (first element) and return remaining parts
  return parts.slice(1);
}
