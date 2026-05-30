from dataset_engine.analyzers.async_analyzer import (AsyncAnalyzer)
from dataset_engine.analyzers.branch_analyzer import (BranchAnalyzer)
from dataset_engine.analyzers.assertion_analyzer import (AssertionAnalyzer)
from dataset_engine.analyzers.mock_analyzer import (MockAnalyzer)

class MetadataValidator:
    REQUIRED_FIELDS = [
        "id",
        "category",
        "difficulty",
        "requires_mock",
        "requires_async",
        "branch_count",
        "expected_assertion_count",
        "source",
        "tags",
        "repository",
        "is_executable_reference"
    ]

    VALID_DIFFICULTIES = [
        "easy",
        "medium",
        "hard"
    ]

    @staticmethod
    def validate(metadata: dict, source_code: str, test_code: str):
        issues = []
        warnings = []

        # REQUIRED FIELD VALIDATION
        for field in (MetadataValidator.REQUIRED_FIELDS):
            if field not in metadata:
                issues.append(f"Missing field: {field}")

        # stop early
        if len(issues) > 0:
            return {
                "is_valid": False,
                "issues": issues
            }

        # TYPE VALIDATION
        if not isinstance(metadata["id"], str):
            issues.append("id must be string")

        if not isinstance(metadata["category"], str):
            issues.append("category must be string")

        if not isinstance(metadata["difficulty"], str):
            issues.append("difficulty must be string")

        if not isinstance(metadata["requires_mock"], bool):
            issues.append("requires_mock must be bool")

        if not isinstance(metadata["requires_async"], bool):
            issues.append("requires_async must be bool")

        if not isinstance(metadata["branch_count"], int):
            issues.append("branch_count must be int")

        if not isinstance(metadata["expected_assertion_count"], int):
            issues.append("expected_assertion_count must be int")

        if not isinstance(metadata["source"], str):
            issues.append("source must be string")

        if not isinstance(metadata["tags"], list):
            issues.append("tags must be list")
        
        if not isinstance(metadata["repository"], str):
            issues.append("repository must be string")

        if not isinstance(metadata["is_executable_reference"], bool):
            issues.append("is_executable_reference must be boolean")

        # ENUM VALIDATION
        if metadata["difficulty"] not in (MetadataValidator.VALID_DIFFICULTIES):
            issues.append("difficulty must be easy/medium/hard")

        # RANGE VALIDATION
        if metadata["branch_count"] < 0:
            issues.append("branch_count must be >= 0")

        if metadata["expected_assertion_count"] < 0:
            issues.append("expected_assertion_count must be >= 0")

        # TAG VALIDATION
        if isinstance(metadata["tags"],list):
            for tag in metadata["tags"]:
                if not isinstance(tag,str):
                    issues.append("all tags must be string")
        
        # EMPTY FILE VALIDATION
        if (len(source_code.strip()) == 0):
            issues.append("source.cs is empty")

        if (len(test_code.strip()) == 0):
            issues.append("expected_test.cs is empty")

        # ASSERTION VALIDATION
        assertion_count = (AssertionAnalyzer.analyze(test_code))

        if assertion_count <= 0:
            warnings.append("test file has no assertions")

        # SEMANTIC VALIDATION
        if metadata["source"] != "github":
            detected_async = AsyncAnalyzer.analyze(source_code)
            if (detected_async != metadata["requires_async"]):
                warnings.append("requires_async mismatch")

            detected_mock = MockAnalyzer.analyze(source_code)
            if (detected_mock != metadata["requires_mock"]):
                warnings.append("requires_mock mismatch")

            detected_branch_count = BranchAnalyzer.analyze(source_code)
            if (detected_branch_count != metadata["branch_count"]):
                warnings.append("branch_count mismatch")

        # FINAL RESULT
        return {
            "is_valid": len(issues) == 0,
            "issues": issues,
            "warnings": warnings
        }