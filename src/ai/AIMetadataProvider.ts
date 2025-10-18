/**
 * AI Metadata Provider - Abstract interface for AI-powered metadata generation
 * v2.1.0 - Multi-provider abstraction layer
 *
 * Strategic approach: Build extension feature FIRST, validate with users, then extract to MCP
 */

/**
 * Supported AI operations for metadata generation
 */
export type AIMetadataOperation =
  | 'analyze_complexity'    // Cyclomatic + cognitive complexity analysis
  | 'estimate_tokens'       // Token count estimation for LLM context
  | 'extract_parameters';   // Extract function/class parameters and context

/**
 * Request to AI provider for metadata generation
 */
export interface AIMetadataRequest {
  /** The operation to perform */
  operation: AIMetadataOperation;

  /** Source code to analyze */
  code: string;

  /** Programming language */
  language: string;

  /** Optional context for better analysis */
  context?: {
    /** File path for reference */
    filePath?: string;

    /** Surrounding code for context */
    surroundingCode?: string;

    /** Line number in file */
    lineNumber?: number;
  };
}

/**
 * Complexity analysis result
 */
export interface ComplexityAnalysis {
  /** Cyclomatic complexity (local calculation) */
  cyclomatic: number;

  /** Cognitive complexity (AI-validated) */
  cognitive: number;

  /** Maintainability index (0-100, higher is better) */
  maintainability: number;

  /** Complexity explanation */
  explanation: string;

  /** Confidence level (0-1) */
  confidence: number;
}

/**
 * Token estimation result
 */
export interface TokenEstimation {
  /** Estimated token count (heuristic) */
  heuristic: number;

  /** AI-validated token count */
  validated: number;

  /** Token breakdown by component */
  breakdown?: {
    code: number;
    comments: number;
    whitespace: number;
  };

  /** Confidence level (0-1) */
  confidence: number;
}

/**
 * Extracted parameters from code
 */
export interface ExtractedParameters {
  /** Function/class name */
  name: string;

  /** Symbol kind (function, class, method, etc.) */
  kind: string;

  /** Parameter names and types */
  parameters: Array<{
    name: string;
    type?: string;
    optional?: boolean;
    defaultValue?: string;
  }>;

  /** Return type (if available) */
  returnType?: string;

  /** Line count */
  lineCount: number;

  /** Complexity score (quick estimate) */
  complexity?: number;

  /** Confidence level (0-1) */
  confidence: number;
}

/**
 * Response from AI provider
 */
export interface AIMetadataResponse {
  /** Whether the operation succeeded */
  success: boolean;

  /** The operation that was performed */
  operation: AIMetadataOperation;

  /** Operation-specific data */
  data?: ComplexityAnalysis | TokenEstimation | ExtractedParameters;

  /** Error information (if failed) */
  error?: {
    /** Error code */
    code: string;

    /** Human-readable error message */
    message: string;

    /** Whether the error is recoverable */
    recoverable: boolean;

    /** Suggested retry delay (ms) */
    retryAfter?: number;
  };

  /** Metadata about the request */
  metadata: {
    /** Provider name (e.g., "openai", "anthropic") */
    provider: string;

    /** Model used (e.g., "gpt-4", "claude-3-opus") */
    model: string;

    /** Request latency in milliseconds */
    latencyMs: number;

    /** Tokens used (if applicable) */
    tokensUsed?: number;

    /** Cost in USD (if available) */
    cost?: number;
  };
}

/**
 * Abstract AI Metadata Provider
 * Implement this interface to add new AI providers (OpenAI, Anthropic, local models, etc.)
 */
export abstract class AIMetadataProvider {
  /** Provider name (e.g., "openai", "anthropic") */
  abstract readonly name: string;

  /** Provider display name */
  abstract readonly displayName: string;

  /** Supported operations */
  abstract readonly supportedOperations: AIMetadataOperation[];

  /**
   * Process an AI metadata request
   * @param request - The metadata request
   * @returns Response with generated metadata
   */
  abstract process(request: AIMetadataRequest): Promise<AIMetadataResponse>;

  /**
   * Validate provider configuration
   * @returns True if provider is properly configured
   */
  abstract validate(): Promise<boolean>;

  /**
   * Get configuration requirements
   * @returns List of required configuration keys
   */
  abstract getConfigRequirements(): string[];

  /**
   * Check if provider supports an operation
   * @param operation - Operation to check
   * @returns True if supported
   */
  supportsOperation(operation: AIMetadataOperation): boolean {
    return this.supportedOperations.includes(operation);
  }
}

/**
 * Provider configuration from .env or VS Code settings
 */
export interface ProviderConfig {
  /** API key or authentication token */
  apiKey?: string;

  /** API base URL (for self-hosted or custom endpoints) */
  baseUrl?: string;

  /** Default model to use */
  model?: string;

  /** Request timeout in milliseconds */
  timeout?: number;

  /** Maximum retries for failed requests */
  maxRetries?: number;

  /** Additional provider-specific options */
  options?: Record<string, unknown>;
}
