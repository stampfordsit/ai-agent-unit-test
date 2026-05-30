import os
import json
import csv

from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parents[3]
RAW_REPORT_PATH = BASE_DIR / "results" / "reports"

def generate_failure_report():
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

            print(f"Generating failure report for {version_name}/{workflow_name}...")
            failure_report_path = (
                BASE_DIR / "results" / "summary"
                / version_name / workflow_name / "failure"
            )
            Path(failure_report_path).mkdir(parents=True, exist_ok=True)

            failure_summary = defaultdict(lambda: defaultdict(int))

            for model_name in os.listdir(workflow_path):
                model_path = workflow_path / model_name
                if not model_path.is_dir():
                    continue

                for filename in os.listdir(model_path):
                    if not filename.endswith(".json"):
                        continue

                    with open(model_path / filename, "r", encoding="utf-8") as f:
                        data = json.load(f)

                    # Only executable benchmarks have meaningful failure types
                    if data.get("execution_skipped", False):
                        continue

                    failure_type = classify_failure(data)
                    if failure_type is None:
                        continue
                    failure_summary[model_name][failure_type] += 1

            final_summary = []
            for model_name, failures in failure_summary.items():
                for failure_type, count in failures.items():
                    final_summary.append({
                        "model": model_name,
                        "failure_type": failure_type,
                        "count": count
                    })

            if not final_summary:
                print(f"  No failure data for {version_name}/{workflow_name}")
                continue

            with open(failure_report_path / "failure_analysis.json", "w", encoding="utf-8") as f:
                json.dump(final_summary, f, indent=2)

            with open(failure_report_path / "failure_analysis.csv", "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=final_summary[0].keys())
                writer.writeheader()
                writer.writerows(final_summary)

            markdown = "| Model | Failure Type | Count |\n|---|---|---|\n"
            for row in final_summary:
                markdown += f"| {row['model']} | {row['failure_type']} | {row['count']} |\n"

            with open(failure_report_path / "failure_analysis.md", "w", encoding="utf-8") as f:
                f.write(markdown)


def classify_failure(data):
    if data.get("success", False):
        return None
    stderr = (data.get("stderr") or "").lower()
    stdout = (data.get("stdout") or "").lower()
    combined = stderr + stdout
    if "cs" in combined:
        return "Compile Error"
    if "assert" in combined:
        return "Assertion Failure"
    if "namespace" in combined:
        return "Namespace Error"
    if "timeout" in combined:
        return "Timeout"
    if "nullreferenceexception" in combined:
        return "Null Reference"
    if "syntax" in combined:
        return "Syntax Error"
    return "Unknown Failure"