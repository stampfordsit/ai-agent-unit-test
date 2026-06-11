import os
import json
import csv
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parents[3]
RAW_REPORT_PATH = BASE_DIR / "results" / "reports"

def generate_evaluator_report():
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

            # Analyze evaluator-guided and compiler-guided-multi-agent workflows for this report
            if workflow_name not in ["evaluator-guided", "compiler-guided-multi-agent"]:
                continue

            print(f"Generating evaluator-guided report for {version_name}/{workflow_name}...")
            report_out_path = (
                BASE_DIR / "results" / "summary"
                / version_name / workflow_name / "evaluator"
            )
            Path(report_out_path).mkdir(parents=True, exist_ok=True)

            evaluator_summary = defaultdict(
                lambda: {
                    "total": 0,
                    "refined_runs": 0,
                    "avg_initial_score": 0.0,
                    "avg_final_score": 0.0,
                    "sum_initial_score": 0.0,
                    "sum_final_score": 0.0,
                    "score_improvements": [],
                    "attempts_distribution": defaultdict(int),
                    "successful_refinements": 0, # count where score >= 75 eventually
                    "failed_refinements": 0
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

                    # Skip real_world (no execution)
                    if data.get("execution_skipped", False):
                        continue

                    summary = evaluator_summary[model_name]
                    summary["total"] += 1

                    final_score = data.get("evaluator_score", 0)
                    loop_log = data.get("evaluator_loop_log", [])
                    attempts = len(loop_log)

                    if attempts == 0:
                        # Initial score was already >= 75, no refinement needed
                        initial_score = final_score
                    else:
                        # Refinement loop was executed
                        initial_score = loop_log[0].get("score_before", 0)
                        summary["refined_runs"] += 1
                        summary["attempts_distribution"][attempts] += 1
                        
                        if final_score >= 75:
                            summary["successful_refinements"] += 1
                        else:
                            summary["failed_refinements"] += 1

                    summary["sum_initial_score"] += initial_score
                    summary["sum_final_score"] += final_score
                    summary["score_improvements"].append(final_score - initial_score)

            final_summary = []
            for model_name, stats in evaluator_summary.items():
                total = stats["total"]
                if total == 0:
                    continue

                avg_initial = stats["sum_initial_score"] / total
                avg_final = stats["sum_final_score"] / total
                avg_improvement = sum(stats["score_improvements"]) / total

                refinement_rate = 0.0
                refinement_success_rate = 0.0
                if total > 0:
                    refinement_rate = (stats["refined_runs"] / total) * 100
                if stats["refined_runs"] > 0:
                    refinement_success_rate = (stats["successful_refinements"] / stats["refined_runs"]) * 100

                final_summary.append({
                    "model": model_name,
                    "total_runs": total,
                    "avg_initial_score": round(avg_initial, 2),
                    "avg_final_score": round(avg_final, 2),
                    "avg_improvement": round(avg_improvement, 2),
                    "runs_needing_refinement": stats["refined_runs"],
                    "refinement_rate_pct": round(refinement_rate, 2),
                    "successful_refinement_count": stats["successful_refinements"],
                    "refinement_success_rate_pct": round(refinement_success_rate, 2),
                    "refined_in_1_attempts": stats["attempts_distribution"][1],
                    "refined_in_2_attempts": stats["attempts_distribution"][2],
                    "refined_in_3_attempts": stats["attempts_distribution"][3]
                })

            if not final_summary:
                print(f"  No evaluator-guided data for {version_name}/{workflow_name}")
                continue

            with open(report_out_path / "evaluator_guided_analysis.json", "w", encoding="utf-8") as f:
                json.dump(final_summary, f, indent=2)

            with open(report_out_path / "evaluator_guided_analysis.csv", "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=final_summary[0].keys())
                writer.writeheader()
                writer.writerows(final_summary)

            markdown = "| Model | Total Runs | Avg Initial Score | Avg Final Score | Avg Improvement | Needing Refinement | Refinement Rate | Success Refined | Refinement Success Rate | Attempt 1 | Attempt 2 | Attempt 3 |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n"
            for row in final_summary:
                markdown += (
                    f"| {row['model']} | {row['total_runs']} | {row['avg_initial_score']} "
                    f"| {row['avg_final_score']} | +{row['avg_improvement']} "
                    f"| {row['runs_needing_refinement']} | {row['refinement_rate_pct']}% "
                    f"| {row['successful_refinement_count']} | {row['refinement_success_rate_pct']}% "
                    f"| {row['refined_in_1_attempts']} | {row['refined_in_2_attempts']} | {row['refined_in_3_attempts']} |\n"
                )

            with open(report_out_path / "evaluator_guided_analysis.md", "w", encoding="utf-8") as f:
                f.write(markdown)

if __name__ == "__main__":
    generate_evaluator_report()
