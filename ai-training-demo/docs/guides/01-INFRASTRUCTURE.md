# Infrastructure Setup - Your Hardware

**Date:** October 19, 2025
**Status:** ✅ **OPTIMIZED FOR YOUR SETUP**

---

## 🖥️ Your Infrastructure

### Device 1: Laptop (Development)
**Role:** Primary development environment
- VS Code / IDE
- Git repository
- SSH client to remote machines
- TensorBoard viewer (via SSH tunnel)

### Device 2: Gaming Tower (Training Powerhouse) 🎯 **PRIMARY TRAINING**
**Role:** Main GPU training server
- **GPU:** RTX 4070Ti (12GB VRAM)
- **OS:** Windows (minimal dev environment)
- **Use:** Gaming + Docker containers for training
- **Setup Needed:** Docker Desktop, NVIDIA Container Toolkit

### Device 3: Linux Server (Monitoring & Backup)
**Role:** Secondary training + experiment tracking
- **GPU:** GTX 970 (4GB VRAM - effectively 3.5GB)
- **CPU:** i7-9700
- **Storage:** 1TB SSD (500GB Linux, 500GB Windows), 300GB free
- **OS:** Headless Linux
- **Current:** Docker (running Foundry VTT)
- **New Role:** MLflow server, small model training, web dashboard host

---

## 🎯 Recommended Architecture

### The Optimal Setup: Distributed Training + Centralized Monitoring

```
┌─────────────────────────────────────────────────────────────────┐
│  LAPTOP (Your Desk)                                             │
│  - VS Code with Remote-SSH extension                            │
│  - Git repository (ai-training-demo/)                           │
│  - TensorBoard access via SSH tunnel (localhost:6006)           │
│  - MLflow UI access via SSH tunnel (localhost:5000)             │
└────────────┬────────────────────────────────────────────────────┘
             │ SSH to tower/server
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  GAMING TOWER (RTX 4070Ti) - PRIMARY TRAINING                   │
│  Windows + Docker Desktop + NVIDIA Container Toolkit            │
├─────────────────────────────────────────────────────────────────┤
│  Docker Container: "llama3-training"                            │
│  ├─ Llama-3 8B (4-bit QLoRA)                                    │
│  ├─ Training script running                                     │
│  ├─ Logs to MLflow server (on Linux server)                    │
│  └─ Checkpoints saved to shared volume                          │
│                                                                  │
│  Time: ~42 hours (2 days) for both models                       │
│  Cost: ~$2 electricity                                          │
└────────────┬────────────────────────────────────────────────────┘
             │ Network connection
             ▼
┌─────────────────────────────────────────────────────────────────┐
│  LINUX SERVER (GTX 970) - MONITORING & LIGHT TRAINING           │
│  Headless Linux + Docker                                        │
├─────────────────────────────────────────────────────────────────┤
│  Container 1: "mlflow-server" (always running)                  │
│  ├─ MLflow tracking server (port 5000)                          │
│  ├─ Stores experiment logs, metrics, models                     │
│  └─ 300GB storage for checkpoints/results                       │
│                                                                  │
│  Container 2: "dashboard" (Next.js)                             │
│  ├─ Results visualization dashboard                             │
│  ├─ Port 3000 (accessible via browser)                          │
│  └─ Fetches data from MLflow                                    │
│                                                                  │
│  Container 3: "llama2-7b-training" (OPTIONAL)                   │
│  ├─ Smaller model training (GTX 970 can handle 7B)             │
│  ├─ Runs in parallel with 4070Ti                               │
│  └─ Cross-validation / ablation studies                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Setup Guide

### Part 1: Gaming Tower (RTX 4070Ti) - Primary Training

**Step 1: Install Docker Desktop (Windows)**

```powershell
# Download Docker Desktop for Windows
# https://www.docker.com/products/docker-desktop/

# Install NVIDIA Container Toolkit
# https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html

# Verify GPU is accessible in Docker
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# Should show: RTX 4070 Ti, 12GB VRAM
```

**Step 2: Create Training Dockerfile**

```dockerfile
# Dockerfile.training
FROM nvidia/cuda:12.1.0-cudnn8-devel-ubuntu22.04

