# Training Pipeline Guide

**Version:** 0.1.0
**Phase:** 2 of 5 (Weeks 3-4)

---

## 🎯 Goal

Set up automated Azure ML fine-tuning pipelines that train both control and experiment models in parallel, with full experiment tracking and reproducibility.

---

## 🏗️ Architecture

```
Azure ML Workspace
├── Compute Cluster (GPU)
│   ├── control-training-job
│   └── experiment-training-job
├── Datasets (from Blob Storage)
│   ├── control/train.jsonl
│   └── experiment/train.jsonl
├── Experiments (MLflow)
│   ├── paired-comments-control
│   └── paired-comments-experiment
└── Models
    ├── control-model-v1
    └── experiment-model-v1
```

---

## 🛠️ Setup (Day 1)

### 1. Azure ML Workspace
```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name paired-comments-rg \
  --location eastus

# Create Azure ML workspace
az ml workspace create \
  --name paired-comments-ml \
  --resource-group paired-comments-rg \
  --location eastus

# Connect to workspace
az ml workspace show \
  --name paired-comments-ml \
  --resource-group paired-comments-rg
```

### 2. Compute Cluster (GPU)
```bash
# Create GPU cluster for training
az ml compute create \
  --name gpu-cluster \
  --type amlcompute \
  --size Standard_NC6s_v3 \
  --min-instances 0 \
  --max-instances 2 \
  --workspace-name paired-comments-ml \
  --resource-group paired-comments-rg

# Cost: ~$1.40/hour per instance (Standard_NC6s_v3 = 1x V100 GPU)
```

**Alternative (Cheaper):**
```bash
# Use CPU cluster for Llama-3 (slower but cheaper)
az ml compute create \
  --name cpu-cluster \
  --type amlcompute \
  --size Standard_D4s_v3 \
  --min-instances 0 \
  --max-instances 4
```

### 3. Register Datasets
```bash
# Upload datasets from Phase 1
az ml data create \
  --name control-train \
  --version 1 \
  --path azureml://datastores/workspaceblobstore/paths/datasets/control/train.jsonl \
  --workspace-name paired-comments-ml

az ml data create \
  --name experiment-train \
  --version 1 \
  --path azureml://datastores/workspaceblobstore/paths/datasets/experiment/train.jsonl \
  --workspace-name paired-comments-ml
```

---

## 🔧 Training Scripts (Days 2-3)

### Option A: GPT-4 Fine-Tuning (OpenAI API)

**Pros:** Highest quality, managed service
**Cons:** Most expensive (~$500-1000 per run)

```python
# src/training/gpt4-finetune.py
import openai
import os
from azure.ai.ml import MLClient
from azure.identity import DefaultAzureCredential

# Setup
openai.api_key = os.environ["OPENAI_API_KEY"]
ml_client = MLClient.from_config(DefaultAzureCredential())

def finetune_gpt4(dataset_path: str, model_name: str):
    """Fine-tune GPT-4 on prepared dataset"""

    # 1. Upload training file
    print(f"Uploading {dataset_path}...")
    with open(dataset_path, "rb") as f:
        training_file = openai.File.create(
            file=f,
            purpose="fine-tune"
        )

    # 2. Create fine-tuning job
    print("Starting fine-tuning job...")
    job = openai.FineTuningJob.create(
        training_file=training_file.id,
        model="gpt-4-0613",
        hyperparameters={
            "n_epochs": 3,
            "batch_size": 4,
            "learning_rate_multiplier": 0.1
        },
        suffix=model_name
    )

    # 3. Monitor progress
    import time
    while True:
        status = openai.FineTuningJob.retrieve(job.id)
        print(f"Status: {status.status}")

        if status.status == "succeeded":
            print(f"✅ Model ready: {status.fine_tuned_model}")
            return status.fine_tuned_model
        elif status.status == "failed":
            raise Exception(f"Training failed: {status.error}")

        time.sleep(60)  # Check every minute

# Train control model
control_model = finetune_gpt4("datasets/control/train.jsonl", "control")

# Train experiment model
experiment_model = finetune_gpt4("datasets/experiment/train.jsonl", "experiment")

print(f"Control: {control_model}")
print(f"Experiment: {experiment_model}")
```

