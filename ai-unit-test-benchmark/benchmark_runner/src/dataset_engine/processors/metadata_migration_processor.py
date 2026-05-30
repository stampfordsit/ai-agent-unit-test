class MetadataMigrationProcessor:

    STANDARD_SCHEMA = {
        "id": "",
        "category": "",
        "difficulty": "easy",
        "requires_mock": False,
        "requires_async": False,
        "branch_count": 0,
        "expected_assertion_count": 0,
        "source": "custom",
        "tags": []
    }

    DIFFICULTY_MAPPING = {
        "basic": "easy",
        "normal": "medium",
        "advanced": "hard",
        "beginner": "easy",
        "intermediate": "medium",
        "expert": "hard"
    }

    @staticmethod
    def migrate(metadata: dict, category: str):
        result = (MetadataMigrationProcessor.STANDARD_SCHEMA.copy())

        # old field mapping
        if "benchmark_id" in metadata:
            metadata["id"] = (metadata["benchmark_id"])

        # merge existing values
        for key in result.keys():
            if key in metadata:
                result[key] = metadata[key]

        # force category
        result["category"] = category

        # difficulty mapping
        difficulty = (metadata.get("difficulty"))
        if isinstance(difficulty,str):
            normalized = (difficulty.strip().lower())
            if (normalized in MetadataMigrationProcessor.DIFFICULTY_MAPPING):
                result["difficulty"] = (MetadataMigrationProcessor.DIFFICULTY_MAPPING[normalized])
                
        return result