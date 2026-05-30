from pathlib import Path
from dataset_engine.utils.json_helper import (JsonHelper)

class DatasetExporter:
    @staticmethod
    def export_sample(destination_root,benchmark_id,source_code,test_code,metadata):
        sample_dir = (destination_root / benchmark_id)
        sample_dir.mkdir(parents=True,exist_ok=True)
        (sample_dir / "source.cs").write_text(source_code,encoding="utf-8")
        (sample_dir / "expected_test.cs").write_text(test_code,encoding="utf-8")
        JsonHelper.save(sample_dir / "metadata.json",metadata)