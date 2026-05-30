from pathlib import Path
from collections import defaultdict
from config.paths import (BENCHMARK_DATASETS_DIR)

class ManifestGenerator:
    @staticmethod
    def generate(dataset_name):
        dataset_path = BENCHMARK_DATASETS_DIR / dataset_name
        total_samples = 0
        categories = []
        statistics = defaultdict(int)

        for category_dir in dataset_path.iterdir():
            if not category_dir.is_dir():
                continue
            category = category_dir.name
            categories.append(category)
            for sample_dir in category_dir.iterdir():
                if not sample_dir.is_dir():
                    continue
                total_samples += 1
                statistics[category] += 1
        manifest = {
            "dataset_name": (
                "CSharpUnitTestBench"
            ),
            "total_samples": total_samples,
            "categories": sorted(categories),
            "statistics": dict(statistics)
        }

        return manifest