def build_evaluation_prompt(
    source_code: str,
    generated_test: str,
    execution_result: dict,
    expected_test: str
) -> str:
    """
    Build prompt to evaluate the generated C# xUnit test.
    """
    compilation_status = "SUCCESS" if execution_result.get("success") else "FAILED"
    line_coverage = execution_result.get("line_coverage", 0)
    branch_coverage = execution_result.get("branch_coverage", 0)
    stdout = execution_result.get("stdout", "")
    stderr = execution_result.get("stderr", "")

    has_reference = bool(expected_test and expected_test.strip())
    
    reference_section = ""
    if has_reference:
        reference_section = f"""
    GOLD STANDARD REFERENCE TEST (Written by a human expert):
    ```csharp
    {expected_test}
    ```
    """
    else:
        reference_section = """
    GOLD STANDARD REFERENCE TEST:
    [No human-written gold standard reference test is available for this live execution. Evaluate the generated test purely based on the source code, C# testing best practices, and code coverage.]
    """

    comparison_instruction = ""
    if has_reference:
        comparison_instruction = "6. Comparison with Reference Test (does the generated test cover the same logical assertions and scenarios as the gold standard reference? If not, what critical scenarios were missed?)"
    else:
        comparison_instruction = "6. Self-contained Assertion Depth (does the generated test have sufficient assertion coverage for all public methods and paths, even without a human reference test?)"

    score_instruction = ""
    if has_reference:
        score_instruction = 'Deduct points for compile failures, missing assertions, incorrect mocks, low coverage, or missing critical test scenarios compared to the reference test.'
    else:
        score_instruction = 'Deduct points for compile failures, missing assertions, incorrect mocks, or low coverage based on the source code structure.'

    assertion_review_instruction = ""
    if has_reference:
        assertion_review_instruction = 'Analysis of the assertions, comparing them to the gold standard reference test\'s assertions.'
    else:
        assertion_review_instruction = 'Analysis of the assertions, evaluating if they cover edge cases, happy paths, and boundary conditions.'

    coverage_review_instruction = ""
    if has_reference:
        coverage_review_instruction = 'Review of the code coverage achieved and logical coverage compared to the reference test.'
    else:
        coverage_review_instruction = 'Review of the code coverage achieved and logical coverage based on the source code complexity.'

    issues_found_instruction = ""
    if has_reference:
        issues_found_instruction = 'List of compile errors, test failures, or logical/behavioral gaps compared to the reference test.'
    else:
        issues_found_instruction = 'List of compile errors, test failures, or logical/behavioral gaps in the generated test.'

    suggestions_instruction = ""
    if has_reference:
        suggestions_instruction = 'Actionable steps to improve the test and align it closer to the gold standard reference test.'
    else:
        suggestions_instruction = 'Actionable steps to improve the quality, readability, and coverage of the generated test.'

    return f"""
    You are an expert C# unit test evaluator.
    Analyze the C# Source Code, the Generated Unit Test, the Gold Standard Reference Test (if available), and the Test Execution Results to evaluate the quality of the generated unit test.

    C# SOURCE CODE:
    ```csharp
    {source_code}
    ```

    {reference_section}

    GENERATED UNIT TEST (To be evaluated):
    ```csharp
    {generated_test}
    ```

    TEST EXECUTION RESULTS:
    - Compilation & Run Status: {compilation_status}
    - Line Coverage: {line_coverage}%
    - Branch Coverage: {branch_coverage}%
    - Test Runner Output (stdout):
    {stdout}
    - Test Runner Errors (stderr):
    {stderr}

    EVALUATION INSTRUCTIONS:
    Evaluate the generated test against best practices in C# testing, specifically:
    1. Compilation correctness (does it build? If failed, why?)
    2. Code correctness (does it correctly instantiate the class/service under test, are the namespace and assembly refs correct?)
    3. Assertion quality (are they meaningful, do they verify logic correctness, or are they trivial?)
    4. Mocking correctness (if Moq or mocks are used, are they configured correctly?)
    5. Coverage effectiveness (does the test run hit branch conditions, does it test edge cases?)
    {comparison_instruction}

    OUTPUT FORMAT:
    You MUST respond with a single valid JSON object containing exactly the keys specified below. Do not output markdown code blocks (like ```json) or any conversational prefix/suffix. Just return the raw JSON object.

    REQUIRED JSON KEYS:
    - "score": (integer, 0 to 100) A global quality rating of the test. {score_instruction}
    - "correctness_rating": (integer, 1 to 5) Rating of grammatical/logical correctness of the test code.
    - "compilation_review": (string) Review of whether the test compiled successfully and any issues found in the build output.
    - "assertion_quality_review": (string) {assertion_review_instruction}
    - "mocking_review": (string) Analysis of mock setups, or "N/A" if mocks were not needed.
    - "coverage_review": (string) {coverage_review_instruction}
    - "issues_found": (list of strings) {issues_found_instruction}
    - "suggestions": (list of strings) {suggestions_instruction}
    """

