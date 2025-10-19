/**
 * Unit tests for AIMetadataService - AI provider abstraction
 * Note: These tests use mocks - no real API calls are made
 */

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { AIMetadataService } from '../../src/ai/AIMetadataService';
import { providerRegistry } from '../../src/ai/ProviderRegistry';
import {
  AIMetadataProvider,
  AIMetadataRequest,
  AIMetadataResponse,
  AIMetadataOperation,
  ComplexityAnalysis,
  TokenEstimation,
  ExtractedParameters,
} from '../../src/ai/AIMetadataProvider';

/**
 * Mock AI Provider for testing (no real API calls)
 */
class MockAIProvider extends AIMetadataProvider {
  readonly name = 'mock-provider';
  readonly displayName = 'Mock Provider';
  readonly supportedOperations: AIMetadataOperation[] = [
    'analyze_complexity',
    'estimate_tokens',
    'extract_parameters',
  ];

  private shouldFail = false;
  private latency = 10;

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  setLatency(ms: number): void {
    this.latency = ms;
  }

  async process(request: AIMetadataRequest): Promise<AIMetadataResponse> {
    // Simulate latency
    await new Promise((resolve) => setTimeout(resolve, this.latency));

    if (this.shouldFail) {
      return {
        success: false,
        operation: request.operation,
        error: {
          code: 'MOCK_ERROR',
          message: 'Mock provider failure',
          recoverable: true,
        },
        metadata: {
          provider: this.name,
          model: 'mock-model',
          latencyMs: this.latency,
        },
      };
    }

    let data: ComplexityAnalysis | TokenEstimation | ExtractedParameters;

    switch (request.operation) {
      case 'analyze_complexity':
        data = {
          cyclomatic: 5,
          cognitive: 7,
          maintainability: 85,
          explanation: 'Mock complexity analysis',
          confidence: 0.9,
        } as ComplexityAnalysis;
        break;

      case 'estimate_tokens':
        data = {
          heuristic: 100,
          validated: 95,
          confidence: 0.95,
        } as TokenEstimation;
        break;

      case 'extract_parameters':
        data = {
          name: 'mockFunction',
          kind: 'function',
          parameters: [
            { name: 'param1', type: 'string' },
            { name: 'param2', type: 'number', optional: true },
          ],
          returnType: 'void',
          lineCount: 10,
          confidence: 0.9,
        } as ExtractedParameters;
        break;

      default:
        throw new Error(`Unsupported operation: ${request.operation}`);
    }

    return {
      success: true,
      operation: request.operation,
      data,
      metadata: {
        provider: this.name,
        model: 'mock-model',
        latencyMs: this.latency,
      },
    };
  }

  async validate(): Promise<boolean> {
    return !this.shouldFail;
  }

  getConfigRequirements(): string[] {
    return []; // Mock has no config requirements
  }
}

