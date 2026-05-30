import os
import time

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


class AIGenerator:
    def __init__(self):
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        api_key = os.getenv("AZURE_OPENAI_KEY")

        self.client = OpenAI(
            base_url=endpoint,
            api_key=api_key
        )

    def generate(
        self,
        prompt: str,
        model_name: str,
        temperature: float = 0.2,
        timeout: int = 120
    ):
        start_time = time.time()

        print(f"CALLING MODEL API: {model_name}")

        max_retries = 5
        retry_delay = 5
        response = None

        for attempt in range(1, max_retries + 1):
            try:
                response = self.client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=temperature,
                    timeout=timeout
                )
                break
            except Exception as e:
                print(f"[WARN] API call attempt {attempt}/{max_retries} failed: {e}")
                if attempt == max_retries:
                    print("[ERROR] Max retries reached. Raising exception.")
                    raise e
                print(f"Waiting {retry_delay} seconds before retrying...")
                time.sleep(retry_delay)
                retry_delay *= 2

        print(f"MODEL RESPONSE COMPLETED: {model_name}")

        end_time = time.time()

        content = (
            response
            .choices[0]
            .message
            .content
        )

        if content:
            content = content.replace("```csharp", "")
            content = content.replace("```", "")
            content = content.strip()

        return {
            "content": content,
            "generation_time": round(
                end_time - start_time,
                2
            ),
            "prompt_tokens": (
                response.usage.prompt_tokens
            ),
            "completion_tokens": (
                response.usage.completion_tokens
            ),
            "total_tokens": (
                response.usage.total_tokens
            )
        }

    def generate_test(
        self,
        source_code: str,
        model_name: str,
        temperature: float = 0.2,
        timeout: int = 120
    ):
        from src.agents.prompts.test_generation_prompt import build_test_generation_prompt
        prompt = build_test_generation_prompt(source_code)
        result = self.generate(prompt, model_name, temperature=temperature, timeout=timeout)
        return {
            "generated_test": result["content"],
            "generation_time": result["generation_time"],
            "prompt_tokens": result["prompt_tokens"],
            "completion_tokens": result["completion_tokens"],
            "total_tokens": result["total_tokens"]
        }

    def generate_text(
        self,
        prompt: str,
        model_name: str,
        temperature: float = 0.2,
        timeout: int = 120
    ):
        return self.generate(prompt, model_name, temperature=temperature, timeout=timeout)
