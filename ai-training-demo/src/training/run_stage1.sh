#!/bin/bash
# Quick start script for Stage 1 validation

echo "🚀 Stage 1 Validation - HumanEval Training"
echo "=========================================="
echo ""
echo "   Dataset: 5 samples (micro)"
echo "   Time: ~30 minutes per model"
echo "   Purpose: Verify code runs without errors"
echo ""

# Check if we're in the right directory
if [ ! -f "train.py" ]; then
    echo "❌ Error: Must run from src/training directory"
    echo "   cd src/training && ./run_stage1.sh"
    exit 1
fi

# Check if datasets exist
if [ ! -f "../../datasets/control/humaneval_micro.jsonl" ]; then
    echo "❌ Error: Micro datasets not found"
    echo "   Run: cd ../../src/data && python prepare_datasets.py --stage1"
    exit 1
fi

echo "Step 1: Training CONTROL model (no metadata)"
echo "---------------------------------------------"
echo ""

python train.py \
    --stage stage1 \
    --experiment-type control

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Control model training failed"
    exit 1
fi

echo ""
echo ""
echo "Step 2: Training EXPERIMENT model (with metadata)"
echo "--------------------------------------------------"
echo ""

python train.py \
    --stage stage1 \
    --experiment-type experiment

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Experiment model training failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Stage 1 Validation Complete!"
echo "=========================================="
echo ""
echo "📊 Review results:"
echo "   Control model: outputs/stage1/control/"
echo "   Experiment model: outputs/stage1/experiment/"
echo ""
echo "📈 View training logs:"
echo "   tensorboard --logdir outputs/stage1/control/logs"
echo "   tensorboard --logdir outputs/stage1/experiment/logs"
echo ""
echo "🚀 Next steps:"
echo "   1. Review training logs for errors"
echo "   2. Check GPU memory usage stayed under 12GB"
echo "   3. If successful, proceed to Stage 2 (20 samples)"
