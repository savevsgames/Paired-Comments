# AI Training Demo - System Architecture

**Version:** 0.1.0
**Last Updated:** October 19, 2025

---

## 🏗️ System Overview

The AI Training Comparison Demo is a full-stack system for proving that `.comments` metadata improves AI model training outcomes. It consists of four major components:

1. **Data Pipeline** - Export `.comments` to training data (JSONL)
2. **Training System** - Azure ML fine-tuning pipelines
3. **Evaluation Harness** - Automated metrics calculation
4. **Dashboard** - Public-facing comparison visualization

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AI Training Demo System                         │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Source Repos    │  (React, Express, Python projects)
│  with .comments  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│  DATA PIPELINE (Phase 1)                                             │
├──────────────────────────────────────────────────────────────────────┤
│  1. MCP Server Export Tool                                           │
│     - export_comments(format: "jsonl", includeSourceContext: true)   │
│     - Outputs JSONL with code context (±5 lines)                     │
│                                                                       │
│  2. Dataset Splitter                                                 │
│     - Split into train/validation/test (70/15/15)                    │
│     - Create control dataset (code only)                             │
│     - Create experiment dataset (code + .comments metadata)          │
│                                                                       │
│  3. Quality Validator                                                │
│     - Check for syntax errors (ESLint, Pylint)                       │
│     - Verify metadata completeness                                   │
│     - Manual review queue (human-in-the-loop)                        │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  AZURE BLOB STORAGE                                                  │
│  - datasets/control/train.jsonl         (350 samples)                │
│  - datasets/control/validation.jsonl    (75 samples)                 │
│  - datasets/control/test.jsonl          (75 samples)                 │
│  - datasets/experiment/train.jsonl      (350 samples)                │
│  - datasets/experiment/validation.jsonl (75 samples)                 │
│  - datasets/experiment/test.jsonl       (75 samples)                 │
└──────────────┬───────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────────┐
│  TRAINING SYSTEM (Phase 2)                                           │
├──────────────────────────────────────────────────────────────────────┤
│  Azure Machine Learning Studio                                       │
│  ┌────────────────────┐        ┌────────────────────┐               │
│  │  Control Pipeline  │        │ Experiment Pipeline│               │
│  │  (Conventional)    │        │ (+ .comments)      │               │
│  ├────────────────────┤        ├────────────────────┤               │
│  │ 1. Load train.jsonl│        │ 1. Load train.jsonl│               │
│  │ 2. Fine-tune GPT-4 │        │ 2. Fine-tune GPT-4 │               │
│  │    or Llama-3      │        │    or Llama-3      │               │
│  │ 3. Track metrics   │        │ 3. Track metrics   │               │
│  │    (MLflow)        │        │    (MLflow)        │               │
│  │ 4. Save checkpoint │        │ 4. Save checkpoint │               │
│  └────────┬───────────┘        └────────┬───────────┘               │
│           │                             │                            │
│           └──────────┬──────────────────┘                            │
│                      ▼                                               │
│              Model Artifacts                                         │
│              - control-model.bin                                     │
│              - experiment-model.bin                                  │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  EVALUATION HARNESS (Phase 3)                                        │
├──────────────────────────────────────────────────────────────────────┤
│  For each model (control + experiment):                              │
│                                                                       │
│  1. Code Accuracy Evaluator                                          │
│     - Generate code for 75 test prompts                              │
│     - Compare AST against expected output                            │
│     - Calculate exact match %                                        │
│                                                                       │
│  2. Functional Correctness Evaluator                                 │
│     - Execute generated code in sandbox                              │
│     - Run unit tests                                                 │
│     - Calculate pass rate %                                          │
│                                                                       │
│  3. Semantic Similarity Evaluator                                    │
│     - Embed generated code (OpenAI embeddings)                       │
│     - Calculate cosine similarity to target                          │
│     - Calculate average similarity score                             │
│                                                                       │
│  4. Pass@k Evaluator                                                 │
│     - Generate k=10 samples per prompt                               │
│     - Calculate % with at least 1 correct answer                     │
│                                                                       │
│  5. Human Eval Interface                                             │
│     - Side-by-side A/B comparison UI                                 │
│     - Collect preferences from 10+ reviewers                         │
│     - Calculate preference %                                         │
│                                                                       │
│  6. Statistical Analysis                                             │
│     - Run t-test for significance (p < 0.05)                         │
│     - Calculate effect size (Cohen's d)                              │
│     - Generate comparison tables                                     │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  RESULTS DATABASE (JSON)                                             │
│  {                                                                    │
│    "scenario": "react-components",                                   │
│    "control": { "accuracy": 0.78, "functional": 0.72, ... },         │
│    "experiment": { "accuracy": 0.94, "functional": 0.89, ... },      │
│    "improvement": { "accuracy": "+16%", "functional": "+17%", ... }, │
│    "significance": { "p_value": 0.003, "effect_size": 1.2 }          │
│  }                                                                    │
└──────────────────────┬───────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────────┐
│  DASHBOARD (Phase 4) - Next.js App                                   │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Split-Screen Training Visualization                           │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐           │ │
│  │  │  Control Model       │  │  Experiment Model    │           │ │
│  │  │  (Conventional)      │  │  (+ .comments)       │           │ │
│  │  │                      │  │                      │           │ │
│  │  │  Training Loss: 0.45 │  │  Training Loss: 0.32 │           │ │
│  │  │  Accuracy: 78%       │  │  Accuracy: 94%       │  (+16%)   │ │
│  │  │  Pass@k: 65%         │  │  Pass@k: 83%         │  (+18%)   │ │
│  │  └──────────────────────┘  └──────────────────────┘           │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Model Comparison UI                                           │ │
│  │  ┌──────────────────────┐  ┌──────────────────────┐           │ │
│  │  │  Control Output      │  │  Experiment Output   │           │ │
│  │  │  (Side-by-side diff) │  │  (Annotated)         │           │ │
│  │  └──────────────────────┘  └──────────────────────┘           │ │
│  │  Annotations: "Metadata helped with type inference here ↑"     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  "Try It Yourself" Interactive Prompt                          │ │
│  │  Prompt: "Create a login form component with validation"       │ │
│  │  [Generate with Both Models]                                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Export Charts & Tables                                        │ │
│  │  [Download PNG] [Download CSV] [Copy LaTeX Table]              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                       │
                       ▼
              Public Demo URL
       (ai-training-demo.vercel.app)
```

---

## 🔧 Component Details

### 1. Data Pipeline

**Input:** Source repositories with `.comments` files
**Output:** JSONL training datasets

**Tech Stack:**
- MCP Server (existing) for `.comments` export
- Python scripts for dataset splitting
- ESLint/Pylint for quality validation

**Data Format (JSONL):**
```json
{
  "prompt": "Create a React form input component with accessibility",
  "completion": "const FormInput = ({ label, ...props }) => {\n  return (\n    <div>\n      <label htmlFor={props.id}>{label}</label>\n      <input {...props} />\n    </div>\n  );\n};",
  "metadata": {
    "componentType": "FormInput",
    "propCount": 5,
    "a11y": true,
    "responsive": true,
    "complexity": 3
  },
  "sourceContext": {
    "beforeLines": ["// Previous function...", ""],
    "afterLines": ["", "// Next function..."]
  }
}
```

**Control Dataset:** Same prompt/completion, but `metadata` field is EMPTY
**Experiment Dataset:** Full metadata from `.comments` (params + aiMeta)

---

### 2. Training System

**Platform:** Azure Machine Learning Studio
**Alternative:** Hugging Face AutoTrain (fallback)

**Models:**
- **Option A:** GPT-4 fine-tuning API (expensive, high quality)
- **Option B:** Llama-3 70B (cheaper, open source)
- **Option C:** Claude fine-tuning (if API available)

**Hyperparameters:**
```python
{
  "learning_rate": 1e-5,
  "batch_size": 4,
  "epochs": 3,
  "warmup_steps": 100,
  "max_seq_length": 2048,
  "early_stopping": True,
  "patience": 2
}
```

**Training Pipeline (Azure ML):**
```python
from azure.ai.ml import MLClient, command
from azure.ai.ml.entities import Environment

# 1. Create compute cluster
compute = ml_client.compute.begin_create_or_update(
    AmlCompute(name="gpu-cluster", size="Standard_NC6s_v3", max_instances=2)
).result()

# 2. Define training job
job = command(
    code="./src/training",
    command="python finetune.py --dataset ${{inputs.dataset}} --model ${{inputs.model}}",
    inputs={
        "dataset": Input(path="azureml://datasets/control-train"),
        "model": "meta-llama/Llama-3-70b"
    },
    environment="azureml://environments/pytorch-gpu",
    compute="gpu-cluster",
    experiment_name="paired-comments-control"
)

# 3. Submit job
ml_client.jobs.create_or_update(job)

# 4. Track with MLflow
import mlflow
mlflow.log_metrics({"train_loss": 0.45, "val_accuracy": 0.78})
```

---

### 3. Evaluation Harness

**Architecture:**
```
evaluation/
├── benchmarks/          # Test suites for each scenario
│   ├── react-components.test.ts
│   ├── express-api.test.ts
│   └── ...
├── evaluators/          # Metric calculators
│   ├── CodeAccuracy.ts
│   ├── FunctionalCorrectness.ts
│   ├── SemanticSimilarity.ts
│   └── PassAtK.ts
├── harness.ts           # Main evaluation runner
└── results/             # Output JSON files
```

**Evaluation Flow:**
```typescript
// harness.ts
async function evaluateModel(model: Model, testSet: TestCase[]) {
  const results = {
    accuracy: 0,
    functional: 0,
    semantic: 0,
    passAtK: 0
  };

  for (const testCase of testSet) {
    // Generate code
    const generated = await model.generate(testCase.prompt);

    // Run evaluators
    results.accuracy += CodeAccuracy.evaluate(generated, testCase.expected);
    results.functional += FunctionalCorrectness.execute(generated, testCase.tests);
    results.semantic += SemanticSimilarity.compare(generated, testCase.expected);
    results.passAtK += PassAtK.check(model, testCase.prompt, k=10);
  }

  return results;
}
```

**Statistical Analysis:**
```typescript
import { ttest } from 'simple-statistics';

const controlScores = [0.78, 0.72, 0.81, ...];
const experimentScores = [0.94, 0.89, 0.97, ...];

const pValue = ttest(controlScores, experimentScores);
const effectSize = cohensD(controlScores, experimentScores);

console.log(`p-value: ${pValue}`);  // Should be < 0.05
console.log(`Effect size: ${effectSize}`);  // Cohen's d > 0.8 = large effect
```

---

### 4. Dashboard (Next.js)

**Tech Stack:**
- **Framework:** Next.js 14 (App Router)
- **UI:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts or Chart.js
- **Deployment:** Vercel or Azure Static Web Apps

**Project Structure:**
```
src/dashboard/
├── app/
│   ├── page.tsx                    # Home page (landing)
│   ├── training/page.tsx           # Split-screen training viz
│   ├── comparison/page.tsx         # Model comparison UI
│   ├── playground/page.tsx         # "Try it yourself"
│   └── results/page.tsx            # Metrics tables
├── components/
│   ├── SplitScreenChart.tsx        # Real-time training metrics
│   ├── CodeDiff.tsx                # Side-by-side comparison
│   ├── MetricsTable.tsx            # Results table
│   └── PromptInterface.tsx         # Interactive testing
├── lib/
│   ├── api.ts                      # Fetch results from JSON
│   ├── models.ts                   # Load model APIs
│   └── types.ts                    # TypeScript types
└── public/
    └── results/                    # Static result JSON files
```

**Key Features:**
- **Live Training Viz:** Real-time charts showing loss/accuracy curves
- **Annotated Diffs:** Highlight where metadata helped (e.g., "Type inference from params here")
- **Interactive Prompts:** Users can test both models with custom prompts
- **Export:** Download charts as PNG, tables as CSV/LaTeX

---

## 🔄 Data Flow

**Training Phase:**
```
.comments files
  → MCP Server export (JSONL)
  → Dataset splitter (train/val/test)
  → Quality validation
  → Azure Blob Storage
  → Azure ML fine-tuning
  → Trained model checkpoints
```

**Evaluation Phase:**
```
Trained models
  → Load test set (75 prompts)
  → Generate code for each prompt
  → Run evaluators (accuracy, functional, semantic, pass@k)
  → Calculate metrics
  → Statistical analysis (t-test, effect size)
  → Save results JSON
```

**Dashboard Phase:**
```
Results JSON
  → Next.js API routes
  → React components (charts, tables, diffs)
  → Public demo URL
  → User interaction (try prompts, export charts)
```

---

## 🛡️ Security & Privacy

**Dataset Privacy:**
- Only use public repos (MIT/Apache licensed)
- Strip PII (names, emails, API keys) from code samples
- Anonymize author names in `.comments`

**Model Access Control:**
- Trained models are PRIVATE (not published)
- Only expose via demo UI (no direct API access)
- Rate limiting on "Try it yourself" (100 requests/day)

**Azure Security:**
- Use managed identities (no API keys in code)
- Enable Azure Key Vault for secrets
- Restrict network access to compute clusters

---

## 📊 Performance Targets

**Training Time:**
- GPT-4 fine-tuning: ~2-4 hours per run
- Llama-3 70B: ~6-12 hours per run (on 4x A100 GPUs)

**Evaluation Time:**
- 75 test cases × 2 models = 150 evaluations
- ~30 seconds per evaluation (including execution)
- Total: ~75 minutes per scenario

**Dashboard Load Time:**
- Initial page load: < 2 seconds
- Chart rendering: < 500ms
- Interactive prompts: < 5 seconds per generation

---

## 🔮 Future Enhancements

**Phase 6+ (Post-Launch):**
- [ ] Real-time training updates (WebSocket streaming)
- [ ] User-contributed scenarios (community datasets)
- [ ] Multi-model comparison (GPT-4 vs Claude vs Llama)
- [ ] Automated hyperparameter tuning (Azure ML AutoML)
- [ ] A/B testing framework for new metadata types
- [ ] Export to academic paper format (IEEE, ACM)

---

## 📚 References

- [Azure Machine Learning Docs](https://learn.microsoft.com/en-us/azure/machine-learning/)
- [GPT-4 Fine-Tuning API](https://platform.openai.com/docs/guides/fine-tuning)
- [HumanEval Benchmark (Pass@k)](https://github.com/openai/human-eval)
- [MLflow Tracking](https://mlflow.org/docs/latest/tracking.html)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Last Updated:** October 19, 2025
**Status:** Ready for Implementation
