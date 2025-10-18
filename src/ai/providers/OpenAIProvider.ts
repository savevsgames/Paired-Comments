/**
 * OpenAI Provider - Implementation using OpenAI API
 * v2.1.0 - First AI provider implementation
 */

import {
  AIMetadataProvider,
  AIMetadataRequest,
  AIMetadataResponse,
  AIMetadataOperation,
  ProviderConfig,
  ComplexityAnalysis,
  TokenEstimation,
  ExtractedParameters,
} from '../AIMetadataProvider';

/**
 * OpenAI API Provider
 * Uses GPT-4 for metadata generation
 */
export class OpenAIProvider extends AIMetadataProvider {
  readonly name = 'openai';
  readonly displayName = 'OpenAI (GPT-4)';
  readonly supportedOperations: AIMetadataOperation[] = [
    'analyze_complexity',
    'estimate_tokens',
    'extract_parameters',
  ];

  private config: ProviderConfig;
  private readonly defaultModel = 'gpt-4';
  private readonly apiBaseUrl = 'https://api.openai.com/v1';

  constructor(config: ProviderConfig) {
    super();
    this.config = config;
  }

  /**
   * Process AI metadata request using OpenAI API
   */
  async process(request: AIMetadataRequest): Promise<AIMetadataResponse> {
    const startTime = Date.now();

    try {
      // Validate configuration
      if (!this.config.apiKey) {
        return this.errorResponse(
          request.operation,
          'MISSING_API_KEY',
          'OpenAI API key not configured. Set OPENAI_API_KEY in .env or VS Code settings.',
          false,
          startTime
        );
      }

      // Check operation support
      if (!this.supportsOperation(request.operation)) {
        return this.errorResponse(
          request.operation,
          'UNSUPPORTED_OPERATION',
          `Operation "${request.operation}" is not supported by OpenAI provider`,
          false,
          startTime
        );
      }

      // Route to operation-specific handler
      switch (request.operation) {
        case 'analyze_complexity':
          return await this.analyzeComplexity(request, startTime);
        case 'estimate_tokens':
          return await this.estimateTokens(request, startTime);
        case 'extract_parameters':
          return await this.extractParameters(request, startTime);
        default:
          return this.errorResponse(
            request.operation,
            'UNKNOWN_OPERATION',
            `Unknown operation: ${request.operation}`,
            false,
            startTime
          );
      }
    } catch (error) {
      return this.errorResponse(
        request.operation,
        'PROVIDER_ERROR',
        error instanceof Error ? error.message : String(error),
        true,
        startTime
      );
    }
  }

