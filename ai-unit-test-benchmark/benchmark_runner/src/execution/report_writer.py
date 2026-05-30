import json
from pathlib import Path

class ReportWriter:
    def __init__(self):
        self.report_path = "./results/reports"
        Path(self.report_path).mkdir(parents=True, exist_ok=True)

    def save_result(self, result, model_name, version, workflow):
        benchmark_id = result["benchmark_id"]
        safe_model_name = (model_name.replace(".", "_").replace("-", "_"))

        model_report_path = (f"{self.report_path}/{version}/{workflow}/{safe_model_name}")
        Path(model_report_path).mkdir(parents=True,exist_ok=True)
        output_path = (f"{model_report_path}/{benchmark_id}.json")

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2)