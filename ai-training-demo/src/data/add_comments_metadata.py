#!/usr/bin/env python3
"""
Add .comments Metadata to HumanEval Dataset

Creates experiment dataset by adding metadata fields that would
normally come from .comments files (params, aiMeta, outputs).

Usage:
    python add_comments_metadata.py
"""

import json
import ast
import re
from pathlib import Path
from typing import Dict, List, Any
from datasets import load_from_disk


def estimate_complexity(func_node: ast.FunctionDef) -> int:
    """
    Estimate cyclomatic complexity (1-5 scale)

    Args:
        func_node: AST function definition node

    Returns:
        Complexity score (1=simple, 5=very complex)
    """
    complexity = 1  # Base complexity

    # Count decision points
    for node in ast.walk(func_node):
        if isinstance(node, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
            complexity += 1
        elif isinstance(node, ast.BoolOp):
            complexity += len(node.values) - 1

    # Map to 1-5 scale
    if complexity <= 2:
        return 1
    elif complexity <= 4:
        return 2
    elif complexity <= 7:
        return 3
    elif complexity <= 10:
        return 4
    else:
        return 5


def detect_algorithm_type(func_node: ast.FunctionDef) -> str:
    """
    Detect algorithm pattern from AST

    Args:
        func_node: AST function definition node

    Returns:
        Algorithm type (loop, recursion, nested-loop, etc.)
    """
    has_loop = False
    has_nested_loop = False
    has_recursion = False
    has_sort = False
    has_search = False

    func_name = func_node.name

    for node in ast.walk(func_node):
        # Check for loops
        if isinstance(node, (ast.For, ast.While)):
            if has_loop:
                has_nested_loop = True
            has_loop = True

        # Check for recursion (function calls itself)
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == func_name:
                has_recursion = True

        # Check for sorting
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Attribute):
                if node.func.attr in ["sort", "sorted"]:
                    has_sort = True

        # Check for search patterns
        if isinstance(node, ast.Compare):
            has_search = True

    # Classify
    if has_recursion:
        return "recursion"
    elif has_nested_loop:
        return "nested-loop"
    elif has_sort:
        return "sorting"
    elif has_loop and has_search:
        return "search"
    elif has_loop:
        return "loop"
    elif has_search:
        return "comparison"
    else:
        return "direct"


def analyze_time_complexity(func_node: ast.FunctionDef) -> str:
    """
    Estimate Big-O time complexity

    Args:
        func_node: AST function definition node

    Returns:
        Big-O notation (e.g., "O(n)", "O(n^2)")
    """
    loop_depth = 0
    max_loop_depth = 0
    has_recursion = False

    for node in ast.walk(func_node):
        if isinstance(node, (ast.For, ast.While)):
            loop_depth += 1
            max_loop_depth = max(max_loop_depth, loop_depth)
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == func_node.name:
                has_recursion = True

    # Estimate complexity
    if has_recursion:
        return "O(2^n)"  # Assume exponential for recursion (conservative)
    elif max_loop_depth >= 3:
        return "O(n^3)"
    elif max_loop_depth == 2:
        return "O(n^2)"
    elif max_loop_depth == 1:
        return "O(n)"
    else:
        return "O(1)"


def analyze_space_complexity(func_node: ast.FunctionDef) -> str:
    """
    Estimate Big-O space complexity

    Args:
        func_node: AST function definition node

    Returns:
        Big-O notation for space usage
    """
    has_list_creation = False
    has_recursion = False

    for node in ast.walk(func_node):
        # Check for list/dict creation
        if isinstance(node, (ast.List, ast.Dict, ast.ListComp, ast.DictComp)):
            has_list_creation = True

        # Check for recursion (uses call stack)
        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name) and node.func.id == func_node.name:
                has_recursion = True

    # Estimate space
    if has_recursion:
        return "O(n)"  # Call stack
    elif has_list_creation:
        return "O(n)"  # Data structures
    else:
        return "O(1)"  # Constants only


def extract_edge_cases(test_code: str) -> List[str]:
    """
    Extract edge cases from test code

    Args:
        test_code: Python test code

    Returns:
        List of edge case descriptions
    """
    edge_cases = []

    # Common patterns
    if "[]" in test_code or "== []" in test_code:
        edge_cases.append("empty list")
    if "[0]" in test_code or "== 0" in test_code:
        edge_cases.append("zero value")
    if "None" in test_code:
        edge_cases.append("None input")
    if "1.0" in test_code or "0.0" in test_code:
        edge_cases.append("floating point")
    if re.search(r'\[\d+\]', test_code):
        edge_cases.append("single element")
    if "negative" in test_code.lower() or "-" in test_code:
        edge_cases.append("negative numbers")

    return edge_cases if edge_cases else ["standard inputs"]


