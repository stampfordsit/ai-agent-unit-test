from pathlib import Path

class StructureValidator:
    REQUIRED_FILES = [
        "source.cs",
        "expected_test.cs"
    ]

    @staticmethod
    def validate(sample_path: Path):
        issues = []
        for file_name in (StructureValidator.REQUIRED_FILES):
            file_path = sample_path / file_name
            if not file_path.exists():
                issues.append(f"Missing file: {file_name}")
        return {
            "is_valid": len(issues) == 0,
            "issues": issues
        }