# AI Training Demo - Quick Start Guide

**Status:** 📋 **PLANNED**
**Version:** 0.1.0

---

## 🚀 Overview

This guide will help you get started with the AI Training Comparison Demo project. The goal is to prove that training AI models on code with `.comments` metadata produces measurably better code generation than training on conventional code alone.

---

## 📋 Prerequisites

### Required
- **Node.js** 18+ (for dashboard)
- **Python** 3.9+ (for training scripts)
- **Azure Subscription** (for Azure ML)
- **Git** (for dataset curation)

### Optional
- **Docker** (for reproducible environments)
- **Hugging Face account** (for Llama-3 models)
- **OpenAI API key** (for GPT-4 fine-tuning)

---

## 🛠️ Installation

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/paired-comments.git
cd paired-comments/ai-training-demo
```

### 2. Install Dependencies
```bash
# Dashboard (Next.js)
cd src/dashboard
npm install

# Training scripts (Python)
cd ../training
pip install -r requirements.txt

# Evaluation harness (TypeScript)
cd ../evaluation
npm install
```

### 3. Set Up Azure
```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Create resource group
az group create --name paired-comments-rg --location eastus

# Create Azure ML workspace
az ml workspace create --name paired-comments-ml --resource-group paired-comments-rg
```

---

## 📦 Project Setup (5-Minute Quickstart)

### Step 1: Prepare Sample Dataset (Local Testing)
```bash
# Create test dataset (10 samples instead of 500)
cd datasets
mkdir -p control/react-components experiment/react-components

# Use MCP server to export existing .comments as JSONL
# (See mcp-server/QUICKSTART.md for MCP setup)

# In Claude Desktop (or MCP Inspector):
"Export comments from test-samples/ as JSONL training data"

# This generates sample.jsonl files
```

### Step 2: Run Local Training (Mock)
```bash
# For quick testing, we'll use a tiny model (GPT-2 instead of GPT-4)
cd src/training

# Mock training run (completes in ~5 minutes)
python mock-train.py \
  --control datasets/control/train.jsonl \
  --experiment datasets/experiment/train.jsonl \
  --model gpt2 \
  --epochs 1
```

### Step 3: Run Evaluation
```bash
cd src/evaluation

# Evaluate mock models
npm run evaluate -- \
  --control-model models/control-gpt2 \
  --experiment-model models/experiment-gpt2 \
  --test-set datasets/test.jsonl
```

### Step 4: Launch Dashboard
```bash
cd src/dashboard

# Copy mock results
cp ../../evaluation/results/comparison.json public/results/

# Start dev server
npm run dev

