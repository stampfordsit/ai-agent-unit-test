import shutil
from pathlib import Path
from config.paths import (RAW_DATASETS_DIR,BENCHMARK_DATASETS_DIR)
from validators.structure_validator import (StructureValidator)
from validators.metadata_validator import (MetadataValidator)
from processors.metadata_migration_processor import (MetadataMigrationProcessor)
from processors.metadata_autofill_processor import (MetadataAutoFillProcessor)
from generators.manifest_generator import (ManifestGenerator)
from utils.metadata_loader import (MetadataLoader)
from utils.json_helper import (JsonHelper)
from utils.version_manager import (VersionManager)
from utils.id_generator import (IdGenerator)

class BenchmarkDatasetBuilder:

    @staticmethod
    def build():
        version = (VersionManager.get_next_version())
        version_dir = (BENCHMARK_DATASETS_DIR / version)
        version_dir.mkdir(parents=True, exist_ok=True)
        failed_samples = []
        warning_samples = []

        total_copied = 0
        for category_dir in (RAW_DATASETS_DIR.iterdir()):
            if not category_dir.is_dir():
                continue

            category = category_dir.name
            benchmark_category_dir = (version_dir / category)
            benchmark_category_dir.mkdir(exist_ok=True)

            for sample_dir in (category_dir.iterdir()):
                if not sample_dir.is_dir():
                    continue

                # validate structure
                structure_result = (StructureValidator.validate(sample_dir))
                if not (structure_result["is_valid"]):
                    failed_samples.append({
                        "sample": sample_dir.name,
                        "issues": structure_result["issues"]
                    })
                    continue

                metadata_path = (sample_dir / "metadata.json")

                # safe load
                source_code = ((sample_dir / "source.cs").read_text(encoding="utf-8"))
                test_code = ((sample_dir / "expected_test.cs").read_text(encoding="utf-8"))
                metadata = (MetadataLoader.load(metadata_path))

                # normalize
                metadata = (MetadataMigrationProcessor.migrate(metadata, category))

                # validate
                metadata_result = (MetadataValidator.validate(metadata,source_code,test_code))

                # autofill if invalid
                if not (metadata_result["is_valid"]):                    
                    metadata = (MetadataAutoFillProcessor.autofill(metadata, metadata_result["issues"],source_code,test_code))

                    # revalidate
                    metadata_result = (MetadataValidator.validate(metadata,source_code,test_code))

                # final fail
                if not (metadata_result["is_valid"]):
                    failed_samples.append({
                        "sample": sample_dir.name,
                        "issues": metadata_result["issues"]
                    })
                    continue

                if metadata_result["warnings"]:
                    warning_samples.append({
                        "sample": sample_dir.name,
                        "warnings": metadata_result["warnings"]
                    })

                # deterministic benchmark id
                benchmark_id = (IdGenerator.generate(total_copied + 1))
                metadata["id"] = (benchmark_id)
                destination = (benchmark_category_dir / benchmark_id)

                if destination.exists():
                    shutil.rmtree(destination)

                shutil.copytree(sample_dir, destination)
                JsonHelper.save(destination / "metadata.json", metadata)
                total_copied += 1
                print(f"Copied: {sample_dir.name} --> {benchmark_id}")

        # failed report
        JsonHelper.save(version_dir / "failed_samples.json", failed_samples)

        # warnings report
        JsonHelper.save(version_dir / "warnings.json", warning_samples)

        # manifest
        manifest = ManifestGenerator.generate(version_dir)
        JsonHelper.save(version_dir / "manifest.json", manifest)
        
        print("=" * 50)
        print("Build completed")
        print(f"Version: {version}")
        print(f"Total copied: {total_copied}")
        print(f"Failed: {len(failed_samples)}")
        print(f"Warnings: {len(warning_samples)}")
        print("=" * 50)