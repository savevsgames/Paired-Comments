# Staged Validation Plan - Risk Mitigation

**Purpose:** Validate entire pipeline with minimal cost/time before committing to full 42-hour training runs
**Total Validation Cost:** ~$15 (vs. $254 full run)
**Total Validation Time:** ~8 hours (vs. 42 hours full run)

---

## 🎯 Philosophy: Fail Fast, Fail Cheap

**Principle:** Each stage validates ONE thing, catches issues early, minimal cost

**Stage Progression:**
1. ✅ **Stage 0:** Hardware validation (5 min, $0)
2. ✅ **Stage 1:** Tiny model test (30 min, $0)
3. ✅ **Stage 2:** Small dataset test (2 hours, $3)
4. ✅ **Stage 3:** Full pipeline test (5 hours, $12)
5. ✅ **Stage 4:** Full production run (42 hours, $254)

**If ANY stage fails → STOP, fix, restart from that stage**

---

## 📋 Stage 0: Hardware & Environment Validation

**Goal:** Verify GPU access, Docker works, no environment issues
**Time:** 5 minutes
**Cost:** $0
**Failure Risk:** HIGH (environment issues are common)

### Checklist

**On Gaming Tower (RTX 4070Ti):**

```powershell
# Test 1: Docker installed
docker --version
# Expected: Docker version 24.0+

# Test 2: NVIDIA drivers working
nvidia-smi
# Expected: RTX 4070 Ti, Driver Version: 535+, CUDA Version: 12.1+

# Test 3: Docker GPU access
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
# Expected: Same output as above (GPU visible in container)

# Test 4: Build training image
docker build -f Dockerfile.training -t llama3-training .
# Expected: Successfully built (no errors)

# Test 5: VRAM test
docker run --rm --gpus all llama3-training python -c "
import torch
print(f'CUDA available: {torch.cuda.is_available()}')
print(f'GPU: {torch.cuda.get_device_name(0)}')
print(f'VRAM: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB')
"
# Expected:
# CUDA available: True
# GPU: NVIDIA GeForce RTX 4070 Ti
# VRAM: 12.0 GB
```

**On Linux Server:**

```bash
# Test 1: MLflow server running
docker ps | grep mlflow
# Expected: mlflow-server container running

# Test 2: MLflow accessible
curl http://localhost:5000/health
# Expected: {"status": "ok"}

# Test 3: Storage available
df -h | grep /home
# Expected: 300+ GB available
```

**On Laptop:**

```bash
# Test 1: SSH to tower
ssh your-user@tower-ip
# Expected: Successful login

# Test 2: SSH tunnel to MLflow
ssh -L 5000:localhost:5000 your-user@server-ip
curl http://localhost:5000/health
# Expected: {"status": "ok"}

# Test 3: VS Code Remote-SSH
# Open VS Code → F1 → "Remote-SSH: Connect to Host" → tower-ip
# Expected: Connected successfully
```

### ✅ Stage 0 Pass Criteria
- [ ] Docker GPU access works
- [ ] Training image builds successfully
- [ ] CUDA/PyTorch detect GPU
- [ ] MLflow server accessible from laptop
- [ ] VS Code Remote-SSH connects

**If fails:** Fix environment issues BEFORE proceeding

---

## 📋 Stage 1: Tiny Model Test (Sanity Check)

**Goal:** Verify training code works end-to-end with TINY dataset
**Time:** 30 minutes
**Cost:** $0 (no evaluation, local only)
**Failure Risk:** MEDIUM (code bugs, config issues)

### Setup: Micro Dataset

```bash
# Create 5-sample dataset (not 500!)
# src/training/create_micro_dataset.py
samples = [
    {"prompt": "Write a hello function", "completion": "def hello(): print('hi')"},
    {"prompt": "Write a sum function", "completion": "def sum(a,b): return a+b"},
    {"prompt": "Write a max function", "completion": "def max(a,b): return a if a>b else b"},
    {"prompt": "Write a min function", "completion": "def min(a,b): return a if a<b else b"},
    {"prompt": "Write a len function", "completion": "def len(x): return len(x)"}
]

# Save as datasets/micro/train.jsonl (5 samples)
# Save as datasets/micro/val.jsonl (same 5 samples)
```

