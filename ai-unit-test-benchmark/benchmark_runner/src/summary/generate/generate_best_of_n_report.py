import os
import json
import csv
from pathlib import Path
from collections import defaultdict
from statistics import mean

BASE_DIR = Path(__file__).resolve().parents[3]
RAW_REPORT_PATH = BASE_DIR / "results" / "reports"

def generate_best_of_n_report():
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

            # Analyze best-of-n and compiler-guided-multi-agent workflows
            if workflow_name not in ["best-of-n", "compiler-guided-multi-agent"]:
                continue

            print(f"Generating Best-of-N selection report for {version_name}/{workflow_name}...")
            report_out_path = (
                BASE_DIR / "results" / "summary"
                / version_name / workflow_name / "selector"
            )
            Path(report_out_path).mkdir(parents=True, exist_ok=True)

            best_of_n_summary = defaultdict(
                lambda: {
                    "total": 0,
                    "candidate_scores": defaultdict(list),
                    "selected_scores": [],
                    "candidate_coverages": defaultdict(list),
                    "selected_coverages": [],
                    "selection_changed_count": 0, # count where Candidate 1 was NOT selected (meaning other candidate was better)
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

                    summary = best_of_n_summary[model_name]
                    summary["total"] += 1

                    selected_score = data.get("evaluator_score", 0)
                    selected_coverage = data.get("line_coverage", 0)
                    summary["selected_scores"].append(selected_score)
                    summary["selected_coverages"].append(selected_coverage)

                    candidates = data.get("best_of_n_candidates", [])
                    if candidates:
                        # Find candidate 1 details
                        cand1 = next((c for c in candidates if c.get("candidate_index") == 1), None)
                        if cand1:
                            c1_score = cand1.get("score", 0)
                            c1_cov = cand1.get("line_coverage", 0)
                        else:
                            c1_score = selected_score
                            c1_cov = selected_coverage

                        # Check if selection changed the outcome (meaning another candidate got a better score than Candidate 1)
                        # We sort candidates by index to see if the best one had index != 1
                        sorted_by_score = sorted(candidates, key=lambda x: x.get("score", 0), reverse=True)
                        if sorted_by_score and sorted_by_score[0].get("candidate_index") != 1:
                            # Selection actually picked a better candidate than the first try
                            summary["selection_changed_count"] += 1

                        for c in candidates:
                            idx = c.get("candidate_index", 1)
                            summary["candidate_scores"][idx].append(c.get("score", 0))
                            summary["candidate_coverages"][idx].append(c.get("line_coverage", 0))

            final_summary = []
            for model_name, stats in best_of_n_summary.items():
                total = stats["total"]
                if total == 0:
                    continue

                avg_selected = mean(stats["selected_scores"])
                avg_selected_cov = mean(stats["selected_coverages"])

                # Average for each candidate
                avg_cand1 = mean(stats["candidate_scores"][1]) if stats["candidate_scores"][1] else avg_selected
                avg_cand1_cov = mean(stats["candidate_coverages"][1]) if stats["candidate_coverages"][1] else avg_selected_cov

                avg_cand2 = mean(stats["candidate_scores"][2]) if stats["candidate_scores"][2] else 0.0
                avg_cand3 = mean(stats["candidate_scores"][3]) if stats["candidate_scores"][3] else 0.0

                score_improvement = avg_selected - avg_cand1
                cov_improvement = avg_selected_cov - avg_cand1_cov

                selection_change_pct = (stats["selection_changed_count"] / total) * 100

                final_summary.append({
                    "model": model_name,
                    "total_runs": total,
                    "avg_first_candidate_score": round(avg_cand1, 2),
                    "avg_first_candidate_coverage": round(avg_cand1_cov, 2),
                    "avg_selected_score": round(avg_selected, 2),
                    "avg_selected_coverage": round(avg_selected_cov, 2),
                    "avg_score_improvement": round(score_improvement, 2),
                    "avg_coverage_improvement": round(cov_improvement, 2),
                    "selection_changed_pct": round(selection_change_pct, 2),
                    "avg_candidate2_score": round(avg_cand2, 2),
                    "avg_candidate3_score": round(avg_cand3, 2),
                })

            if not final_summary:
                print(f"  No Best-of-N selection logs found for {version_name}/{workflow_name}")
                continue

            with open(report_out_path / "best_of_n_analysis.json", "w", encoding="utf-8") as f:
                json.dump(final_summary, f, indent=2)

            with open(report_out_path / "best_of_n_analysis.csv", "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=final_summary[0].keys())
                writer.writeheader()
                writer.writerows(final_summary)

            markdown = "| Model | Total Runs | Avg C1 Score | Avg Selected Score | Avg Score Improvement | Avg C1 Coverage | Avg Selected Coverage | Avg Coverage Improvement | Selection Changed Rate |\n|---|---|---|---|---|---|---|---|---|\n"
            for row in final_summary:
                markdown += (
                    f"| {row['model']} | {row['total_runs']} | {row['avg_first_candidate_score']} "
                    f"| {row['avg_selected_score']} | +{row['avg_score_improvement']} "
                    f"| {row['avg_first_candidate_coverage']}% | {row['avg_selected_coverage']}% "
                    f"| +{row['avg_coverage_improvement']}% | {row['selection_changed_pct']}% |\n"
                )

            with open(report_out_path / "best_of_n_analysis.md", "w", encoding="utf-8") as f:
                f.write(markdown)

if __name__ == "__main__":
    generate_best_of_n_report()
