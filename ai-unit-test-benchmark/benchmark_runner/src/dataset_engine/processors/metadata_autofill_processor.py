from dataset_engine.analyzers.async_analyzer import (AsyncAnalyzer)
from dataset_engine.analyzers.mock_analyzer import (MockAnalyzer)
from dataset_engine.analyzers.branch_analyzer import (BranchAnalyzer)
from dataset_engine.analyzers.assertion_analyzer import (AssertionAnalyzer)

class MetadataAutoFillProcessor:
    DEFAULT_VALUES = {
        "difficulty": "easy",
        "source": "custom",
        "tags": []
    }

    @staticmethod
    def autofill(metadata: dict,validation_issues: list,source_code: str,test_code: str):
        result = metadata.copy()

        # AUTO FILL DEFAULTS
        if ("repository must be string" not in validation_issues):
            result["repository"] = ""
        
        if ("is_executable_reference must be boolean" not in validation_issues):
            result["is_executable_reference"] = True

        # MISSING FIELD REPAIR
        for issue in validation_issues:
            if ("Missing field:" not in issue):
                continue

            field = (issue.replace("Missing field:","").strip())

            if (field in MetadataAutoFillProcessor.DEFAULT_VALUES):
                result[field] = (MetadataAutoFillProcessor.DEFAULT_VALUES[field])

        # TYPE REPAIR
        if ("branch_count must be int" in validation_issues):
            try:
                result["branch_count"] = int(result["branch_count"])
            except:
                result["branch_count"] = 0

        if ("expected_assertion_count must be int" in validation_issues):
            try:
                result["expected_assertion_count"] = int(result["expected_assertion_count"])
            except:
                result["expected_assertion_count"] = 0

        # ENUM REPAIR
        if ("difficulty must be easy/medium/hard" in validation_issues):
            result["difficulty"] = "easy"

        # SEMANTIC REPAIR
        if ("requires_async mismatch" in validation_issues):
            result["requires_async"] = (AsyncAnalyzer.analyze(source_code))

        if ("requires_mock mismatch" in validation_issues):
            result["requires_mock"] = (MockAnalyzer.analyze(source_code))

        if ("branch_count mismatch" in validation_issues):
            result["branch_count"] = (BranchAnalyzer.analyze(source_code))

        # ASSERTION REPAIR
        detected_assertions = (AssertionAnalyzer.analyze(test_code))
        result["expected_assertion_count"] = detected_assertions

        if ("difficulty must be easy/medium/hard" in validation_issues):
            result["difficulty"] = "hard"
        return result