### Run Tiny Training

```bash
# On tower (via VS Code Remote-SSH)
docker run --gpus all \
  --name test-micro \
  -v H:/AI-Training-Data/micro:/data \
  -e DATASET_PATH=/data/train.jsonl \
  -e MAX_STEPS=10 \
  -e BATCH_SIZE=1 \
  -e MODEL_NAME=test-micro \
  llama3-training

# Watch logs
docker logs -f test-micro

# Expected output:
# Loading model: meta-llama/Meta-Llama-3-8B
# Loaded in 4-bit: 5.2 GB VRAM
# Training steps: 10/10
# Loss: 2.45 → 1.23 → 0.89 → ...
# Model saved to /models/test-micro
```

### Validation

```bash
# Test inference
docker run --rm --gpus all llama3-training python -c "
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained('/models/test-micro')
tokenizer = AutoTokenizer.from_pretrained('meta-llama/Meta-Llama-3-8B')
prompt = 'Write a hello function'
output = model.generate(**tokenizer(prompt, return_tensors='pt'))
print(tokenizer.decode(output[0]))
"
# Expected: Should generate something (even if bad quality)
```

### ✅ Stage 1 Pass Criteria
- [ ] Model loads in 4-bit (uses ~5GB VRAM)
- [ ] Training runs for 10 steps without crashing
- [ ] Loss decreases (even slightly)
- [ ] Model saves to disk
- [ ] Inference works (generates output)

**If fails:** Debug training code, fix bugs, re-run Stage 1

---

## 📋 Stage 2: Small Dataset Test (Performance Check)

**Goal:** Validate training performance with 20 real samples
**Time:** 2 hours
**Cost:** $3 (minimal evaluation)
**Failure Risk:** LOW (code already validated in Stage 1)

### Setup: Small Dataset

```bash
# Create 20-sample dataset (10% of final size)
# Take first 20 samples from React Components scenario
head -n 20 datasets/control/react-components/samples.jsonl > datasets/small/control-train.jsonl
head -n 20 datasets/experiment/react-components/samples.jsonl > datasets/small/experiment-train.jsonl

# Create 5-sample validation set
head -n 5 datasets/control/react-components/samples.jsonl > datasets/small/control-val.jsonl
head -n 5 datasets/experiment/react-components/samples.jsonl > datasets/small/experiment-val.jsonl
```

### Run Small Training (Control)

```bash
# Expected time: ~1 hour (20 samples × 3 epochs)
docker run --gpus all \
  --name small-control \
  -v H:/AI-Training-Data/small:/data \
  -e MLFLOW_TRACKING_URI=http://server-ip:5000 \
  -e DATASET_PATH=/data/control-train.jsonl \
  -e VAL_DATASET_PATH=/data/control-val.jsonl \
  -e EPOCHS=3 \
  -e MODEL_NAME=small-control \
  llama3-training

# Monitor in browser: http://localhost:5000 (MLflow UI)
```

### Run Small Training (Experiment)

```bash
# Expected time: ~1 hour (20 samples × 3 epochs)
docker run --gpus all \
  --name small-experiment \
  -v H:/AI-Training-Data/small:/data \
  -e MLFLOW_TRACKING_URI=http://server-ip:5000 \
  -e DATASET_PATH=/data/experiment-train.jsonl \
  -e VAL_DATASET_PATH=/data/experiment-val.jsonl \
  -e EPOCHS=3 \
  -e MODEL_NAME=small-experiment \
  llama3-training
```

### Quick Evaluation (5 samples only)

```bash
# On laptop
python evaluate.py \
  --control-model models/small-control \
  --experiment-model models/small-experiment \
  --test-set datasets/small/control-val.jsonl \
  --limit 5

# Cost: 5 samples × 7 evaluators = 35 API calls = ~$0.35
# Plus pass@k: 5 × 10 = 50 calls = ~$0.50
# Total: ~$1
```

