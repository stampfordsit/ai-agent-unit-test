import os
import json
import csv
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parents[3]
RAW_REPORT_PATH = BASE_DIR / "results" / "reports"

def generate_mutation_report():
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

            print(f"Generating mutation testing report for {version_name}/{workflow_name}...")
            mutation_report_path = (
                BASE_DIR / "results" / "summary"
                / version_name / workflow_name / "mutation"
            )
            Path(mutation_report_path).mkdir(parents=True, exist_ok=True)

            mutation_summary = defaultdict(
                lambda: {
                    "total_runs": 0,
                    "runs_with_mutation": 0,
                    "mutation_scores": [],
                    "total_mutants": [],
                    "killed_mutants": [],
                    "survived_mutants": [],
                    "ignored_mutants": [],
                    "timeout_mutants": []
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

                    # Skip real-world benchmarks (which are semantic evaluation only)
                    if data.get("execution_skipped", False):
                        continue

                    summary = mutation_summary[model_name]
                    summary["total_runs"] += 1

                    mut_score = data.get("mutation_score")
                    if mut_score is not None:
                        summary["runs_with_mutation"] += 1
                        summary["mutation_scores"].append(mut_score)
                        summary["total_mutants"].append(data.get("total_mutants", 0))
                        summary["killed_mutants"].append(data.get("killed_mutants", 0))
                        summary["survived_mutants"].append(data.get("survived_mutants", 0))
                        summary["ignored_mutants"].append(data.get("ignored_mutants", 0))
                        summary["timeout_mutants"].append(data.get("timeout_mutants", 0))

            final_summary = []
            for model_name, stats in mutation_summary.items():
                total = stats["total_runs"]
                if total == 0:
                    continue

                runs_mut = stats["runs_with_mutation"]
                if runs_mut > 0:
                    avg_score = round(sum(stats["mutation_scores"]) / runs_mut, 2)
                    avg_total = round(sum(stats["total_mutants"]) / runs_mut, 2)
                    avg_killed = round(sum(stats["killed_mutants"]) / runs_mut, 2)
                    avg_survived = round(sum(stats["survived_mutants"]) / runs_mut, 2)
                    avg_ignored = round(sum(stats["ignored_mutants"]) / runs_mut, 2)
                    avg_timeout = round(sum(stats["timeout_mutants"]) / runs_mut, 2)
                    
                    sum_total = sum(stats["total_mutants"])
                    sum_killed = sum(stats["killed_mutants"])
                    sum_survived = sum(stats["survived_mutants"])
                    sum_ignored = sum(stats["ignored_mutants"])
                    sum_timeout = sum(stats["timeout_mutants"])
                else:
                    avg_score = None
                    avg_total = None
                    avg_killed = None
                    avg_survived = None
                    avg_ignored = None
                    avg_timeout = None
                    
                    sum_total = 0
                    sum_killed = 0
                    sum_survived = 0
                    sum_ignored = 0
                    sum_timeout = 0

                final_summary.append({
                    "model": model_name,
                    "total_runs": total,
                    "runs_with_mutation": runs_mut,
                    "avg_mutation_score": avg_score,
                    "avg_total_mutants": avg_total,
                    "avg_killed_mutants": avg_killed,
                    "avg_survived_mutants": avg_survived,
                    "avg_ignored_mutants": avg_ignored,
                    "avg_timeout_mutants": avg_timeout,
                    "total_mutants_count": sum_total,
                    "total_killed_mutants": sum_killed,
                    "total_survived_mutants": sum_survived,
                    "total_ignored_mutants": sum_ignored,
                    "total_timeout_mutants": sum_timeout
                })

            if not final_summary:
                print(f"  No mutation data for {version_name}/{workflow_name}")
                continue

            with open(mutation_report_path / "mutation_analysis.json", "w", encoding="utf-8") as f:
                json.dump(final_summary, f, indent=2)

            with open(mutation_report_path / "mutation_analysis.csv", "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=final_summary[0].keys())
                writer.writeheader()
                writer.writerows(final_summary)

            markdown = (
                "| Model | Total Runs | Runs w/ Mutation | Avg Mutation Score | Avg Total Mutants | "
                "Avg Killed | Avg Survived | Avg Ignored | Avg Timeout | Total Mutants | Total Killed |\n"
                "|---|---|---|---|---|---|---|---|---|---|---|\n"
            )
            for row in final_summary:
                score_str = f"{row['avg_mutation_score']}%" if row['avg_mutation_score'] is not None else "N/A"
                avg_tot = f"{row['avg_total_mutants']}" if row['avg_total_mutants'] is not None else "N/A"
                avg_kil = f"{row['avg_killed_mutants']}" if row['avg_killed_mutants'] is not None else "N/A"
                avg_sur = f"{row['avg_survived_mutants']}" if row['avg_survived_mutants'] is not None else "N/A"
                avg_ign = f"{row['avg_ignored_mutants']}" if row['avg_ignored_mutants'] is not None else "N/A"
                avg_to = f"{row['avg_timeout_mutants']}" if row['avg_timeout_mutants'] is not None else "N/A"

                markdown += (
                    f"| {row['model']} | {row['total_runs']} | {row['runs_with_mutation']} | {score_str} "
                    f"| {avg_tot} | {avg_kil} | {avg_sur} | {avg_ign} | {avg_to} "
                    f"| {row['total_mutants_count']} | {row['total_killed_mutants']} |\n"
                )

            with open(mutation_report_path / "mutation_analysis.md", "w", encoding="utf-8") as f:
                f.write(markdown)

if __name__ == "__main__":
    generate_mutation_report()
