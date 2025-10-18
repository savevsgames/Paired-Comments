/**
 * Logger - Structured logging with VS Code output channel
 * Provides consistent logging across the extension with user-visible output
 */

import * as vscode from 'vscode';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export class Logger {
  private static instance: Logger | null = null;
  private outputChannel: vscode.OutputChannel;
  private logLevel: LogLevel = 'INFO';

  private constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Paired Comments');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the minimum log level to display
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level set to: ${level}`);
  }

  /**
   * Show the output channel to the user
   */
  public show(): void {
    this.outputChannel.show();
  }

  /**
   * Log a debug message (development only)
   */
  public debug(message: string, context?: unknown): void {
    this.log('DEBUG', message, context);
  }

  /**
   * Log an informational message
   */
  public info(message: string, context?: unknown): void {
    this.log('INFO', message, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: unknown): void {
    this.log('WARN', message, context);
  }

  /**
   * Log an error message
   */
  public error(message: string, error?: unknown): void {
    this.log('ERROR', message, error);

    // Also log to console for development
    if (error instanceof Error) {
      console.error(message, error);
    } else {
      console.error(message, error);
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: unknown): void {
    // Check if this level should be logged
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    this.outputChannel.appendLine(logMessage);

    // Log context if provided
    if (context !== undefined) {
      if (context instanceof Error) {
        this.outputChannel.appendLine(`  Error: ${context.message}`);
        if (context.stack) {
          this.outputChannel.appendLine(`  Stack: ${context.stack}`);
        }
      } else if (typeof context === 'object') {
        try {
          this.outputChannel.appendLine(`  Context: ${JSON.stringify(context, null, 2)}`);
        } catch (error) {
          this.outputChannel.appendLine(`  Context: [Cannot stringify - circular reference]`);
        }
      } else {
        this.outputChannel.appendLine(`  Context: ${String(context)}`);
      }
    }
  }

  /**
   * Check if a message at this level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.outputChannel.dispose();
  }
}

// Export a singleton instance for convenience
export const logger = Logger.getInstance();
