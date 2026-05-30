import os
import json
import csv

from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parents[3]
RAW_REPORT_PATH = BASE_DIR / "results" / "reports"

def generate_latency_report():
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

            print(f"Generating latency report for {version_name}/{workflow_name}...")
            latency_report_path = (
                BASE_DIR / "results" / "summary"
                / version_name / workflow_name / "latency"
            )
            Path(latency_report_path).mkdir(parents=True, exist_ok=True)

            latency_summary = defaultdict(list)

            for model_name in os.listdir(workflow_path):
                model_path = workflow_path / model_name
                if not model_path.is_dir():
                    continue

                for filename in os.listdir(model_path):
                    if not filename.endswith(".json"):
                        continue

                    with open(model_path / filename, "r", encoding="utf-8") as f:
                        data = json.load(f)

                    latency_summary[model_name].append(data.get("generation_time", 0))

            final_summary = []
            for model_name, times in latency_summary.items():
                if not times:
                    continue
                final_summary.append({
                    "model": model_name,
                    "avg_time": round(sum(times) / len(times), 2),
                    "max_time": round(max(times), 2),
                    "min_time": round(min(times), 2),
                    "total_time": round(sum(times), 2)
                })

            if not final_summary:
                print(f"  No data for {version_name}/{workflow_name}")
                continue

            with open(latency_report_path / "latency_analysis.json", "w", encoding="utf-8") as f:
                json.dump(final_summary, f, indent=2)

            with open(latency_report_path / "latency_analysis.csv", "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=final_summary[0].keys())
                writer.writeheader()
                writer.writerows(final_summary)

            markdown = "| Model | Avg Time | Max Time | Min Time | Total Time |\n|---|---|---|---|---|\n"
            for row in final_summary:
                markdown += f"| {row['model']} | {row['avg_time']}s | {row['max_time']}s | {row['min_time']}s | {row['total_time']}s |\n"

            with open(latency_report_path / "latency_analysis.md", "w", encoding="utf-8") as f:
                f.write(markdown)