## HumanEval Evaluation & Comparison

**Purpose:** Evaluate trained models on HumanEval and compare control vs experiment.

---

## 📋 Quick Start

### Prerequisites

1. **Trained Models:**
   - Control model: `outputs/final/control/final_model/`
   - Experiment model: `outputs/final/experiment/final_model/`

2. **Test Dataset:**
   - `datasets/control/test.jsonl` (25 samples)

### Run Comparison

```bash
cd src/evaluation

# Compare both models
python compare.py --stage stage4

# View results
cat evaluation/results/final/comparison_report.md
```

---

## 📂 File Overview

### Core Scripts

**`config.py`** - Evaluation configuration
- `EvaluationConfig` - Model paths, metrics, output settings
- `ComparisonConfig` - Statistical tests, visualization
- Presets for Stage 1 (quick) and Stage 4 (full)

**`humaneval_evaluator.py`** - HumanEval evaluation
- `HumanEvalEvaluator` - Generates code and runs tests
- Computes pass@1 metric (functional correctness)
- Saves detailed results per sample

**`compare.py`** - Model comparison
- Evaluates both models
- Statistical significance testing (t-test, McNemar's test)
- Generates comparison report
- Saves combined results

**`mlflow_logger.py`** - MLflow integration
- Logs training metrics
- Logs evaluation results
- Logs comparison metrics
- Optional (gracefully disabled if MLflow not installed)

---

## 🎯 Evaluation Metrics

### Pass@1 (Functional Correctness)

**What it measures:** Percentage of problems where the first generated solution passes all unit tests.

**How it works:**
1. Model generates code completion for each problem
2. Generated code is executed against unit tests
3. Pass = all tests pass, Fail = any test fails or code error

**Target:**
- Control (no metadata): ~30% pass@1
- Experiment (with metadata): ~40-45% pass@1 (+33-50% improvement)

### Statistical Tests

**Paired t-test:**
- Tests if improvement is statistically significant
- Null hypothesis: No difference between control and experiment
- p < 0.05 = statistically significant

**McNemar's test:**
- For paired binary data (pass/fail)
- More appropriate for binary outcomes than t-test

**Effect size (Cohen's d):**
- Measures magnitude of difference
- |d| < 0.2: negligible
- |d| < 0.5: small
- |d| < 0.8: medium
- |d| >= 0.8: large

---

## 📊 Usage Examples

### Evaluate Single Model

```bash
python humaneval_evaluator.py \
  --model outputs/final/control/final_model \
  --test-file datasets/control/test.jsonl \
  --output evaluation/results/control_only.json
```

**Output:**
```json
{
  "metrics": {
    "total_samples": 25,
    "passed": 8,
    "failed": 17,
    "pass@1": 0.32
  },
  "results": [
    {
      "task_id": "HumanEval/0",
      "passed": true,
      "error": null,
      "generated_code": "..."
    },
    ...
  ]
}
```

### Compare Both Models

```bash
python compare.py --stage stage4
```

**Output files:**
- `evaluation/results/final/control_results.json` - Control model results
- `evaluation/results/final/experiment_results.json` - Experiment model results
- `evaluation/results/final/comparison_report.md` - Human-readable report
- `evaluation/results/final/combined_results.json` - All metrics combined

**Example report:**
```markdown
# HumanEval Evaluation - Comparison Report

## 📊 Overall Results

| Model | Pass@1 | Passed | Failed | Total |
|-------|--------|--------|--------|-------|
| **Control** (no metadata) | 32.0% | 8 | 17 | 25 |
| **Experiment** (with metadata) | 44.0% | 11 | 14 | 25 |

### 🎯 Improvement

- **Absolute improvement:** +12.0 percentage points
- **Relative improvement:** +37.5%

✅ Experiment model outperforms control by 12.0%

## 📈 Statistical Significance

- **p-value:** 0.023
- **Cohen's d:** 0.62
- **Effect size:** medium

✅ **Result is statistically significant** (p < 0.05)

## 🎯 Conclusion

✅ **The experiment model (with .comments metadata) significantly outperforms the control model.**

- Improvement: +12.0 percentage points (+37.5%)
- Statistical significance: p = 0.023 (p < 0.05)
- Effect size: medium (Cohen's d = 0.62)
```

---

## 🔬 MLflow Integration

### Setup MLflow Server

**On Linux server:**
```bash
# Install MLflow
pip install mlflow

# Start server
mlflow server \
  --host 0.0.0.0 \
  --port 5000 \
  --backend-store-uri sqlite:///mlflow.db \
  --default-artifact-root ./mlruns
```

**Access UI:**
```
http://server:5000
```

### Log Evaluation to MLflow

```python
from mlflow_logger import MLflowLogger

# Initialize
logger = MLflowLogger(
    tracking_uri="http://server:5000",
    experiment_name="HumanEval-Evaluation"
)

# Log evaluation
logger.log_evaluation_run(
    run_name="stage4-control-eval",
    model_type="control",
    humaneval_metrics=metrics,
    results_file="evaluation/results/control_results.json"
)
```

**MLflow automatically logs:**
- pass@1, passed, failed, total
- Model type (control/experiment)
- Results JSON as artifact

### View in MLflow UI

1. Open `http://server:5000` in browser
2. Navigate to "HumanEval-Evaluation" experiment
3. Compare runs side-by-side
4. Download artifacts (results JSON, reports)

---

## 📋 Configuration

### Stage 1: Quick Validation (5 samples)

```python
config = get_stage1_eval_config()
# test_file: datasets/control/humaneval_micro.jsonl
# Azure metrics: disabled (save API costs)
# output: evaluation/results/stage1/
```

**Purpose:** Verify evaluation code works before spending on full evaluation.

### Stage 4: Full Evaluation (25 samples)

```python
config = get_stage4_eval_config()
# test_file: datasets/control/test.jsonl
# Azure metrics: enabled (optional)
# output: evaluation/results/final/
```

**Purpose:** Production evaluation with statistical significance.

---

## 🔧 Troubleshooting

### Out of Memory During Evaluation

**Error:** `CUDA out of memory`

**Solution:** Evaluation uses 8-bit quantization (less VRAM than training):
- Estimated VRAM: ~6-8GB
- Close other GPU processes
- Reduce `max_new_tokens` in config

### Code Execution Errors

**Issue:** Generated code fails to execute

**Check:**
1. Syntax errors in generated code
2. Model generating incomplete code
3. Temperature too high (try 0.0 for greedy decoding)

### Statistical Tests Not Significant

**Issue:** Improvement exists but p >= 0.05

**Reasons:**
1. Small sample size (25 test samples may not be enough)
2. High variance in results
3. Actual improvement is small

**Solutions:**
1. Collect more test samples
2. Run multiple evaluations and average
3. Tune model further

---

## 📈 Expected Results

### Baseline Comparisons

**Published HumanEval Results:**

| Model | Pass@1 |
|-------|--------|
| GPT-4 | 67.0% |
| Claude 3.5 Sonnet | 92.0% |
| CodeLlama 13B | 43.3% |
| CodeLlama 7B | 29.9% |
| Llama-3 8B (base) | ~25-30% |

### Our Targets

| Model | Pass@1 | Status |
|-------|--------|--------|
| Control (Llama-3 8B, no metadata) | ~30% | Baseline |
| Experiment (Llama-3 8B + metadata) | **~40-45%** | **Target** |

**If we achieve 40%+:**
- Our 8B model with metadata beats CodeLlama 7B (29.9%) without metadata!
- Shows that metadata can make smaller models competitive with larger ones

---

## 📊 Output Structure

After evaluation:

```
evaluation/
├── results/
│   ├── stage1/                      # Stage 1 (quick)
│   │   ├── control_results.json
│   │   ├── experiment_results.json
│   │   ├── comparison_report.md
│   │   └── combined_results.json
│   └── final/                       # Stage 4 (full)
│       ├── control_results.json     # Control model results
│       ├── experiment_results.json  # Experiment model results
│       ├── comparison_report.md     # Human-readable comparison
│       └── combined_results.json    # All metrics combined
└── mlruns/                          # MLflow artifacts (if enabled)
```

---

## 🚀 Next Steps After Evaluation

### If Results Are Good (Experiment > Control, p < 0.05)

1. **Document Results:**
   - Add to whitepaper
   - Update README with actual metrics
   - Create visualizations

2. **Share Results:**
   - Blog post
   - arXiv preprint
   - GitHub release

3. **Scale Up:**
   - Try with full 164 HumanEval samples
   - Try with other benchmarks (MBPP, CodeContests)
   - Try with larger models (13B, 34B)

### If Results Are Mixed

1. **Analyze Failures:**
   - Which problems failed?
   - Is metadata quality good?
   - Are there patterns in failures?

2. **Iterate:**
   - Improve metadata extraction
   - Tune training hyperparameters
   - Try different metadata formats

3. **Collect More Data:**
   - Larger test set for significance
   - More training examples

### If Results Are Poor (No Improvement)

1. **Debug:**
   - Check metadata is actually included in training
   - Verify model is learning (training loss decreases)
   - Compare generated code quality

2. **Rethink Approach:**
   - Different metadata schema
   - Different training strategy
   - Different model architecture

---

## 💡 Tips

### For Faster Evaluation

- Use Stage 1 (5 samples) first
- Set `temperature=0.0` for deterministic results
- Disable MLflow logging during testing

### For Better Statistical Power

- Increase test set size (use full 164 samples)
- Run multiple evaluations with different seeds
- Use bootstrap confidence intervals

### For Debugging

- Save generated code (`save_predictions=True`)
- Review failed samples manually
- Check if failures are consistent across runs

---

## 📚 References

**HumanEval Paper:**
- https://arxiv.org/abs/2107.03374

**Statistical Tests:**
- Paired t-test: https://en.wikipedia.org/wiki/Student%27s_t-test#Dependent_t-test
- McNemar's test: https://en.wikipedia.org/wiki/McNemar%27s_test
- Cohen's d: https://en.wikipedia.org/wiki/Effect_size#Cohen's_d

**MLflow:**
- https://mlflow.org/docs/latest/index.html

---

**Status:** ✅ Ready to use
**Cost:** Free (no API calls, all local evaluation)
**Time:** ~5-10 minutes per model (25 samples)
