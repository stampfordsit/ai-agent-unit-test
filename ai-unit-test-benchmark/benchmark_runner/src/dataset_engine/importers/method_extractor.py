import re

class MethodExtractor:
    METHOD_PATTERN = re.compile(
        r"""
        public\s+
        .*?
        \s+
        (?P<method>\w+)
        \s*
        \(
        """,
        re.VERBOSE
    )

    @staticmethod
    def extract_methods(source_code: str):
        methods = []
        for match in (MethodExtractor.METHOD_PATTERN.finditer(source_code)):
            methods.append({"method_name": (match.group("method"))})
        return methods