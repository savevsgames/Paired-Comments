"""
Dataset loader for HumanEval training data

Handles both control (no metadata) and experiment (with metadata) datasets.
"""

import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from torch.utils.data import Dataset


@dataclass
class HumanEvalSample:
    """Single HumanEval training sample"""

    task_id: str
    prompt: str
    completion: str
    metadata: Dict[str, Any]
    test: str
    entry_point: str

    def to_training_text(self, include_metadata: bool = False) -> str:
        """
        Convert sample to training text format

        Args:
            include_metadata: If True, prepend metadata as comments

        Returns:
            Formatted training text
        """
        if not include_metadata or not self.metadata:
            # Control dataset: Just prompt + completion
            return self.prompt + self.completion

        # Experiment dataset: Add metadata as .comments-style annotations
        metadata_text = self._format_metadata()
        return metadata_text + "\n" + self.prompt + self.completion

    def _format_metadata(self) -> str:
        """Format metadata as comment-style annotations"""
        if not self.metadata:
            return ""

        lines = ["# .comments metadata"]

        # Function info
        if "functionName" in self.metadata:
            lines.append(f"# @function {self.metadata['functionName']}")

        if "paramCount" in self.metadata:
            lines.append(f"# @params {self.metadata['paramCount']}")

        # Algorithm info
        if "algorithmType" in self.metadata:
            lines.append(f"# @algorithm {self.metadata['algorithmType']}")

        if "complexity" in self.metadata:
            lines.append(f"# @complexity {self.metadata['complexity']}/5")

        # Performance
        if "timeComplexity" in self.metadata:
            lines.append(f"# @time {self.metadata['timeComplexity']}")

        if "spaceComplexity" in self.metadata:
            lines.append(f"# @space {self.metadata['spaceComplexity']}")

        # Edge cases
        if "edgeCases" in self.metadata and self.metadata["edgeCases"]:
            edge_cases = ", ".join(self.metadata["edgeCases"])
            lines.append(f"# @edgeCases {edge_cases}")

        # Validation
        if "validates" in self.metadata:
            lines.append(f"# @validates {self.metadata['validates']}")

        return "\n".join(lines)


class HumanEvalDataset(Dataset):
    """PyTorch Dataset for HumanEval training data"""

    def __init__(
        self,
        data_file: str,
        tokenizer,
        max_length: int = 2048,
        include_metadata: bool = False
    ):
        """
        Initialize dataset

        Args:
            data_file: Path to JSONL file
            tokenizer: HuggingFace tokenizer
            max_length: Maximum sequence length
            include_metadata: Include metadata in training text
        """
        self.data_file = data_file
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.include_metadata = include_metadata

        # Load samples
        self.samples = self._load_samples()

        print(f"📊 Loaded {len(self.samples)} samples from {data_file}")
        if include_metadata:
            print(f"   Including .comments metadata in training")

    def _load_samples(self) -> List[HumanEvalSample]:
        """Load samples from JSONL file"""
        samples = []
        with open(self.data_file, "r", encoding="utf-8") as f:
            for line in f:
                data = json.loads(line)
                sample = HumanEvalSample(
                    task_id=data["task_id"],
                    prompt=data["prompt"],
                    completion=data["completion"],
                    metadata=data.get("metadata", {}),
                    test=data["test"],
                    entry_point=data["entry_point"]
                )
                samples.append(sample)
        return samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        """
        Get training sample

        Returns:
            Dict with input_ids, attention_mask, labels
        """
        sample = self.samples[idx]

        # Convert to text
        text = sample.to_training_text(include_metadata=self.include_metadata)

        # Tokenize
        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )

        # Labels = input_ids (causal LM training)
        labels = encoding["input_ids"].clone()

        # Mask padding tokens in labels (-100 = ignore in loss)
        labels[labels == self.tokenizer.pad_token_id] = -100

        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "labels": labels.squeeze(0),
            "task_id": sample.task_id
        }


def load_humaneval_dataset(
    data_file: str,
    tokenizer,
    max_length: int = 2048,
    include_metadata: bool = False
) -> HumanEvalDataset:
    """
    Load HumanEval dataset

    Args:
        data_file: Path to JSONL file
        tokenizer: HuggingFace tokenizer
        max_length: Maximum sequence length
        include_metadata: Include metadata (True for experiment, False for control)

    Returns:
        HumanEvalDataset instance
    """
    return HumanEvalDataset(
        data_file=data_file,
        tokenizer=tokenizer,
        max_length=max_length,
        include_metadata=include_metadata
    )


def get_dataset_stats(dataset: HumanEvalDataset) -> Dict[str, Any]:
    """
    Get dataset statistics

    Args:
        dataset: HumanEvalDataset instance

    Returns:
        Dict with statistics
    """
    total_samples = len(dataset)
    samples_with_metadata = sum(1 for s in dataset.samples if s.metadata)

    # Token length statistics
    token_lengths = []
    for sample in dataset.samples:
        text = sample.to_training_text(include_metadata=dataset.include_metadata)
        tokens = dataset.tokenizer(text, return_tensors="pt")
        token_lengths.append(tokens["input_ids"].shape[1])

    stats = {
        "total_samples": total_samples,
        "samples_with_metadata": samples_with_metadata,
        "avg_token_length": sum(token_lengths) / len(token_lengths),
        "max_token_length": max(token_lengths),
        "min_token_length": min(token_lengths),
        "samples_exceeding_max_length": sum(
            1 for length in token_lengths if length > dataset.max_length
        )
    }

    return stats


if __name__ == "__main__":
    """Test dataset loading"""
    print("🧪 Testing dataset loader...")
    print()

    # Test loading control dataset
    print("📂 Control dataset (no metadata):")
    print("   File: datasets/control/humaneval_micro.jsonl")
    print()

    # Note: This test requires tokenizer to be loaded
    # Run with: python -c "from dataset import HumanEvalDataset; ..."
    print("✅ Dataset loader ready!")
    print()
    print("Usage:")
    print("   from dataset import load_humaneval_dataset")
    print("   dataset = load_humaneval_dataset(")
    print("       'datasets/control/train.jsonl',")
    print("       tokenizer,")
    print("       max_length=2048,")
    print("       include_metadata=False  # False for control, True for experiment")
    print("   )")
