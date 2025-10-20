#!/usr/bin/env python3
"""
Create Control Dataset from HumanEval

Converts HumanEval dataset to control format (no metadata).
This is the baseline dataset without .comments metadata.

Usage:
    python create_control_dataset.py
"""

import json
from pathlib import Path
from datasets import load_from_disk


def create_control_dataset(
    input_dir: str = "datasets/humaneval_raw",
    output_dir: str = "datasets/control"
):
    """
    Create control dataset from HumanEval (no metadata)

    Args:
        input_dir: Directory with downloaded HumanEval
        output_dir: Directory to save control dataset
    """
    print("🔧 Creating control dataset (conventional code, no metadata)...")
    print(f"   Input: {input_dir}")
    print(f"   Output: {output_dir}")
    print()

    # Load HumanEval dataset
    dataset = load_from_disk(input_dir)

    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Convert to control format
    control_samples = []
    for problem in dataset["test"]:
        sample = {
            "task_id": problem["task_id"],
            "prompt": problem["prompt"],
            "completion": problem["canonical_solution"],
            "metadata": {},  # Empty - no .comments metadata
            "test": problem["test"],
            "entry_point": problem["entry_point"]
        }
        control_samples.append(sample)

    # Save as JSONL
    output_file = Path(output_dir) / "humaneval.jsonl"
    with open(output_file, "w", encoding="utf-8") as f:
        for sample in control_samples:
            f.write(json.dumps(sample) + "\n")

    # Print statistics
    num_samples = len(control_samples)
    print(f"✅ Created {num_samples} control samples")
    print(f"   Saved to: {output_file}")
    print()

    # Show sample
    sample = control_samples[0]
    print("📝 Sample Control Data (HumanEval/0):")
    print(f"   Task ID: {sample['task_id']}")
    print(f"   Entry Point: {sample['entry_point']}")
    print(f"   Prompt: {sample['prompt'][:100]}...")
    print(f"   Completion: {sample['completion'][:100]}...")
    print(f"   Metadata: {sample['metadata']}")  # Should be {}
    print()

    print("✅ Control dataset ready!")
    print("   Next: Create experiment dataset with metadata")

    return control_samples


if __name__ == "__main__":
    create_control_dataset()
