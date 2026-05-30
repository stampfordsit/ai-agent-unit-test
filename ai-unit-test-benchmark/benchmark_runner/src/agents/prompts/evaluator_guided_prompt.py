from src.agents.prompts.test_generation_prompt import GENERATION_RULES


def build_evaluator_guided_prompt(
    source_code: str,
    current_test: str,
    execution_result: dict,
    evaluator_score: int,
    issues_found: list,
    suggestions: list,
    assertion_quality_review: str,
    coverage_review: str,
) -> str:
    """
    Build a prompt that feeds evaluator feedback (score, issues, suggestions,
    coverage and assertion reviews) back to the generator so it can produce
    an improved unit test.
    """
    import re

    class_match = re.search(r'\b(class|interface|struct)\s+(\w+)\b', source_code)
    class_name = class_match.group(2) if class_match else "SourceService"

    rules = GENERATION_RULES.replace("SourceService", class_name)

    compilation_status = "SUCCESS" if execution_result.get("success") else "FAILED"
    line_coverage    = execution_result.get("line_coverage", 0)
    branch_coverage  = execution_result.get("branch_coverage", 0)
    stdout           = execution_result.get("stdout", "")
    stderr           = execution_result.get("stderr", "")

    issues_text      = "\n".join(f"- {i}" for i in issues_found) if issues_found else "None"
    suggestions_text = "\n".join(f"- {s}" for s in suggestions)  if suggestions  else "None"

    return f"""
    {rules}

    The previously generated C# xUnit test was evaluated by an expert Evaluator Agent
    and received a score of {evaluator_score}/100, which is below the quality threshold.
    You must analyse the evaluator feedback and produce an improved version of the test.

    C# SOURCE CODE UNDER TEST:
    ```csharp
    {source_code}
    ```

    CURRENT GENERATED TEST (to be improved):
    ```csharp
    {current_test}
    ```

    TEST EXECUTION RESULTS:
    - Compilation & Run Status : {compilation_status}
    - Line Coverage            : {line_coverage}%
    - Branch Coverage          : {branch_coverage}%
    - Test Runner Output (stdout):
    {stdout}
    - Test Runner Errors (stderr):
    {stderr}

    EVALUATOR FEEDBACK (score: {evaluator_score}/100):

    Assertion Quality Review:
    {assertion_quality_review}

    Coverage Review:
    {coverage_review}

    Issues Found:
    {issues_text}

    Suggestions for Improvement:
    {suggestions_text}

    STRICT REQUIREMENTS:
    - Address every issue listed above.
    - Apply every suggestion where applicable.
    - Increase branch and line coverage by adding missing test cases.
    - Ensure the test still compiles and all assertions are meaningful.
    - Return ONLY the improved raw C# test code. No explanations, no markdown blocks.
    """
