"""
Training Configuration for QLoRA Fine-tuning

Hardware targets:
- RTX 4070Ti (12GB VRAM) - Primary training
- Llama-3 8B with 4-bit quantization
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ModelConfig:
    """Model configuration"""

    # Base model
    model_name: str = "meta-llama/Meta-Llama-3-8B"
    tokenizer_name: str = "meta-llama/Meta-Llama-3-8B"

    # Quantization (4-bit for 12GB VRAM)
    load_in_4bit: bool = True
    bnb_4bit_compute_dtype: str = "float16"  # or "bfloat16"
    bnb_4bit_quant_type: str = "nf4"  # Normal Float 4-bit
    bnb_4bit_use_double_quant: bool = True  # Nested quantization

    # LoRA configuration
    lora_r: int = 16  # LoRA rank (higher = more parameters, more VRAM)
    lora_alpha: int = 32  # LoRA scaling factor
    lora_dropout: float = 0.05
    lora_target_modules: list = field(default_factory=lambda: [
        "q_proj",
        "k_proj",
        "v_proj",
        "o_proj",
        "gate_proj",
        "up_proj",
        "down_proj"
    ])

    # Context window
    max_seq_length: int = 2048  # Max tokens per sample


@dataclass
class TrainingConfig:
    """Training hyperparameters"""

    # Training regime
    num_epochs: int = 3
    per_device_train_batch_size: int = 1  # Small for 12GB VRAM
    per_device_eval_batch_size: int = 1
    gradient_accumulation_steps: int = 4  # Effective batch size = 4

    # Optimizer
    learning_rate: float = 2e-4
    weight_decay: float = 0.01
    warmup_ratio: float = 0.1
    lr_scheduler_type: str = "cosine"

    # Gradient clipping
    max_grad_norm: float = 1.0

    # Mixed precision
    fp16: bool = True  # Use FP16 for RTX 4070Ti
    bf16: bool = False  # BF16 only on Ampere+ (RTX 30xx+)

    # Logging
    logging_steps: int = 10
    eval_steps: int = 50
    save_steps: int = 100

    # Evaluation
    evaluation_strategy: str = "steps"
    save_strategy: str = "steps"
    save_total_limit: int = 3  # Keep only 3 checkpoints

    # Early stopping
    load_best_model_at_end: bool = True
    metric_for_best_model: str = "eval_loss"
    greater_is_better: bool = False

    # Memory optimization
    gradient_checkpointing: bool = True
    optim: str = "paged_adamw_8bit"  # 8-bit Adam (saves VRAM)


@dataclass
class DataConfig:
    """Dataset configuration"""

    # Paths
    train_file: str = "datasets/control/train.jsonl"
    val_file: str = "datasets/control/val.jsonl"
    test_file: str = "datasets/control/test.jsonl"

    # Preprocessing
    max_prompt_length: int = 512
    max_completion_length: int = 512

    # Data loading
    num_workers: int = 4
    preprocessing_num_workers: int = 4


@dataclass
class ExperimentConfig:
    """Experiment tracking configuration"""

    # Experiment naming
    experiment_name: str = "humaneval-control"
    run_name: Optional[str] = None  # Auto-generated if None

    # Output directories
    output_dir: str = "outputs/control"
    logging_dir: str = "outputs/control/logs"

    # MLflow
    mlflow_tracking_uri: Optional[str] = None  # "http://server:5000"
    mlflow_experiment_name: str = "HumanEval-Training"

    # Checkpointing
    resume_from_checkpoint: Optional[str] = None

    # Seed for reproducibility
    seed: int = 42


# Preset configurations for different stages

def get_stage1_config() -> tuple[ModelConfig, TrainingConfig, DataConfig, ExperimentConfig]:
    """
    Stage 1: Tiny test (5 samples, 30 min)
    Purpose: Verify code runs without errors
    """
    model_config = ModelConfig()

    training_config = TrainingConfig(
        num_epochs=1,  # Just 1 epoch for quick test
        per_device_train_batch_size=1,
        gradient_accumulation_steps=1,  # No accumulation needed
        logging_steps=1,
        eval_steps=5,
        save_steps=5
    )

    data_config = DataConfig(
        train_file="datasets/control/humaneval_micro.jsonl",
        val_file="datasets/control/humaneval_micro.jsonl",  # Same for quick test
        test_file="datasets/control/humaneval_micro.jsonl"
    )

    experiment_config = ExperimentConfig(
        experiment_name="stage1-validation",
        output_dir="outputs/stage1/control",
        logging_dir="outputs/stage1/control/logs"
    )

    return model_config, training_config, data_config, experiment_config


def get_stage4_config(experiment_type: str = "control") -> tuple[ModelConfig, TrainingConfig, DataConfig, ExperimentConfig]:
    """
    Stage 4: Production (164 samples, 21 hrs per model)

    Args:
        experiment_type: "control" or "experiment"
    """
    model_config = ModelConfig()

    training_config = TrainingConfig(
        num_epochs=3,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=4,
        logging_steps=10,
        eval_steps=50,
        save_steps=100
    )

    if experiment_type == "control":
        data_config = DataConfig(
            train_file="datasets/control/train.jsonl",
            val_file="datasets/control/val.jsonl",
            test_file="datasets/control/test.jsonl"
        )
        experiment_config = ExperimentConfig(
            experiment_name="humaneval-control",
            output_dir="outputs/final/control",
            logging_dir="outputs/final/control/logs"
        )
    else:  # experiment
        data_config = DataConfig(
            train_file="datasets/experiment/train.jsonl",
            val_file="datasets/experiment/val.jsonl",
            test_file="datasets/experiment/test.jsonl"
        )
        experiment_config = ExperimentConfig(
            experiment_name="humaneval-experiment",
            output_dir="outputs/final/experiment",
            logging_dir="outputs/final/experiment/logs"
        )

    return model_config, training_config, data_config, experiment_config


# Hardware validation
def validate_gpu():
    """
    Check if GPU is available and meets requirements

    Returns:
        bool: True if GPU is suitable for training
    """
    try:
        import torch

        if not torch.cuda.is_available():
            print("❌ No CUDA GPU detected")
            return False

        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3  # GB

        print(f"✅ GPU detected: {gpu_name}")
        print(f"   VRAM: {gpu_memory:.1f} GB")

        if gpu_memory < 10:
            print(f"⚠️  Warning: GPU has less than 10GB VRAM")
            print(f"   QLoRA requires ~8-10GB for Llama-3 8B")
            return False

        return True

    except ImportError:
        print("❌ PyTorch not installed")
        return False


if __name__ == "__main__":
    # Test GPU validation
    print("🔍 Validating GPU setup...")
    print()

    if validate_gpu():
        print()
        print("✅ GPU is suitable for QLoRA training!")
    else:
        print()
        print("❌ GPU check failed. Please ensure:")
        print("   1. CUDA-capable GPU is available")
        print("   2. PyTorch with CUDA support is installed")
        print("   3. GPU has at least 10GB VRAM")
