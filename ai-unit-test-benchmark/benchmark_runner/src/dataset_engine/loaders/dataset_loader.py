import json
from pathlib import Path

class DatasetLoader:

    def load(self, dataset_path: str):
        benchmarks = []
        for metadata_file in Path(dataset_path).rglob("metadata.json"):

            folder = metadata_file.parent
            metadata = json.loads(metadata_file.read_text(encoding="utf-8"))
            source_code = (folder / "source.cs").read_text(encoding="utf-8")
            expected_test = (folder / "expected_test.cs").read_text(encoding="utf-8")

            benchmarks.append({
                "metadata": metadata,
                "source_code": source_code,
                "expected_test": expected_test,
                "folder": str(folder)
            })
        return benchmarks