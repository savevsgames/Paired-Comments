# Dataset Preparation Guide

**Version:** 0.1.0
**Phase:** 1 of 5 (Weeks 1-2)

---

## 🎯 Goal

Create high-quality training datasets that demonstrate measurable improvements when models are trained with `.comments` metadata vs. conventional code alone.

**Target:** 500 total code samples (100 per scenario × 5 scenarios)

---

## 📋 Dataset Requirements

### Quality Standards
- ✅ **Syntactically valid** - Must compile/parse without errors
- ✅ **Production-grade** - Real-world code, not toy examples
- ✅ **Well-documented** - Control samples have inline comments
- ✅ **Metadata-rich** - Experiment samples have comprehensive `.comments`
- ✅ **Diverse** - Multiple coding styles, libraries, patterns
- ✅ **Licensed** - Only MIT/Apache/BSD licensed repos (public domain)

### Metadata Completeness (Experiment Dataset Only)
Each `.comments` file must include:
- ✅ **params** - At least 2 dynamic parameters (e.g., `functionName`, `paramCount`)
- ✅ **aiMeta** - Complexity, type info, edge cases, dependencies
- ✅ **output** (if applicable) - Expected return value, type, validation
- ✅ **author** - "ai-trainer" or model name (e.g., "gpt-4")
- ✅ **tag** - NOTE, TODO, or STAR (for categorization)

---

## 📊 Dataset Structure

### Directory Layout
```
datasets/
├── control/                    # Conventional code only
│   ├── react-components/
│   │   ├── sample-001.jsonl
│   │   ├── sample-002.jsonl
│   │   └── ...
│   ├── express-api/
│   ├── python-pipeline/
│   ├── bug-fixes/
│   └── sql-queries/
├── experiment/                 # Code + .comments metadata
│   ├── react-components/
│   │   ├── sample-001.jsonl
│   │   ├── sample-002.jsonl
│   │   └── ...
│   ├── express-api/
│   ├── python-pipeline/
│   ├── bug-fixes/
│   └── sql-queries/
└── splits/                     # Train/validation/test splits
    ├── train.jsonl             # 70% (350 samples)
    ├── validation.jsonl        # 15% (75 samples)
    └── test.jsonl              # 15% (75 samples)
```

---

## 🔧 Data Preparation Workflow

### Step 1: Source Selection (Week 1, Days 1-2)

**Goal:** Identify 20-30 high-quality open-source repositories

**Criteria:**
- Popular repos (>5K stars on GitHub)
- Active maintenance (commits within last 6 months)
- Good documentation
- Clean code style (passes linter)
- Permissive license (MIT, Apache 2.0, BSD)

**Recommended Repos by Scenario:**