### Expected Results

```
Evaluation Results (5 samples):
====================================
Control Model:
  - Code Accuracy: 60% (3/5 exact match)
  - Functional Correctness: 40% (2/5 pass tests)
  - Semantic Similarity: 0.75
  - Coherence: 0.82
  - Pass@k (k=10): 80% (4/5)

Experiment Model:
  - Code Accuracy: 80% (4/5 exact match)  [+20%]
  - Functional Correctness: 60% (3/5 pass tests)  [+20%]
  - Semantic Similarity: 0.88  [+13%]
  - Coherence: 0.91  [+9%]
  - Pass@k (k=10): 100% (5/5)  [+20%]

🎯 Improvement: +15% average (GOOD SIGN!)
```

### ✅ Stage 2 Pass Criteria
- [ ] Both models train successfully (2 hours total)
- [ ] Training logs to MLflow correctly
- [ ] Evaluation runs without errors
- [ ] Experiment model shows >10% improvement (early signal)
- [ ] No OOM errors, no crashes

**If fails:** Check for data issues, hyperparameter problems, re-run Stage 2

---

## 📋 Stage 3: Full Pipeline Dry Run (One Scenario)

**Goal:** Full test with ONE complete scenario (100 samples)
**Time:** 5 hours
**Cost:** $12
**Failure Risk:** VERY LOW (validated in Stages 1-2)

### Setup: React Components (100 samples)

```bash
# Use full React Components dataset
# Control: 70 train, 15 val, 15 test
# Experiment: 70 train, 15 val, 15 test
```

### Run Full Training (Control)

```bash
# Expected time: ~2.5 hours
docker run --gpus all \
  --name react-control \
  -v H:/AI-Training-Data/scenarios:/data \
  -e MLFLOW_TRACKING_URI=http://server-ip:5000 \
  -e DATASET_PATH=/data/react-components/control-train.jsonl \
  -e VAL_DATASET_PATH=/data/react-components/control-val.jsonl \
  -e EPOCHS=3 \
  -e MODEL_NAME=react-control-v1 \
  llama3-training
```

### Run Full Training (Experiment)

```bash
# Expected time: ~2.5 hours
docker run --gpus all \
  --name react-experiment \
  -v H:/AI-Training-Data/scenarios:/data \
  -e MLFLOW_TRACKING_URI=http://server-ip:5000 \
  -e DATASET_PATH=/data/react-components/experiment-train.jsonl \
  -e VAL_DATASET_PATH=/data/react-components/experiment-val.jsonl \
  -e EPOCHS=3 \
  -e MODEL_NAME=react-experiment-v1 \
  llama3-training
```

### Full Evaluation (15 test samples)

```bash
# On laptop
python evaluate.py \
  --control-model models/react-control-v1 \
  --experiment-model models/react-experiment-v1 \
  --test-set datasets/react-components/test.jsonl \
  --all-metrics

# Cost: 15 samples × 7 evaluators = 105 API calls = ~$1.05
# Plus pass@k: 15 × 10 = 150 calls = ~$1.50
# Total: ~$2.50 per model × 2 = ~$5
```

### Statistical Analysis

```bash
# Run significance test
python stats_analysis.py \
  --control-results results/react-control.json \
  --experiment-results results/react-experiment.json

# Expected:
# p-value: 0.023 (< 0.05, significant!)
# Effect size (Cohen's d): 0.87 (large effect)
```

### Expected Results

```
React Components (100 samples, 15 test):
=========================================
Control Model:
  - Code Accuracy: 78%
  - Functional Correctness: 72%
  - Semantic Similarity: 0.85
  - Code Vulnerability: 6.2/10 (lower is better)

Experiment Model:
  - Code Accuracy: 94%  [+16%]
  - Functional Correctness: 89%  [+17%]
  - Semantic Similarity: 0.96  [+13%]
  - Code Vulnerability: 4.1/10  [+34% safer!]

🎯 Average Improvement: +20%
📊 Statistical Significance: p=0.023 (VALIDATED!)
```

