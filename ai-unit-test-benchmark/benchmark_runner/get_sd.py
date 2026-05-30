import os
import json
import statistics

base_dir = r"g:\AI Agent in C#\ai-unit-test-benchmark\benchmark_runner\results\reports\v2\single"
models = ["gpt_4_1_mini", "Llama_3_3_70B_Instruct", "DeepSeek_V3_2"]

for model in models:
    model_path = os.path.join(base_dir, model)
    if not os.path.isdir(model_path): continue
    
    input_tokens = []
    output_tokens = []
    latencies = []
    
    for file in os.listdir(model_path):
        if not file.endswith(".json"): continue
        with open(os.path.join(model_path, file), "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                worker_prompt = data.get("worker_prompt_tokens", 0)
                worker_completion = data.get("worker_completion_tokens", 0)
                worker_latency = data.get("worker_latency", 0)
                eval_prompt = data.get("evaluator_prompt_tokens", 0)
                eval_completion = data.get("evaluator_completion_tokens", 0)
                eval_latency = data.get("evaluator_latency", 0)
                
                input_tokens.append(worker_prompt + eval_prompt)
                output_tokens.append(worker_completion + eval_completion)
                latencies.append(worker_latency + eval_latency)
            except Exception as e:
                pass

    if input_tokens:
        print(f"Model: {model}")
        print(f"Input Tokens: Avg={statistics.mean(input_tokens):.2f}, SD={statistics.stdev(input_tokens):.2f}")
        print(f"Output Tokens: Avg={statistics.mean(output_tokens):.2f}, SD={statistics.stdev(output_tokens):.2f}")
        print(f"Latency (s): Avg={statistics.mean(latencies):.2f}, SD={statistics.stdev(latencies):.2f}")
        print("-" * 40)
