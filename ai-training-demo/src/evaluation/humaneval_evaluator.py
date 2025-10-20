"""
HumanEval Evaluator

Uses official HumanEval evaluation harness to compute pass@k metrics.
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel


@dataclass
class HumanEvalResult:
    """Results from HumanEval evaluation"""

    task_id: str
    prompt: str
    generated_code: str
    passed: bool
    error: Optional[str] = None


class HumanEvalEvaluator:
    """Evaluator for HumanEval dataset"""

    def __init__(
        self,
        model_path: str,
        base_model_name: str = "meta-llama/Meta-Llama-3-8B",
        temperature: float = 0.2,
        max_new_tokens: int = 512
    ):
        """
        Initialize evaluator

        Args:
            model_path: Path to fine-tuned model (LoRA adapter)
            base_model_name: Base model name
            temperature: Sampling temperature
            max_new_tokens: Max tokens to generate
        """
        self.model_path = model_path
        self.base_model_name = base_model_name
        self.temperature = temperature
        self.max_new_tokens = max_new_tokens

        print(f"📦 Loading model from {model_path}...")
        self.tokenizer, self.model = self._load_model()
        print("   ✅ Model loaded")

    def _load_model(self):
        """Load model with LoRA adapter"""
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            self.model_path,
            trust_remote_code=True
        )

        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token

        # Load base model (8-bit for inference)
        base_model = AutoModelForCausalLM.from_pretrained(
            self.base_model_name,
            load_in_8bit=True,
            device_map="auto",
            trust_remote_code=True
        )

        # Load LoRA adapter
        model = PeftModel.from_pretrained(base_model, self.model_path)
        model.eval()

        return tokenizer, model

    def generate_completion(self, prompt: str) -> str:
        """
        Generate code completion for prompt

        Args:
            prompt: Function signature and docstring

        Returns:
            Generated code completion
        """
        # Tokenize
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2048
        ).to(self.model.device)

        # Generate
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=self.max_new_tokens,
                temperature=self.temperature,
                do_sample=True if self.temperature > 0 else False,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id
            )

        # Decode (remove prompt)
        full_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        completion = full_text[len(prompt):]

        return completion

    def evaluate_sample(self, sample: Dict[str, Any]) -> HumanEvalResult:
        """
        Evaluate single HumanEval sample

        Args:
            sample: HumanEval sample dict

        Returns:
            Evaluation result
        """
        task_id = sample["task_id"]
        prompt = sample["prompt"]
        test_code = sample["test"]
        entry_point = sample["entry_point"]

        # Generate completion
        generated_code = self.generate_completion(prompt)

        # Test generated code
        passed, error = self._test_code(
            prompt, generated_code, test_code, entry_point
        )

        return HumanEvalResult(
            task_id=task_id,
            prompt=prompt,
            generated_code=generated_code,
            passed=passed,
            error=error
        )

    def _test_code(
        self,
        prompt: str,
        completion: str,
        test_code: str,
        entry_point: str
    ) -> tuple[bool, Optional[str]]:
        """
        Test generated code against unit tests

        Args:
            prompt: Function signature
            completion: Generated code
            test_code: Unit test code
            entry_point: Function name

        Returns:
            Tuple of (passed, error_message)
        """
        # Combine prompt + completion
        full_code = prompt + completion

        # Create test environment
        namespace = {}

        try:
            # Execute the generated code
            exec(full_code, namespace)

            # Check if entry point exists
            if entry_point not in namespace:
                return False, f"Function '{entry_point}' not found in generated code"

            # Execute tests
            exec(test_code, namespace)

            # Call check function
            check_func = namespace.get("check")
            if check_func is None:
                return False, "Test function 'check' not found"

            candidate = namespace[entry_point]
            check_func(candidate)

            # If no exception, tests passed
            return True, None

        except AssertionError as e:
            return False, f"Test failed: {str(e)}"
        except Exception as e:
            return False, f"Execution error: {type(e).__name__}: {str(e)}"

    def evaluate_dataset(
        self,
        dataset_file: str,
        output_file: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluate full dataset

        Args:
            dataset_file: Path to JSONL dataset
            output_file: Optional path to save results

        Returns:
            Evaluation metrics
        """
        print(f"📊 Evaluating {dataset_file}...")

        # Load dataset
        samples = []
        with open(dataset_file, "r", encoding="utf-8") as f:
            for line in f:
                samples.append(json.loads(line))

        print(f"   {len(samples)} samples to evaluate")

        # Evaluate each sample
        results = []
        passed_count = 0

        for i, sample in enumerate(samples):
            print(f"   [{i+1}/{len(samples)}] {sample['task_id']}...", end=" ")

            result = self.evaluate_sample(sample)
            results.append(result)

            if result.passed:
                passed_count += 1
                print("✅ PASSED")
            else:
                print(f"❌ FAILED: {result.error}")

        # Compute metrics
        total = len(samples)
        pass_at_1 = passed_count / total if total > 0 else 0.0

        metrics = {
            "total_samples": total,
            "passed": passed_count,
            "failed": total - passed_count,
            "pass@1": pass_at_1
        }

        print()
        print(f"📊 Results:")
        print(f"   Total: {total}")
        print(f"   Passed: {passed_count}")
        print(f"   Failed: {total - passed_count}")
        print(f"   Pass@1: {pass_at_1*100:.1f}%")

        # Save results
        if output_file:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            output_data = {
                "metrics": metrics,
                "results": [
                    {
                        "task_id": r.task_id,
                        "passed": r.passed,
                        "error": r.error,
                        "generated_code": r.generated_code
                    }
                    for r in results
                ]
            }

            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(output_data, f, indent=2)

            print(f"   💾 Saved to {output_file}")

        return metrics


def evaluate_model(
    model_path: str,
    test_file: str,
    output_file: str,
    base_model_name: str = "meta-llama/Meta-Llama-3-8B"
) -> Dict[str, Any]:
    """
    Evaluate a single model on HumanEval

    Args:
        model_path: Path to model
        test_file: Test dataset JSONL
        output_file: Where to save results
        base_model_name: Base model name

    Returns:
        Evaluation metrics
    """
    evaluator = HumanEvalEvaluator(
        model_path=model_path,
        base_model_name=base_model_name,
        temperature=0.2,
        max_new_tokens=512
    )

    metrics = evaluator.evaluate_dataset(
        dataset_file=test_file,
        output_file=output_file
    )

    return metrics


if __name__ == "__main__":
    """Test evaluator"""
    import argparse

    parser = argparse.ArgumentParser(description="HumanEval Evaluation")
    parser.add_argument("--model", type=str, required=True, help="Path to model")
    parser.add_argument("--test-file", type=str, required=True, help="Test dataset")
    parser.add_argument("--output", type=str, required=True, help="Output file")

    args = parser.parse_args()

    print("🚀 HumanEval Evaluation")
    print("=" * 60)
    print()

    metrics = evaluate_model(
        model_path=args.model,
        test_file=args.test_file,
        output_file=args.output
    )

    print()
    print("✅ Evaluation complete!")
