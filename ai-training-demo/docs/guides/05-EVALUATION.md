# Evaluation Guide

**Version:** 0.1.0
**Phase:** 3 of 5 (Weeks 5-6)

---

## 🎯 Goal

Systematically evaluate both control and experiment models using industry-standard metrics to prove measurable improvement when training with `.comments` metadata.

**Target:** >10% average improvement across all metrics

---

## 📊 Evaluation Metrics

### 1. Code Accuracy (Exact Match)
**Definition:** % of generated code that exactly matches expected output (after normalization)

**Implementation:**
```typescript
// src/evaluation/metrics/CodeAccuracy.ts
import { parse } from '@babel/parser';
import generate from '@babel/generator';

export class CodeAccuracy {
  /**
   * Compare generated code to expected using AST equality
   */
  static evaluate(generated: string, expected: string): number {
    // Parse both to AST
    const genAST = parse(generated, { sourceType: 'module' });
    const expAST = parse(expected, { sourceType: 'module' });

    // Normalize (remove comments, consistent formatting)
    const genCode = generate(genAST, { comments: false }).code;
    const expCode = generate(expAST, { comments: false }).code;

    // Compare
    return genCode === expCode ? 1.0 : 0.0;
  }

  /**
   * Partial credit for semantic similarity
   */
  static evaluatePartial(generated: string, expected: string): number {
    const genAST = parse(generated);
    const expAST = parse(expected);

    // Count matching AST nodes
    const genNodes = this.countNodes(genAST);
    const expNodes = this.countNodes(expAST);

    const intersection = this.intersectNodes(genNodes, expNodes);
    const union = this.unionNodes(genNodes, expNodes);

    return intersection.length / union.length;  // Jaccard similarity
  }
}
```

---

### 2. Functional Correctness (Pass Rate)
**Definition:** % of generated code that executes correctly and passes all test cases

**Implementation:**
```typescript
// src/evaluation/metrics/FunctionalCorrectness.ts
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

export class FunctionalCorrectness {
  /**
   * Execute generated code in sandbox and run tests
   */
  static async execute(
    generated: string,
    testCases: TestCase[]
  ): Promise<number> {
    const tempFile = `/tmp/test_${Date.now()}.js`;

    try {
      // Write generated code to temp file
      writeFileSync(tempFile, generated);

      let passed = 0;

      for (const test of testCases) {
        const result = await this.runTest(tempFile, test);
        if (result.success) passed++;
      }

      return passed / testCases.length;
    } finally {
      unlinkSync(tempFile);
    }
  }

  private static runTest(
    filePath: string,
    test: TestCase
  ): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      // Run in Node.js sandbox
      const child = spawn('node', [
        '--eval',
        `
        const fn = require('${filePath}');
        const assert = require('assert');
        try {
          const result = fn(${JSON.stringify(test.input)});
          assert.deepEqual(result, ${JSON.stringify(test.expected)});
          console.log('PASS');
        } catch (e) {
          console.error('FAIL:', e.message);
          process.exit(1);
        }
        `
      ]);

      child.on('exit', (code) => {
        resolve({ success: code === 0 });
      });
    });
  }
}

interface TestCase {
  input: any;
  expected: any;
  description?: string;
}
```

---

### 3. Semantic Similarity (Embedding Distance)
**Definition:** Cosine similarity between embeddings of generated vs. expected code

**Implementation:**
```typescript
// src/evaluation/metrics/SemanticSimilarity.ts
import { OpenAI } from 'openai';

export class SemanticSimilarity {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Calculate cosine similarity using OpenAI embeddings
   */
  async compare(generated: string, expected: string): Promise<number> {
    // Get embeddings
    const [genEmbed, expEmbed] = await Promise.all([
      this.embed(generated),
      this.embed(expected)
    ]);

    // Cosine similarity
    return this.cosineSimilarity(genEmbed, expEmbed);
  }

  private async embed(code: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: code
    });

    return response.data[0].embedding;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }
}
```

---

### 4. Pass@k (HumanEval-style)
**Definition:** % of problems where at least 1 out of k generated samples is correct

