"""
Evaluation Configuration

Configuration for HumanEval evaluation and Azure AI SDK metrics.
"""

from dataclasses import dataclass, field
from typing import Optional, List


@dataclass
class EvaluationConfig:
    """Evaluation configuration"""

    # Models to evaluate
    control_model_path: str = "outputs/final/control/final_model"
    experiment_model_path: str = "outputs/final/experiment/final_model"
    base_model_name: str = "meta-llama/Meta-Llama-3-8B"

    # Test dataset
    test_file: str = "datasets/control/test.jsonl"  # Same for both (25 samples)

    # HumanEval settings
    num_samples_per_task: int = 1  # For pass@1 (can be 10 for pass@10)
    temperature: float = 0.2  # Low temperature for deterministic generation
    max_new_tokens: int = 512

    # Azure AI Evaluation SDK
    use_azure_eval: bool = True
    azure_openai_api_key: Optional[str] = None  # Set via env var
    azure_openai_endpoint: Optional[str] = None  # Set via env var
    azure_deployment_name: str = "gpt-4o"  # For evaluation metrics

    # Metrics to compute
    enable_humaneval: bool = True  # Functional correctness (pass@k)
    enable_azure_metrics: bool = True  # Azure AI SDK metrics

    azure_metrics: List[str] = field(default_factory=lambda: [
        "coherence",
        "fluency",
        "groundedness",
        "relevance",
        "similarity",
        "f1_score"
    ])

    # Output
    output_dir: str = "evaluation/results"
    save_predictions: bool = True  # Save generated code
    save_detailed_results: bool = True  # Save per-sample results

    # MLflow
    mlflow_tracking_uri: Optional[str] = None  # "http://server:5000"
    mlflow_experiment_name: str = "HumanEval-Evaluation"


@dataclass
class ComparisonConfig:
    """Configuration for comparing control vs experiment"""

    # Statistical tests
    run_statistical_tests: bool = True
    significance_level: float = 0.05  # p < 0.05 for significance

    # Visualization
    create_plots: bool = True
    plot_formats: List[str] = field(default_factory=lambda: ["png", "pdf"])

    # Report generation
    generate_report: bool = True
    report_format: str = "markdown"  # or "html", "pdf"

    # Output
    output_dir: str = "evaluation/comparison"


def get_stage1_eval_config() -> EvaluationConfig:
    """
    Stage 1: Quick evaluation (5 samples)
    Purpose: Verify evaluation code works
    """
    return EvaluationConfig(
        control_model_path="outputs/stage1/control/final_model",
        experiment_model_path="outputs/stage1/experiment/final_model",
        test_file="datasets/control/humaneval_micro.jsonl",
        num_samples_per_task=1,
        enable_azure_metrics=False,  # Skip expensive Azure calls for quick test
        output_dir="evaluation/results/stage1"
    )


def get_stage4_eval_config() -> EvaluationConfig:
    """
    Stage 4: Full evaluation (25 test samples)
    Purpose: Production evaluation
    """
    return EvaluationConfig(
        control_model_path="outputs/final/control/final_model",
        experiment_model_path="outputs/final/experiment/final_model",
        test_file="datasets/control/test.jsonl",
        num_samples_per_task=1,  # pass@1
        enable_azure_metrics=True,  # Full evaluation
        output_dir="evaluation/results/final"
    )


if __name__ == "__main__":
    """Test configuration"""
    print("🔧 Evaluation Configuration")
    print()

    print("Stage 1 (Quick validation):")
    config = get_stage1_eval_config()
    print(f"   Test file: {config.test_file}")
    print(f"   Azure metrics: {config.enable_azure_metrics}")
    print(f"   Output: {config.output_dir}")
    print()

    print("Stage 4 (Full evaluation):")
    config = get_stage4_eval_config()
    print(f"   Test file: {config.test_file}")
    print(f"   Azure metrics: {config.enable_azure_metrics}")
    print(f"   Metrics: {', '.join(config.azure_metrics)}")
    print(f"   Output: {config.output_dir}")