  /**
   * Validate OpenAI provider configuration
   */
  async validate(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    // Try a simple API call to validate key
    try {
      const response = await this.callOpenAI({
        model: this.config.model || this.defaultModel,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get configuration requirements
   */
  getConfigRequirements(): string[] {
    return ['OPENAI_API_KEY'];
  }

  /**
   * Analyze code complexity using GPT-4
   */
  private async analyzeComplexity(
    request: AIMetadataRequest,
    startTime: number
  ): Promise<AIMetadataResponse> {
    const prompt = this.buildComplexityPrompt(request);

    const response = await this.callOpenAI({
      model: this.config.model || this.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are a code complexity analyzer. Provide accurate cyclomatic and cognitive complexity scores.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Low temperature for consistent analysis
      response_format: { type: 'json_object' },
    });

    const data = await response.json() as any;
    const analysis = this.parseComplexityResponse(data);

    return {
      success: true,
      operation: 'analyze_complexity',
      data: analysis,
      metadata: {
        provider: this.name,
        model: this.config.model || this.defaultModel,
        latencyMs: Date.now() - startTime,
        tokensUsed: data.usage?.total_tokens,
        cost: this.calculateCost(data.usage?.total_tokens || 0),
      },
    };
  }

  /**
   * Estimate token count using GPT-4
   */
  private async estimateTokens(
    request: AIMetadataRequest,
    startTime: number
  ): Promise<AIMetadataResponse> {
    const prompt = this.buildTokenEstimationPrompt(request);

    const response = await this.callOpenAI({
      model: this.config.model || this.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are a token estimation expert. Estimate token counts accurately for LLM context management.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const data = await response.json() as any;
    const estimation = this.parseTokenEstimationResponse(data);

    return {
      success: true,
      operation: 'estimate_tokens',
      data: estimation,
      metadata: {
        provider: this.name,
        model: this.config.model || this.defaultModel,
        latencyMs: Date.now() - startTime,
        tokensUsed: data.usage?.total_tokens,
        cost: this.calculateCost(data.usage?.total_tokens || 0),
      },
    };
  }

  /**
   * Extract parameters from code using GPT-4
   */
  private async extractParameters(
    request: AIMetadataRequest,
    startTime: number
  ): Promise<AIMetadataResponse> {
    const prompt = this.buildParameterExtractionPrompt(request);

    const response = await this.callOpenAI({
      model: this.config.model || this.defaultModel,
      messages: [
        {
          role: 'system',
          content: 'You are a code analysis expert. Extract function/class parameters and metadata accurately.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Very low temperature for accurate extraction
      response_format: { type: 'json_object' },
    });

    const data = await response.json() as any;
    const parameters = this.parseParameterExtractionResponse(data);

    return {
      success: true,
      operation: 'extract_parameters',
      data: parameters,
      metadata: {
        provider: this.name,
        model: this.config.model || this.defaultModel,
        latencyMs: Date.now() - startTime,
        tokensUsed: data.usage?.total_tokens,
        cost: this.calculateCost(data.usage?.total_tokens || 0),
      },
    };
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(payload: unknown): Promise<Response> {
    const url = `${this.config.baseUrl || this.apiBaseUrl}/chat/completions`;
    const timeout = this.config.timeout || 30000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Build complexity analysis prompt
   */
  private buildComplexityPrompt(request: AIMetadataRequest): string {
    return `Analyze the complexity of this ${request.language} code:

\`\`\`${request.language}
${request.code}
\`\`\`

Provide a JSON response with:
{
  "cyclomatic": <number>,
  "cognitive": <number>,
  "maintainability": <0-100>,
  "explanation": "<brief explanation>",
  "confidence": <0-1>
}`;
  }

  /**
   * Build token estimation prompt
   */
  private buildTokenEstimationPrompt(request: AIMetadataRequest): string {
    return `Estimate the token count for this ${request.language} code when used in an LLM context:

\`\`\`${request.language}
${request.code}
\`\`\`

Provide a JSON response with:
{
  "heuristic": <estimated tokens using chars/4>,
  "validated": <accurate token count>,
  "breakdown": {
    "code": <tokens>,
    "comments": <tokens>,
    "whitespace": <tokens>
  },
  "confidence": <0-1>
}`;
  }

  /**
   * Build parameter extraction prompt
   */
  private buildParameterExtractionPrompt(request: AIMetadataRequest): string {
    return `Extract metadata from this ${request.language} code:

\`\`\`${request.language}
${request.code}
\`\`\`

Provide a JSON response with:
{
  "name": "<function/class name>",
  "kind": "<function|class|method|etc>",
  "parameters": [
    {
      "name": "<param name>",
      "type": "<type if available>",
      "optional": <boolean>,
      "defaultValue": "<value if any>"
    }
  ],
  "returnType": "<type if available>",
  "lineCount": <number of lines>,
  "complexity": <quick estimate>,
  "confidence": <0-1>
}`;
  }

  /**
   * Parse complexity analysis response
   */
  private parseComplexityResponse(data: any): ComplexityAnalysis {
    const content = JSON.parse(data.choices[0].message.content);
    return {
      cyclomatic: content.cyclomatic || 0,
      cognitive: content.cognitive || 0,
      maintainability: content.maintainability || 50,
      explanation: content.explanation || 'No explanation provided',
      confidence: content.confidence || 0.8,
    };
  }

  /**
   * Parse token estimation response
   */
  private parseTokenEstimationResponse(data: any): TokenEstimation {
    const content = JSON.parse(data.choices[0].message.content);
    return {
      heuristic: content.heuristic || Math.floor(content.validated * 0.8),
      validated: content.validated || 0,
      breakdown: content.breakdown,
      confidence: content.confidence || 0.9,
    };
  }

  /**
   * Parse parameter extraction response
   */
  private parseParameterExtractionResponse(data: any): ExtractedParameters {
    const content = JSON.parse(data.choices[0].message.content);
    return {
      name: content.name || 'unknown',
      kind: content.kind || 'function',
      parameters: content.parameters || [],
      returnType: content.returnType,
      lineCount: content.lineCount || 0,
      complexity: content.complexity,
      confidence: content.confidence || 0.85,
    };
  }

  /**
   * Calculate cost based on tokens used
   * GPT-4 pricing: $0.03 per 1K prompt tokens, $0.06 per 1K completion tokens
   */
  private calculateCost(tokens: number): number {
    // Simplified cost calculation (average of prompt and completion costs)
    return (tokens / 1000) * 0.045;
  }

  /**
   * Build error response
   */
  private errorResponse(
    operation: AIMetadataOperation,
    code: string,
    message: string,
    recoverable: boolean,
    startTime: number
  ): AIMetadataResponse {
    return {
      success: false,
      operation,
      error: {
        code,
        message,
        recoverable,
        retryAfter: recoverable ? 1000 : undefined,
      },
      metadata: {
        provider: this.name,
        model: this.config.model || this.defaultModel,
        latencyMs: Date.now() - startTime,
      },
    };
  }
}
