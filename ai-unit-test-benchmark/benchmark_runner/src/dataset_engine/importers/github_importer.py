from pathlib import Path
from dataset_engine.importers.repository_scanner import (RepositoryScanner)
from dataset_engine.importers.method_extractor import (MethodExtractor)
from dataset_engine.importers.test_matcher import (TestMatcher)
from dataset_engine.importers.dataset_exporter import (DatasetExporter)
from dataset_engine.utils.id_generator import (IdGenerator)

REPOSITORIES = [
    {
        "name": "eShopOnWeb",
        "path": Path("repositories/eShopOnWeb")
    },
    {
        "name": "CleanArchitecture",
        "path": Path("repositories/CleanArchitecture")
    },
    {
        "name": "OrchardCore",
        "path": Path("repositories/OrchardCore")
    }
]

class GitHubImporter:
    @staticmethod
    def run():
        output_dir = Path("raw_datasets/real_world")
        total = 0
        for repository in REPOSITORIES:
            repo_name = (repository["name"])
            repo_path = (repository["path"])

            print(f"\nScanning: {repo_name}")
            cs_files = (RepositoryScanner.scan_cs_files(repo_path))

            source_files = []
            test_files = []

            for file in cs_files:
                file_path = (file.as_posix().lower())

                if ("test" in file_path):
                    test_files.append(file)
                else:
                    source_files.append(file)

            for source_file in source_files:
                try:
                    source_code = (source_file.read_text(encoding="utf-8"))
                except:
                    continue
                methods = (MethodExtractor.extract_methods(source_code))

                for method in methods:
                    method_name = (method["method_name"])

                    matching_test = (TestMatcher.find_matching_test(method_name,test_files))
                    if matching_test is None:
                        continue

                    try:
                        test_code = (matching_test.read_text(encoding="utf-8"))
                    except:
                        continue

                    benchmark_id = (IdGenerator.generate(total + 1))

                    metadata = {
                        "category": "real_world",
                        "source": "github",
                        "repository": repo_name,
                        "is_executable_reference": False
                    }

                    DatasetExporter.export_sample(
                        output_dir,
                        benchmark_id,
                        source_code,
                        test_code,
                        metadata
                    )

                    total += 1
                    print(f"Exported: {benchmark_id} ({method_name})")

        print("\n" + "=" * 50)
        print(f"Total exported: {total}")
        print("=" * 50)