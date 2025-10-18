/**
 * AI Metadata Service - High-level facade for AI-powered metadata generation
 * v2.1.0 - Service layer for extension integration
 */

import {
  AIMetadataRequest,
  AIMetadataResponse,
  ComplexityAnalysis,
  TokenEstimation,
  ExtractedParameters,
} from './AIMetadataProvider';
import { providerRegistry } from './ProviderRegistry';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { aiConfig } from '../config/AIConfig';
import { logger } from '../utils/Logger';

/**
 * Cache entry for AI responses
 */
interface CacheEntry {
  response: AIMetadataResponse;
  timestamp: number;
}

/**
 * AI Metadata Service
 * High-level API for AI-powered metadata generation
 */
export class AIMetadataService {
  private cache: Map<string, CacheEntry> = new Map();
  private initialized = false;

  /**
   * Initialize the AI metadata service
   * Loads configuration and registers providers
   */
  async initialize(workspaceRoot?: string): Promise<void> {
    if (this.initialized) {
      logger.debug('AIMetadataService already initialized');
      return;
    }

    logger.info('Initializing AI Metadata Service...');

    // Load configuration
    await aiConfig.load(workspaceRoot);

    // Check if AI is enabled
    if (!aiConfig.isEnabled()) {
      logger.info('AI features are disabled in settings');
      this.initialized = true;
      return;
    }

    // Register OpenAI provider
    const openaiConfig = aiConfig.getOpenAIConfig();
    if (openaiConfig.apiKey) {
      const openaiProvider = new OpenAIProvider(openaiConfig);
      providerRegistry.register(openaiProvider);
      logger.info('Registered OpenAI provider');
    } else {
      logger.warn('OpenAI API key not found. Set OPENAI_API_KEY in .env or VS Code settings.');
    }

    // Set active provider
    const defaultProvider = aiConfig.getDefaultProvider();
    if (providerRegistry.has(defaultProvider)) {
      providerRegistry.setActive(defaultProvider);
    }

    // Validate providers
    const validation = await providerRegistry.validateAll();
    for (const [name, isValid] of validation) {
      if (!isValid) {
        logger.warn(`Provider "${name}" validation failed`);
      }
    }

    this.initialized = true;
    logger.info('AI Metadata Service initialized successfully');
  }

  /**
   * Analyze code complexity
   * @param code - Source code to analyze
   * @param language - Programming language
   * @param options - Additional options
   * @returns Complexity analysis or null if AI is disabled
   */
  async analyzeComplexity(
    code: string,
    language: string,
    options?: {
      filePath?: string;
      lineNumber?: number;
      useCache?: boolean;
    }
  ): Promise<ComplexityAnalysis | null> {
    if (!this.isAvailable()) {
      return this.fallbackComplexity(code);
    }

    const request: AIMetadataRequest = {
      operation: 'analyze_complexity',
      code,
      language,
      context: {
        filePath: options?.filePath,
        lineNumber: options?.lineNumber,
      },
    };

    const response = await this.processRequest(request, options?.useCache ?? true);

    if (response.success && response.data) {
      return response.data as ComplexityAnalysis;
    }

    logger.warn('Complexity analysis failed, using fallback', response.error);
    return this.fallbackComplexity(code);
  }

  /**
   * Estimate token count
   * @param code - Source code to estimate
   * @param language - Programming language
   * @param options - Additional options
   * @returns Token estimation or null if AI is disabled
   */
  async estimateTokens(
    code: string,
    language: string,
    options?: {
      filePath?: string;
      useCache?: boolean;
    }
  ): Promise<TokenEstimation | null> {
    if (!this.isAvailable()) {
      return this.fallbackTokenEstimation(code);
    }

    const request: AIMetadataRequest = {
      operation: 'estimate_tokens',
      code,
      language,
      context: {
        filePath: options?.filePath,
      },
    };

    const response = await this.processRequest(request, options?.useCache ?? true);

    if (response.success && response.data) {
      return response.data as TokenEstimation;
    }

    logger.warn('Token estimation failed, using fallback', response.error);
    return this.fallbackTokenEstimation(code);
  }

