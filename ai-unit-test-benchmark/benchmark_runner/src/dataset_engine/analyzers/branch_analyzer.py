class BranchAnalyzer:
    KEYWORDS = [
        "if",
        "else if",
        "switch",
        "case",
        "&&",
        "||",
        "?"
    ]

    @staticmethod
    def analyze(source_code: str):
        count = 0
        for keyword in (
            BranchAnalyzer.KEYWORDS
        ):
            count += (
                source_code.count(keyword)
            )
        return count