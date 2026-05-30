class AsyncAnalyzer:
    @staticmethod
    def analyze(source_code: str):
        keywords = [
            "async ",
            "await ",
            "Task<",
            "Task "
        ]

        for keyword in keywords:
            if keyword in source_code:
                return True
        return False