  /**
   * Extract parameters from code
   * @param code - Source code to analyze
   * @param language - Programming language
   * @param options - Additional options
   * @returns Extracted parameters or null if AI is disabled
   */
  async extractParameters(
    code: string,
    language: string,
    options?: {
      filePath?: string;
      lineNumber?: number;
      useCache?: boolean;
    }
  ): Promise<ExtractedParameters | null> {
    if (!this.isAvailable()) {
      return this.fallbackParameterExtraction(code, language);
    }

    const request: AIMetadataRequest = {
      operation: 'extract_parameters',
      code,
      language,
      context: {
        filePath: options?.filePath,
        lineNumber: options?.lineNumber,
      },
    };

    const response = await this.processRequest(request, options?.useCache ?? true);

    if (response.success && response.data) {
      return response.data as ExtractedParameters;
    }

    logger.warn('Parameter extraction failed, using fallback', response.error);
    return this.fallbackParameterExtraction(code, language);
  }

  /**
   * Process an AI metadata request
   * @param request - The request to process
   * @param useCache - Whether to use cache
   * @returns AI response
   */
  private async processRequest(
    request: AIMetadataRequest,
    useCache: boolean
  ): Promise<AIMetadataResponse> {
    // Check cache
    if (useCache && aiConfig.getSettings().cacheEnabled) {
      const cacheKey = this.getCacheKey(request);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for ${request.operation}`);
        return cached;
      }
    }

    // Find provider for operation
    const provider = providerRegistry.findForOperation(request.operation);
    if (!provider) {
      return {
        success: false,
        operation: request.operation,
        error: {
          code: 'NO_PROVIDER',
          message: `No provider available for operation: ${request.operation}`,
          recoverable: false,
        },
        metadata: {
          provider: 'none',
          model: 'none',
          latencyMs: 0,
        },
      };
    }

    // Process request
    const response = await provider.process(request);

    // Cache successful responses
    if (response.success && useCache && aiConfig.getSettings().cacheEnabled) {
      const cacheKey = this.getCacheKey(request);
      this.addToCache(cacheKey, response);
    }

    return response;
  }

  /**
   * Check if AI metadata service is available
   * @returns True if service is initialized and has providers
   */
  isAvailable(): boolean {
    return this.initialized && aiConfig.isEnabled() && providerRegistry.hasProviders();
  }

  /**
   * Get service statistics
   * @returns Service statistics
   */
  getStats(): {
    initialized: boolean;
    enabled: boolean;
    providersCount: number;
    cacheSize: number;
    cacheHitRate: number;
  } {
    return {
      initialized: this.initialized,
      enabled: aiConfig.isEnabled(),
      providersCount: providerRegistry.getStats().total,
      cacheSize: this.cache.size,
      cacheHitRate: 0, // TODO: Track cache hits/misses
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('AI response cache cleared');
  }

  /**
   * Generate cache key for request
   */
  private getCacheKey(request: AIMetadataRequest): string {
    return `${request.operation}:${request.language}:${request.code.substring(0, 100)}`;
  }

  /**
   * Get response from cache
   */
  private getFromCache(key: string): AIMetadataResponse | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    const ttl = aiConfig.getSettings().cacheTTL;
    if (Date.now() - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  /**
   * Add response to cache
   */
  private addToCache(key: string, response: AIMetadataResponse): void {
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
    });
  }

  /**
   * Fallback complexity analysis (local calculation)
   */
  private fallbackComplexity(code: string): ComplexityAnalysis {
    // Simple heuristic: count control flow statements
    const controlFlowKeywords = /\b(if|else|for|while|switch|case|catch|&&|\|\|)\b/g;
    const matches = code.match(controlFlowKeywords);
    const cyclomatic = (matches?.length || 0) + 1;

    return {
      cyclomatic,
      cognitive: cyclomatic, // Same as cyclomatic for fallback
      maintainability: Math.max(0, Math.min(100, 100 - cyclomatic * 2)),
      explanation: 'Heuristic calculation (AI unavailable)',
      confidence: 0.5,
    };
  }

  /**
   * Fallback token estimation (chars / 4)
   */
  private fallbackTokenEstimation(code: string): TokenEstimation {
    const heuristic = Math.ceil(code.length / 4);

    return {
      heuristic,
      validated: heuristic,
      confidence: 0.6,
    };
  }

  /**
   * Fallback parameter extraction (simple regex)
   */
  private fallbackParameterExtraction(code: string, _language: string): ExtractedParameters {
    // Very simple function name extraction
    const functionMatch = code.match(/function\s+(\w+)|(\w+)\s*\(|def\s+(\w+)|fn\s+(\w+)/);
    const name = functionMatch?.[1] || functionMatch?.[2] || functionMatch?.[3] || functionMatch?.[4] || 'unknown';

    return {
      name,
      kind: 'function',
      parameters: [],
      lineCount: code.split('\n').length,
      confidence: 0.4,
    };
  }
}

/**
 * Singleton instance of AI metadata service
 */
export const aiMetadataService = new AIMetadataService();
