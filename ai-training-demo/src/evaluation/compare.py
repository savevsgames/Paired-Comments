#!/usr/bin/env python3
"""
Compare Control vs Experiment Models

Evaluates both models and performs statistical comparison.
"""

import argparse
import json
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

from scipy import stats
import numpy as np

from humaneval_evaluator import evaluate_model
from config import get_stage1_eval_config, get_stage4_eval_config


def compute_statistical_significance(
    control_results: Dict[str, Any],
    experiment_results: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Compute statistical significance between control and experiment

    Args:
        control_results: Control model evaluation results
        experiment_results: Experiment model evaluation results

    Returns:
        Statistical test results
    """
    # Extract pass/fail for each sample
    control_passed = [r["passed"] for r in control_results["results"]]
    experiment_passed = [r["passed"] for r in experiment_results["results"]]

    # Convert to binary (1=pass, 0=fail)
    control_binary = [1 if p else 0 for p in control_passed]
    experiment_binary = [1 if p else 0 for p in experiment_passed]

    # Paired t-test (same samples, different models)
    t_statistic, p_value = stats.ttest_rel(experiment_binary, control_binary)

    # Effect size (Cohen's d)
    diff = np.array(experiment_binary) - np.array(control_binary)
    cohens_d = np.mean(diff) / (np.std(diff) + 1e-10)

    # McNemar's test (for paired binary data)
    # Contingency table: [[both_fail, control_only], [experiment_only, both_pass]]
    both_pass = sum(1 for i in range(len(control_binary))
                    if control_binary[i] == 1 and experiment_binary[i] == 1)
    both_fail = sum(1 for i in range(len(control_binary))
                    if control_binary[i] == 0 and experiment_binary[i] == 0)
    control_only = sum(1 for i in range(len(control_binary))
                       if control_binary[i] == 1 and experiment_binary[i] == 0)
    experiment_only = sum(1 for i in range(len(control_binary))
                          if control_binary[i] == 0 and experiment_binary[i] == 1)

    # McNemar's chi-squared
    if (control_only + experiment_only) > 0:
        mcnemar_chi2 = ((experiment_only - control_only) ** 2) / (experiment_only + control_only)
        mcnemar_p = 1 - stats.chi2.cdf(mcnemar_chi2, 1)
    else:
        mcnemar_chi2 = 0.0
        mcnemar_p = 1.0

    return {
        "t_statistic": float(t_statistic),
        "p_value": float(p_value),
        "cohens_d": float(cohens_d),
        "significant": p_value < 0.05,
        "mcnemar_chi2": float(mcnemar_chi2),
        "mcnemar_p": float(mcnemar_p),
        "contingency": {
            "both_pass": both_pass,
            "both_fail": both_fail,
            "control_only": control_only,
            "experiment_only": experiment_only
        }
    }


def generate_comparison_report(
    control_metrics: Dict[str, Any],
    experiment_metrics: Dict[str, Any],
    control_results: Dict[str, Any],
    experiment_results: Dict[str, Any],
    stats_results: Dict[str, Any],
    output_file: str
):
    """
    Generate markdown comparison report

    Args:
        control_metrics: Control model metrics
        experiment_metrics: Experiment model metrics
        control_results: Control detailed results
        experiment_results: Experiment detailed results
        stats_results: Statistical test results
        output_file: Output markdown file
    """
    report = []

    report.append("# HumanEval Evaluation - Comparison Report")
    report.append("")
    report.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append("")
    report.append("---")
    report.append("")

    # Overall metrics
    report.append("## 📊 Overall Results")
    report.append("")
    report.append("| Model | Pass@1 | Passed | Failed | Total |")
    report.append("|-------|--------|--------|--------|-------|")
    report.append(f"| **Control** (no metadata) | {control_metrics['pass@1']*100:.1f}% | {control_metrics['passed']} | {control_metrics['failed']} | {control_metrics['total_samples']} |")
    report.append(f"| **Experiment** (with metadata) | {experiment_metrics['pass@1']*100:.1f}% | {experiment_metrics['passed']} | {experiment_metrics['failed']} | {experiment_metrics['total_samples']} |")
    report.append("")

    # Improvement
    improvement = experiment_metrics['pass@1'] - control_metrics['pass@1']
    improvement_pct = (improvement / control_metrics['pass@1'] * 100) if control_metrics['pass@1'] > 0 else 0

    report.append("### 🎯 Improvement")
    report.append("")
    report.append(f"- **Absolute improvement:** +{improvement*100:.1f} percentage points")
    report.append(f"- **Relative improvement:** +{improvement_pct:.1f}%")
    report.append("")

    if improvement > 0:
        report.append(f"✅ Experiment model outperforms control by {improvement*100:.1f}%")
    elif improvement < 0:
        report.append(f"❌ Experiment model underperforms control by {abs(improvement)*100:.1f}%")
    else:
        report.append("⚖️ Both models perform equally")
    report.append("")

    # Statistical significance
    report.append("## 📈 Statistical Significance")
    report.append("")
    report.append("### Paired t-test")
    report.append("")
    report.append(f"- **t-statistic:** {stats_results['t_statistic']:.3f}")
    report.append(f"- **p-value:** {stats_results['p_value']:.4f}")
    report.append(f"- **Cohen's d (effect size):** {stats_results['cohens_d']:.3f}")
    report.append("")

    if stats_results['significant']:
        report.append(f"✅ **Result is statistically significant** (p < 0.05)")
    else:
        report.append(f"⚠️ **Result is NOT statistically significant** (p >= 0.05)")
    report.append("")

    # Effect size interpretation
    d = abs(stats_results['cohens_d'])
    if d < 0.2:
        effect = "negligible"
    elif d < 0.5:
        effect = "small"
    elif d < 0.8:
        effect = "medium"
    else:
        effect = "large"

    report.append(f"**Effect size interpretation:** {effect} effect (|d| = {d:.3f})")
    report.append("")

    # McNemar's test
    report.append("### McNemar's Test (Paired Binary Data)")
    report.append("")
    report.append(f"- **χ² statistic:** {stats_results['mcnemar_chi2']:.3f}")
    report.append(f"- **p-value:** {stats_results['mcnemar_p']:.4f}")
    report.append("")

    # Contingency table
    cont = stats_results['contingency']
    report.append("**Contingency Table:**")
    report.append("")
    report.append(f"- Both models pass: {cont['both_pass']}")
    report.append(f"- Both models fail: {cont['both_fail']}")
    report.append(f"- Only control passes: {cont['control_only']}")
    report.append(f"- Only experiment passes: {cont['experiment_only']}")
    report.append("")

    # Per-sample comparison
    report.append("## 📋 Per-Sample Comparison")
    report.append("")
    report.append("| Task ID | Control | Experiment | Winner |")
    report.append("|---------|---------|------------|--------|")

    for i in range(len(control_results["results"])):
        control_r = control_results["results"][i]
        experiment_r = experiment_results["results"][i]

        task_id = control_r["task_id"]
        control_status = "✅ PASS" if control_r["passed"] else "❌ FAIL"
        experiment_status = "✅ PASS" if experiment_r["passed"] else "❌ FAIL"

        if control_r["passed"] and experiment_r["passed"]:
            winner = "➖ Both"
        elif control_r["passed"]:
            winner = "🔵 Control"
        elif experiment_r["passed"]:
            winner = "🟢 Experiment"
        else:
            winner = "➖ Neither"

        report.append(f"| {task_id} | {control_status} | {experiment_status} | {winner} |")

    report.append("")

    # Conclusion
    report.append("## 🎯 Conclusion")
    report.append("")

    if improvement > 0 and stats_results['significant']:
        report.append(f"✅ **The experiment model (with .comments metadata) significantly outperforms the control model.**")
        report.append("")
        report.append(f"- Improvement: +{improvement*100:.1f} percentage points (+{improvement_pct:.1f}%)")
        report.append(f"- Statistical significance: p = {stats_results['p_value']:.4f} (p < 0.05)")
        report.append(f"- Effect size: {effect} (Cohen's d = {stats_results['cohens_d']:.3f})")
    elif improvement > 0:
        report.append(f"⚠️ **The experiment model shows improvement but it is NOT statistically significant.**")
        report.append("")
        report.append(f"- Improvement: +{improvement*100:.1f} percentage points (+{improvement_pct:.1f}%)")
        report.append(f"- Statistical significance: p = {stats_results['p_value']:.4f} (p >= 0.05)")
        report.append(f"- Recommendation: Collect more data or tune hyperparameters")
    else:
        report.append(f"❌ **The experiment model does not show improvement over the control model.**")
        report.append("")
        report.append(f"- Change: {improvement*100:.1f} percentage points")
        report.append(f"- Recommendation: Review metadata quality, training hyperparameters, or model architecture")

    report.append("")
    report.append("---")
    report.append("")
    report.append(f"*Report generated by HumanEval Comparison Tool*")

    # Write report
    Path(output_file).parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(report))

    print(f"📄 Report saved to {output_file}")


def compare_models(stage: str = "stage4"):
    """
    Compare control vs experiment models

    Args:
        stage: "stage1" or "stage4"
    """
    print("=" * 60)
    print("🔬 HUMANEVAL MODEL COMPARISON")
    print("=" * 60)
    print(f"   Stage: {stage}")
    print()

    # Load configuration
    if stage == "stage1":
        config = get_stage1_eval_config()
    else:
        config = get_stage4_eval_config()

    # Evaluate control model
    print("🔵 Evaluating CONTROL model (no metadata)...")
    print("-" * 60)
    control_output = f"{config.output_dir}/control_results.json"
    control_metrics = evaluate_model(
        model_path=config.control_model_path,
        test_file=config.test_file,
        output_file=control_output
    )
    print()

    # Evaluate experiment model
    print("🟢 Evaluating EXPERIMENT model (with metadata)...")
    print("-" * 60)
    experiment_output = f"{config.output_dir}/experiment_results.json"
    experiment_metrics = evaluate_model(
        model_path=config.experiment_model_path,
        test_file=config.test_file,
        output_file=experiment_output
    )
    print()

    # Load detailed results
    with open(control_output, "r") as f:
        control_results = json.load(f)
    with open(experiment_output, "r") as f:
        experiment_results = json.load(f)

    # Statistical comparison
    print("📊 Computing statistical significance...")
    stats_results = compute_statistical_significance(
        control_results, experiment_results
    )

    # Generate report
    print("📄 Generating comparison report...")
    report_file = f"{config.output_dir}/comparison_report.md"
    generate_comparison_report(
        control_metrics, experiment_metrics,
        control_results, experiment_results,
        stats_results, report_file
    )

    # Save combined results
    combined_output = f"{config.output_dir}/combined_results.json"
    combined = {
        "control": control_metrics,
        "experiment": experiment_metrics,
        "improvement": {
            "absolute": experiment_metrics['pass@1'] - control_metrics['pass@1'],
            "relative_pct": ((experiment_metrics['pass@1'] - control_metrics['pass@1']) / control_metrics['pass@1'] * 100) if control_metrics['pass@1'] > 0 else 0
        },
        "statistical_tests": stats_results
    }

    with open(combined_output, "w") as f:
        json.dump(combined, f, indent=2)

    print(f"💾 Combined results saved to {combined_output}")
    print()

    # Print summary
    print("=" * 60)
    print("✅ COMPARISON COMPLETE")
    print("=" * 60)
    print()
    print(f"📊 Results:")
    print(f"   Control:    {control_metrics['pass@1']*100:.1f}% pass@1")
    print(f"   Experiment: {experiment_metrics['pass@1']*100:.1f}% pass@1")
    print(f"   Improvement: +{(experiment_metrics['pass@1'] - control_metrics['pass@1'])*100:.1f} percentage points")
    print()
    print(f"📈 Statistical significance: p = {stats_results['p_value']:.4f}")
    if stats_results['significant']:
        print(f"   ✅ Result is statistically significant")
    else:
        print(f"   ⚠️  Result is NOT statistically significant")
    print()
    print(f"📄 Full report: {report_file}")


def main():
    """Parse arguments and run comparison"""
    parser = argparse.ArgumentParser(description="Compare Control vs Experiment Models")

    parser.add_argument(
        "--stage",
        type=str,
        default="stage4",
        choices=["stage1", "stage4"],
        help="Evaluation stage"
    )

    args = parser.parse_args()

    compare_models(stage=args.stage)


if __name__ == "__main__":
    main()
