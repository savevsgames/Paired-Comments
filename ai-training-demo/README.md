# AI Training Comparison Demo

**Status:** 📋 **PLANNED - Ready for Implementation**
**Version:** 0.1.0 (Prototype)
**Target:** Milestone 7 (v3.6.0) - Q4 2026

---

## 🎯 Mission

**Empirical proof that `.comments` files improve AI model training outcomes.**

This project demonstrates measurably better AI code generation when models are trained on code annotated with Paired Comments metadata (params, aiMeta, outputs) compared to conventional inline comments.

**Strategic Value:**
- ✅ Data-driven proof for Microsoft/Azure ML acquisition
- ✅ Academic credibility via published methodology
- ✅ "`.comments` improve code generation by 15-20%" marketing claim
- ✅ First-mover advantage in metadata-enhanced training

---

## 📊 What We're Building

### Training Comparison System

**5 Pre-built Scenarios:**
1. React Component Generator (accessibility, responsive design)
2. Express.js API Builder (auth, validation, security)
3. Python Data Pipeline (ETL, error handling)
4. Bug Fix Predictor (root cause analysis)
5. SQL Query Generator (optimization, indexing)

**Evaluation Framework:**
- 10 metrics (code accuracy, functional correctness, semantic similarity, pass@k, code vulnerability, coherence, fluency, groundedness, relevance, F1)
- Azure AI Evaluation SDK integration
- Statistical significance testing (t-test, effect size)

**Interactive Dashboard:**
- Split-screen training visualization
- Model comparison with annotated diffs
- "Try it yourself" prompt interface
- Export charts/tables for whitepaper

---

## 💻 Infrastructure (Your Hardware)

### Laptop (Development)
- VS Code with Remote-SSH
- Git repository
- Access MLflow/Dashboard via SSH tunnels

### Gaming Tower - RTX 4070Ti (Primary Training)
- **GPU:** 12GB VRAM
- **Role:** Train Llama-3 8B (4-bit QLoRA)
- **Time:** ~42 hours total (21 hrs per model)
- **Cost:** ~$2 (electricity)

### Linux Server - GTX 970 (Monitoring)
- **Role:** MLflow server, Dashboard host
- **Storage:** 300GB available for checkpoints
- **Note:** GTX 970 NOT used for training (only 4GB VRAM)

---

## 📋 Implementation Phases (10 Weeks)

### **Phase 1: Dataset Preparation (Weeks 1-2)**
- Curate 500 code samples (100 per scenario)
- Create control dataset (conventional code)
- Create experiment dataset (code + `.comments` metadata)
- Quality validation (automated + manual review)
- Upload to Azure Blob Storage

**Deliverables:**
- `datasets/control/*.jsonl` (500 samples)
- `datasets/experiment/*.jsonl` (500 samples)

---

### **Phase 2: Training (Weeks 3-4)**
- Set up Docker on gaming tower
- Train control model (Llama-3 8B, 4-bit QLoRA)
- Train experiment model (Llama-3 8B + metadata)
- Log to MLflow server (Linux)

**Deliverables:**
- Trained models (~200MB LoRA adapters each)
- MLflow experiment logs

---

### **Phase 3: Evaluation (Weeks 5-6)**
- Use Azure AI Evaluation SDK (10 metrics)
- Build 3 custom evaluators (functional correctness, pass@k, code accuracy)
- Statistical analysis (t-test, effect size)
- Generate comparison reports

**Deliverables:**
- `evaluation/results/comparison.json`
- Statistical significance report

---

### **Phase 4: Dashboard (Weeks 7-8)**
- Build Next.js comparison UI
- Deploy to Linux server (localhost)
- Later: Deploy to Azure Static Web Apps (public)

**Deliverables:**
- Interactive dashboard
- Public demo URL

---

### **Phase 5: Whitepaper & Launch (Weeks 9-10)**
- Write methodology paper
- Create demo videos
- Submit to arXiv
- Social media launch

**Deliverables:**
- `whitepaper.pdf`
- Demo videos
- Blog posts

---

## 🚀 Staged Validation Plan (Risk Mitigation)