def extract_return_type(func_node: ast.FunctionDef) -> str:
    """
    Extract return type annotation

    Args:
        func_node: AST function definition node

    Returns:
        Return type as string
    """
    if func_node.returns:
        return ast.unparse(func_node.returns)
    else:
        return "unknown"


def extract_validation_pattern(prompt: str) -> str:
    """
    Extract what the function validates/checks from docstring

    Args:
        prompt: Function prompt with docstring

    Returns:
        Validation pattern description
    """
    # Look for common patterns in docstring
    prompt_lower = prompt.lower()

    if "check" in prompt_lower:
        return "validation check"
    elif "find" in prompt_lower or "search" in prompt_lower:
        return "search operation"
    elif "sort" in prompt_lower:
        return "sorting"
    elif "count" in prompt_lower:
        return "counting"
    elif "filter" in prompt_lower:
        return "filtering"
    elif "transform" in prompt_lower or "convert" in prompt_lower:
        return "transformation"
    elif "calculate" in prompt_lower or "compute" in prompt_lower:
        return "calculation"
    else:
        return "general operation"


def extract_metadata(problem: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract metadata from HumanEval problem

    This simulates metadata that would come from .comments files.

    Args:
        problem: HumanEval problem dict

    Returns:
        Metadata dict with params/aiMeta fields
    """
    # Parse code
    code = problem["prompt"] + problem["canonical_solution"]
    tree = ast.parse(code)

    # Find function definition
    func_node = None
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            func_node = node
            break

    if not func_node:
        raise ValueError(f"No function found in {problem['task_id']}")

    # Extract metadata
    metadata = {
        "functionName": func_node.name,
        "paramCount": len(func_node.args.args),
        "complexity": estimate_complexity(func_node),
        "algorithmType": detect_algorithm_type(func_node),
        "timeComplexity": analyze_time_complexity(func_node),
        "spaceComplexity": analyze_space_complexity(func_node),
        "edgeCases": extract_edge_cases(problem["test"]),
        "returnType": extract_return_type(func_node),
        "validates": extract_validation_pattern(problem["prompt"])
    }

    return metadata


def create_experiment_dataset(
    input_dir: str = "datasets/humaneval_raw",
    output_dir: str = "datasets/experiment"
):
    """
    Create experiment dataset with .comments metadata

    Args:
        input_dir: Directory with downloaded HumanEval
        output_dir: Directory to save experiment dataset
    """
    print("🔧 Creating experiment dataset (with .comments metadata)...")
    print(f"   Input: {input_dir}")
    print(f"   Output: {output_dir}")
    print()

    # Load HumanEval dataset
    dataset = load_from_disk(input_dir)

    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    # Process all problems
    experiment_samples = []
    errors = []

    for i, problem in enumerate(dataset["test"]):
        try:
            # Extract metadata
            metadata = extract_metadata(problem)

            # Create sample
            sample = {
                "task_id": problem["task_id"],
                "prompt": problem["prompt"],
                "completion": problem["canonical_solution"],
                "metadata": metadata,  # Rich .comments metadata!
                "test": problem["test"],
                "entry_point": problem["entry_point"]
            }
            experiment_samples.append(sample)

            # Progress
            if (i + 1) % 20 == 0:
                print(f"   Processed {i + 1}/164 problems...")

        except Exception as e:
            errors.append((problem["task_id"], str(e)))
            print(f"   ⚠️  Error processing {problem['task_id']}: {e}")

    # Save as JSONL
    output_file = Path(output_dir) / "humaneval.jsonl"
    with open(output_file, "w", encoding="utf-8") as f:
        for sample in experiment_samples:
            f.write(json.dumps(sample) + "\n")

    # Print statistics
    num_samples = len(experiment_samples)
    print()
    print(f"✅ Created {num_samples} experiment samples")
    print(f"   Saved to: {output_file}")
    if errors:
        print(f"   ⚠️  {len(errors)} errors encountered")
    print()

    # Show sample metadata
    if experiment_samples:
        sample = experiment_samples[0]
        print("📝 Sample Experiment Data (HumanEval/0):")
        print(f"   Task ID: {sample['task_id']}")
        print(f"   Entry Point: {sample['entry_point']}")
        print(f"   Metadata:")
        for key, value in sample['metadata'].items():
            print(f"      {key}: {value}")
        print()

    print("✅ Experiment dataset ready!")
    print("   Next: Split datasets into train/val/test")

    return experiment_samples, errors


if __name__ == "__main__":
    create_experiment_dataset()