# Install Python 3.10
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch + Transformers
RUN pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
RUN pip3 install transformers accelerate peft bitsandbytes datasets mlflow

# Set working directory
WORKDIR /workspace

# Copy training scripts
COPY src/training /workspace/training

# Default command
CMD ["python3", "training/train_qlora.py"]
```

**Step 3: Build & Run Training Container**

```powershell
# Build image
docker build -f Dockerfile.training -t llama3-training .

# Run training (control model)
docker run --gpus all \
  --name llama3-control \
  -v H:/AI-Training-Data:/data \
  -e MLFLOW_TRACKING_URI=http://192.168.1.100:5000 \
  -e DATASET_PATH=/data/control/train.jsonl \
  -e MODEL_NAME=control \
  llama3-training

# Monitor progress
docker logs -f llama3-control

# Training runs in background (42 hours)
# You can still game while it runs! (slight FPS impact)
```

**Step 4: SSH Access from Laptop**

```bash
# On laptop, SSH to tower (if Windows has SSH server enabled)
ssh your-username@192.168.1.101  # Your tower's IP

# Or use VS Code Remote-SSH
# Install extension: ms-vscode-remote.remote-ssh
# Connect to tower, work directly on files
```

---

### Part 2: Linux Server - MLflow & Monitoring

**Step 1: MLflow Server Container**

```bash
# On Linux server
docker run -d \
  --name mlflow-server \
  -p 5000:5000 \
  -v /home/your-user/mlflow:/mlflow \
  ghcr.io/mlflow/mlflow:latest \
  mlflow server \
    --backend-store-uri sqlite:////mlflow/mlruns.db \
    --default-artifact-root /mlflow/artifacts \
    --host 0.0.0.0 \
    --port 5000

# Verify it's running
curl http://localhost:5000/health
```

**Step 2: Access MLflow UI from Laptop**

```bash
# On laptop, create SSH tunnel
ssh -L 5000:localhost:5000 your-user@192.168.1.100

# Open browser: http://localhost:5000
# You'll see MLflow UI with all experiments!
```

**Step 3: Dashboard Container (Next.js)**

```bash
# On Linux server
docker run -d \
  --name ai-training-dashboard \
  -p 3000:3000 \
  -e MLFLOW_URI=http://localhost:5000 \
  -v /home/your-user/dashboard:/app \
  node:18 \
  sh -c "cd /app && npm install && npm run start"

# Access from browser: http://192.168.1.100:3000
```

**Step 4: Optional - Light Training on GTX 970**

```bash
# GTX 970 (4GB VRAM) can train smaller models
# Use for cross-validation or ablation studies

docker run --gpus all \
  --name llama2-7b-ablation \
  -v /home/your-user/data:/data \
  -e MLFLOW_TRACKING_URI=http://localhost:5000 \
  -e DATASET_PATH=/data/control/train.jsonl \
  -e MODEL_NAME=llama2-7b-control \
  llama3-training

# Runs in parallel with 4070Ti!
# Use for testing different metadata configurations
```

---

## 🔧 Development Workflow

### Day-to-Day Development (on Laptop)

**Option 1: VS Code Remote-SSH (RECOMMENDED)**

```bash
# Install VS Code extension: Remote-SSH
# Connect to tower or server
# Edit files directly on remote machine
# Terminal runs commands on remote GPU
```

**Step-by-step:**
1. Open VS Code on laptop
2. Press F1 → "Remote-SSH: Connect to Host"
3. Enter `your-user@192.168.1.101` (tower)
4. Open folder: `/workspace/ai-training-demo`
5. Edit `src/training/train_qlora.py`
6. Terminal → Run: `python train_qlora.py`
7. Training runs on tower's RTX 4070Ti!

**Option 2: Local Development + Docker Exec**

```bash
# On laptop: Edit files in Git repo
git commit -m "Update training script"
git push origin main

