"""
MLflow Logging Integration

Logs training and evaluation metrics to MLflow tracking server.
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional

try:
    import mlflow
    MLFLOW_AVAILABLE = True
except ImportError:
    MLFLOW_AVAILABLE = False
    print("⚠️  MLflow not installed. Logging disabled.")


class MLflowLogger:
    """MLflow logging wrapper"""

    def __init__(
        self,
        tracking_uri: Optional[str] = None,
        experiment_name: str = "HumanEval-Training"
    ):
        """
        Initialize MLflow logger

        Args:
            tracking_uri: MLflow tracking server URI (e.g., "http://server:5000")
            experiment_name: Experiment name
        """
        if not MLFLOW_AVAILABLE:
            self.enabled = False
            return

        self.enabled = True

        if tracking_uri:
            mlflow.set_tracking_uri(tracking_uri)
            print(f"📊 MLflow tracking URI: {tracking_uri}")

        mlflow.set_experiment(experiment_name)
        print(f"🔬 MLflow experiment: {experiment_name}")

    def log_training_run(
        self,
        run_name: str,
        model_type: str,
        config: Dict[str, Any],
        metrics: Dict[str, Any],
        model_path: Optional[str] = None
    ):
        """
        Log training run to MLflow

        Args:
            run_name: Run name (e.g., "stage1-control")
            model_type: "control" or "experiment"
            config: Training configuration
            metrics: Training metrics
            model_path: Path to saved model
        """
        if not self.enabled:
            return

        with mlflow.start_run(run_name=run_name):
            # Log parameters
            mlflow.log_param("model_type", model_type)
            mlflow.log_param("stage", config.get("stage", "unknown"))

            # Training config
            if "training_config" in config:
                tc = config["training_config"]
                mlflow.log_param("num_epochs", tc.get("num_epochs"))
                mlflow.log_param("batch_size", tc.get("per_device_train_batch_size"))
                mlflow.log_param("learning_rate", tc.get("learning_rate"))
                mlflow.log_param("lora_r", tc.get("lora_r"))

            # Log metrics
            for key, value in metrics.items():
                mlflow.log_metric(key, value)

            # Log model artifacts
            if model_path and Path(model_path).exists():
                mlflow.log_artifact(model_path)

            print(f"   ✅ Logged to MLflow: {run_name}")

    def log_evaluation_run(
        self,
        run_name: str,
        model_type: str,
        humaneval_metrics: Dict[str, Any],
        results_file: str
    ):
        """
        Log evaluation run to MLflow

        Args:
            run_name: Run name (e.g., "stage4-control-eval")
            model_type: "control" or "experiment"
            humaneval_metrics: HumanEval metrics
            results_file: Path to detailed results JSON
        """
        if not self.enabled:
            return

        with mlflow.start_run(run_name=run_name):
            # Log parameters
            mlflow.log_param("model_type", model_type)
            mlflow.log_param("evaluation_type", "humaneval")

            # Log metrics
            mlflow.log_metric("pass@1", humaneval_metrics["pass@1"])
            mlflow.log_metric("passed", humaneval_metrics["passed"])
            mlflow.log_metric("failed", humaneval_metrics["failed"])
            mlflow.log_metric("total", humaneval_metrics["total_samples"])

            # Log results file
            if Path(results_file).exists():
                mlflow.log_artifact(results_file)

            print(f"   ✅ Logged evaluation to MLflow: {run_name}")

    def log_comparison_run(
        self,
        run_name: str,
        control_metrics: Dict[str, Any],
        experiment_metrics: Dict[str, Any],
        statistical_tests: Dict[str, Any],
        report_file: str
    ):
        """
        Log comparison run to MLflow

        Args:
            run_name: Run name (e.g., "stage4-comparison")
            control_metrics: Control model metrics
            experiment_metrics: Experiment model metrics
            statistical_tests: Statistical test results
            report_file: Comparison report markdown
        """
        if not self.enabled:
            return

        with mlflow.start_run(run_name=run_name):
            # Log metrics
            mlflow.log_metric("control_pass@1", control_metrics["pass@1"])
            mlflow.log_metric("experiment_pass@1", experiment_metrics["pass@1"])

            improvement = experiment_metrics["pass@1"] - control_metrics["pass@1"]
            mlflow.log_metric("improvement_absolute", improvement)

            if control_metrics["pass@1"] > 0:
                improvement_pct = (improvement / control_metrics["pass@1"]) * 100
                mlflow.log_metric("improvement_relative_pct", improvement_pct)

            # Log statistical tests
            mlflow.log_metric("p_value", statistical_tests["p_value"])
            mlflow.log_metric("cohens_d", statistical_tests["cohens_d"])
            mlflow.log_param("statistically_significant", statistical_tests["significant"])

            # Log report
            if Path(report_file).exists():
                mlflow.log_artifact(report_file)

            print(f"   ✅ Logged comparison to MLflow: {run_name}")


def setup_mlflow_logging(
    tracking_uri: Optional[str] = None,
    experiment_name: str = "HumanEval-Training"
) -> MLflowLogger:
    """
    Setup MLflow logging

    Args:
        tracking_uri: MLflow server URI
        experiment_name: Experiment name

    Returns:
        MLflowLogger instance
    """
    if not MLFLOW_AVAILABLE:
        print("⚠️  MLflow not installed. Run: pip install mlflow")
        print("   Continuing without MLflow logging...")
        return MLflowLogger(tracking_uri=None)

    return MLflowLogger(
        tracking_uri=tracking_uri,
        experiment_name=experiment_name
    )


if __name__ == "__main__":
    """Test MLflow logger"""
    print("🧪 Testing MLflow logger...")
    print()

    logger = setup_mlflow_logging()

    if logger.enabled:
        print("✅ MLflow logger initialized")
        print()
        print("Usage:")
        print("   logger = MLflowLogger(tracking_uri='http://server:5000')")
        print("   logger.log_training_run('stage1-control', 'control', config, metrics)")
    else:
        print("⚠️  MLflow not available")
        print("   Install with: pip install mlflow")