**Before committing to 42-hour/$242 production run:**

| Stage | What | Time | Cost | Go/No-Go |
|-------|------|------|------|----------|
| **Stage 0** | Hardware check | 5 min | $0 | GPU works? |
| **Stage 1** | Tiny test (5 samples) | 30 min | $0 | Code runs? |
| **Stage 2** | Small test (20 samples) | 2 hrs | $3 | Shows improvement? |
| **Stage 3** | Full test (100 samples) | 5 hrs | $12 | >10% improvement? |
| **Validation Total** | | **8 hrs** | **$15** | **Decision point** |
| **Stage 4** | Production (500 samples) | 42 hrs | $242 | Only if Stage 3 passes |

**Risk Protection:** Know if approach works for $15, not $242!

---

## 💰 Budget

### With Your Hardware (Local Training + Azure Evaluation)

| Item | Cost |
|------|------|
| Training (RTX 4070Ti electricity) | $2 |
| Evaluation (Azure AI SDK) | $242 |
| Storage (Azure Blob) | $10 |
| **Total** | **$254** |

**vs. Azure-only:** $442 (save $188!)

---

## 📚 Documentation

### Quick Start
- **[QUICKSTART.md](docs/QUICKSTART.md)** - Get started in 5 minutes

### Implementation Guides
- **[guides/01-INFRASTRUCTURE.md](docs/guides/01-INFRASTRUCTURE.md)** - Your hardware setup (tower + server + laptop)
- **[guides/02-VALIDATION.md](docs/guides/02-VALIDATION.md)** - Staged testing plan (Stage 0-4)
- **[guides/03-DATASETS.md](docs/guides/03-DATASETS.md)** - Dataset preparation (500 samples)
- **[guides/04-TRAINING.md](docs/guides/04-TRAINING.md)** - Local GPU training (QLoRA)
- **[guides/05-EVALUATION.md](docs/guides/05-EVALUATION.md)** - Azure AI Evaluation SDK

### Reference Documentation
- **[reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md)** - System design and data flow
- **[reference/AZURE-INTEGRATION.md](docs/reference/AZURE-INTEGRATION.md)** - Azure AI Evaluation SDK analysis

---

## 🎯 Success Metrics

### Quantitative (Data-Driven)
- ✅ Experiment model outperforms control by >10% on average
- ✅ Statistical significance (p < 0.05)
- ✅ Functional correctness improves by >15%
- ✅ Code vulnerability reduces by >20%

### Qualitative (Strategic Impact)
- ✅ Whitepaper published on arXiv
- ✅ Featured in Azure ML case studies
- ✅ Microsoft Research / OpenAI outreach
- ✅ "Paired Comments training" becomes best practice

---

## 🔗 Dependencies

### Required (Already Built)
- ✅ MCP Server with JSONL export (v2.2.0)
- ✅ AI Metadata (aiMeta) in comment files (v2.1.0)
- ✅ Dynamic Params system (v2.1.2)

### Hardware (Already Own)
- ✅ RTX 4070Ti (12GB VRAM) - Gaming tower
- ✅ GTX 970 (4GB VRAM) - Linux server (monitoring only)
- ✅ Laptop (development)

---

## 🚀 Next Steps

1. **Review documentation** - Read guides in order (01-05)
2. **Stage 0 validation** - Test hardware setup (5 min)
3. **Start small** - Run Stage 1-3 validation ($15, 8 hours)
4. **Go/No-Go decision** - Only proceed if Stage 3 shows >10% improvement
5. **Production run** - Full training + evaluation ($254, 42 hours)

---

## ⚠️ Important Notes

- **Linux server (GTX 970):** NOT used for training (only 4GB VRAM insufficient)
- **Linux server role:** MLflow tracking, dashboard hosting only
- **Training:** All done on gaming tower RTX 4070Ti
- **Staged validation:** MUST pass Stage 3 before committing to Stage 4

---

**Built:** October 19, 2025
**Status:** 📋 **PLANNED - Ready for Stage 0 Validation**
**Questions?** See [QUICKSTART.md](docs/QUICKSTART.md)
