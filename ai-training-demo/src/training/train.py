#!/usr/bin/env python3
"""
QLoRA Fine-tuning for HumanEval

Trains Llama-3 8B with 4-bit quantization on HumanEval dataset.

Usage:
    # Stage 1 validation (5 samples, 30 min)
    python train.py --stage stage1 --experiment-type control

    # Stage 4 production (164 samples, 21 hrs)
    python train.py --stage stage4 --experiment-type control
    python train.py --stage stage4 --experiment-type experiment

    # Custom configuration
    python train.py --config custom_config.json
"""

import argparse
import os
import sys
from pathlib import Path
from datetime import datetime

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    TrainingArguments,
    Trainer,
    BitsAndBytesConfig
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training

# Import our modules
from config import (
    ModelConfig,
    TrainingConfig,
    DataConfig,
    ExperimentConfig,
    get_stage1_config,
    get_stage4_config,
    validate_gpu
)
from dataset import load_humaneval_dataset, get_dataset_stats


def setup_tokenizer(model_config: ModelConfig):
    """
    Load and configure tokenizer

    Args:
        model_config: Model configuration

    Returns:
        Configured tokenizer
    """
    print("📝 Loading tokenizer...")

    tokenizer = AutoTokenizer.from_pretrained(
        model_config.tokenizer_name,
        trust_remote_code=True
    )

    # Add padding token if missing
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        tokenizer.pad_token_id = tokenizer.eos_token_id

    print(f"   ✅ Tokenizer loaded: {model_config.tokenizer_name}")
    print(f"   Vocab size: {len(tokenizer)}")
    print(f"   PAD token: {tokenizer.pad_token}")

    return tokenizer


def setup_model(model_config: ModelConfig):
    """
    Load model with 4-bit quantization and LoRA

    Args:
        model_config: Model configuration

    Returns:
        PEFT model ready for training
    """
    print("🤖 Loading base model with 4-bit quantization...")

    # 4-bit quantization config
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=model_config.load_in_4bit,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_quant_type=model_config.bnb_4bit_quant_type,
        bnb_4bit_use_double_quant=model_config.bnb_4bit_use_double_quant
    )

    # Load base model
    model = AutoModelForCausalLM.from_pretrained(
        model_config.model_name,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True
    )

    print(f"   ✅ Base model loaded: {model_config.model_name}")

    # Prepare for k-bit training
    model = prepare_model_for_kbit_training(model)

    # LoRA configuration
    lora_config = LoraConfig(
        r=model_config.lora_r,
        lora_alpha=model_config.lora_alpha,
        target_modules=model_config.lora_target_modules,
        lora_dropout=model_config.lora_dropout,
        bias="none",
        task_type="CAUSAL_LM"
    )

    # Apply LoRA
    model = get_peft_model(model, lora_config)

    print("   ✅ LoRA applied")
    print(f"   LoRA rank: {model_config.lora_r}")
    print(f"   LoRA alpha: {model_config.lora_alpha}")
    print(f"   Target modules: {len(model_config.lora_target_modules)}")

    # Print trainable parameters
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total_params = sum(p.numel() for p in model.parameters())
    trainable_pct = 100 * trainable_params / total_params

    print()
    print(f"📊 Model parameters:")
    print(f"   Trainable: {trainable_params:,} ({trainable_pct:.2f}%)")
    print(f"   Total: {total_params:,}")

    return model


def setup_datasets(
    data_config: DataConfig,
    tokenizer,
    model_config: ModelConfig,
    experiment_type: str
):
    """
    Load training and validation datasets

    Args:
        data_config: Data configuration
        tokenizer: Tokenizer
        model_config: Model configuration
        experiment_type: "control" or "experiment"

    Returns:
        Tuple of (train_dataset, val_dataset)
    """
    print()
    print("📂 Loading datasets...")

    # Determine if we should include metadata
    include_metadata = (experiment_type == "experiment")

    # Load train dataset
    train_dataset = load_humaneval_dataset(
        data_file=data_config.train_file,
        tokenizer=tokenizer,
        max_length=model_config.max_seq_length,
        include_metadata=include_metadata
    )

    # Load validation dataset
    val_dataset = load_humaneval_dataset(
        data_file=data_config.val_file,
        tokenizer=tokenizer,
        max_length=model_config.max_seq_length,
        include_metadata=include_metadata
    )

    # Print statistics
    print()
    print("📊 Dataset statistics:")
    train_stats = get_dataset_stats(train_dataset)
    print(f"   Train samples: {train_stats['total_samples']}")
    print(f"   Val samples: {len(val_dataset)}")
    print(f"   Avg token length: {train_stats['avg_token_length']:.0f}")
    print(f"   Max token length: {train_stats['max_token_length']}")

    if train_stats['samples_exceeding_max_length'] > 0:
        print(f"   ⚠️  {train_stats['samples_exceeding_max_length']} samples exceed max length (will be truncated)")

    return train_dataset, val_dataset


