# QLoRA Fine-tuning for HumanEval

**Purpose:** Train Llama-3 8B with 4-bit quantization on HumanEval dataset.

---

## 📋 Quick Start

### Prerequisites

1. **GPU Requirements:**
   - CUDA-capable GPU with at least 10GB VRAM
   - Recommended: RTX 4070Ti (12GB VRAM)

2. **Install Dependencies:**
```bash
# From ai-training-demo root
cd H:\CommentsExtension\ai-training-demo

# Activate virtual environment
source venv/Scripts/activate  # Linux/Mac
# or
venv\Scripts\activate.bat  # Windows

# Install training dependencies
pip install -r requirements.txt
```

**Note:** Installing PyTorch with CUDA support may take 10-15 minutes.

3. **Prepare Datasets:**
```bash
cd src/data
python prepare_datasets.py
```

---

## 🚀 Running Training

### Stage 1: Validation (5 samples, ~30 min)

**Purpose:** Verify code runs without errors before committing to 21-hour run.

```bash
cd src/training

# Quick start (trains both models)
./run_stage1.sh  # Linux/Mac
run_stage1.bat   # Windows

# Or manually
python train.py --stage stage1 --experiment-type control
python train.py --stage stage1 --experiment-type experiment
```

**Expected output:**
- Control model: `outputs/stage1/control/`
- Experiment model: `outputs/stage1/experiment/`
- Each ~200MB LoRA adapter

### Stage 4: Production (164 samples, ~21 hrs per model)

**Only run after Stage 1-3 validation passes!**

```bash
cd src/training

# Control model (no metadata)
python train.py --stage stage4 --experiment-type control

# Experiment model (with .comments metadata)
python train.py --stage stage4 --experiment-type experiment
```

**Expected output:**
- Final models: `outputs/final/control/` and `outputs/final/experiment/`
- Each ~200MB LoRA adapter
- Training logs in `outputs/final/*/logs/`

---

## 📂 File Overview

### Core Scripts

**`config.py`** - Training configuration
- `ModelConfig` - Model and LoRA settings
- `TrainingConfig` - Hyperparameters
- `DataConfig` - Dataset paths
- `ExperimentConfig` - Experiment tracking
- Preset configs for Stage 1 and Stage 4

**`dataset.py`** - HumanEval dataset loader
- `HumanEvalDataset` - PyTorch Dataset class
- Handles both control (no metadata) and experiment (with metadata)
- Formats metadata as comment-style annotations

**`train.py`** - Main training script
- Loads model with 4-bit quantization
- Applies LoRA adapters
- Trains with HuggingFace Trainer
- Saves checkpoints and final model

### Helper Scripts

**`run_stage1.sh`/`.bat`** - Quick start for Stage 1 validation
- Trains both control and experiment models
- Checks for required datasets
- Provides next steps after completion

---

## ⚙️ Configuration Details

### Model Configuration

```python
# Default settings (12GB VRAM)
model_name = "meta-llama/Meta-Llama-3-8B"
load_in_4bit = True  # 4-bit quantization
lora_r = 16  # LoRA rank
lora_alpha = 32  # LoRA scaling
max_seq_length = 2048  # Max tokens
```

**Estimated VRAM usage:** ~8-10GB

### Training Configuration

```python
# Stage 1 (5 samples)
num_epochs = 1
batch_size = 1
gradient_accumulation = 1
time: ~30 minutes

# Stage 4 (164 samples)
num_epochs = 3
batch_size = 1
gradient_accumulation = 4
time: ~21 hours per model
```

### Dataset Configuration

**Control dataset (no metadata):**
```json
{
  "prompt": "def has_close_elements(...):\n    \"\"\"...\"\"\"\n",
  "completion": "    for idx, elem in enumerate(...):\n        ...\n",
  "metadata": {}
}
```

**Experiment dataset (with metadata):**
```json
{
  "prompt": "def has_close_elements(...):\n    \"\"\"...\"\"\"\n",
  "completion": "    for idx, elem in enumerate(...):\n        ...\n",
  "metadata": {
    "functionName": "has_close_elements",
    "algorithmType": "nested-loop",
    "timeComplexity": "O(n^2)",
    "spaceComplexity": "O(1)",
    ...
  }
}
```

Metadata is prepended as comments:
```python
# .comments metadata
# @function has_close_elements
# @algorithm nested-loop
# @time O(n^2)
# @space O(1)

def has_close_elements(...):
    ...
```

---

## 📊 Monitoring Training

### TensorBoard

View real-time training metrics:

```bash
# Control model
tensorboard --logdir outputs/stage1/control/logs

# Experiment model
tensorboard --logdir outputs/stage1/experiment/logs

# Open browser to http://localhost:6006
```

