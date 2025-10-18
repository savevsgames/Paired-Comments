/**
 * AI Configuration - Load AI provider settings from .env and VS Code settings
 * v2.1.0 - Configuration management for AI metadata system
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ProviderConfig } from '../ai/AIMetadataProvider';
import { logger } from '../utils/Logger';

/**
 * AI Configuration Manager
 * Loads configuration from .env file and VS Code settings
 */
export class AIConfig {
  private envConfig: Map<string, string> = new Map();
  private loaded = false;

  /**
   * Load configuration from .env file
   * @param workspaceRoot - Workspace root directory
   */
  async load(workspaceRoot?: string): Promise<void> {
    if (this.loaded) {
      logger.debug('AIConfig already loaded');
      return;
    }

    // Try to load .env file
    if (workspaceRoot) {
      const envPath = path.join(workspaceRoot, '.env');
      if (fs.existsSync(envPath)) {
        try {
          const envContent = fs.readFileSync(envPath, 'utf8');
          this.parseEnv(envContent);
          logger.info(`Loaded .env file from: ${envPath}`);
        } catch (error) {
          logger.warn(`Failed to load .env file: ${error}`);
        }
      } else {
        logger.debug(`.env file not found at: ${envPath}`);
      }
    }

    this.loaded = true;
  }

  /**
   * Parse .env file content
   * @param content - .env file content
   */
  private parseEnv(content: string): void {
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Parse KEY=VALUE pairs
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1]?.trim();
        let value = match[2]?.trim();

        if (key && value) {
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }

          this.envConfig.set(key, value);
        }
      }
    }

    logger.debug(`Parsed ${this.envConfig.size} environment variables`);
  }

  /**
   * Get environment variable
   * @param key - Environment variable key
   * @returns Value or undefined
   */
  getEnv(key: string): string | undefined {
    // Try .env file first
    const envValue = this.envConfig.get(key);
    if (envValue) {
      return envValue;
    }

    // Fall back to process.env
    return process.env[key];
  }

  /**
   * Get provider configuration for OpenAI
   * @returns OpenAI provider configuration
   */
  getOpenAIConfig(): ProviderConfig {
    const config = vscode.workspace.getConfiguration('pairedComments.ai.openai');

    return {
      apiKey: this.getEnv('OPENAI_API_KEY') || config.get<string>('apiKey'),
      baseUrl: config.get<string>('baseUrl'),
      model: config.get<string>('model') || 'gpt-4',
      timeout: config.get<number>('timeout') || 30000,
      maxRetries: config.get<number>('maxRetries') || 3,
      options: config.get<Record<string, unknown>>('options') || {},
    };
  }

  /**
   * Get provider configuration for Anthropic (future)
   * @returns Anthropic provider configuration
   */
  getAnthropicConfig(): ProviderConfig {
    const config = vscode.workspace.getConfiguration('pairedComments.ai.anthropic');

    return {
      apiKey: this.getEnv('ANTHROPIC_API_KEY') || config.get<string>('apiKey'),
      baseUrl: config.get<string>('baseUrl'),
      model: config.get<string>('model') || 'claude-3-opus-20240229',
      timeout: config.get<number>('timeout') || 30000,
      maxRetries: config.get<number>('maxRetries') || 3,
      options: config.get<Record<string, unknown>>('options') || {},
    };
  }

  /**
   * Get provider configuration by name
   * @param provider - Provider name
   * @returns Provider configuration
   */
  getProviderConfig(provider: string): ProviderConfig {
    switch (provider.toLowerCase()) {
      case 'openai':
        return this.getOpenAIConfig();
      case 'anthropic':
        return this.getAnthropicConfig();
      default:
        logger.warn(`Unknown provider: ${provider}`);
        return {};
    }
  }

  /**
   * Get general AI settings
   * @returns AI settings
   */
  getSettings(): {
    enabled: boolean;
    defaultProvider: string;
    cacheEnabled: boolean;
    cacheTTL: number;
  } {
    const config = vscode.workspace.getConfiguration('pairedComments.ai');

    return {
      enabled: config.get<boolean>('enabled') ?? true,
      defaultProvider: config.get<string>('defaultProvider') ?? 'openai',
      cacheEnabled: config.get<boolean>('cacheEnabled') ?? true,
      cacheTTL: config.get<number>('cacheTTL') ?? 3600000, // 1 hour
    };
  }

  /**
   * Check if AI features are enabled
   * @returns True if AI features are enabled
   */
  isEnabled(): boolean {
    return this.getSettings().enabled;
  }

  /**
   * Get default provider name
   * @returns Default provider name
   */
  getDefaultProvider(): string {
    return this.getSettings().defaultProvider;
  }

  /**
   * Validate configuration for a provider
   * @param provider - Provider name
   * @returns Validation result with missing requirements
   */
  validate(provider: string): {
    valid: boolean;
    missing: string[];
  } {
    const config = this.getProviderConfig(provider);
    const missing: string[] = [];

    // Check required fields
    if (!config.apiKey) {
      missing.push(`${provider.toUpperCase()}_API_KEY`);
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Reload configuration
   * @param workspaceRoot - Workspace root directory
   */
  async reload(workspaceRoot?: string): Promise<void> {
    this.loaded = false;
    this.envConfig.clear();
    await this.load(workspaceRoot);
  }
}

/**
 * Singleton instance of AI configuration
 */
export const aiConfig = new AIConfig();