def setup_training_args(
    training_config: TrainingConfig,
    experiment_config: ExperimentConfig
) -> TrainingArguments:
    """
    Create HuggingFace TrainingArguments

    Args:
        training_config: Training configuration
        experiment_config: Experiment configuration

    Returns:
        TrainingArguments instance
    """
    # Generate run name if not provided
    run_name = experiment_config.run_name
    if run_name is None:
        run_name = f"{experiment_config.experiment_name}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

    return TrainingArguments(
        output_dir=experiment_config.output_dir,
        run_name=run_name,

        # Training regime
        num_train_epochs=training_config.num_epochs,
        per_device_train_batch_size=training_config.per_device_train_batch_size,
        per_device_eval_batch_size=training_config.per_device_eval_batch_size,
        gradient_accumulation_steps=training_config.gradient_accumulation_steps,

        # Optimizer
        learning_rate=training_config.learning_rate,
        weight_decay=training_config.weight_decay,
        warmup_ratio=training_config.warmup_ratio,
        lr_scheduler_type=training_config.lr_scheduler_type,
        optim=training_config.optim,

        # Gradient clipping
        max_grad_norm=training_config.max_grad_norm,

        # Mixed precision
        fp16=training_config.fp16,
        bf16=training_config.bf16,

        # Logging
        logging_dir=experiment_config.logging_dir,
        logging_steps=training_config.logging_steps,
        report_to=["tensorboard"],  # Can add "mlflow" later

        # Evaluation
        evaluation_strategy=training_config.evaluation_strategy,
        eval_steps=training_config.eval_steps,

        # Saving
        save_strategy=training_config.save_strategy,
        save_steps=training_config.save_steps,
        save_total_limit=training_config.save_total_limit,
        load_best_model_at_end=training_config.load_best_model_at_end,
        metric_for_best_model=training_config.metric_for_best_model,
        greater_is_better=training_config.greater_is_better,

        # Memory optimization
        gradient_checkpointing=training_config.gradient_checkpointing,

        # Reproducibility
        seed=experiment_config.seed,

        # Disable features we don't need
        push_to_hub=False,
        remove_unused_columns=False
    )


def train(
    stage: str = "stage1",
    experiment_type: str = "control"
):
    """
    Run training

    Args:
        stage: "stage1" or "stage4"
        experiment_type: "control" or "experiment"
    """
    print("=" * 60)
    print("🚀 HUMANEVAL QLORA TRAINING")
    print("=" * 60)
    print(f"   Stage: {stage}")
    print(f"   Experiment: {experiment_type}")
    print()

    # Validate GPU
    print("🔍 Validating GPU...")
    if not validate_gpu():
        print("❌ GPU validation failed. Aborting.")
        sys.exit(1)
    print()

    # Load configuration
    print(f"⚙️  Loading configuration for {stage}...")
    if stage == "stage1":
        model_config, training_config, data_config, experiment_config = get_stage1_config()
    elif stage == "stage4":
        model_config, training_config, data_config, experiment_config = get_stage4_config(experiment_type)
    else:
        raise ValueError(f"Unknown stage: {stage}")

    # Update experiment name
    experiment_config.experiment_name = f"{stage}-{experiment_type}"
    print(f"   Experiment: {experiment_config.experiment_name}")
    print()

    # Setup tokenizer
    tokenizer = setup_tokenizer(model_config)
    print()

    # Setup model
    model = setup_model(model_config)
    print()

    # Load datasets
    train_dataset, val_dataset = setup_datasets(
        data_config, tokenizer, model_config, experiment_type
    )
    print()

    # Setup training arguments
    print("⚙️  Configuring trainer...")
    training_args = setup_training_args(training_config, experiment_config)
    print(f"   Output dir: {experiment_config.output_dir}")
    print(f"   Epochs: {training_config.num_epochs}")
    print(f"   Batch size: {training_config.per_device_train_batch_size}")
    print(f"   Gradient accumulation: {training_config.gradient_accumulation_steps}")
    print(f"   Effective batch size: {training_config.per_device_train_batch_size * training_config.gradient_accumulation_steps}")
    print()

    # Create trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        tokenizer=tokenizer
    )

    # Train!
    print("=" * 60)
    print("🏋️  STARTING TRAINING")
    print("=" * 60)
    print()

    try:
        trainer.train(resume_from_checkpoint=experiment_config.resume_from_checkpoint)

        print()
        print("=" * 60)
        print("✅ TRAINING COMPLETE!")
        print("=" * 60)
        print()

        # Save final model
        final_model_path = Path(experiment_config.output_dir) / "final_model"
        print(f"💾 Saving final model to {final_model_path}...")
        trainer.save_model(str(final_model_path))
        tokenizer.save_pretrained(str(final_model_path))

        print()
        print("✅ Model saved successfully!")
        print()
        print(f"📊 View training logs:")
        print(f"   tensorboard --logdir {experiment_config.logging_dir}")

    except KeyboardInterrupt:
        print()
        print("⚠️  Training interrupted by user")
        print("   Saving checkpoint...")
        trainer.save_model(str(Path(experiment_config.output_dir) / "interrupted"))
        print("   ✅ Checkpoint saved")

    except Exception as e:
        print()
        print(f"❌ Training failed: {e}")
        raise


def main():
    """Parse arguments and run training"""
    parser = argparse.ArgumentParser(description="QLoRA Fine-tuning for HumanEval")

    parser.add_argument(
        "--stage",
        type=str,
        default="stage1",
        choices=["stage1", "stage4"],
        help="Training stage (stage1=5 samples, stage4=164 samples)"
    )

    parser.add_argument(
        "--experiment-type",
        type=str,
        default="control",
        choices=["control", "experiment"],
        help="Experiment type (control=no metadata, experiment=with metadata)"
    )

    args = parser.parse_args()

    train(stage=args.stage, experiment_type=args.experiment_type)


if __name__ == "__main__":
    main()
