import os
import json
import csv

from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parents[3]
RAW_REPORT_PATH = BASE_DIR / "results" / "reports"

def load_category_mapping(version_name: str) -> dict:
    mapping = {}
    dataset_version_path = BASE_DIR / "benchmark_datasets" / version_name
    if not dataset_version_path.exists():
        return mapping

    for root, _, files in os.walk(dataset_version_path):
        for file in files:
            if file == "metadata.json":
                meta_path = Path(root) / file
                try:
                    with open(meta_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                    b_id = meta.get("id")
                    category = meta.get("category")
                    if b_id and category:
                        mapping[b_id] = category
                except Exception as e:
                    print(f"    [WARN] Failed to load metadata in {meta_path}: {e}")
    return mapping

def generate_category_report():
    if not RAW_REPORT_PATH.exists():
        print("  [SKIP] No reports directory found.")
        return

    for version_name in os.listdir(RAW_REPORT_PATH):
        version_path = RAW_REPORT_PATH / version_name
        if not version_path.is_dir():
            continue

        category_mapping = load_category_mapping(version_name)

        for workflow_name in os.listdir(version_path):
            workflow_path = version_path / workflow_name
            if not workflow_path.is_dir():
                continue

            print(f"Generating category report for {version_name}/{workflow_name}...")
            category_report_path = (
                BASE_DIR / "results" / "summary"
                / version_name / workflow_name / "category"
            )
            Path(category_report_path).mkdir(parents=True, exist_ok=True)

            category_summary = defaultdict(
                lambda: defaultdict(
                    lambda: {
                        "total": 0,
                        "success": 0,
                        "line_coverage": []
                    }
                )
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

                    # Skip real_world (no execution metrics)
                    if data.get("execution_skipped", False):
                        continue

                    benchmark_id = data.get("benchmark_id", "unknown")
                    category = data.get("category")
                    if not category:
                        category = category_mapping.get(benchmark_id)
                    if not category:
                        category = "unknown"

                    summary = category_summary[category][model_name]
                    summary["total"] += 1
                    if data.get("success", False):
                        summary["success"] += 1
                    summary["line_coverage"].append(data.get("line_coverage", 0))

            final_summary = []
            for category, models in category_summary.items():
                for model_name, summary in models.items():
                    total = summary["total"]
                    if total == 0:
                        continue
                    pass_rate = (summary["success"] / total) * 100
                    avg_coverage = sum(summary["line_coverage"]) / total

                    final_summary.append({
                        "category": category,
                        "model": model_name,
                        "pass_rate": round(pass_rate, 2),
                        "avg_line_coverage": round(avg_coverage, 2)
                    })

            if not final_summary:
                print(f"  No data for {version_name}/{workflow_name}")
                continue

            with open(category_report_path / "category_summary.json", "w", encoding="utf-8") as f:
                json.dump(final_summary, f, indent=2)

            with open(category_report_path / "category_summary.csv", "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=final_summary[0].keys())
                writer.writeheader()
                writer.writerows(final_summary)

            markdown = "| Category | Model | Pass Rate | Avg Coverage |\n|---|---|---|---|\n"
            for row in final_summary:
                markdown += f"| {row['category']} | {row['model']} | {row['pass_rate']}% | {row['avg_line_coverage']}% |\n"

            with open(category_report_path / "category_summary.md", "w", encoding="utf-8") as f:
                f.write(markdown)