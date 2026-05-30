GENERATION_RULES = """
Generate concise xUnit tests only.
Do not explain your reasoning.
Return code only.

STRICT REQUIREMENTS:
- Return ONLY raw C# code
- No markdown
- No explanation
- Use xUnit
- Code MUST compile
- Tests MUST call methods from SourceService
- Instantiate SourceService
- Include assertions

REQUIRED:
- Add:
using BenchmarkSourceProject;

Use namespace:
BenchmarkTestProject.Tests

The source class name is:
SourceService
"""


def build_test_generation_prompt(
    source_code: str
):
    import re
    # Check if a class, interface, or struct name can be extracted
    class_match = re.search(r'\b(class|interface|struct)\s+(\w+)\b', source_code)
    class_name = class_match.group(2) if class_match else "SourceService"
    
    rules = GENERATION_RULES.replace("SourceService", class_name)
    
    return f"""
    {rules}

    SOURCE CODE:
    {source_code}
    """