import os
from dotenv import load_dotenv

load_dotenv()

MODELS = {
    "gptmini": os.getenv("AZURE_WORKER_GPT_MODEL"),
    "llama": os.getenv("AZURE_WORKER_LLAMA_MODEL"),
    "deepseekv3": os.getenv("AZURE_WORKER_DEEPSEEK_V3_MODEL"),
}

def get_models(selected_model: str = None):
    if selected_model:

        if selected_model not in MODELS:
            raise ValueError(f"Unknown model: {selected_model}")
        return [MODELS[selected_model]]

    return [
        model
        for model in MODELS.values()
        if model
    ]