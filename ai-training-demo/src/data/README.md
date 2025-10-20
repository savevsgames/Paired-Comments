# HumanEval Dataset Preparation Scripts

**Purpose:** Download and prepare HumanEval dataset for training comparison.

---

## 📋 Quick Start

### Full Pipeline (Recommended)

```bash
# Install dependencies
pip install datasets

# Run full pipeline
python prepare_datasets.py
```

**Output:**
- 164 HumanEval problems downloaded
- Control dataset (no metadata): 114 train / 25 val / 25 test
- Experiment dataset (with metadata): 114 train / 25 val / 25 test
- Micro datasets (5 samples each) for Stage 1 validation

**Time:** ~5-10 minutes

---

## 📂 Scripts Overview

### 1. `prepare_datasets.py` - Master Pipeline

**Orchestrates all steps:**

```bash
# Full pipeline
python prepare_datasets.py

# Stage 1 validation only (5 samples)
python prepare_datasets.py --stage1

# Skip download (if already downloaded)
python prepare_datasets.py --skip-download
```

**What it does:**
1. Downloads HumanEval from Hugging Face
2. Creates control dataset (conventional code)
3. Creates experiment dataset (code + `.comments` metadata)
4. Splits into train/val/test (70/15/15)
5. Creates micro datasets for Stage 1 validation

---

### 2. `download_humaneval.py` - Download Dataset

**Downloads HumanEval from Hugging Face:**

```bash
python download_humaneval.py
```

**Output:**
- `datasets/humaneval_raw/` - 164 problems

**Fields:**
- `task_id` - HumanEval/0 to HumanEval/163
- `prompt` - Function signature + docstring
- `canonical_solution` - Reference implementation
- `test` - Unit tests
- `entry_point` - Function name

---

### 3. `create_control_dataset.py` - Control Dataset

**Creates baseline dataset (no metadata):**

```bash
python create_control_dataset.py
```

**Output:**
- `datasets/control/humaneval.jsonl` - 164 samples

**Format:**
```json
{
  "task_id": "HumanEval/0",
  "prompt": "def has_close_elements(...):\n    \"\"\"...\"\"\"\n",
  "completion": "    for idx, elem in enumerate(...):\n        ...\n",
  "metadata": {},  // Empty - no .comments metadata
  "test": "def check(candidate): ...",
  "entry_point": "has_close_elements"
}
```

---

### 4. `add_comments_metadata.py` - Experiment Dataset

**Creates experiment dataset with `.comments` metadata:**

```bash
python add_comments_metadata.py
```

**Output:**
- `datasets/experiment/humaneval.jsonl` - 164 samples

**Format:**
```json
{
  "task_id": "HumanEval/0",
  "prompt": "def has_close_elements(...):\n    \"\"\"...\"\"\"\n",
  "completion": "    for idx, elem in enumerate(...):\n        ...\n",
  "metadata": {
    "functionName": "has_close_elements",
    "paramCount": 2,
    "complexity": 2,
    "algorithmType": "nested-loop",
    "timeComplexity": "O(n^2)",
    "spaceComplexity": "O(1)",
    "edgeCases": ["empty list", "single element"],
    "returnType": "bool",
    "validates": "proximity comparison"
  },
  "test": "def check(candidate): ...",
  "entry_point": "has_close_elements"
}
```

**Metadata Extraction:**
- Uses Python AST parsing to extract function metadata
- Estimates cyclomatic complexity (1-5 scale)
- Detects algorithm patterns (loop, recursion, sorting, etc.)
- Analyzes time/space complexity (Big-O)
- Extracts edge cases from test code
- Identifies validation patterns from docstrings

---

### 5. `split_dataset.py` - Train/Val/Test Split

**Splits datasets into train/val/test sets:**

```bash
python split_dataset.py
```

**Output:**
- `datasets/control/train.jsonl` - 114 samples (70%)
- `datasets/control/val.jsonl` - 25 samples (15%)
- `datasets/control/test.jsonl` - 25 samples (15%)
- `datasets/experiment/train.jsonl` - 114 samples (70%)
- `datasets/experiment/val.jsonl` - 25 samples (15%)
- `datasets/experiment/test.jsonl` - 25 samples (15%)
- `datasets/split_info.json` - Split indices (for reproducibility)

**Features:**
- Uses same indices for control and experiment (fair comparison)
- Random seed = 42 (reproducible)
- Saves split indices for reference

---

### 6. `create_micro_dataset.py` - Stage 1 Validation

**Creates tiny dataset for Stage 1 validation:**

