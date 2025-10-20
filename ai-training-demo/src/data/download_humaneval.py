#!/usr/bin/env python3
"""
Download HumanEval dataset from Hugging Face

Usage:
    python download_humaneval.py
"""

import os
from pathlib import Path
from datasets import load_dataset


def download_humaneval(output_dir: str = "datasets/humaneval_raw"):
    """
    Download HumanEval dataset from Hugging Face

    Args:
        output_dir: Directory to save dataset
    """
    print("📥 Downloading HumanEval dataset from Hugging Face...")
    print("   Dataset: openai/openai_humaneval")
    print("   Source: https://huggingface.co/datasets/openai/openai_humaneval")
    print()

    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Download dataset
    dataset = load_dataset("openai/openai_humaneval")

    # Save to disk
    dataset.save_to_disk(output_dir)

    # Print statistics
    num_problems = len(dataset["test"])
    print(f"✅ Downloaded {num_problems} problems")
    print(f"   Saved to: {output_dir}")
    print()

    # Show sample problem
    sample = dataset["test"][0]
    print("📝 Sample Problem (HumanEval/0):")
    print(f"   Task ID: {sample['task_id']}")
    print(f"   Entry Point: {sample['entry_point']}")
    print(f"   Prompt: {sample['prompt'][:100]}...")
    print(f"   Solution: {sample['canonical_solution'][:100]}...")
    print()

    print("✅ Dataset ready for processing!")

    return dataset


if __name__ == "__main__":
    download_humaneval()
