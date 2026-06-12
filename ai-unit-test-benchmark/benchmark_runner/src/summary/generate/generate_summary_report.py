import os
import json
import csv

from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parents[3]
RAW_REPORT_PATH = BASE_DIR / "results" / "reports"

def generate_summary_report():
    if not RAW_REPORT_PATH.exists():
        print("  [SKIP] No reports directory found.")
        return

    for version_name in os.listdir(RAW_REPORT_PATH):
        version_path = RAW_REPORT_PATH / version_name
        if not version_path.is_dir():
            continue

        for workflow_name in os.listdir(version_path):
            workflow_path = version_path / workflow_name
            if not workflow_path.is_dir():
                continue

            print(f"Generating summary report for {version_name}/{workflow_name}...")
            summary_path = (
                BASE_DIR / "results" / "summary"
                / version_name / workflow_name / "summary"
            )
            Path(summary_path).mkdir(parents=True, exist_ok=True)

            model_summary = defaultdict(
                lambda: {
                    "total": 0,
                    "success": 0,
                    "line_coverage": [],
                    "branch_coverage": [],
                    "mutation_score": [],
                    "mut_total": [],
                    "mut_killed": [],
                    "mut_timeout": [],
                    "mut_ignored": [],
                    "evaluator_score": [],
                    "success_evaluator_score": [],
                    "healing_attempts": [],
                    "generation_time": [],
                    "cost": [],
                    "worker_cost": [],
                    "evaluator_cost": [],
                    "worker_latency": [],
                    "evaluator_latency": [],
                    "initial_line_coverage": [],
                    "initial_branch_coverage": [],
                    "initial_evaluator_score": [],
                    "initial_success": []
                }
            )

            for model_name in os.listdir(workflow_path):
                model_path = workflow_path / model_name
                if not model_path.is_dir():
                    continue

                for filename in os.listdir(model_path):
                    if not filename.endswith(".json"):
                        continue

                    with open(model_path / filename, "r", encoding="utf-8") as f:
                        data = json.load(f)

                    # Skip real_world for execution metrics
                    if data.get("execution_skipped", False):
                        continue

                    summary = model_summary[model_name]
                    summary["total"] += 1

                    if data.get("success", False):
                        summary["success"] += 1
                        summary["success_evaluator_score"].append(data.get("evaluator_score", 0))
                    
                    summary["line_coverage"].append(data.get("line_coverage", 0))
                    summary["branch_coverage"].append(data.get("branch_coverage", 0))
                    mut_score = data.get("mutation_score")
                    if mut_score is not None:
                        summary["mutation_score"].append(mut_score)
                        summary["mut_total"].append(data.get("total_mutants", 0))
                        summary["mut_killed"].append(data.get("killed_mutants", 0))
                        summary["mut_timeout"].append(data.get("timeout_mutants", 0))
                        summary["mut_ignored"].append(data.get("ignored_mutants", 0))
                    summary["evaluator_score"].append(data.get("evaluator_score", 0))
                    summary["healing_attempts"].append(data.get("healing_attempts", 0))
                    summary["generation_time"].append(data.get("generation_time", 0))
                    summary["cost"].append(data.get("cost", 0))  # field is "cost"
                    summary["worker_cost"].append(data.get("worker_cost", 0.0))
                    summary["evaluator_cost"].append(data.get("evaluator_cost", 0.0))
                    summary["worker_latency"].append(data.get("worker_latency", 0.0))
                    summary["evaluator_latency"].append(data.get("evaluator_latency", 0.0))
                    summary["initial_line_coverage"].append(data.get("initial_line_coverage", 0.0))
                    summary["initial_branch_coverage"].append(data.get("initial_branch_coverage", 0.0))
                    summary["initial_evaluator_score"].append(data.get("initial_evaluator_score", 0))
                    summary["initial_success"].append(1 if data.get("initial_success", False) else 0)

            final_summary = []
            for model_name, summary in model_summary.items():
                total = summary["total"]
                if total == 0:
                    continue

                mut_scores = summary["mutation_score"]
                if mut_scores:
                    sum_total = sum(summary["mut_total"])
                    sum_killed = sum(summary["mut_killed"])
                    sum_timeout = sum(summary["mut_timeout"])
                    sum_ignored = sum(summary["mut_ignored"])
                    active = sum_total - sum_ignored
                    avg_mut = round(((sum_killed + sum_timeout) / active) * 100, 2) if active > 0 else 0.0
                else:
                    avg_mut = None

                pass_rate = round((summary["success"] / total) * 100, 2)

                # Coverage and Evaluator
                success_count = summary["success"]
                cond_line_cov = round(sum(summary["line_coverage"]) / success_count, 2) if success_count > 0 else 0.0
                eff_line_cov = round(sum(summary["line_coverage"]) / total, 2)

                cond_branch_cov = round(sum(summary["branch_coverage"]) / success_count, 2) if success_count > 0 else 0.0
                eff_branch_cov = round(sum(summary["branch_coverage"]) / total, 2)

                cond_eval_score = round(sum(summary.get("success_evaluator_score", [])) / success_count, 2) if success_count > 0 else 0.0
                eff_eval_score = round(sum(summary["evaluator_score"]) / total, 2)

                eff_mut = round((pass_rate / 100) * avg_mut, 2) if avg_mut is not None else None

                final_summary.append({
                    "model": model_name,
                    "pass_rate": pass_rate,
                    "conditional_line_coverage": cond_line_cov,
                    "effective_line_coverage": eff_line_cov,
                    "conditional_branch_coverage": cond_branch_cov,
                    "effective_branch_coverage": eff_branch_cov,
                    "conditional_mutation_score": avg_mut,
                    "effective_mutation_score": eff_mut,
                    "conditional_evaluator_score": cond_eval_score,
                    "effective_evaluator_score": eff_eval_score,
                    "avg_healing_attempts": round(sum(summary["healing_attempts"]) / total, 2),
                    "avg_generation_time": round(sum(summary["generation_time"]) / total, 2),
                    "avg_cost": round(sum(summary["cost"]) / total, 6),
                    "total_cost": round(sum(summary["cost"]), 6),
                    "avg_worker_cost": round(sum(summary["worker_cost"]) / total, 6),
                    "avg_evaluator_cost": round(sum(summary["evaluator_cost"]) / total, 6),
                    "avg_worker_latency": round(sum(summary["worker_latency"]) / total, 2),
                    "avg_evaluator_latency": round(sum(summary["evaluator_latency"]) / total, 2),
                    "avg_initial_line_coverage": round(sum(summary["initial_line_coverage"]) / total, 2),
                    "avg_initial_branch_coverage": round(sum(summary["initial_branch_coverage"]) / total, 2),
                    "avg_initial_evaluator_score": round(sum(summary["initial_evaluator_score"]) / total, 2),
                    "avg_initial_success_rate": round((sum(summary["initial_success"]) / total) * 100, 2)
                })

            if not final_summary:
                print(f"  No data for {version_name}/{workflow_name}")
                continue

            with open(summary_path / "benchmark_summary.json", "w", encoding="utf-8") as f:
                json.dump(final_summary, f, indent=2)

            with open(summary_path / "benchmark_summary.csv", "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=final_summary[0].keys())
                writer.writeheader()
                writer.writerows(final_summary)

            markdown = "| Model | Pass Rate | Cond Line Cov | Eff Line Cov | Cond Branch Cov | Eff Branch Cov | Cond Mut Score | Eff Mut Score | Cond Eval Score | Eff Eval Score | Avg Healing Attempts | Avg Time | Avg Cost | Total Cost | Avg Worker Cost | Avg Evaluator Cost | Avg Worker Latency | Avg Evaluator Latency | Avg Initial Line Cov | Avg Initial Branch Cov | Avg Initial Score | Avg Initial Pass Rate |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n"
            for row in final_summary:
                cond_mut_score_str = f"{row['conditional_mutation_score']}%" if row.get('conditional_mutation_score') is not None else "N/A"
                eff_mut_score_str = f"{row['effective_mutation_score']}%" if row.get('effective_mutation_score') is not None else "N/A"
                markdown += (
                    f"| {row['model']} | {row['pass_rate']}% | {row['conditional_line_coverage']}% | {row['effective_line_coverage']}% "
                    f"| {row['conditional_branch_coverage']}% | {row['effective_branch_coverage']}% | {cond_mut_score_str} | {eff_mut_score_str} "
                    f"| {row['conditional_evaluator_score']} | {row['effective_evaluator_score']} "
                    f"| {row['avg_healing_attempts']} | {row['avg_generation_time']}s "
                    f"| ${row['avg_cost']} | ${row['total_cost']} "
                    f"| ${row['avg_worker_cost']} | ${row['avg_evaluator_cost']} "
                    f"| {row['avg_worker_latency']}s | {row['avg_evaluator_latency']}s "
                    f"| {row['avg_initial_line_coverage']}% | {row['avg_initial_branch_coverage']}% "
                    f"| {row['avg_initial_evaluator_score']} | {row['avg_initial_success_rate']}% |\n"
                )

            with open(summary_path / "benchmark_summary.md", "w", encoding="utf-8") as f:
                f.write(markdown)