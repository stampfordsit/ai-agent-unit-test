import sys
from pathlib import Path

# benchmark_runner/src
ROOT_DIR = (Path(__file__).resolve().parents[1])
sys.path.append(str(ROOT_DIR))

from dataset_engine.builders.benchmark_dataset_builder import BenchmarkDatasetBuilder
from dataset_engine.importers.github_importer import GitHubImporter

def print_header(title):
    print("=" * 50)
    print(title)
    print("=" * 50)

def run_import():
    print_header("GITHUB DATASET IMPORT")
    GitHubImporter.run()
    print_header("IMPORT COMPLETED")

def run_build():
    print_header("BENCHMARK DATASET BUILD")
    BenchmarkDatasetBuilder.build()
    print_header("BUILD COMPLETED")

def main():
    commands = (sys.argv[1:])

    if not commands:
        print("Usage:")
        print("py src/dataset_engine/main.py import")
        print("py src/dataset_engine/main.py build")
        print("py src/dataset_engine/main.py import build")
        return

    if "import" in commands:
        run_import()

    if "build" in commands:
        run_build()

if __name__ == "__main__":
    main()