# Open http://localhost:3000
```

**Expected Output:**
- Split-screen chart showing training curves
- Metrics table (mock data: experiment model shows +10% improvement)
- Side-by-side code comparison

---

## 🎯 Full Implementation Guide (10 Weeks)

Follow the detailed implementation plan:

### **Phase 1: Dataset Preparation (Weeks 1-2)**
See: [docs/DATASETS.md](./DATASETS.md)

**Quick Summary:**
1. Select 20-30 high-quality open source repos
2. Extract 100 code samples per scenario (500 total)
3. Create control dataset (conventional code)
4. Create experiment dataset (code + `.comments` metadata)
5. Quality validation (automated + manual review)
6. Split into train/val/test (70/15/15)
7. Upload to Azure Blob Storage

**Deliverables:**
- `datasets/splits/control/*.jsonl`
- `datasets/splits/experiment/*.jsonl`
- Quality report

---

### **Phase 2: Training Pipeline (Weeks 3-4)**
See: [docs/TRAINING_PIPELINE.md](./TRAINING_PIPELINE.md)

**Quick Summary:**
1. Set up Azure ML workspace
2. Create fine-tuning scripts (GPT-4 or Llama-3)
3. Configure hyperparameters
4. Run training for control model
5. Run training for experiment model
6. Track metrics with MLflow
7. Save model checkpoints

**Deliverables:**
- `src/training/azure-ml-pipeline.py`
- Trained model artifacts
- MLflow experiment logs

---

### **Phase 3: Evaluation Harness (Weeks 5-6)**
See: [docs/EVALUATION_GUIDE.md](./EVALUATION_GUIDE.md)

**Quick Summary:**
1. Build test suite generators
2. Implement evaluation metrics (accuracy, functional, semantic, pass@k)
3. Build human eval UI (A/B comparison)
4. Run statistical tests (t-test, effect size)
5. Generate comparison tables

**Deliverables:**
- `evaluation/benchmarks/*.test.ts`
- `src/evaluation/metrics.ts`
- `evaluation/results/comparison.json`

---

### **Phase 4: Interactive Dashboard (Weeks 7-8)**
See: [docs/ARCHITECTURE.md](./ARCHITECTURE.md#4-dashboard-nextjs)

**Quick Summary:**
1. Build Next.js app with split-screen viz
2. Integrate real-time training metrics
3. Build model comparison UI
4. Implement "Try it yourself" prompts
5. Deploy to Vercel

**Deliverables:**
- `src/dashboard/` (full Next.js app)
- Public demo URL

---

### **Phase 5: Whitepaper & Launch (Weeks 9-10)**
See: [docs/WHITEPAPER_OUTLINE.md](./WHITEPAPER_OUTLINE.md)

**Quick Summary:**
1. Write methodology & results paper
2. Create demo videos
3. Submit to arXiv
4. Launch on social media (LinkedIn, Twitter, HN)
5. Reach out to Microsoft Research

**Deliverables:**
- `whitepaper.pdf`
- Demo videos
- Blog posts

---

## 🧪 Testing

### Unit Tests
```bash
# Test dataset splitter
cd scripts
python -m pytest test_split_dataset.py

# Test evaluation metrics
cd src/evaluation
npm test
```

### Integration Tests
```bash
# Test end-to-end pipeline (mock data)
./scripts/e2e-test.sh
```

---

## 📊 Monitoring

### Training Progress
```bash
# View MLflow UI
mlflow ui --backend-store-uri ./mlruns

# Open http://localhost:5000
```

### Dashboard Analytics
```bash
# View Vercel analytics
vercel analytics --project ai-training-demo
```

---

## ⚠️ Troubleshooting

### Azure ML Connection Issues
**Problem:** `Az login` fails or timeout
**Solution:**
```bash
# Clear cached credentials
az account clear
az login --use-device-code
```

### Dataset Export Fails
**Problem:** MCP server doesn't export JSONL
**Solution:**
```bash
# Check MCP server is running
cd mcp-server
npm run build
npm run dev

# Test export manually
npx @modelcontextprotocol/inspector node dist/server.js
```

### Training OOM (Out of Memory)
**Problem:** Azure ML job fails with OOM error
**Solution:**
```python
# Reduce batch size in training config
config = {
  "batch_size": 2,  # Was 4
  "max_seq_length": 1024  # Was 2048
}
```

---

## 💡 Tips & Best Practices

### Dataset Quality
- Review 10% of samples manually before starting training
- Use automated quality checks (linting, type checking)
- Ensure balanced distribution across scenarios

### Training Efficiency
- Start with small model (GPT-2) to validate pipeline
- Use gradient checkpointing to save memory
- Enable early stopping to avoid overfitting

### Cost Optimization
- Use Llama-3 (open source) instead of GPT-4 to save $$$
- Use Azure spot instances (80% discount)
- Set budget alerts in Azure portal

---

## 📚 Next Steps

1. **Read Documentation:**
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
   - [DATASETS.md](./DATASETS.md) - Dataset preparation
   - [TRAINING_PIPELINE.md](./TRAINING_PIPELINE.md) - Azure ML setup
   - [EVALUATION_GUIDE.md](./EVALUATION_GUIDE.md) - Metrics & testing

2. **Start Small:**
   - Begin with 1 scenario (React components)
   - Use 20 samples (instead of 100) for initial testing
   - Run mock training with GPT-2 to validate pipeline

3. **Scale Up:**
   - Once pipeline works, expand to all 5 scenarios
   - Switch to GPT-4 or Llama-3 for real training
   - Publish results and dashboard

---

**Built:** October 19, 2025
**Status:** 📋 **PLANNED - Ready for Implementation**
**Questions?** See [README.md](../README.md) or open an issue