**React Components:**
- [radix-ui/primitives](https://github.com/radix-ui/primitives)
- [shadcn/ui](https://github.com/shadcn/ui)
- [mui/material-ui](https://github.com/mui/material-ui)

**Express.js API:**
- [gothinkster/realworld](https://github.com/gothinkster/realworld)
- [nestjs/nest](https://github.com/nestjs/nest)
- [strapi/strapi](https://github.com/strapi/strapi)

**Python Data Pipeline:**
- [apache/airflow](https://github.com/apache/airflow)
- [dagster-io/dagster](https://github.com/dagster-io/dagster)
- [great-expectations/great_expectations](https://github.com/great-expectations/great_expectations)

**Bug Fixes:**
- Mine from GitHub Issues (closed, with PR fixes)
- Example: React bug fixes, TypeScript type errors

**SQL Queries:**
- [sqlfluff/sqlfluff](https://github.com/sqlfluff/sqlfluff) test cases
- [dbt-labs/dbt-core](https://github.com/dbt-labs/dbt-core) examples

---

### Step 2: Sample Extraction (Week 1, Days 3-5)

**Goal:** Extract 100 code samples per scenario

**Process:**
1. Clone repository locally
2. Identify well-structured functions/classes (100-300 LOC)
3. Extract function + surrounding context (±5 lines)
4. Create prompt (e.g., "Create a React button component with variants")
5. Record expected completion (the actual code)

**Automation Script:**
```bash
# extract-samples.sh
#!/bin/bash

REPO_PATH="/path/to/repo"
OUTPUT_DIR="datasets/raw"

# Find all TypeScript files with exported functions
rg "export (function|const)" "$REPO_PATH" -l --type ts | while read -r file; do
  # Extract function signatures
  ast-grep --pattern "export function $NAME($$$) { $$$ }" "$file" > "$OUTPUT_DIR/$(basename $file).json"
done
```

---

### Step 3: Control Dataset Creation (Week 1, Days 6-7)

**Goal:** Create conventional code samples (NO metadata)

**Format (JSONL):**
```json
{
  "prompt": "Create a React button component with variants (primary, secondary, danger)",
  "completion": "import React from 'react';\n\ntype ButtonVariant = 'primary' | 'secondary' | 'danger';\n\ninterface ButtonProps {\n  variant: ButtonVariant;\n  children: React.ReactNode;\n  onClick?: () => void;\n}\n\n// Primary button uses brand colors, secondary uses gray, danger uses red\nexport function Button({ variant, children, onClick }: ButtonProps) {\n  const baseClasses = 'px-4 py-2 rounded font-medium';\n  const variantClasses = {\n    primary: 'bg-blue-600 text-white hover:bg-blue-700',\n    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',\n    danger: 'bg-red-600 text-white hover:bg-red-700'\n  };\n\n  return (\n    <button\n      className={`${baseClasses} ${variantClasses[variant]}`}\n      onClick={onClick}\n    >\n      {children}\n    </button>\n  );\n}",
  "metadata": {},
  "sourceContext": {
    "beforeLines": ["import React from 'react';", ""],
    "afterLines": ["", "export default Button;"]
  }
}
```

**Key Point:** `metadata` field is EMPTY (or null) for control dataset

---

### Step 4: Experiment Dataset Creation (Week 2, Days 1-3)

**Goal:** Augment same samples with rich `.comments` metadata

**Process:**
1. Start with control sample
2. Add `.comments` file with params + aiMeta
3. Export using MCP server: `export_comments(format: "jsonl", includeSourceContext: true)`
4. Verify metadata completeness

**Format (JSONL with metadata):**
```json
{
  "prompt": "Create a React button component with variants (primary, secondary, danger)",
  "completion": "import React from 'react';\n\ntype ButtonVariant = 'primary' | 'secondary' | 'danger';\n\ninterface ButtonProps {\n  variant: ButtonVariant;\n  children: React.ReactNode;\n  onClick?: () => void;\n}\n\nexport function Button({ variant, children, onClick }: ButtonProps) {\n  const baseClasses = 'px-4 py-2 rounded font-medium';\n  const variantClasses = {\n    primary: 'bg-blue-600 text-white hover:bg-blue-700',\n    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',\n    danger: 'bg-red-600 text-white hover:bg-red-700'\n  };\n\n  return (\n    <button\n      className={`${baseClasses} ${variantClasses[variant]}`}\n      onClick={onClick}\n    >\n      {children}\n    </button>\n  );\n}",
  "metadata": {
    "componentType": "Button",
    "propCount": 3,
    "variantCount": 3,
    "complexity": 2,
    "a11y": false,
    "responsive": true,
    "dependencies": ["react", "tailwindcss"],
    "stateManagement": "none",
    "patterns": ["composition", "variant-pattern"]
  },
  "params": {
    "componentType": {
      "value": "Button",
      "type": "dynamic",
      "source": "function.name"
    },
    "propCount": {
      "value": 3,
      "type": "computed",
      "source": "aiMeta.paramCount"
    }
  },
  "output": {
    "type": "ReactComponent",
    "returns": "JSX.Element",
    "validation": "propTypes or TypeScript"
  },
  "sourceContext": {
    "beforeLines": ["import React from 'react';", ""],
    "afterLines": ["", "export default Button;"]
  }
}
```

**MCP Server Export Command:**
```bash
# Using Claude Desktop MCP integration
# Or via MCP Inspector

# In Claude:
"Export all comments from src/components/Button.tsx as JSONL training data with 5 lines of context"

# Programmatic API:
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "export_comments",
    "params": {
      "format": "jsonl",
      "filePath": "src/components/Button.tsx",
      "options": {
        "includeSourceContext": true,
        "contextLines": 5
      }
    }
  }'
```

---

### Step 5: Quality Validation (Week 2, Days 4-5)

**Goal:** Ensure 100% dataset quality before training

**Automated Checks:**
```bash
# Syntax validation
npm run lint datasets/control/**/*.jsonl
npm run lint datasets/experiment/**/*.jsonl

# Metadata completeness check
python scripts/validate-metadata.py datasets/experiment/

# Type checking
tsc --noEmit datasets/**/*.ts

# Duplicate detection
python scripts/find-duplicates.py datasets/
```

**Manual Review:**
- 2 reviewers per sample (pair review)
- Check for:
  - Code quality (readability, best practices)
  - Prompt clarity (unambiguous task description)
  - Metadata accuracy (correct complexity, dependencies)
  - Completeness (no TODO comments, no partial code)

**Review Checklist:**
```markdown
Sample ID: react-components-042

- [ ] Code compiles without errors
- [ ] Prompt is clear and specific
- [ ] Completion matches prompt exactly
- [ ] Control sample has NO metadata
- [ ] Experiment sample has complete metadata (params + aiMeta)
- [ ] Source context is relevant (±5 lines)
- [ ] No PII (names, emails, API keys)
- [ ] License is permissive (MIT/Apache/BSD)

Reviewer 1: ____________ Date: _______
Reviewer 2: ____________ Date: _______
```

---

### Step 6: Dataset Splitting (Week 2, Day 6)

**Goal:** Split into train/validation/test sets (70/15/15)

**Stratified Splitting:**
- Ensure balanced distribution across scenarios
- Each split should have ~20% from each scenario
- Randomized but reproducible (set seed)

**Script:**
```python
# scripts/split-dataset.py
import json
import random
from pathlib import Path

random.seed(42)  # Reproducible splits

def split_dataset(input_dir, output_dir, split_ratios=(0.7, 0.15, 0.15)):
    samples = []

    # Load all JSONL samples
    for jsonl_file in Path(input_dir).rglob("*.jsonl"):
        with open(jsonl_file) as f:
            for line in f:
                sample = json.loads(line)
                sample['scenario'] = jsonl_file.parent.name
                samples.append(sample)

    # Shuffle
    random.shuffle(samples)

    # Split
    n = len(samples)
    train_end = int(n * split_ratios[0])
    val_end = train_end + int(n * split_ratios[1])

    train = samples[:train_end]
    val = samples[train_end:val_end]
    test = samples[val_end:]

    # Write splits
    for split_name, split_data in [('train', train), ('validation', val), ('test', test)]:
        output_file = Path(output_dir) / f"{split_name}.jsonl"
        with open(output_file, 'w') as f:
            for sample in split_data:
                f.write(json.dumps(sample) + '\n')

    print(f"Train: {len(train)}, Validation: {len(val)}, Test: {len(test)}")

# Run for both control and experiment
split_dataset("datasets/control", "datasets/splits/control")
split_dataset("datasets/experiment", "datasets/splits/experiment")
```

**Output:**
```
datasets/splits/
├── control/
│   ├── train.jsonl       (350 samples)
│   ├── validation.jsonl  (75 samples)
│   └── test.jsonl        (75 samples)
└── experiment/
    ├── train.jsonl       (350 samples)
    ├── validation.jsonl  (75 samples)
    └── test.jsonl        (75 samples)
```

---

### Step 7: Upload to Azure Blob Storage (Week 2, Day 7)

**Goal:** Make datasets accessible to Azure ML training pipelines

**Azure CLI Upload:**
```bash
# Install Azure CLI
az login

# Create storage account
az storage account create \
  --name pairedcommentsdata \
  --resource-group paired-comments-rg \
  --location eastus \
  --sku Standard_LRS

# Create container
az storage container create \
  --name datasets \
  --account-name pairedcommentsdata

# Upload splits
az storage blob upload-batch \
  --source datasets/splits/control \
  --destination datasets/control \
  --account-name pairedcommentsdata

az storage blob upload-batch \
  --source datasets/splits/experiment \
  --destination datasets/experiment \
  --account-name pairedcommentsdata
```

---

## 📊 Dataset Statistics

After completion, generate summary report:

```
Dataset Summary Report
======================

Total Samples: 500
├── React Components: 100 (20%)
├── Express.js API: 100 (20%)
├── Python Pipeline: 100 (20%)
├── Bug Fixes: 100 (20%)
└── SQL Queries: 100 (20%)

Split Distribution:
├── Train: 350 (70%)
├── Validation: 75 (15%)
└── Test: 75 (15%)

Control Dataset:
├── Total tokens: ~1.2M
├── Avg sample length: 150 LOC
├── Metadata fields: 0 (baseline)

Experiment Dataset:
├── Total tokens: ~1.5M
├── Avg sample length: 150 LOC (code) + metadata
├── Metadata fields: 8-12 per sample
├── Avg params per sample: 3.2
├── Avg aiMeta fields: 7.5

Quality Metrics:
├── Syntax errors: 0%
├── Missing metadata: 0%
├── Manual review pass rate: 100%
└── License compliance: 100% (MIT/Apache/BSD)
```

---

## 🎯 Success Criteria

- [ ] **500 total samples** (100 per scenario)
- [ ] **Zero syntax errors** (all code compiles)
- [ ] **100% metadata completeness** (experiment dataset)
- [ ] **Manual review complete** (2 reviewers per sample)
- [ ] **Uploaded to Azure Blob Storage**
- [ ] **Splits are balanced** (stratified by scenario)

---

**Phase 1 Complete:** Ready for Phase 2 (Training Pipeline)