**Metrics to watch:**
- `train/loss` - Training loss (should decrease)
- `eval/loss` - Validation loss (should decrease)
- `train/learning_rate` - Learning rate schedule
- `train/grad_norm` - Gradient norm (should be stable)

### GPU Monitoring

Monitor GPU usage during training:

```bash
# Watch GPU usage
watch -n 1 nvidia-smi

# Look for:
# - GPU utilization: ~80-100% (training actively)
# - Memory usage: <12GB (for RTX 4070Ti)
# - Temperature: <85°C (safe range)
```

---

## 🔧 Troubleshooting

### Out of Memory (OOM)

**Error:** `CUDA out of memory`

**Solutions:**
1. Reduce `max_seq_length` in `config.py`:
   ```python
   max_seq_length = 1024  # Down from 2048
   ```

2. Enable gradient checkpointing (already enabled by default):
   ```python
   gradient_checkpointing = True
   ```

3. Reduce LoRA rank:
   ```python
   lora_r = 8  # Down from 16
   ```

### Slow Training

**Issue:** Training takes longer than expected

**Check:**
1. GPU is being used: `nvidia-smi` shows high utilization
2. Mixed precision enabled: `fp16=True` in config
3. Gradient accumulation working: Check logs for effective batch size

### Model Not Learning

**Issue:** Loss not decreasing

**Check:**
1. Learning rate: Try `2e-4` to `5e-4`
2. Data loading: Verify samples are loaded correctly
3. Tokenization: Check samples aren't mostly padding

---

## 📈 Expected Results

### Training Metrics

**Stage 1 (5 samples):**
- Initial loss: ~2.5-3.0
- Final loss: ~1.5-2.0
- Purpose: Code validation only (not meaningful results)

**Stage 4 (164 samples):**
- Initial loss: ~2.5-3.0
- Final loss: ~1.0-1.5
- Validation loss should track training loss closely

### Performance Targets

**HumanEval Pass@1 (after training):**

| Model | Pass@1 | Target |
|-------|--------|--------|
| Control (no metadata) | ~30% | Baseline |
| Experiment (with metadata) | ~40-45% | **+33-50%** |

**If experiment model achieves 40%+:** We've shown that metadata makes an 8B model competitive with CodeLlama 13B (43.3%)!

---

## 🗂️ Output Structure

After training:

```
outputs/
├── stage1/                      # Stage 1 validation
│   ├── control/
│   │   ├── final_model/         # Final LoRA adapter (~200MB)
│   │   ├── checkpoint-*/        # Intermediate checkpoints
│   │   └── logs/                # TensorBoard logs
│   └── experiment/
│       ├── final_model/
│       ├── checkpoint-*/
│       └── logs/
└── final/                       # Stage 4 production
    ├── control/
    │   ├── final_model/
    │   ├── checkpoint-*/
    │   └── logs/
    └── experiment/
        ├── final_model/
        ├── checkpoint-*/
        └── logs/
```

---

## 🔄 Resume Training

If training is interrupted:

```bash
python train.py \
    --stage stage4 \
    --experiment-type control \
    --resume-from-checkpoint outputs/final/control/checkpoint-100
```

Checkpoints are saved every 100 steps by default.

---

## 🚀 Next Steps After Training

1. **Evaluate Models:**
   ```bash
   cd ../evaluation
   python evaluate.py --model outputs/final/control/final_model
   python evaluate.py --model outputs/final/experiment/final_model
   ```

2. **Compare Results:**
   - Run HumanEval evaluation harness
   - Calculate Pass@1, Pass@10, Pass@100
   - Statistical significance testing

3. **Iterate:**
   - If results are good: Scale to full dataset
   - If results are poor: Adjust hyperparameters, try Stage 2/3

---

## 💡 Tips

### For Faster Iteration

- Use Stage 1 (5 samples) to test configuration changes
- Only run Stage 4 when confident in setup

### For Better Results

- Increase `num_epochs` if underfitting
- Increase `lora_r` for more capacity (uses more VRAM)
- Tune `learning_rate` if loss plateaus

### For Memory Constraints

- Reduce `max_seq_length` to 1024
- Reduce `lora_r` to 8
- Use gradient checkpointing (enabled by default)

---

## 📚 References

**QLoRA Paper:**
- https://arxiv.org/abs/2305.14314

**PEFT (LoRA) Documentation:**
- https://huggingface.co/docs/peft

**Llama-3 Model Card:**
- https://huggingface.co/meta-llama/Meta-Llama-3-8B

---

**Status:** ✅ Ready to use
**Hardware:** RTX 4070Ti (12GB VRAM)
**Time:** 30 min (Stage 1), 21 hrs (Stage 4 per model)
**Cost:** ~$2 electricity for full training