---

### Option B: Llama-3 Fine-Tuning (Hugging Face + Azure ML)

**Pros:** Open source, full control, cheaper (~$50-200 per run)
**Cons:** More complex setup

```python
# src/training/llama3-finetune.py
from azure.ai.ml import command, Input
from azure.ai.ml.entities import Environment
from azure.ai.ml import MLClient
from azure.identity import DefaultAzureCredential

# Initialize Azure ML client
ml_client = MLClient.from_config(DefaultAzureCredential())

# Define training environment
env = Environment(
    name="llama3-training",
    image="mcr.microsoft.com/azureml/openmpi4.1.0-cuda11.8-cudnn8-ubuntu22.04",
    conda_file="conda.yml"
)

# Training script
training_script = """
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    Trainer,
    TrainingArguments
)
from datasets import load_dataset
import mlflow

# Load dataset
dataset = load_dataset("json", data_files="train.jsonl")

# Load Llama-3 70B
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-70b-hf",
    torch_dtype=torch.bfloat16,
    device_map="auto"
)
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-3-70b-hf")

# Training config
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    learning_rate=1e-5,
    fp16=True,
    logging_steps=10,
    save_strategy="epoch",
    evaluation_strategy="epoch",
    report_to="mlflow"  # Log to MLflow
)

# Start MLflow run
mlflow.start_run()
mlflow.log_params({
    "model": "llama-3-70b",
    "epochs": 3,
    "batch_size": 2,
    "learning_rate": 1e-5
})

# Train
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset["train"],
    tokenizer=tokenizer
)

trainer.train()

# Save model
model.save_pretrained("./model")
tokenizer.save_pretrained("./model")

# Log metrics
mlflow.log_metrics({
    "final_loss": trainer.state.log_history[-1]["loss"]
})
mlflow.end_run()
"""

# Create training job
job = command(
    code="./src/training",
    command="python llama3-train.py",
    inputs={
        "train_data": Input(path="azureml://datastores/workspaceblobstore/paths/datasets/control/train.jsonl")
    },
    environment=env,
    compute="gpu-cluster",
    experiment_name="paired-comments-control",
    display_name="llama3-control-training"
)

# Submit job
ml_client.jobs.create_or_update(job)
```

**conda.yml:**
```yaml
name: llama3-training
channels:
  - conda-forge
  - nvidia
dependencies:
  - python=3.9
  - pytorch>=2.0
  - cuda-toolkit=11.8
  - pip:
      - transformers>=4.30
      - datasets
      - accelerate
      - mlflow
      - azure-ai-ml
```

---

## 📊 Hyperparameter Tuning (Day 4)

### Grid Search
```python
# src/training/hyperparam-search.py
from azure.ai.ml.sweep import Choice, Uniform

hyperparameters = {
    "learning_rate": Uniform(1e-6, 1e-4),
    "batch_size": Choice([2, 4, 8]),
    "epochs": Choice([2, 3, 4]),
    "warmup_steps": Choice([50, 100, 200])
}

# Run sweep
sweep_job = ml_client.jobs.create_or_update(
    sweep(
        sampling_algorithm="grid",
        objective={"goal": "minimize", "primary_metric": "validation_loss"},
        limits={"max_total_trials": 20},
        compute="gpu-cluster"
    )
)
```

---

## 🎯 Training Execution (Days 5-7)

### Run Control Training
```bash
cd src/training

# Set environment variables
export AZURE_SUBSCRIPTION_ID=your-sub-id
export WORKSPACE_NAME=paired-comments-ml
export RESOURCE_GROUP=paired-comments-rg

# Run training
python run-training.py \
  --dataset control \
  --model llama-3-70b \
  --experiment control-v1
```

### Run Experiment Training (Parallel)
```bash
# In separate terminal
python run-training.py \
  --dataset experiment \
  --model llama-3-70b \
  --experiment experiment-v1
```