```bash
python create_micro_dataset.py
```

**Output:**
- `datasets/control/humaneval_micro.jsonl` - 5 samples
- `datasets/experiment/humaneval_micro.jsonl` - 5 samples

**Purpose:**
- Quick validation (30 min per model)
- Verify code runs without errors
- Fail fast before committing to full training

---

## 📊 Dataset Structure

After running full pipeline:

```
datasets/
├── humaneval_raw/              # Original HumanEval (164 problems)
├── control/
│   ├── humaneval.jsonl         # Full dataset (164 samples)
│   ├── train.jsonl             # Training set (114 samples)
│   ├── val.jsonl               # Validation set (25 samples)
│   ├── test.jsonl              # Test set (25 samples)
│   └── humaneval_micro.jsonl   # Micro dataset (5 samples)
├── experiment/
│   ├── humaneval.jsonl         # Full dataset (164 samples)
│   ├── train.jsonl             # Training set (114 samples)
│   ├── val.jsonl               # Validation set (25 samples)
│   ├── test.jsonl              # Test set (25 samples)
│   └── humaneval_micro.jsonl   # Micro dataset (5 samples)
└── split_info.json             # Split indices
```

---

## 🎯 Usage in Training Pipeline

### Stage 1: Tiny Test (5 samples, 30 min)

```bash
# Train control model
python train.py \
  --dataset datasets/control/humaneval_micro.jsonl \
  --output models/control_stage1

# Train experiment model
python train.py \
  --dataset datasets/experiment/humaneval_micro.jsonl \
  --output models/experiment_stage1
```

### Stage 4: Production (164 samples, 21 hrs per model)

```bash
# Train control model
python train.py \
  --dataset datasets/control/train.jsonl \
  --val_dataset datasets/control/val.jsonl \
  --output models/control_final

# Train experiment model
python train.py \
  --dataset datasets/experiment/train.jsonl \
  --val_dataset datasets/experiment/val.jsonl \
  --output models/experiment_final
```

---

## 🔍 Metadata Fields Explained

### `functionName`
- Function name extracted from AST
- Example: `"has_close_elements"`

### `paramCount`
- Number of parameters
- Example: `2` (for `numbers` and `threshold`)

### `complexity`
- Cyclomatic complexity (1-5 scale)
- 1 = simple, 5 = very complex
- Example: `2` (1 base + 1 if statement)

### `algorithmType`
- Detected pattern:
  - `"loop"` - Single loop
  - `"nested-loop"` - Multiple nested loops
  - `"recursion"` - Recursive calls
  - `"sorting"` - Uses sort/sorted
  - `"search"` - Search patterns
  - `"comparison"` - Comparison logic
  - `"direct"` - Direct computation
- Example: `"nested-loop"`

### `timeComplexity`
- Big-O time complexity
- Example: `"O(n^2)"` (nested loops)

### `spaceComplexity`
- Big-O space complexity
- Example: `"O(1)"` (constant space)

### `edgeCases`
- Extracted from test code
- Example: `["empty list", "single element", "negative numbers"]`

### `returnType`
- Return type annotation
- Example: `"bool"`

### `validates`
- What the function validates/checks
- Example: `"proximity comparison"`

---

## 📈 Expected Results

### Baseline Comparisons (HumanEval Pass@1)

| Model | Pass@1 |
|-------|--------|
| GPT-4 | 67.0% |
| Claude 3.5 Sonnet | 92.0% |
| CodeLlama 7B | 29.9% |
| CodeLlama 13B | 43.3% |
| Llama-3 8B (base) | ~25-30% |

### Our Targets

| Model | Pass@1 | Improvement |
|-------|--------|-------------|
| Control (Llama-3 8B) | ~30% | Baseline |
| Experiment (Llama-3 8B + metadata) | **~40-45%** | **+33-50%** |

**If we hit 40%+:** Our 8B model with metadata beats CodeLlama 7B without metadata!

---

## 🚀 Next Steps

1. ✅ Run `prepare_datasets.py` to create all datasets
2. ⏭️ Review datasets in `datasets/` folder
3. ⏭️ Create training scripts (`src/training/train_qlora.py`)
4. ⏭️ Run Stage 1 validation (5 samples, 30 min)
5. ⏭️ If Stage 1 passes, proceed to Stage 2-3
6. ⏭️ If Stage 3 passes (>10% improvement), run Stage 4 production

---

**Status:** ✅ Ready to use
**Dependencies:** `datasets` (from Hugging Face)
**Total Runtime:** ~5-10 minutes for full pipeline
