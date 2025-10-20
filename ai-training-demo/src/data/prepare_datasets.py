#!/usr/bin/env python3
"""
Master Data Preparation Pipeline

Orchestrates all dataset preparation steps:
1. Download HumanEval
2. Create control dataset
3. Create experiment dataset (with metadata)
4. Split into train/val/test
5. Create micro dataset for Stage 1 validation

Usage:
    # Full pipeline
    python prepare_datasets.py

    # Stage 1 validation only (5 samples)
    python prepare_datasets.py --stage1

    # Skip download (if already downloaded)
    python prepare_datasets.py --skip-download
"""

import argparse
import sys
from pathlib import Path

# Import our data preparation modules
from download_humaneval import download_humaneval
from create_control_dataset import create_control_dataset
from add_comments_metadata import create_experiment_dataset
from split_dataset import split_dataset
from create_micro_dataset import create_micro_dataset


def run_full_pipeline(skip_download: bool = False):
    """
    Run full data preparation pipeline

    Args:
        skip_download: Skip HumanEval download if already exists
    """
    print("=" * 60)
    print("🚀 HUMANEVAL DATASET PREPARATION PIPELINE")
    print("=" * 60)
    print()

    # Step 1: Download HumanEval
    if skip_download:
        print("⏭️  Skipping download (--skip-download flag)")
        print()
    else:
        print("📥 STEP 1: Download HumanEval Dataset")
        print("-" * 60)
        try:
            download_humaneval()
        except Exception as e:
            print(f"❌ Error downloading HumanEval: {e}")
            sys.exit(1)
        print()

    # Step 2: Create control dataset
    print("🔧 STEP 2: Create Control Dataset (No Metadata)")
    print("-" * 60)
    try:
        create_control_dataset()
    except Exception as e:
        print(f"❌ Error creating control dataset: {e}")
        sys.exit(1)
    print()

    # Step 3: Create experiment dataset
    print("🔧 STEP 3: Create Experiment Dataset (With .comments Metadata)")
    print("-" * 60)
    try:
        experiment_samples, errors = create_experiment_dataset()
        if errors:
            print(f"⚠️  {len(errors)} problems had errors:")
            for task_id, error in errors[:5]:  # Show first 5
                print(f"   - {task_id}: {error}")
            if len(errors) > 5:
                print(f"   ... and {len(errors) - 5} more")
    except Exception as e:
        print(f"❌ Error creating experiment dataset: {e}")
        sys.exit(1)
    print()

    # Step 4: Split datasets
    print("📊 STEP 4: Split Datasets (Train/Val/Test)")
    print("-" * 60)
    try:
        split_dataset()
    except Exception as e:
        print(f"❌ Error splitting datasets: {e}")
        sys.exit(1)
    print()

    # Step 5: Create micro dataset
    print("🔬 STEP 5: Create Micro Dataset (Stage 1 Validation)")
    print("-" * 60)
    try:
        create_micro_dataset(
            control_input="datasets/control/train.jsonl",
            experiment_input="datasets/experiment/train.jsonl",
            num_samples=5,
            output_suffix="micro"
        )
    except Exception as e:
        print(f"❌ Error creating micro dataset: {e}")
        sys.exit(1)
    print()

    # Done!
    print("=" * 60)
    print("✅ DATASET PREPARATION COMPLETE!")
    print("=" * 60)
    print()
    print("📂 Dataset Structure:")
    print("   datasets/")
    print("   ├── humaneval_raw/          # Original HumanEval")
    print("   ├── control/")
    print("   │   ├── train.jsonl         # 114 samples (no metadata)")
    print("   │   ├── val.jsonl           # 25 samples")
    print("   │   ├── test.jsonl          # 25 samples")
    print("   │   └── humaneval_micro.jsonl  # 5 samples (Stage 1)")
    print("   ├── experiment/")
    print("   │   ├── train.jsonl         # 114 samples (with metadata)")
    print("   │   ├── val.jsonl           # 25 samples")
    print("   │   ├── test.jsonl          # 25 samples")
    print("   │   └── humaneval_micro.jsonl  # 5 samples (Stage 1)")
    print("   └── split_info.json         # Split indices")
    print()
    print("🚀 Next Steps:")
    print("   1. Review datasets in datasets/ folder")
    print("   2. Run Stage 1 validation (5 samples, 30 min)")
    print("   3. If Stage 1 passes, proceed to Stage 2-3")
    print("   4. If Stage 3 passes (>10% improvement), run Stage 4 production")


def run_stage1_only():
    """
    Create only micro dataset for Stage 1 validation

    Useful for quick testing without full pipeline.
    """
    print("=" * 60)
    print("🔬 STAGE 1 VALIDATION DATASET PREPARATION")
    print("=" * 60)
    print()

    # Check if full datasets exist
    control_path = Path("datasets/control/humaneval.jsonl")
    experiment_path = Path("datasets/experiment/humaneval.jsonl")

    if not control_path.exists() or not experiment_path.exists():
        print("❌ Full datasets not found. Please run full pipeline first:")
        print("   python prepare_datasets.py")
        sys.exit(1)

    # Create micro dataset
    print("🔬 Creating Micro Dataset (5 samples)...")
    print("-" * 60)
    try:
        create_micro_dataset(
            control_input=str(control_path),
            experiment_input=str(experiment_path),
            num_samples=5,
            output_suffix="micro"
        )
    except Exception as e:
        print(f"❌ Error creating micro dataset: {e}")
        sys.exit(1)

    print()
    print("✅ Stage 1 dataset ready!")


def main():
    """Parse arguments and run appropriate pipeline"""
    parser = argparse.ArgumentParser(
        description="HumanEval Dataset Preparation Pipeline"
    )
    parser.add_argument(
        "--stage1",
        action="store_true",
        help="Create only micro dataset for Stage 1 validation"
    )
    parser.add_argument(
        "--skip-download",
        action="store_true",
        help="Skip HumanEval download if already exists"
    )

    args = parser.parse_args()

    if args.stage1:
        run_stage1_only()
    else:
        run_full_pipeline(skip_download=args.skip_download)


if __name__ == "__main__":
    main()
