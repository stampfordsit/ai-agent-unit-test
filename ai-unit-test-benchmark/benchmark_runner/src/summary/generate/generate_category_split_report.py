import os
import json
import csv

from pathlib import Path
from statistics import mean
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parents[3]
RAW_REPORT_PATH = BASE_DIR / "results" / "reports"


def _aggregate(reports: list[dict], label: str) -> dict:
    """Compute aggregate metrics for a group of reports."""
    if not reports:
        return {"total": 0, "category": label, "note": f"No {label} benchmarks found"}

    is_real_world = all(r.get("execution_skipped", False) for r in reports)

    result = {
        "total": len(reports),
        "category": label,
    }

    # Pass rate — only meaningful for synthetic
    if is_real_world:
        result["pass_rate_pct"] = "N/A (execution skipped)"
    else:
        passed = sum(1 for r in reports if r.get("success", False))
        result["pass_rate_pct"] = round(passed / len(reports) * 100, 2)

    # Coverage — only for synthetic
    if not is_real_world:
        result["avg_line_coverage_pct"] = round(mean([r.get("line_coverage", 0) for r in reports]), 2)
        result["avg_branch_coverage_pct"] = round(mean([r.get("branch_coverage", 0) for r in reports]), 2)
    else:
        result["avg_line_coverage_pct"] = "N/A (execution skipped)"
        result["avg_branch_coverage_pct"] = "N/A (execution skipped)"

    # Evaluator score — available for all categories
    scores = [r.get("evaluator_score", 0) for r in reports]
    result["avg_evaluator_score"] = round(mean(scores), 2)
    result["max_evaluator_score"] = max(scores)
    result["min_evaluator_score"] = min(scores)

    # Generation time
    times = [r.get("generation_time", 0) for r in reports]
    result["avg_generation_time_sec"] = round(mean(times), 2)
    result["total_generation_time_sec"] = round(sum(times), 2)

    # Cost
    costs = [r.get("cost", 0) for r in reports]
    result["avg_cost_usd"] = round(mean(costs), 6)
    result["total_cost_usd"] = round(sum(costs), 6)

    # Self-healing stats
    healing = [r.get("healing_attempts", 0) for r in reports]
    if any(h > 0 for h in healing):
        result["avg_healing_attempts"] = round(mean(healing), 2)
        result["healing_success_count"] = sum(
            1 for r in reports if r.get("healing_attempts", 0) > 0 and r.get("success", False)
        )

    return result


def generate_category_split_report():
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

            for model_name in os.listdir(workflow_path):
                model_path = workflow_path / model_name
                if not model_path.is_dir():
                    continue

                # Load all JSON reports for this model x workflow
                all_reports = []
                for filename in os.listdir(model_path):
                    if not filename.endswith(".json"):
                        continue
                    with open(model_path / filename, "r", encoding="utf-8") as f:
                        try:
                            all_reports.append(json.load(f))
                        except json.JSONDecodeError:
                            print(f"    [WARN] Could not parse {filename}, skipping.")

                if not all_reports:
                    continue

                print(f"    -> {version_name}/{workflow_name}/{model_name}: {len(all_reports)} reports")

                # Split by category
                synthetic = [r for r in all_reports if not r.get("execution_skipped", False)]
                real_world = [r for r in all_reports if r.get("execution_skipped", False)]

                synthetic_summary = _aggregate(synthetic, "synthetic")
                real_world_summary = _aggregate(real_world, "real_world")

                # Overall — cross-category fair metrics only
                overall_summary = {
                    "total": len(all_reports),
                    "synthetic_count": len(synthetic),
                    "real_world_count": len(real_world),
                    "avg_evaluator_score": round(mean([r.get("evaluator_score", 0) for r in all_reports]), 2),
                    "avg_generation_time_sec": round(mean([r.get("generation_time", 0) for r in all_reports]), 2),
                    "total_cost_usd": round(sum([r.get("cost", 0) for r in all_reports]), 6),
                    "note": "Pass rate and coverage are reported in synthetic_summary only."
                }

                # Per-benchmark flat list (for Excel / further analysis)
                per_benchmark = [
                    {
                        "benchmark_id": r.get("benchmark_id"),
                        "category": "real_world" if r.get("execution_skipped") else "synthetic",
                        "success": r.get("success"),
                        "execution_skipped": r.get("execution_skipped"),
                        "line_coverage": r.get("line_coverage"),
                        "branch_coverage": r.get("branch_coverage"),
                        "evaluator_score": r.get("evaluator_score"),
                        "generation_time_sec": r.get("generation_time"),
                        "cost_usd": r.get("cost"),
                        "healing_attempts": r.get("healing_attempts", 0),
                        "evaluation_mode": r.get("evaluation_mode"),
                        "workflow": r.get("workflow"),
                        "model": r.get("model"),
                    }
                    for r in all_reports
                ]

                # Output path
                out_dir = (
                    BASE_DIR / "results" / "summary"
                    / version_name / workflow_name / model_name / "category_split"
                )
                out_dir.mkdir(parents=True, exist_ok=True)

                def _save_json(data, filename):
                    with open(out_dir / filename, "w", encoding="utf-8") as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)

                def _save_csv(rows, filename):
                    if not rows:
                        return
                    with open(out_dir / filename, "w", newline="", encoding="utf-8") as f:
                        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
                        writer.writeheader()
                        writer.writerows(rows)

                _save_json(synthetic_summary, "synthetic_summary.json")
                _save_json(real_world_summary, "real_world_summary.json")
                _save_json(overall_summary, "overall_summary.json")
                _save_json(per_benchmark, "per_benchmark.json")
                _save_csv(per_benchmark, "per_benchmark.csv")
