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
                    "evaluator_score": [],
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

                    summary["line_coverage"].append(data.get("line_coverage", 0))
                    summary["branch_coverage"].append(data.get("branch_coverage", 0))
                    mut_score = data.get("mutation_score")
                    if mut_score is not None:
                        summary["mutation_score"].append(mut_score)
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
                avg_mut = round(sum(mut_scores) / len(mut_scores), 2) if mut_scores else None

                final_summary.append({
                    "model": model_name,
                    "pass_rate": round((summary["success"] / total) * 100, 2),
                    "avg_line_coverage": round(sum(summary["line_coverage"]) / total, 2),
                    "avg_branch_coverage": round(sum(summary["branch_coverage"]) / total, 2),
                    "avg_mutation_score": avg_mut,
                    "avg_evaluator_score": round(sum(summary["evaluator_score"]) / total, 2),
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

            markdown = "| Model | Pass Rate | Avg Line Coverage | Avg Branch Coverage | Avg Mutation Score | Avg Evaluator Score | Avg Healing Attempts | Avg Time | Avg Cost | Total Cost | Avg Worker Cost | Avg Evaluator Cost | Avg Worker Latency | Avg Evaluator Latency | Avg Initial Line Cov | Avg Initial Branch Cov | Avg Initial Score | Avg Initial Pass Rate |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|\n"
            for row in final_summary:
                mut_score_str = f"{row['avg_mutation_score']}%" if row.get('avg_mutation_score') is not None else "N/A"
                markdown += (
                    f"| {row['model']} | {row['pass_rate']}% | {row['avg_line_coverage']}% "
                    f"| {row['avg_branch_coverage']}% | {mut_score_str} | {row['avg_evaluator_score']} "
                    f"| {row['avg_healing_attempts']} | {row['avg_generation_time']}s "
                    f"| ${row['avg_cost']} | ${row['total_cost']} "
                    f"| ${row['avg_worker_cost']} | ${row['avg_evaluator_cost']} "
                    f"| {row['avg_worker_latency']}s | {row['avg_evaluator_latency']}s "
                    f"| {row['avg_initial_line_coverage']}% | {row['avg_initial_branch_coverage']}% "
                    f"| {row['avg_initial_evaluator_score']} | {row['avg_initial_success_rate']}% |\n"
                )

            with open(summary_path / "benchmark_summary.md", "w", encoding="utf-8") as f:
                f.write(markdown)