**Implementation:**
```typescript
// src/evaluation/metrics/PassAtK.ts
export class PassAtK {
  /**
   * Generate k samples and check if any pass
   */
  static async evaluate(
    model: Model,
    prompt: string,
    testCases: TestCase[],
    k: number = 10
  ): Promise<number> {
    // Generate k samples
    const samples = await Promise.all(
      Array.from({ length: k }, () => model.generate(prompt))
    );

    // Test each sample
    for (const sample of samples) {
      const correctness = await FunctionalCorrectness.execute(sample, testCases);
      if (correctness === 1.0) {
        return 1.0;  // At least 1 correct
      }
    }

    return 0.0;  // None correct
  }

  /**
   * Calculate expected pass@k from n samples
   * (Unbiased estimator from HumanEval paper)
   */
  static calculatePassAtK(
    n: number,  // Total samples
    c: number,  // Correct samples
    k: number   // k for pass@k
  ): number {
    if (n - c < k) return 1.0;

    return 1.0 - (this.nCr(n - c, k) / this.nCr(n, k));
  }

  private static nCr(n: number, r: number): number {
    // n choose r
    if (r > n) return 0;
    if (r === 0 || r === n) return 1;

    let result = 1;
    for (let i = 1; i <= r; i++) {
      result *= (n - i + 1) / i;
    }
    return result;
  }
}
```

---

### 5. Human Evaluation (A/B Comparison)
**Definition:** % of reviewers who prefer experiment model output over control

**Implementation (Next.js UI):**
```typescript
// src/evaluation/human-eval-ui/app/evaluate/page.tsx
'use client';

import { useState } from 'react';

export default function HumanEvalPage() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Preference[]>([]);

  const current = samples[currentIndex];

  function recordPreference(choice: 'A' | 'B' | 'Tie') {
    setResults([...results, {
      sampleId: current.id,
      choice,
      timestamp: new Date()
    }]);

    setCurrentIndex(currentIndex + 1);
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="border p-4">
        <h3>Model A</h3>
        <pre>{current.modelA}</pre>
      </div>

      <div className="border p-4">
        <h3>Model B</h3>
        <pre>{current.modelB}</pre>
      </div>

      <div className="col-span-2 flex gap-4 justify-center">
        <button onClick={() => recordPreference('A')}>Prefer A</button>
        <button onClick={() => recordPreference('Tie')}>Tie</button>
        <button onClick={() => recordPreference('B')}>Prefer B</button>
      </div>

      <div className="col-span-2">
        Progress: {currentIndex + 1} / {samples.length}
      </div>
    </div>
  );
}
```

---

## 🧪 Evaluation Harness

### Main Evaluation Runner
```typescript
// src/evaluation/harness.ts
import { CodeAccuracy } from './metrics/CodeAccuracy';
import { FunctionalCorrectness } from './metrics/FunctionalCorrectness';
import { SemanticSimilarity } from './metrics/SemanticSimilarity';
import { PassAtK } from './metrics/PassAtK';

export class EvaluationHarness {
  async evaluateModel(
    model: Model,
    testSet: TestCase[]
  ): Promise<EvaluationResult> {
    const results = {
      codeAccuracy: 0,
      functionalCorrectness: 0,
      semanticSimilarity: 0,
      passAtK: 0
    };

    for (const testCase of testSet) {
      // Generate code
      const generated = await model.generate(testCase.prompt);

      // Run all evaluators
      results.codeAccuracy += CodeAccuracy.evaluate(generated, testCase.expected);
      results.functionalCorrectness += await FunctionalCorrectness.execute(
        generated,
        testCase.tests
      );
      results.semanticSimilarity += await new SemanticSimilarity(
        process.env.OPENAI_API_KEY!
      ).compare(generated, testCase.expected);
      results.passAtK += await PassAtK.evaluate(model, testCase.prompt, testCase.tests, 10);
    }

    // Average scores
    const n = testSet.length;
    return {
      codeAccuracy: results.codeAccuracy / n,
      functionalCorrectness: results.functionalCorrectness / n,
      semanticSimilarity: results.semanticSimilarity / n,
      passAtK: results.passAtK / n
    };
  }

  async compareModels(
    controlModel: Model,
    experimentModel: Model,
    testSet: TestCase[]
  ): Promise<ComparisonResult> {
    const [controlResults, experimentResults] = await Promise.all([
      this.evaluateModel(controlModel, testSet),
      this.evaluateModel(experimentModel, testSet)
    ]);

    return {
      control: controlResults,
      experiment: experimentResults,
      improvement: this.calculateImprovement(controlResults, experimentResults)
    };
  }

  private calculateImprovement(
    control: EvaluationResult,
    experiment: EvaluationResult
  ): Record<string, string> {
    return {
      codeAccuracy: this.formatImprovement(control.codeAccuracy, experiment.codeAccuracy),
      functionalCorrectness: this.formatImprovement(
        control.functionalCorrectness,
        experiment.functionalCorrectness
      ),
      semanticSimilarity: this.formatImprovement(
        control.semanticSimilarity,
        experiment.semanticSimilarity
      ),
      passAtK: this.formatImprovement(control.passAtK, experiment.passAtK)
    };
  }

  private formatImprovement(control: number, experiment: number): string {
    const diff = ((experiment - control) / control) * 100;
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
  }
}
```

