from src.agents.prompts.test_generation_prompt import (
    GENERATION_RULES
)


def build_review_prompt(
    source_code: str,
    generated_test: str
):
    return f"""
    You are an expert C# unit test reviewer.

    Review the generated unit test.

    Focus on:
    - assertion quality
    - edge case coverage
    - readability
    - mocking correctness
    - test naming
    - maintainability

    Return:
    1. strengths
    2. weaknesses
    3. improvement suggestions

    SOURCE CODE:
    {source_code}

    GENERATED TEST:
    {generated_test}
    """


def build_refine_prompt(
    source_code: str,
    generated_test: str,
    review_feedback: str
):
    return f"""
    {GENERATION_RULES}

    Improve the generated test based on reviewer feedback.

    REVIEW FEEDBACK:
    {review_feedback}

    SOURCE CODE:
    {source_code}

    ORIGINAL TEST:
    {generated_test}
    """