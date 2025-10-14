/**
 * Command Registry
 * 
 * Central registry for all bot commands using plugin pattern.
 * To add a new command:
 * 1. Create handler class implementing CommandHandler interface
 * 2. Add command type to CommandType in commandRouter.ts
 * 3. Register handler in commandRegistry below
 * 
 * This pattern keeps webhook.ts lean and makes commands independently testable.
 */

import type { CommandHandler } from "./types";
import type { CommandType } from "../lib/commandRouter";
import { StartCommandHandler } from "./startCommand";
import { HelpCommandHandler } from "./helpCommand";

/**
 * Command Registry
 * Maps command types to their handler instances
 */
export const commandRegistry: Record<Exclude<CommandType, null>, CommandHandler> = {
  start: new StartCommandHandler(),
  help: new HelpCommandHandler(),
};

/**
 * Get command handler for a given command type
 * 
 * @param commandType - Command type from detectCommand()
 * @returns Handler instance or undefined if not registered
 */
export function getCommandHandler(commandType: CommandType): CommandHandler | undefined {
  if (!commandType) {
    return undefined;
  }
  
  return commandRegistry[commandType];
}