---

## 📈 Statistical Analysis

### T-Test for Significance
```typescript
// src/evaluation/stats.ts
import { ttest } from 'simple-statistics';

export class StatisticalAnalysis {
  /**
   * Test if experiment results are significantly better
   */
  static testSignificance(
    controlScores: number[],
    experimentScores: number[]
  ): SignificanceResult {
    const pValue = ttest(controlScores, experimentScores);
    const effectSize = this.cohensD(controlScores, experimentScores);

    return {
      pValue,
      effectSize,
      isSignificant: pValue < 0.05,
      effectInterpretation: this.interpretEffectSize(effectSize)
    };
  }

  /**
   * Calculate Cohen's d (effect size)
   */
  private static cohensD(a: number[], b: number[]): number {
    const meanA = a.reduce((sum, x) => sum + x, 0) / a.length;
    const meanB = b.reduce((sum, x) => sum + x, 0) / b.length;

    const varA = a.reduce((sum, x) => sum + Math.pow(x - meanA, 2), 0) / a.length;
    const varB = b.reduce((sum, x) => sum + Math.pow(x - meanB, 2), 0) / b.length;

    const pooledSD = Math.sqrt((varA + varB) / 2);

    return (meanB - meanA) / pooledSD;
  }

  private static interpretEffectSize(d: number): string {
    if (d < 0.2) return 'negligible';
    if (d < 0.5) return 'small';
    if (d < 0.8) return 'medium';
    return 'large';
  }
}
```

---

## 📊 Results Format

### JSON Output
```json
{
  "scenario": "react-components",
  "timestamp": "2025-10-19T12:00:00Z",
  "testSetSize": 75,
  "control": {
    "codeAccuracy": 0.78,
    "functionalCorrectness": 0.72,
    "semanticSimilarity": 0.85,
    "passAtK": 0.65
  },
  "experiment": {
    "codeAccuracy": 0.94,
    "functionalCorrectness": 0.89,
    "semanticSimilarity": 0.96,
    "passAtK": 0.83
  },
  "improvement": {
    "codeAccuracy": "+20.5%",
    "functionalCorrectness": "+23.6%",
    "semanticSimilarity": "+12.9%",
    "passAtK": "+27.7%"
  },
  "significance": {
    "pValue": 0.003,
    "effectSize": 1.24,
    "effectInterpretation": "large",
    "isSignificant": true
  }
}
```

---

## 🎯 Success Criteria

### Quantitative
- ✅ **Experiment > Control by >10%** on all metrics
- ✅ **p-value < 0.05** (statistically significant)
- ✅ **Effect size > 0.8** (large effect)
- ✅ **Functional correctness > 85%** for experiment model
- ✅ **Human eval preference > 70%** for experiment model

### Qualitative
- Clear patterns in where metadata helped (annotate diffs)
- Reproducible results (consistent across scenarios)
- No catastrophic failures (model doesn't hallucinate)

---

## 🚀 Running Evaluation

### Command-Line
```bash
cd src/evaluation

# Evaluate single model
npm run evaluate -- \
  --model models/control-llama3 \
  --test-set datasets/test.jsonl \
  --output results/control.json

# Compare two models
npm run compare -- \
  --control models/control-llama3 \
  --experiment models/experiment-llama3 \
  --test-set datasets/test.jsonl \
  --output results/comparison.json
```

### Programmatic
```typescript
import { EvaluationHarness } from './harness';
import { StatisticalAnalysis } from './stats';

const harness = new EvaluationHarness();

// Load models
const control = await loadModel('control-llama3');
const experiment = await loadModel('experiment-llama3');

// Load test set
const testSet = await loadTestSet('datasets/test.jsonl');

// Run comparison
const results = await harness.compareModels(control, experiment, testSet);

// Statistical analysis
const stats = StatisticalAnalysis.testSignificance(
  results.control.scores,
  results.experiment.scores
);

console.log(results);
console.log(stats);
```

---

**Phase 3 Complete:** Ready for Phase 4 (Dashboard)
