import json
import os
from src.agents.ai_generator import AIGenerator
from src.agents.prompts.evaluator_agent_prompt import build_evaluation_prompt

class EvaluatorAgent(AIGenerator):
    def __init__(self):
        super().__init__()
        # Load the model configured for evaluation
        # Priority: AZURE_EVALUTOR_GPT_MODEL -> AZURE_EVALUTOR_CLAUDE_MODEL -> AZURE_WORKER_GPT_MODEL -> gpt-4.1-mini
        self.evaluator_model = (
            os.getenv("AZURE_EVALUTOR_GPT_MODEL") or 
            os.getenv("AZURE_EVALUTOR_CLAUDE_MODEL") or 
            os.getenv("AZURE_WORKER_GPT_MODEL") or 
            "gpt-4.1-mini"
        )
        self.token_usage = {} # dict of target_model -> {"prompt_tokens": 0, "completion_tokens": 0}

    def reset_usage(self):
        self.token_usage = {}

    def get_usage(self) -> dict:
        return self.token_usage

    def evaluate(
        self,
        source_code: str,
        generated_test: str,
        execution_result: dict,
        expected_test: str,
        model_name: str = None
    ) -> dict:
        target_model = model_name or self.evaluator_model
        print(f"RUNNING EVALUATOR AGENT USING MODEL: {target_model}")
        
        prompt = build_evaluation_prompt(source_code, generated_test, execution_result, expected_test)
        
        # Call generate to get raw text with low temperature for deterministic evaluation
        result = self.generate(prompt, target_model, temperature=0.0)
        
        # Track token usage
        model_usage = self.token_usage.setdefault(target_model, {"prompt_tokens": 0, "completion_tokens": 0})
        model_usage["prompt_tokens"] += result.get("prompt_tokens", 0)
        model_usage["completion_tokens"] += result.get("completion_tokens", 0)
        
        content = result["content"]
        
        if content:
            start_idx = content.find('{')
            end_idx = content.rfind('}')
            if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
                content = content[start_idx:end_idx+1]
            else:
                content = content.strip()
            
        try:
            evaluation_data = json.loads(content)
            # Ensure the required keys are present
            required_keys = [
                "score", 
                "correctness_rating", 
                "compilation_review", 
                "assertion_quality_review", 
                "mocking_review", 
                "coverage_review", 
                "issues_found", 
                "suggestions"
            ]
            for key in required_keys:
                if key not in evaluation_data:
                    evaluation_data[key] = None
            return evaluation_data
        except Exception as e:
            print(f"Failed to parse evaluator response as JSON: {e}")
            return {
                "score": 0,
                "correctness_rating": 1,
                "compilation_review": f"Failed to parse evaluator output. Raw output: {content}",
                "assertion_quality_review": "N/A",
                "mocking_review": "N/A",
                "coverage_review": "N/A",
                "issues_found": [f"Evaluator error: {str(e)}"],
                "suggestions": ["Ensure the model outputs valid JSON."]
            }