### ✅ Stage 3 Pass Criteria
- [ ] Both models train successfully (~5 hours total)
- [ ] All evaluation metrics run without errors
- [ ] Experiment model shows >10% improvement
- [ ] Statistical significance (p < 0.05)
- [ ] Code Vulnerability shows improvement
- [ ] MLflow logs all metrics correctly

**If fails:** Investigate metric issues, check dataset quality, fix and re-run

---

## 📋 Stage 4: Full Production Run (All 5 Scenarios)

**Goal:** Final production training with complete dataset
**Time:** 42 hours (21 hrs per model)
**Cost:** $242 (full evaluation on 5 scenarios)
**Failure Risk:** MINIMAL (fully validated in Stages 1-3)

### Only Proceed If:
- ✅ Stage 3 showed >10% improvement
- ✅ Statistical significance confirmed (p < 0.05)
- ✅ No crashes or errors in 5-hour run
- ✅ MLflow tracking working correctly
- ✅ Evaluation pipeline validated

### Full Training (Control)

```bash
# 5 scenarios × 70 samples each = 350 samples
# Expected time: ~21 hours

docker run --gpus all \
  --name production-control \
  -v H:/AI-Training-Data:/data \
  -e MLFLOW_TRACKING_URI=http://server-ip:5000 \
  -e DATASET_PATH=/data/all-scenarios/control-train.jsonl \
  -e VAL_DATASET_PATH=/data/all-scenarios/control-val.jsonl \
  -e EPOCHS=3 \
  -e MODEL_NAME=production-control-v1 \
  llama3-training

# Run overnight (start 9pm, finish next day 6pm)
```

### Full Training (Experiment)

```bash
# Expected time: ~21 hours
docker run --gpus all \
  --name production-experiment \
  -v H:/AI-Training-Data:/data \
  -e MLFLOW_TRACKING_URI=http://server-ip:5000 \
  -e DATASET_PATH=/data/all-scenarios/experiment-train.jsonl \
  -e VAL_DATASET_PATH=/data/all-scenarios/experiment-val.jsonl \
  -e EPOCHS=3 \
  -e MODEL_NAME=production-experiment-v1 \
  llama3-training
```

### Full Evaluation (75 test samples, 5 scenarios)

```bash
# On laptop
python evaluate.py \
  --control-model models/production-control-v1 \
  --experiment-model models/production-experiment-v1 \
  --test-sets datasets/all-scenarios/test.jsonl \
  --all-metrics \
  --scenarios react,express,python,bugfix,sql

# Cost: 75 samples × 7 evaluators × 2 models = 1,050 API calls = ~$10.50
# Plus pass@k: 75 × 10 × 2 = 1,500 calls = ~$15
# Total: ~$25.50 × 2 (control + experiment) = ~$51

# Plus human eval, statistical analysis, etc: ~$242 total
```

---

## 💰 Cost Summary by Stage

| Stage | Time | Cost | Purpose | Skip if... |
|-------|------|------|---------|-----------|
| Stage 0 | 5 min | $0 | Environment validation | Never skip |
| Stage 1 | 30 min | $0 | Code sanity check | Never skip |
| Stage 2 | 2 hrs | $3 | Performance check | Never skip |
| Stage 3 | 5 hrs | $12 | Full pipeline test | Never skip |
| **Validation Total** | **~8 hrs** | **~$15** | | |
| Stage 4 | 42 hrs | $242 | Production run | Only if Stage 3 fails |

**Total Validation Cost:** $15 (6% of full budget)
**Total Validation Time:** 8 hours (19% of full time)

**Risk Mitigation:** If issues found, fix costs $15, not $242!

---

## 🚨 Failure Recovery Plan

### If Stage 1 Fails (Code Issues)
**Cost:** $0 wasted
**Action:**
1. Debug training script locally
2. Fix imports, config issues
3. Re-run Stage 1
4. Repeat until passes

