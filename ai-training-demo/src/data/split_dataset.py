#!/usr/bin/env python3
"""
Split HumanEval Dataset into Train/Val/Test Sets

Splits both control and experiment datasets using the same indices
to ensure fair comparison.

Split: 70% train (114), 15% val (25), 15% test (25)

Usage:
    python split_dataset.py
"""

import json
import random
from pathlib import Path
from typing import List, Dict, Any


def load_jsonl(file_path: str) -> List[Dict[str, Any]]:
    """Load JSONL file into list of dicts"""
    samples = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            samples.append(json.loads(line))
    return samples


def save_jsonl(samples: List[Dict[str, Any]], file_path: str):
    """Save list of dicts to JSONL file"""
    Path(file_path).parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        for sample in samples:
            f.write(json.dumps(sample) + "\n")


def split_dataset(
    control_input: str = "datasets/control/humaneval.jsonl",
    experiment_input: str = "datasets/experiment/humaneval.jsonl",
    seed: int = 42
):
    """
    Split datasets into train/val/test sets

    Args:
        control_input: Path to control dataset
        experiment_input: Path to experiment dataset
        seed: Random seed for reproducibility
    """
    print("🔧 Splitting datasets into train/val/test sets...")
    print(f"   Control: {control_input}")
    print(f"   Experiment: {experiment_input}")
    print(f"   Random seed: {seed}")
    print()

    # Set random seed for reproducibility
    random.seed(seed)

    # Load datasets
    print("📥 Loading datasets...")
    control = load_jsonl(control_input)
    experiment = load_jsonl(experiment_input)

    num_samples = len(control)
    print(f"   Loaded {num_samples} samples from each dataset")

    # Verify same number of samples
    if len(control) != len(experiment):
        raise ValueError(f"Dataset size mismatch: control={len(control)}, experiment={len(experiment)}")

    # Create random indices
    indices = list(range(num_samples))
    random.shuffle(indices)

    # Split indices (70/15/15)
    train_size = int(0.70 * num_samples)  # 114
    val_size = int(0.15 * num_samples)    # 25
    # test_size = remaining                # 25

    train_idx = indices[:train_size]
    val_idx = indices[train_size:train_size + val_size]
    test_idx = indices[train_size + val_size:]

    print()
    print(f"📊 Split sizes:")
    print(f"   Train: {len(train_idx)} samples ({len(train_idx)/num_samples*100:.1f}%)")
    print(f"   Val:   {len(val_idx)} samples ({len(val_idx)/num_samples*100:.1f}%)")
    print(f"   Test:  {len(test_idx)} samples ({len(test_idx)/num_samples*100:.1f}%)")
    print()

    # Split control dataset
    print("💾 Saving control splits...")
    control_train = [control[i] for i in train_idx]
    control_val = [control[i] for i in val_idx]
    control_test = [control[i] for i in test_idx]

    save_jsonl(control_train, "datasets/control/train.jsonl")
    save_jsonl(control_val, "datasets/control/val.jsonl")
    save_jsonl(control_test, "datasets/control/test.jsonl")

    print(f"   ✅ datasets/control/train.jsonl ({len(control_train)} samples)")
    print(f"   ✅ datasets/control/val.jsonl ({len(control_val)} samples)")
    print(f"   ✅ datasets/control/test.jsonl ({len(control_test)} samples)")
    print()

    # Split experiment dataset
    print("💾 Saving experiment splits...")
    experiment_train = [experiment[i] for i in train_idx]
    experiment_val = [experiment[i] for i in val_idx]
    experiment_test = [experiment[i] for i in test_idx]

    save_jsonl(experiment_train, "datasets/experiment/train.jsonl")
    save_jsonl(experiment_val, "datasets/experiment/val.jsonl")
    save_jsonl(experiment_test, "datasets/experiment/test.jsonl")

    print(f"   ✅ datasets/experiment/train.jsonl ({len(experiment_train)} samples)")
    print(f"   ✅ datasets/experiment/val.jsonl ({len(experiment_val)} samples)")
    print(f"   ✅ datasets/experiment/test.jsonl ({len(experiment_test)} samples)")
    print()

    # Save split indices for reference
    split_info = {
        "seed": seed,
        "total_samples": num_samples,
        "train_size": len(train_idx),
        "val_size": len(val_idx),
        "test_size": len(test_idx),
        "train_indices": train_idx,
        "val_indices": val_idx,
        "test_indices": test_idx
    }

    split_info_path = "datasets/split_info.json"
    with open(split_info_path, "w", encoding="utf-8") as f:
        json.dump(split_info, f, indent=2)

    print(f"📋 Split info saved to: {split_info_path}")
    print()

    print("✅ Dataset splitting complete!")
    print()
    print("📊 Final dataset structure:")
    print("   datasets/")
    print("   ├── control/")
    print(f"   │   ├── train.jsonl ({len(control_train)} samples)")
    print(f"   │   ├── val.jsonl ({len(control_val)} samples)")
    print(f"   │   └── test.jsonl ({len(control_test)} samples)")
    print("   ├── experiment/")
    print(f"   │   ├── train.jsonl ({len(experiment_train)} samples)")
    print(f"   │   ├── val.jsonl ({len(experiment_val)} samples)")
    print(f"   │   └── test.jsonl ({len(experiment_test)} samples)")
    print("   └── split_info.json")

    return split_info


if __name__ == "__main__":
    split_dataset()
