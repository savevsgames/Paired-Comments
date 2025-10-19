# AI Training Demo - Documentation Index

**Last Updated:** October 19, 2025
**Status:** 📋 PLANNED - Ready for Implementation

---

## 📖 Reading Order

### **Start Here**
1. **[../README.md](../README.md)** - Project overview, budget, timeline
2. **[QUICKSTART.md](QUICKSTART.md)** - 5-minute quick start guide

### **Implementation Guides** (Read in Order)
3. **[guides/01-INFRASTRUCTURE.md](guides/01-INFRASTRUCTURE.md)** - Hardware setup (tower + server + laptop)
4. **[guides/02-VALIDATION.md](guides/02-VALIDATION.md)** - Staged testing plan (Stage 0-4)
5. **[guides/03-DATASETS.md](guides/03-DATASETS.md)** - Dataset preparation (500 samples)
6. **[guides/04-TRAINING.md](guides/04-TRAINING.md)** - Local GPU training with QLoRA
7. **[guides/05-EVALUATION.md](guides/05-EVALUATION.md)** - Azure AI Evaluation SDK

### **Reference Documentation** (As Needed)
8. **[reference/ARCHITECTURE.md](reference/ARCHITECTURE.md)** - System design and data flow
9. **[reference/AZURE-INTEGRATION.md](reference/AZURE-INTEGRATION.md)** - Azure AI SDK analysis

### **Archive** (Historical)
- **[archive/TRAINING_PIPELINE_AZURE.md](archive/TRAINING_PIPELINE_AZURE.md)** - Azure ML training (not used - we use local GPU)

---

## 🗂️ Documentation Structure

```
docs/
├── INDEX.md                          # This file
├── QUICKSTART.md                     # 5-minute quick start
├── guides/                           # Step-by-step implementation
│   ├── 01-INFRASTRUCTURE.md          # Hardware setup
│   ├── 02-VALIDATION.md              # Staged testing
│   ├── 03-DATASETS.md                # Data preparation
│   ├── 04-TRAINING.md                # GPU training
│   └── 05-EVALUATION.md              # Evaluation SDK
├── reference/                        # Technical reference
│   ├── ARCHITECTURE.md               # System design
│   └── AZURE-INTEGRATION.md          # Azure analysis
└── archive/                          # Historical docs
    └── TRAINING_PIPELINE_AZURE.md    # Azure ML guide (unused)
```

---

## 📋 Quick Reference

### Key Decisions Made

**Infrastructure:**
- ✅ Gaming Tower (RTX 4070Ti) - Primary training
- ✅ Linux Server (GTX 970) - MLflow + Dashboard only (NO training)
- ✅ Laptop - Development via VS Code Remote-SSH

**Training Approach:**
- ✅ Local GPU (not Azure ML)
- ✅ Llama-3 8B with 4-bit QLoRA
- ✅ 42 hours total (21 hrs per model)
- ✅ Cost: $2 (electricity)

**Evaluation Approach:**
- ✅ Azure AI Evaluation SDK (10 metrics)
- ✅ Custom evaluators (functional correctness, pass@k, code accuracy)
- ✅ Cost: $242 (API calls)

**Risk Mitigation:**
- ✅ Staged validation (Stage 0-4)
- ✅ Validation cost: $15 (vs. $242 production)
- ✅ GO/NO-GO gate at Stage 3

### Budget Summary

| Item | Cost |
|------|------|
| Training (RTX 4070Ti electricity) | $2 |
| Evaluation (Azure AI SDK) | $242 |
| Storage (Azure Blob) | $10 |
| **Total** | **$254** |

### Timeline Summary

| Phase | Duration | Cost |
|-------|----------|------|
| Validation (Stage 0-3) | 8 hours | $15 |
| **GO/NO-GO Decision** | - | - |
| Dataset Prep (Phase 1) | 2 weeks | $0 |
| Training (Phase 2) | 42 hours | $2 |
| Evaluation (Phase 3) | 2 weeks | $242 |
| Dashboard (Phase 4) | 2 weeks | $0 |
| Whitepaper (Phase 5) | 2 weeks | $0 |
| **Total** | 10 weeks | $254 |

---

## 🎯 Success Criteria

### Validation (Stage 3)
- [ ] >10% improvement on 100-sample test
- [ ] Statistical significance (p < 0.05)
- [ ] No crashes or OOM errors
- [ ] MLflow logging works

### Production (Stage 4)
- [ ] >10% average improvement across 5 scenarios
- [ ] >15% functional correctness improvement
- [ ] >20% code vulnerability reduction
- [ ] Statistical significance maintained

---

## 🔗 External Resources

### Azure AI Evaluation SDK
- **Docs:** https://learn.microsoft.com/en-us/azure/ai-foundry/how-to/develop/evaluate-sdk
- **PyPI:** https://pypi.org/project/azure-ai-evaluation/
- **Sample Repo:** https://github.com/Azure-Samples/ai-rag-chat-evaluator

### QLoRA (4-bit Quantization)
- **Paper:** https://arxiv.org/abs/2305.14314
- **Hugging Face:** https://huggingface.co/docs/peft/main/en/conceptual_guides/lora

### Llama-3 Models
- **Meta:** https://llama.meta.com/llama3/
- **Hugging Face:** https://huggingface.co/meta-llama

---

## ⚠️ Important Notes

1. **Linux Server (GTX 970):** NOT used for training (only 4GB VRAM)
   - Role: MLflow server, Dashboard hosting only
   - Reason: Insufficient VRAM for Llama-3 8B training

2. **Staged Validation is MANDATORY:**
   - Must pass Stage 3 before proceeding to Stage 4
   - Stage 3 costs only $12 vs. $242 for Stage 4
   - Know if approach works BEFORE major investment

3. **Azure Integration for Credibility:**
   - Local training saves $200
   - Azure evaluation SDK maintains Microsoft-native story
   - Hybrid approach: train anywhere, evaluate Azure

---

**Next Step:** Read [QUICKSTART.md](QUICKSTART.md) to begin
