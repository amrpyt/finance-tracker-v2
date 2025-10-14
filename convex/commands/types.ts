/**
 * Command Handler Types
 * 
 * Defines the interface for command handlers in the plugin pattern.
 * Each command handler is a self-contained module that processes a specific command.
 */

import type { ExtractedUserData } from "../telegram/types";

/**
 * Command Handler Context
 * Provides access to Convex runtime for database and actions
 */
export interface CommandHandlerContext {
  runQuery: (query: any, args?: any) => Promise<any>;
  runMutation: (mutation: any, args?: any) => Promise<any>;
  runAction: (action: any, args?: any) => Promise<any>;
}

/**
 * Command Handler Interface
 * All command handlers must implement this interface
 */
export interface CommandHandler {
  /**
   * Execute the command
   * 
   * @param ctx - Convex runtime context for database/action access
   * @param userData - Extracted Telegram user data
   * @param chatId - Telegram chat ID for sending responses
   * @param messageText - Full message text (for parameter extraction)
   * @returns Promise that resolves when command is complete
   */
  execute(
    ctx: CommandHandlerContext,
    userData: ExtractedUserData,
    chatId: number,
    messageText: string
  ): Promise<void>;
}
