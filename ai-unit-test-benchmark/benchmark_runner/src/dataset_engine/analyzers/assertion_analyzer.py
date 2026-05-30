class AssertionAnalyzer:
    ASSERTIONS = [
        "Assert.Equal",
        "Assert.True",
        "Assert.False",
        "Assert.Throws",
        "Assert.NotNull",
        "Assert.Null",
        "Assert.Contains"
    ]

    @staticmethod
    def analyze(test_code: str):
        count = 0
        for assertion in (
            AssertionAnalyzer.ASSERTIONS
        ):
            count += (
                test_code.count(assertion)
            )
        return count