class MockAnalyzer:
    DEPENDENCY_KEYWORDS = [
        "Repository",
        "Service",
        "Client",
        "DbContext",
        "ILogger",
        "Provider"
    ]

    @staticmethod
    def analyze(source_code: str):
        for keyword in (
            MockAnalyzer
            .DEPENDENCY_KEYWORDS
        ):
            if keyword in source_code:
                return True
        return False