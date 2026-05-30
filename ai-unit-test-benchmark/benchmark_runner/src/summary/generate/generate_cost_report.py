import os
import json
import csv

from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parents[3]
RAW_REPORT_PATH = BASE_DIR / "results" / "reports"

def generate_cost_report():
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

            print(f"Generating cost report for {version_name}/{workflow_name}...")
            cost_report_path = (
                BASE_DIR / "results" / "summary"
                / version_name / workflow_name / "cost"
            )
            Path(cost_report_path).mkdir(parents=True, exist_ok=True)

            cost_summary = defaultdict(
                lambda: {"coverage": [], "cost": [], "worker_cost": [], "evaluator_cost": []}
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

                    # Coverage only meaningful for synthetic
                    coverage = 0 if data.get("execution_skipped", False) else data.get("line_coverage", 0)
                    cost_summary[model_name]["coverage"].append(coverage)
                    cost_summary[model_name]["cost"].append(data.get("cost", 0))  # field is "cost"
                    cost_summary[model_name]["worker_cost"].append(data.get("worker_cost", 0.0))
                    cost_summary[model_name]["evaluator_cost"].append(data.get("evaluator_cost", 0.0))

            final_summary = []
            for model_name, summary in cost_summary.items():
                if not summary["cost"]:
                    continue
                avg_coverage = sum(summary["coverage"]) / len(summary["coverage"])
                avg_cost = sum(summary["cost"]) / len(summary["cost"])
                avg_worker_cost = sum(summary["worker_cost"]) / len(summary["worker_cost"])
                avg_evaluator_cost = sum(summary["evaluator_cost"]) / len(summary["evaluator_cost"])
                coverage_per_dollar = (avg_coverage / avg_cost) if avg_cost > 0 else 0

                if avg_worker_cost == 0.0 and avg_evaluator_cost == 0.0 and avg_cost > 0.0:
                    avg_worker_cost = None
                    avg_evaluator_cost = None

                final_summary.append({
                    "model": model_name,
                    "avg_coverage": round(avg_coverage, 2),
                    "avg_worker_cost": round(avg_worker_cost, 6) if avg_worker_cost is not None else None,
                    "avg_evaluator_cost": round(avg_evaluator_cost, 6) if avg_evaluator_cost is not None else None,
                    "avg_cost": round(avg_cost, 6),
                    "coverage_per_dollar": round(coverage_per_dollar, 2)
                })

            if not final_summary:
                print(f"  No data for {version_name}/{workflow_name}")
                continue

            with open(cost_report_path / "cost_efficiency.json", "w", encoding="utf-8") as f:
                json.dump(final_summary, f, indent=2)

            with open(cost_report_path / "cost_efficiency.csv", "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=final_summary[0].keys())
                writer.writeheader()
                writer.writerows(final_summary)

            markdown = "| Model | Avg Coverage | Avg Worker Cost | Avg Evaluator Cost | Avg Total Cost | Coverage per Dollar |\n|---|---|---|---|---|---|\n"
            for row in final_summary:
                worker_str = f"${row['avg_worker_cost']}" if row['avg_worker_cost'] is not None else "N/A"
                evaluator_str = f"${row['avg_evaluator_cost']}" if row['avg_evaluator_cost'] is not None else "N/A"
                markdown += (
                    f"| {row['model']} | {row['avg_coverage']}% | {worker_str} "
                    f"| {evaluator_str} | ${row['avg_cost']} | {row['coverage_per_dollar']} |\n"
                )

            with open(cost_report_path / "cost_efficiency.md", "w", encoding="utf-8") as f:
                f.write(markdown)