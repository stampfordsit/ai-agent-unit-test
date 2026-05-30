from src.agents.prompts.test_generation_prompt import GENERATION_RULES

def build_self_healing_prompt(
    source_code: str,
    failing_test_code: str,
    compiler_errors: str
) -> str:
    """
    Build prompt to request the AI model to fix compile or test run errors.
    """
    import re
    # Check if a class, interface, or struct name can be extracted
    class_match = re.search(r'\b(class|interface|struct)\s+(\w+)\b', source_code)
    class_name = class_match.group(2) if class_match else "SourceService"
    
    rules = GENERATION_RULES.replace("SourceService", class_name)

    return f"""
    {rules}

    The previously generated C# xUnit test failed to compile or run correctly.
    You must analyze the compiler error message and fix the unit test code.

    C# SOURCE CODE UNDER TEST:
    ```csharp
    {source_code}
    ```

    PREVIOUS GENERATED TEST CODE THAT FAILED:
    ```csharp
    {failing_test_code}
    ```

    COMPILER/TEST RUNNER ERROR MESSAGE:
    {compiler_errors}

    STRICT REQUIREMENTS:
    - Analyze the compiler/test error carefully.
    - Correct the namespace, class instantiation, mock setups, or assembly imports.
    - Ensure all methods called exist on the correct types.
    - Return ONLY the corrected raw C# test code. No explanations, no markdown blocks.
    """
