#!/usr/bin/env python3
"""
Create Micro Dataset for Stage 1 Validation

Extracts 5 HumanEval problems for tiny model testing.
Used for 30-minute validation run before committing to full training.

Usage:
    python create_micro_dataset.py
"""

import json
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


def create_micro_dataset(
    control_input: str = "datasets/control/humaneval.jsonl",
    experiment_input: str = "datasets/experiment/humaneval.jsonl",
    num_samples: int = 5,
    output_suffix: str = "micro"
):
    """
    Create micro dataset for Stage 1 validation

    Extracts first N samples from both datasets for quick testing.

    Args:
        control_input: Path to control dataset
        experiment_input: Path to experiment dataset
        num_samples: Number of samples to extract
        output_suffix: Suffix for output files
    """
    print(f"🔧 Creating micro dataset ({num_samples} samples)...")
    print(f"   Control: {control_input}")
    print(f"   Experiment: {experiment_input}")
    print()

    # Load full datasets
    print("📥 Loading datasets...")
    control = load_jsonl(control_input)
    experiment = load_jsonl(experiment_input)

    print(f"   Loaded {len(control)} control samples")
    print(f"   Loaded {len(experiment)} experiment samples")
    print()

    # Extract first N samples (deterministic)
    control_micro = control[:num_samples]
    experiment_micro = experiment[:num_samples]

    # Save micro datasets
    control_output = f"datasets/control/humaneval_{output_suffix}.jsonl"
    experiment_output = f"datasets/experiment/humaneval_{output_suffix}.jsonl"

    save_jsonl(control_micro, control_output)
    save_jsonl(experiment_micro, experiment_output)

    print(f"💾 Saved micro datasets:")
    print(f"   ✅ {control_output} ({len(control_micro)} samples)")
    print(f"   ✅ {experiment_output} ({len(experiment_micro)} samples)")
    print()

    # Show sample task IDs
    print("📋 Micro dataset task IDs:")
    for i, sample in enumerate(control_micro):
        metadata_info = ""
        if experiment_micro[i]["metadata"]:
            meta = experiment_micro[i]["metadata"]
            metadata_info = f" | Experiment: {meta.get('algorithmType', 'unknown')} ({meta.get('timeComplexity', 'unknown')})"

        print(f"   {i+1}. {sample['task_id']} - {sample['entry_point']}{metadata_info}")

    print()
    print("✅ Micro dataset ready for Stage 1 validation!")
    print()
    print("📊 Usage:")
    print(f"   - Control model: Train on {control_output}")
    print(f"   - Experiment model: Train on {experiment_output}")
    print(f"   - Training time: ~30 minutes per model")
    print(f"   - Purpose: Verify code runs without errors")

    return control_micro, experiment_micro


if __name__ == "__main__":
    create_micro_dataset()
