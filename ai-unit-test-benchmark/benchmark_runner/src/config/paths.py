from pathlib import Path


CURRENT_FILE = Path(__file__).resolve()

# benchmark_runner/
ROOT_DIR = CURRENT_FILE.parents[2]

# raw datasets
RAW_DATASETS_DIR = (
    ROOT_DIR / "raw_datasets"
)

# processed datasets
BENCHMARK_DATASETS_DIR = (
    ROOT_DIR / "benchmark_datasets"
)

# results
RESULTS_DIR = (
    ROOT_DIR / "results"
)