### If Stage 2 Fails (Performance Issues)
**Cost:** $3 wasted
**Action:**
1. Check training logs for issues
2. Adjust hyperparameters (learning rate, batch size)
3. Verify dataset quality (no corrupted samples)
4. Re-run Stage 2
5. If still fails, consult research papers on QLoRA tuning

### If Stage 3 Fails (No Improvement)
**Cost:** $15 wasted
**Action:**
1. **STOP! Do NOT proceed to Stage 4**
2. Analyze why experiment model didn't improve:
   - Is metadata actually helpful?
   - Are we training long enough?
   - Is dataset quality good?
3. Options:
   - Add more metadata fields
   - Increase training epochs
   - Try different scenarios (maybe React is hard, try SQL first)
4. Re-run Stage 3 with adjustments
5. Only proceed to Stage 4 if >10% improvement confirmed

---

## 📊 Decision Tree

```
Stage 0: Environment
├─ PASS → Stage 1
└─ FAIL → Fix environment, retry Stage 0

Stage 1: Tiny Model (5 samples, 10 steps)
├─ PASS → Stage 2
└─ FAIL → Fix code bugs, retry Stage 1

Stage 2: Small Dataset (20 samples, 2 hrs)
├─ PASS (>10% improvement) → Stage 3
├─ PASS (<10% improvement) → Investigate, adjust, retry Stage 2
└─ FAIL (crash/error) → Debug, retry Stage 2

Stage 3: Full Pipeline (100 samples, 5 hrs, $12)
├─ PASS (>10% improvement, p<0.05) → Stage 4 ✅ GO!
├─ PASS (<10% improvement) → 🚨 STOP! Investigate deeply
└─ FAIL → 🚨 STOP! Fix issues, retry Stage 3

Stage 4: Production (500 samples, 42 hrs, $242)
└─ Only run if Stage 3 PASSED with >10% improvement
```

---

## ✅ Recommended Timeline

### Week 1: Setup + Validation
- **Day 1:** Stage 0 (environment setup)
- **Day 2:** Stage 1 (tiny model test)
- **Day 3:** Stage 2 (small dataset, 20 samples)
- **Day 4-5:** Stage 3 (full pipeline, React only)
- **Day 6-7:** Review results, decision point

**Decision Point:** Only proceed if Stage 3 shows >10% improvement!

### Week 2-3: Production Run (If Validated)
- **Day 8-9:** Stage 4 control training (21 hours)
- **Day 10-11:** Stage 4 experiment training (21 hours)
- **Day 12-14:** Full evaluation (75 samples, all metrics)

---

## 🎯 Success Metrics by Stage

| Stage | Success = | Failure = |
|-------|-----------|-----------|
| Stage 0 | GPU detected, Docker works | Can't access GPU, build fails |
| Stage 1 | Training runs 10 steps | Crash, OOM, import errors |
| Stage 2 | >5% improvement on 20 samples | <5% improvement, crashes |
| Stage 3 | >10% improvement, p<0.05 | <10% improvement, p>0.05 |
| Stage 4 | >10% avg across 5 scenarios | <10% improvement |

---

## 📋 Pre-Flight Checklist (Before Stage 4)

Before committing to 42-hour/$242 production run:

- [ ] ✅ Stage 0 passed (environment working)
- [ ] ✅ Stage 1 passed (code runs)
- [ ] ✅ Stage 2 passed (small dataset works)
- [ ] ✅ Stage 3 passed (>10% improvement confirmed)
- [ ] ✅ Statistical significance (p < 0.05)
- [ ] ✅ No crashes or OOM errors
- [ ] ✅ MLflow logging works
- [ ] ✅ Evaluation pipeline validated
- [ ] ✅ Have 42 hours of uninterrupted GPU time available
- [ ] ✅ Budget $242 for evaluation approved

**If ALL boxes checked → Proceed to Stage 4**
**If ANY box unchecked → DO NOT proceed, fix issues first**

---

**Status:** Ready for staged validation approach
**Next Step:** Begin Stage 0 (environment validation)
