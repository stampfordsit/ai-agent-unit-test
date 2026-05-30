import os
import json
import csv
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parents[3]
RAW_REPORT_PATH = BASE_DIR / "results" / "reports"

def generate_healing_report():
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

            print(f"Generating self-healing report for {version_name}/{workflow_name}...")
            healing_report_path = (
                BASE_DIR / "results" / "summary"
                / version_name / workflow_name / "healing"
            )
            Path(healing_report_path).mkdir(parents=True, exist_ok=True)

            healing_summary = defaultdict(
                lambda: {
                    "total": 0,
                    "initial_success": 0,
                    "initial_fail": 0,
                    "healed_success": 0,
                    "healed_fail": 0,
                    "attempts_distribution": defaultdict(int)
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

                    summary = healing_summary[model_name]
                    summary["total"] += 1

                    attempts = data.get("healing_attempts", 0)
                    final_success = data.get("success", False)

                    if attempts == 0:
                        if final_success:
                            summary["initial_success"] += 1
                        else:
                            summary["initial_fail"] += 1
                    else:
                        summary["initial_fail"] += 1
                        if final_success:
                            summary["healed_success"] += 1
                            summary["attempts_distribution"][attempts] += 1
                        else:
                            summary["healed_fail"] += 1

            final_summary = []
            for model_name, stats in healing_summary.items():
                total = stats["total"]
                if total == 0:
                    continue
                initial_fail = stats["initial_fail"]

                healing_success_rate = 0.0
                if initial_fail > 0:
                    healing_success_rate = (stats["healed_success"] / initial_fail) * 100

                initial_compile_rate = (stats["initial_success"] / total) * 100
                final_compile_rate = ((stats["initial_success"] + stats["healed_success"]) / total) * 100

                final_summary.append({
                    "model": model_name,
                    "total_runs": total,
                    "initial_success_count": stats["initial_success"],
                    "initial_compile_rate": round(initial_compile_rate, 2),
                    "final_compile_rate": round(final_compile_rate, 2),
                    "healed_success_count": stats["healed_success"],
                    "healing_success_rate": round(healing_success_rate, 2),
                    "healed_fail_count": stats["healed_fail"],
                    "healed_in_1_attempts": stats["attempts_distribution"][1],   # fixed typo
                    "healed_in_2_attempts": stats["attempts_distribution"][2],   # fixed typo
                    "healed_in_3_attempts": stats["attempts_distribution"][3]    # fixed typo
                })

            if not final_summary:
                print(f"  No healing data for {version_name}/{workflow_name}")
                continue

            with open(healing_report_path / "self_healing_analysis.json", "w", encoding="utf-8") as f:
                json.dump(final_summary, f, indent=2)

            with open(healing_report_path / "self_healing_analysis.csv", "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=final_summary[0].keys())
                writer.writeheader()
                writer.writerows(final_summary)

            markdown = "| Model | Total Runs | Initial Success | Initial Compile Rate | Final Compile Rate | Healed Count | Healing Success Rate | Attempt 1 | Attempt 2 | Attempt 3 |\n|---|---|---|---|---|---|---|---|---|---|\n"
            for row in final_summary:
                markdown += (
                    f"| {row['model']} | {row['total_runs']} | {row['initial_success_count']} "
                    f"| {row['initial_compile_rate']}% | {row['final_compile_rate']}% "
                    f"| {row['healed_success_count']} | {row['healing_success_rate']}% "
                    f"| {row['healed_in_1_attempts']} | {row['healed_in_2_attempts']} | {row['healed_in_3_attempts']} |\n"
                )

            with open(healing_report_path / "self_healing_analysis.md", "w", encoding="utf-8") as f:
                f.write(markdown)

if __name__ == "__main__":
    generate_healing_report()