# On tower: Pull changes
ssh your-user@192.168.1.101
cd /workspace/ai-training-demo
git pull

# Restart training container
docker restart llama3-control
```

---

## 📊 Monitoring Training Progress

### Real-Time Monitoring (from Laptop)

**1. MLflow UI (Experiment Tracking)**

```bash
# SSH tunnel to Linux server
ssh -L 5000:localhost:5000 your-user@192.168.1.100

# Open browser: http://localhost:5000
# View:
# - Training loss curves
# - Validation accuracy
# - Hyperparameters
# - Model checkpoints
```

**2. TensorBoard (Optional)**

```bash
# On tower, start TensorBoard in container
docker exec -it llama3-control tensorboard --logdir=/workspace/logs --host=0.0.0.0 --port=6006

# SSH tunnel from laptop
ssh -L 6006:localhost:6006 your-user@192.168.1.101

# Open browser: http://localhost:6006
```

**3. Docker Logs (Live Output)**

```bash
# SSH to tower
ssh your-user@192.168.1.101

# Follow logs
docker logs -f llama3-control

# See real-time training progress:
# Epoch 1/3: 100%|██████████| 350/350 [1:23:45<00:00, 4.12it/s, loss=0.45]
```

**4. GPU Utilization**

```bash
# On tower
docker exec llama3-control nvidia-smi

# Should show:
# GPU 0: RTX 4070 Ti
# Memory-Usage: 10GB / 12GB
# GPU-Util: 95%
```

---

## 💾 Storage Strategy

### Where to Store What

**Gaming Tower (Windows):**
- Training datasets: `H:/AI-Training-Data/` (shared Docker volume)
- Model checkpoints: `H:/AI-Training-Models/`
- Temp files: Deleted after training

**Linux Server:**
- MLflow database: `/home/your-user/mlflow/mlruns.db`
- Experiment artifacts: `/home/your-user/mlflow/artifacts/` (300GB available)
- Dashboard data: `/home/your-user/dashboard/public/results/`

**Laptop (Development):**
- Git repository: `H:/CommentsExtension/ai-training-demo/`
- Local results cache: `temp/evaluation_results/` (for offline viewing)

---

## 🎮 Gaming Impact

### Can You Still Game During Training?

**YES! But with caveats:**

**Training Impact:**
- Training uses ~95% GPU when active
- Gaming will PAUSE training (containers share GPU)
- **Solution:** Use Docker resource limits

```powershell
# Limit training to 80% GPU when gaming
docker run --gpus '"device=0"' \
  --gpus-reservation 80% \
  llama3-training

# Or pause/resume training
docker pause llama3-control    # Pause for gaming
docker unpause llama3-control  # Resume after gaming
```

**Better Approach: Schedule Training**
```bash
# Run training overnight / while at work
docker run --rm llama3-training  # Starts training
# Leave it running, go to bed / work
# Come back 21 hours later, done!
```

---

## 🔒 Network Security

### SSH Tunnel Best Practices

**1. Use SSH Keys (Not Passwords)**

```bash
# On laptop, generate SSH key
ssh-keygen -t ed25519 -C "ai-training"

# Copy to servers
ssh-copy-id your-user@192.168.1.101  # Tower
ssh-copy-id your-user@192.168.1.100  # Linux server
```

**2. Firewall Rules**

```bash
# On Linux server, allow only laptop IP
sudo ufw allow from 192.168.1.50 to any port 5000  # MLflow
sudo ufw allow from 192.168.1.50 to any port 3000  # Dashboard
```

**3. Don't Expose to Internet**

- Keep MLflow/Dashboard on local network only
- Use VPN if accessing from outside home
- No port forwarding on router

---

## 🧪 Testing the Setup

### Quick Validation (10 minutes)

**Step 1: Test Docker GPU on Tower**

```powershell
# On tower
docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi

# Should show: RTX 4070 Ti, 12GB VRAM
```

**Step 2: Test MLflow Server**

```bash
# On Linux server
docker ps | grep mlflow-server

# Should show: mlflow-server running on port 5000