### Monitor Progress
```bash
# View MLflow UI
mlflow ui --backend-store-uri ./mlruns

# Or use Azure ML Studio
az ml job show --name <job-id> --web
```

---

## 📈 Experiment Tracking (MLflow)

### Log Metrics During Training
```python
import mlflow

# Start run
mlflow.start_run(experiment_id="paired-comments-control")

# Log hyperparameters
mlflow.log_params({
    "model": "llama-3-70b",
    "dataset": "control",
    "learning_rate": 1e-5,
    "batch_size": 4,
    "epochs": 3
})

# Log metrics during training
for epoch in range(3):
    train_loss = train_one_epoch()
    val_loss = validate()

    mlflow.log_metrics({
        "train_loss": train_loss,
        "val_loss": val_loss,
        "epoch": epoch
    }, step=epoch)

# Save model artifact
mlflow.pytorch.log_model(model, "model")

mlflow.end_run()
```

### Compare Experiments
```python
# Load experiment results
import mlflow

experiments = mlflow.search_runs(
    experiment_names=["paired-comments-control", "paired-comments-experiment"]
)

print(experiments[["params.model", "metrics.val_loss", "metrics.train_loss"]])
```

---

## 💾 Model Checkpointing

### Save Checkpoints During Training
```python
# In training loop
for epoch in range(num_epochs):
    train_one_epoch()

    # Save checkpoint
    checkpoint = {
        "epoch": epoch,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
        "loss": train_loss
    }

    torch.save(checkpoint, f"checkpoints/model_epoch_{epoch}.pt")

    # Upload to Azure Blob
    ml_client.models.create_or_update(
        name=f"control-model-epoch-{epoch}",
        path=f"checkpoints/model_epoch_{epoch}.pt",
        type="custom_model"
    )
```

### Early Stopping
```python
from transformers import EarlyStoppingCallback

trainer = Trainer(
    model=model,
    args=training_args,
    callbacks=[EarlyStoppingCallback(early_stopping_patience=2)]
)
```

---

## ⚡ Performance Optimization

### Gradient Checkpointing (Save Memory)
```python
model.gradient_checkpointing_enable()
```

### Mixed Precision Training
```python
training_args = TrainingArguments(
    fp16=True,  # Use half-precision
    gradient_accumulation_steps=8  # Simulate larger batch
)
```

### Distributed Training (Multi-GPU)
```python
torchrun --nproc_per_node=4 llama3-train.py
```

---

## 📊 Expected Results

### Training Time Estimates
- **GPT-4 API:** 2-4 hours (managed service)
- **Llama-3 70B (4x A100):** 6-12 hours
- **Llama-3 13B (1x V100):** 3-6 hours

### Cost Estimates
- **GPT-4 fine-tuning:** $500-1000 per run
- **Azure ML (4x A100):** ~$15/hour × 10 hours = $150
- **Azure ML (1x V100):** ~$1.40/hour × 6 hours = $8.40

### Metrics to Track
- Training loss (should decrease)
- Validation loss (should decrease, watch for overfitting)
- Perplexity (should decrease)
- Learning rate schedule
- GPU utilization (should be >80%)

---

## ✅ Success Criteria

- [ ] Both models (control + experiment) trained successfully
- [ ] Final validation loss < 1.0
- [ ] No overfitting (train loss ≈ val loss)
- [ ] Model checkpoints saved to Azure ML
- [ ] MLflow experiment logs complete
- [ ] Training time within budget (<$200 total)

---

## 🚨 Troubleshooting

### OOM (Out of Memory)
```python
# Reduce batch size
training_args.per_device_train_batch_size = 1

# Enable gradient checkpointing
model.gradient_checkpointing_enable()
```

### Slow Training
```bash
# Check GPU utilization
nvidia-smi

# Should show >80% GPU usage
# If low, increase batch size or reduce logging frequency
```

### Job Fails Silently
```bash
# Check Azure ML logs
az ml job stream --name <job-id>
```

---

**Phase 2 Complete:** Ready for Phase 3 (Evaluation Harness)
