/**
 * Provider Registry - Manages multiple AI providers
 * v2.1.0 - Central registry for AI metadata providers
 */

import { AIMetadataProvider, AIMetadataOperation } from './AIMetadataProvider';
import { logger } from '../utils/Logger';

/**
 * Registry for managing AI metadata providers
 * Supports multiple providers (OpenAI, Anthropic, local models, etc.)
 */
export class ProviderRegistry {
  private providers: Map<string, AIMetadataProvider> = new Map();
  private activeProvider: string | null = null;

  /**
   * Register a new provider
   * @param provider - Provider to register
   */
  register(provider: AIMetadataProvider): void {
    if (this.providers.has(provider.name)) {
      logger.warn(`Provider "${provider.name}" is already registered. Overwriting.`);
    }

    this.providers.set(provider.name, provider);
    logger.info(`Registered AI provider: ${provider.displayName} (${provider.name})`);

    // Set as active if it's the first provider
    if (this.activeProvider === null) {
      this.activeProvider = provider.name;
      logger.info(`Set "${provider.name}" as active provider`);
    }
  }

  /**
   * Unregister a provider
   * @param name - Provider name to unregister
   */
  unregister(name: string): boolean {
    const removed = this.providers.delete(name);

    if (removed) {
      logger.info(`Unregistered AI provider: ${name}`);

      // If active provider was removed, switch to another
      if (this.activeProvider === name) {
        const fallback = this.providers.keys().next().value;
        this.activeProvider = fallback || null;
        if (fallback) {
          logger.info(`Switched active provider to: ${fallback}`);
        }
      }
    }

    return removed;
  }

  /**
   * Get a provider by name
   * @param name - Provider name
   * @returns Provider instance or undefined
   */
  get(name: string): AIMetadataProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get the active provider
   * @returns Active provider or undefined
   */
  getActive(): AIMetadataProvider | undefined {
    if (!this.activeProvider) {
      return undefined;
    }
    return this.providers.get(this.activeProvider);
  }

  /**
   * Set the active provider
   * @param name - Provider name to activate
   * @returns True if provider was activated
   */
  setActive(name: string): boolean {
    if (!this.providers.has(name)) {
      logger.warn(`Cannot set active provider: "${name}" is not registered`);
      return false;
    }

    this.activeProvider = name;
    logger.info(`Switched active provider to: ${name}`);
    return true;
  }

  /**
   * Get all registered providers
   * @returns Array of provider names and display names
   */
  getAll(): Array<{ name: string; displayName: string; isActive: boolean }> {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      displayName: provider.displayName,
      isActive: name === this.activeProvider,
    }));
  }

  /**
   * Find a provider that supports a specific operation
   * @param operation - Operation to check
   * @returns Provider that supports the operation, or undefined
   */
  findForOperation(operation: AIMetadataOperation): AIMetadataProvider | undefined {
    // Try active provider first
    const active = this.getActive();
    if (active && active.supportsOperation(operation)) {
      return active;
    }

    // Fall back to any provider that supports the operation
    for (const provider of this.providers.values()) {
      if (provider.supportsOperation(operation)) {
        logger.info(`Using provider "${provider.name}" for operation: ${operation}`);
        return provider;
      }
    }

    logger.warn(`No provider supports operation: ${operation}`);
    return undefined;
  }

  /**
   * Validate all registered providers
   * @returns Map of provider names to validation results
   */
  async validateAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [name, provider] of this.providers.entries()) {
      try {
        const isValid = await provider.validate();
        results.set(name, isValid);
        logger.info(`Provider "${name}" validation: ${isValid ? 'PASS' : 'FAIL'}`);
      } catch (error) {
        results.set(name, false);
        logger.error(`Provider "${name}" validation error:`, error);
      }
    }

    return results;
  }

  /**
   * Get provider statistics
   * @returns Statistics about registered providers
   */
  getStats(): {
    total: number;
    active: string | null;
    byOperation: Record<AIMetadataOperation, number>;
  } {
    const stats = {
      total: this.providers.size,
      active: this.activeProvider,
      byOperation: {
        analyze_complexity: 0,
        estimate_tokens: 0,
        extract_parameters: 0,
      } as Record<AIMetadataOperation, number>,
    };

    for (const provider of this.providers.values()) {
      for (const operation of provider.supportedOperations) {
        stats.byOperation[operation]++;
      }
    }

    return stats;
  }

  /**
   * Clear all providers
   */
  clear(): void {
    const count = this.providers.size;
    this.providers.clear();
    this.activeProvider = null;
    logger.info(`Cleared ${count} provider(s) from registry`);
  }

  /**
   * Check if registry has any providers
   * @returns True if registry has at least one provider
   */
  hasProviders(): boolean {
    return this.providers.size > 0;
  }

  /**
   * Check if a specific provider is registered
   * @param name - Provider name
   * @returns True if provider is registered
   */
  has(name: string): boolean {
    return this.providers.has(name);
  }
}

/**
 * Singleton instance of provider registry
 */
export const providerRegistry = new ProviderRegistry();