# From laptop
ssh -L 5000:localhost:5000 your-user@192.168.1.100
curl http://localhost:5000/health

# Should return: {"status": "ok"}
```

**Step 3: Test Remote Development**

```bash
# On laptop, VS Code
# Install: Remote-SSH extension
# Connect to: your-user@192.168.1.101
# Open folder: /workspace/ai-training-demo
# Create file: test.py
# Run: python test.py

# Should execute on tower!
```

---

## 📋 Docker Compose (Simplified Setup)

### All-in-One Configuration

```yaml
# docker-compose.yml (on Linux server)
version: '3.8'

services:
  mlflow:
    image: ghcr.io/mlflow/mlflow:latest
    container_name: mlflow-server
    ports:
      - "5000:5000"
    volumes:
      - ./mlflow:/mlflow
    command: >
      mlflow server
      --backend-store-uri sqlite:////mlflow/mlruns.db
      --default-artifact-root /mlflow/artifacts
      --host 0.0.0.0
      --port 5000
    restart: unless-stopped

  dashboard:
    image: node:18
    container_name: ai-training-dashboard
    ports:
      - "3000:3000"
    volumes:
      - ./dashboard:/app
    working_dir: /app
    command: sh -c "npm install && npm run start"
    environment:
      - MLFLOW_URI=http://mlflow:5000
    depends_on:
      - mlflow
    restart: unless-stopped

  # Optional: Small model training on GTX 970
  llama2-training:
    build:
      context: .
      dockerfile: Dockerfile.training
    container_name: llama2-7b-training
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    volumes:
      - ./data:/data
      - ./models:/models
    environment:
      - MLFLOW_TRACKING_URI=http://mlflow:5000
      - DATASET_PATH=/data/control/train.jsonl
      - MODEL_NAME=llama2-7b-control
    depends_on:
      - mlflow
```

**Start all services:**

```bash
# On Linux server
cd /home/your-user/ai-training-demo
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f mlflow
```

---

## 💰 Cost Analysis (Your Setup)

### Total Project Cost

| Item | Cost |
|------|------|
| **Hardware** | $0 (already own) |
| **Electricity (42 hrs @ 300W)** | ~$2 |
| **Azure AI Evaluation SDK** | $242 |
| **Azure Blob Storage** | $10 |
| **Total** | **$254** |

**vs. Azure ML only:** $442 (save $188!)

---

## 🎯 Recommended Approach

### The Winning Strategy

**Phase 1: Setup (Week 1)**
- ✅ Install Docker on tower (Windows)
- ✅ Setup MLflow on Linux server (already has Docker)
- ✅ Configure VS Code Remote-SSH on laptop
- ✅ Test GPU access in Docker

**Phase 2: Training (Week 2-3)**
- ✅ Train control model on RTX 4070Ti (21 hours)
- ✅ Train experiment model on RTX 4070Ti (21 hours)
- ✅ Optional: Train Llama-2 7B on GTX 970 (cross-validation)

**Phase 3: Evaluation (Week 4-5)**
- ✅ Use Azure AI Evaluation SDK (from laptop)
- ✅ Results logged to MLflow (on Linux server)
- ✅ Dashboard hosted on Linux server

**Phase 4: Dashboard (Week 6)**
- ✅ Deploy Next.js on Linux server
- ✅ Accessible from any device on network
- ✅ Later: Deploy to Azure Static Web Apps (public)

---

## ✅ Summary

**Your Infrastructure is PERFECT for this project!**

**Advantages:**
- ✅ **RTX 4070Ti** - Main training workhorse (12GB VRAM)
- ✅ **Linux server** - Always-on MLflow + dashboard
- ✅ **GTX 970** - Bonus for parallel experiments
- ✅ **Laptop** - Development comfort (VS Code Remote-SSH)
- ✅ **Distributed** - Each machine does what it's best at

**Total Cost:** $254 (vs. $442 Azure-only)
**Setup Time:** ~1 week (mostly Docker installation + testing)
**Training Time:** 42 hours (can run unattended)

**You have everything you need!** 🚀
