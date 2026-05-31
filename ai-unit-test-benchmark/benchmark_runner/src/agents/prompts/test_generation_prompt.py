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

The test class name MUST be exactly:
TestClassName
"""


def build_test_generation_prompt(
    source_code: str,
    method_name: str = None
):
    import re
    # Check if a class, interface, or struct name can be extracted
    class_match = re.search(r'\b(class|interface|struct)\s+(\w+)\b', source_code)
    class_name = class_match.group(2) if class_match else "SourceService"
    
    # Check if a namespace can be extracted
    ns_match = re.search(r'\bnamespace\s+([\w\.]+)', source_code)
    source_namespace = ns_match.group(1) if ns_match else "BenchmarkSourceProject"
    
    # Maintain strict backward compatibility for old benchmark tests
    if source_namespace == "BenchmarkSourceProject":
        test_namespace = "BenchmarkTestProject.Tests"
    else:
        test_namespace = f"{source_namespace}.Tests"
    
    rules = GENERATION_RULES.replace("SourceService", class_name)
    rules = rules.replace("using BenchmarkSourceProject;", f"using {source_namespace};")
    rules = rules.replace("BenchmarkTestProject.Tests", test_namespace)
    
    test_class_name = f"{class_name}_{method_name}Tests" if method_name else f"{class_name}Tests"
    rules = rules.replace("TestClassName", test_class_name)
    
    return f"""
    {rules}

    SOURCE CODE:
    {source_code}
    """