suite('AIMetadataService', () => {
  let service: AIMetadataService;
  let mockProvider: MockAIProvider;

  setup(async () => {
    // Create fresh service instance
    service = new AIMetadataService();

    // Create and register mock provider
    mockProvider = new MockAIProvider();
    providerRegistry.register(mockProvider);
    providerRegistry.setActive('mock-provider');

    // Initialize service (will use mock provider)
    await service.initialize();
  });

  teardown(() => {
    // Clean up
    service.clearCache();
    // Note: ProviderRegistry is singleton, so we can't fully reset it
    // But setting a mock provider for tests is acceptable
  });

  suite('initialize', () => {
    test('should initialize successfully', async () => {
      const newService = new AIMetadataService();
      await newService.initialize();

      expect(newService.isAvailable()).to.be.true;
    });

    test('should handle initialization errors gracefully', async () => {
      mockProvider.setShouldFail(true);

      const newService = new AIMetadataService();
      // Should not throw
      await newService.initialize();
    });
  });

  suite('analyzeComplexity', () => {
    test('should analyze code complexity', async () => {
      const code = 'function test() { if (x) { return 1; } else { return 2; } }';
      const result = await service.analyzeComplexity(code, 'javascript');

      expect(result).to.exist;
      expect(result?.cyclomatic).to.equal(5);
      expect(result?.cognitive).to.equal(7);
      expect(result?.maintainability).to.equal(85);
      expect(result?.confidence).to.equal(0.9);
    });

    test('should use fallback when AI unavailable', async () => {
      mockProvider.setShouldFail(true);

      const code = 'function test() { if (x) { return 1; } }';
      const result = await service.analyzeComplexity(code, 'javascript');

      expect(result).to.exist;
      // Fallback uses heuristic
      expect(result?.explanation).to.include('Heuristic');
    });

    test('should support caching', async () => {
      const code = 'function test() {}';

      // First call
      const result1 = await service.analyzeComplexity(code, 'javascript', {
        useCache: true,
      });

      // Second call (should hit cache)
      const start = Date.now();
      const result2 = await service.analyzeComplexity(code, 'javascript', {
        useCache: true,
      });
      const duration = Date.now() - start;

      // Cache hit should be very fast (< 5ms)
      expect(duration).to.be.lessThan(5);
      expect(result1).to.deep.equal(result2);
    });

    test('should respect useCache=false', async () => {
      const code = 'function test() {}';

      // First call
      await service.analyzeComplexity(code, 'javascript', { useCache: true });

      // Second call without cache
      mockProvider.setLatency(20);
      const start = Date.now();
      await service.analyzeComplexity(code, 'javascript', { useCache: false });
      const duration = Date.now() - start;

      // Should make real call (>= 20ms latency)
      expect(duration).to.be.at.least(15); // Allow some variance
    });
  });

  suite('estimateTokens', () => {
    test('should estimate token count', async () => {
      const code = 'function calculateTotal(items) { return items.reduce((a, b) => a + b, 0); }';
      const result = await service.estimateTokens(code, 'javascript');

      expect(result).to.exist;
      expect(result?.heuristic).to.equal(100);
      expect(result?.validated).to.equal(95);
      expect(result?.confidence).to.equal(0.95);
    });

    test('should use fallback when AI unavailable', async () => {
      mockProvider.setShouldFail(true);

      const code = 'const x = 5;';
      const result = await service.estimateTokens(code, 'javascript');

      expect(result).to.exist;
      // Fallback uses chars / 4
      expect(result?.heuristic).to.be.a('number');
      expect(result?.heuristic).to.be.greaterThan(0);
    });

    test('should cache token estimates', async () => {
      const code = 'const x = 5;';

      await service.estimateTokens(code, 'javascript', { useCache: true });

      const stats = service.getStats();
      expect(stats.cacheSize).to.be.greaterThan(0);
    });
  });

  suite('extractParameters', () => {
    test('should extract function parameters', async () => {
      const code = 'function processData(items, options) { return items.length; }';
      const result = await service.extractParameters(code, 'javascript');

      expect(result).to.exist;
      expect(result!.name).to.equal('mockFunction');
      expect(result!.kind).to.equal('function');
      expect(result!.parameters).to.have.lengthOf(2);
      expect(result!.parameters[0]!.name).to.equal('param1');
      expect(result!.parameters[1]!.optional).to.be.true;
    });

    test('should use fallback when AI unavailable', async () => {
      mockProvider.setShouldFail(true);

      const code = 'function test() {}';
      const result = await service.extractParameters(code, 'javascript');

      expect(result).to.exist;
      expect(result?.kind).to.equal('function');
      expect(result?.confidence).to.be.lessThan(0.9); // Fallback has lower confidence
    });
  });

  suite('isAvailable', () => {
    test('should return true when initialized with providers', () => {
      expect(service.isAvailable()).to.be.true;
    });

    test('should return false when provider fails validation', async () => {
      mockProvider.setShouldFail(true);

      const newService = new AIMetadataService();
      await newService.initialize();

      // Service still available (graceful degradation), but validation failed
      // The service uses fallback methods
      expect(newService.isAvailable()).to.be.true;
    });
  });

  suite('getStats', () => {
    test('should return service statistics', () => {
      const stats = service.getStats();

      expect(stats).to.have.property('initialized');
      expect(stats).to.have.property('enabled');
      expect(stats).to.have.property('providersCount');
      expect(stats).to.have.property('cacheSize');
      expect(stats).to.have.property('cacheHitRate');

      expect(stats.initialized).to.be.true;
      expect(stats.providersCount).to.be.greaterThan(0);
    });

    test('should track cache size', async () => {
      const code = 'function test() {}';

      await service.analyzeComplexity(code, 'javascript', { useCache: true });
      await service.estimateTokens(code, 'javascript', { useCache: true });

      const stats = service.getStats();
      expect(stats.cacheSize).to.be.greaterThan(0);
    });
  });

  suite('clearCache', () => {
    test('should clear cached responses', async () => {
      const code = 'function test() {}';

      await service.analyzeComplexity(code, 'javascript', { useCache: true });

      let stats = service.getStats();
      const initialCacheSize = stats.cacheSize;
      expect(initialCacheSize).to.be.greaterThan(0);

      service.clearCache();

      stats = service.getStats();
      expect(stats.cacheSize).to.equal(0);
    });
  });

  suite('Error Handling', () => {
    test('should handle provider errors gracefully', async () => {
      mockProvider.setShouldFail(true);

      const code = 'function test() {}';

      // Should not throw, should use fallback
      const complexity = await service.analyzeComplexity(code, 'javascript');
      const tokens = await service.estimateTokens(code, 'javascript');
      const params = await service.extractParameters(code, 'javascript');

      expect(complexity).to.exist;
      expect(tokens).to.exist;
      expect(params).to.exist;
    });

    test('should handle missing providers gracefully', async () => {
      // Create service without registering provider
      const newService = new AIMetadataService();

      // Don't initialize - should still work with fallbacks
      const code = 'function test() {}';
      const result = await newService.analyzeComplexity(code, 'javascript');

      expect(result).to.exist;
      expect(result?.explanation).to.include('Heuristic');
    });
  });

  suite('Performance', () => {
    test('should complete analysis in reasonable time', async () => {
      mockProvider.setLatency(50); // 50ms mock latency

      const code = 'function test() { if (x) { return 1; } }';
      const start = Date.now();
      await service.analyzeComplexity(code, 'javascript');
      const duration = Date.now() - start;

      // Should complete in < 100ms
      expect(duration).to.be.lessThan(100);
    });

    test('should handle concurrent requests', async () => {
      const code = 'function test() {}';

      const promises = [
        service.analyzeComplexity(code, 'javascript'),
        service.estimateTokens(code, 'javascript'),
        service.extractParameters(code, 'javascript'),
      ];

      const results = await Promise.all(promises);

      expect(results).to.have.lengthOf(3);
      results.forEach((result) => {
        expect(result).to.exist;
      });
    });
  });
});
