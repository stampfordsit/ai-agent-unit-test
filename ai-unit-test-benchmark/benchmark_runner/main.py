import argparse
import sys
import time
from pathlib import Path

# Force line-buffered output so print() flushes immediately
# even when stdout is redirected to a file (e.g. > log.txt)
sys.stdout.reconfigure(line_buffering=True)
from src.dataset_engine.loaders.dataset_loader import DatasetLoader
from src.agents.ai_generator import AIGenerator
from src.execution.test_executor import TestExecutor
from src.execution.report_writer import ReportWriter
from src.execution.coverage_reader import CoverageReader
from src.config.models import get_models
from src.config.pricing import MODEL_PRICING
from src.agents.prompts.reviewer_agent import (build_review_prompt, build_refine_prompt)
from src.agents.evaluator_agent import EvaluatorAgent
from src.agents.prompts.self_healing_prompt import build_self_healing_prompt
from src.agents.prompts.evaluator_guided_prompt import build_evaluator_guided_prompt

print("STARTING BENCHMARK")

loader = DatasetLoader()
generator = AIGenerator()
evaluator = EvaluatorAgent()
executor = TestExecutor()
writer = ReportWriter()
coverage_reader = CoverageReader()

parser = argparse.ArgumentParser()
parser.add_argument("--version", default="v1")
parser.add_argument("--model", help="Single model to run")
parser.add_argument("--workflow", default="single")
parser.add_argument("--skip-existing", action="store_true", help="Skip benchmarks that already have reports")
parser.add_argument("--enable-mutation", action="store_true", help="Enable Stryker mutation testing for execution benchmarks")
args = parser.parse_args()

models = get_models(args.model)
dataset_root = Path(f"benchmark_datasets/{args.version}")
benchmarks = loader.load(dataset_root)
print(f"FOUND {len(benchmarks)} BENCHMARKS")

results_dir = Path(f"./results/generated_tests/{args.version}/{args.workflow}")
results_dir.mkdir(parents=True, exist_ok=True)

for model_name in models:
    print("=" * 50)
    print(f"RUNNING MODEL: {model_name}")
    print(f"WORKFLOW: {args.workflow}")
    start_time = time.time()

    pricing = MODEL_PRICING.get(model_name, {})
    input_price = pricing.get("input", 0)
    output_price = pricing.get("output", 0)

    for benchmark in benchmarks:
        benchmark_id = benchmark["metadata"]["id"]
        category = benchmark["metadata"]["category"]
        is_real_world = (category == "real_world")

        # Skip if report already exists
        safe_model_name = model_name.replace(".", "_").replace("-", "_")
        report_file = Path(f"./results/reports/{args.version}/{args.workflow}/{safe_model_name}/{benchmark_id}.json")
        if args.skip_existing and report_file.exists():
            print(f"SKIPPING {benchmark_id} (report already exists)")
            continue

        print("=" * 50)
        print(f"RUNNING {benchmark_id} (Category: {category})")
        evaluator.reset_usage()
        source_code = benchmark["source_code"]
        expected_test = benchmark["expected_test"]

        # Variables to be resolved by workflows
        final_test = ""
        review_feedback = ""
        total_prompt_tokens = 0
        total_completion_tokens = 0
        
        coverage_metrics = {
            "line_coverage": 0,
            "branch_coverage": 0
        }
        healing_attempts = 0
        healing_log = []
        evaluator_loop_log = []
        initial_test = ""
        best_of_n_candidates = []
        result = {"success": False, "stdout": "", "stderr": ""}
        evaluation_result = {}
        generation_time = 0

        # Detailed metrics tracking
        worker_prompt_tokens = 0
        worker_completion_tokens = 0
        worker_cost = 0.0
        worker_latency = 0.0

        evaluator_prompt_tokens = 0
        evaluator_completion_tokens = 0
        evaluator_cost = 0.0
        evaluator_latency = 0.0

        initial_line_coverage = 0.0
        initial_branch_coverage = 0.0
        initial_evaluator_score = 0
        initial_success = False
        initial_state_captured = False

        def capture_initial_state(success, line_cov, branch_cov, eval_score=0):
            global initial_line_coverage, initial_branch_coverage, initial_evaluator_score, initial_success, initial_state_captured
            if not initial_state_captured:
                initial_line_coverage = float(line_cov)
                initial_branch_coverage = float(branch_cov)
                initial_evaluator_score = int(eval_score)
                initial_success = bool(success)
                initial_state_captured = True

        def calculate_worker_cost(p_tokens, c_tokens):
            cost_in = (p_tokens / 1_000_000) * input_price
            cost_out = (c_tokens / 1_000_000) * output_price
            return round(cost_in + cost_out, 6)

        def run_worker_test(src_code, m_name, temp=0.2):
            res = generator.generate_test(src_code, m_name, temperature=temp)
            cost = calculate_worker_cost(res["prompt_tokens"], res["completion_tokens"])
            return res, cost

        def run_worker_text(prompt_str, m_name, temp=0.2):
            res = generator.generate_text(prompt_str, m_name, temperature=temp)
            cost = calculate_worker_cost(res["prompt_tokens"], res["completion_tokens"])
            return res, cost

        def run_evaluator(src_code, gen_test, exec_res, exp_test, m_name=None):
            target_model = m_name or evaluator.evaluator_model
            usage_before = evaluator.get_usage().get(target_model, {"prompt_tokens": 0, "completion_tokens": 0}).copy()
            
            start_eval_time = time.time()
            evaluation = evaluator.evaluate(
                source_code=src_code,
                generated_test=gen_test,
                execution_result=exec_res,
                expected_test=exp_test,
                model_name=m_name
            )
            eval_time = round(time.time() - start_eval_time, 2)
            
            usage_after = evaluator.get_usage().get(target_model, {"prompt_tokens": 0, "completion_tokens": 0})
            
            p_tokens_used = usage_after["prompt_tokens"] - usage_before.get("prompt_tokens", 0)
            c_tokens_used = usage_after["completion_tokens"] - usage_before.get("completion_tokens", 0)
            
            eval_pricing = MODEL_PRICING.get(target_model, {})
            eval_input_price = eval_pricing.get("input", 0)
            eval_output_price = eval_pricing.get("output", 0)
            cost_used = round(
                (p_tokens_used / 1_000_000) * eval_input_price +
                (c_tokens_used / 1_000_000) * eval_output_price,
                6
            )
            
            return evaluation, p_tokens_used, c_tokens_used, cost_used, eval_time

        if args.workflow == "best_of_n":
            candidates = []
            N = 3
            start_gen_time = time.time()
            for i in range(N):
                print(f"Generating candidate {i+1}/{N}...")
                generation_result, gen_cost = run_worker_test(source_code, model_name, temp=0.5)
                candidate_test = generation_result["generated_test"]
                
                worker_prompt_tokens += generation_result["prompt_tokens"]
                worker_completion_tokens += generation_result["completion_tokens"]
                worker_cost += gen_cost
                worker_latency += generation_result["generation_time"]
                
                total_prompt_tokens += generation_result["prompt_tokens"]
                total_completion_tokens += generation_result["completion_tokens"]
                
                candidate_coverage = {"line_coverage": 0, "branch_coverage": 0}
                
                if not is_real_world:
                    # Inject and run execution sandbox
                    executor.inject_source_code(source_code)
                    executor.inject_generated_test(candidate_test)
                    executor.build_source_project()
                    candidate_result = executor.run_tests()
                    
                    coverage_file = executor.find_coverage_file()
                    if coverage_file:
                        candidate_coverage = coverage_reader.read_coverage(coverage_file)
                else:
                    candidate_result = {"success": True, "stdout": "Real-world execution skipped", "stderr": ""}
                
                eval_execution_result = {
                    "success": candidate_result["success"],
                    "stdout": candidate_result["stdout"],
                    "stderr": candidate_result["stderr"],
                    "line_coverage": candidate_coverage["line_coverage"],
                    "branch_coverage": candidate_coverage["branch_coverage"]
                }
                
                candidate_evaluation, p_tokens, c_tokens, e_cost, eval_time = run_evaluator(
                    src_code=source_code,
                    gen_test=candidate_test,
                    exec_res=eval_execution_result,
                    exp_test=expected_test,
                    m_name=None
                )
                
                evaluator_prompt_tokens += p_tokens
                evaluator_completion_tokens += c_tokens
                evaluator_cost += e_cost
                evaluator_latency += eval_time
                
                score = candidate_evaluation.get("score", 0)
                if not is_real_world and not candidate_result["success"]:
                    score = min(score, 10)
                
                # Capture initial state of the first candidate
                if i == 0:
                    capture_initial_state(
                        candidate_result["success"],
                        candidate_coverage["line_coverage"],
                        candidate_coverage["branch_coverage"],
                        score
                    )
                
                candidates.append({
                    "test": candidate_test,
                    "result": candidate_result,
                    "coverage": candidate_coverage,
                    "evaluation": candidate_evaluation,
                    "score": score,
                    "generation_time": generation_result["generation_time"],
                    "worker_prompt_tokens": generation_result["prompt_tokens"],
                    "worker_completion_tokens": generation_result["completion_tokens"],
                    "worker_cost": round(gen_cost, 6),
                    "worker_latency": round(generation_result["generation_time"], 2),
                    "evaluator_prompt_tokens": p_tokens,
                    "evaluator_completion_tokens": c_tokens,
                    "evaluator_cost": round(e_cost, 6),
                    "evaluator_latency": round(eval_time, 2)
                })
            
            candidates.sort(key=lambda x: x["score"], reverse=True)
            best_candidate = candidates[0]
            final_test = best_candidate["test"]
            result = best_candidate["result"]
            coverage_metrics = best_candidate["coverage"]
            evaluation_result = best_candidate["evaluation"]
            generation_time = time.time() - start_gen_time
            print(f"SELECTED BEST CANDIDATE with score: {best_candidate['score']}")
            
            best_of_n_candidates = [
                {
                    "candidate_index": idx + 1,
                    "score": c["score"],
                    "line_coverage": c["coverage"]["line_coverage"],
                    "branch_coverage": c["coverage"]["branch_coverage"],
                    "success": c["result"]["success"],
                    "generated_test": c["test"],
                    "worker_prompt_tokens": c["worker_prompt_tokens"],
                    "worker_completion_tokens": c["worker_completion_tokens"],
                    "worker_cost": c["worker_cost"],
                    "worker_latency": c["worker_latency"],
                    "evaluator_prompt_tokens": c["evaluator_prompt_tokens"],
                    "evaluator_completion_tokens": c["evaluator_completion_tokens"],
                    "evaluator_cost": c["evaluator_cost"],
                    "evaluator_latency": c["evaluator_latency"],
                    "cost": round(c["worker_cost"] + c["evaluator_cost"], 6),
                    "latency": round(c["worker_latency"] + c["evaluator_latency"], 2)
                }
                for idx, c in enumerate(candidates)
            ]
            
        elif args.workflow == "ultimate_hybrid":
            candidates = []
            N = 3
            start_gen_time = time.time()
            for i in range(N):
                print(f"Generating candidate {i+1}/{N}...")
                generation_result, gen_cost = run_worker_test(source_code, model_name, temp=0.5)
                candidate_test = generation_result["generated_test"]
                
                cand_worker_prompt_tokens = generation_result["prompt_tokens"]
                cand_worker_completion_tokens = generation_result["completion_tokens"]
                cand_worker_cost = gen_cost
                cand_worker_latency = generation_result["generation_time"]
                
                worker_prompt_tokens += generation_result["prompt_tokens"]
                worker_completion_tokens += generation_result["completion_tokens"]
                worker_cost += gen_cost
                worker_latency += generation_result["generation_time"]
                
                total_prompt_tokens += generation_result["prompt_tokens"]
                total_completion_tokens += generation_result["completion_tokens"]
                
                candidate_coverage = {"line_coverage": 0, "branch_coverage": 0}
                
                if not is_real_world:
                    # Inject and run execution sandbox
                    executor.inject_source_code(source_code)
                    executor.inject_generated_test(candidate_test)
                    executor.build_source_project()
                    candidate_result = executor.run_tests()
                    
                    # Capture initial state of the first candidate BEFORE healing
                    if i == 0:
                        if not candidate_result["success"]:
                            capture_initial_state(False, 0.0, 0.0, 0)
                    
                    # Self-healing for candidate if it fails
                    cand_healing_attempts = 0
                    cand_healing_log = []
                    if not candidate_result["success"]:
                        max_cand_healing = 2
                        while not candidate_result["success"] and cand_healing_attempts < max_cand_healing:
                            cand_healing_attempts += 1
                            healing_attempts += 1
                            print(f"Candidate {i+1} compilation failed. Healing attempt {cand_healing_attempts}/{max_cand_healing}...")
                            errors = (candidate_result["stdout"] or "") + "\n" + (candidate_result["stderr"] or "")
                            healing_prompt = build_self_healing_prompt(source_code, candidate_test, errors)
                            
                            healing_res, healing_cost = run_worker_text(healing_prompt, model_name)
                            candidate_test = healing_res["content"]
                            
                            cand_worker_prompt_tokens += healing_res["prompt_tokens"]
                            cand_worker_completion_tokens += healing_res["completion_tokens"]
                            cand_worker_cost += healing_cost
                            cand_worker_latency += healing_res["generation_time"]
                            
                            worker_prompt_tokens += healing_res["prompt_tokens"]
                            worker_completion_tokens += healing_res["completion_tokens"]
                            worker_cost += healing_cost
                            worker_latency += healing_res["generation_time"]
                            
                            total_prompt_tokens += healing_res["prompt_tokens"]
                            total_completion_tokens += healing_res["completion_tokens"]
                            
                            executor.inject_generated_test(candidate_test)
                            executor.build_source_project()
                            candidate_result = executor.run_tests()
                            
                            log_entry = {
                                "attempt": cand_healing_attempts,
                                "errors": errors,
                                "success": candidate_result["success"],
                                "prompt_tokens": healing_res["prompt_tokens"],
                                "completion_tokens": healing_res["completion_tokens"],
                                "cost": round(healing_cost, 6),
                                "latency": healing_res["generation_time"]
                            }
                            cand_healing_log.append(log_entry)
                            healing_log.append({
                                "candidate_index": i + 1,
                                **log_entry
                            })
                            
                    coverage_file = executor.find_coverage_file()
                    if coverage_file:
                        candidate_coverage = coverage_reader.read_coverage(coverage_file)
                else:
                    candidate_result = {"success": True, "stdout": "Real-world execution skipped", "stderr": ""}
                
                eval_execution_result = {
                    "success": candidate_result["success"],
                    "stdout": candidate_result["stdout"],
                    "stderr": candidate_result["stderr"],
                    "line_coverage": candidate_coverage["line_coverage"],
                    "branch_coverage": candidate_coverage["branch_coverage"]
                }
                
                candidate_evaluation, p_tokens, c_tokens, e_cost, eval_time = run_evaluator(
                    src_code=source_code,
                    gen_test=candidate_test,
                    exec_res=eval_execution_result,
                    exp_test=expected_test,
                    m_name=None
                )
                
                evaluator_prompt_tokens += p_tokens
                evaluator_completion_tokens += c_tokens
                evaluator_cost += e_cost
                evaluator_latency += eval_time
                
                score = candidate_evaluation.get("score", 0)
                if not is_real_world and not candidate_result["success"]:
                    score = min(score, 10)
                
                # Capture initial state of candidate 1 (if it hasn't been captured due to compile success on first try)
                if i == 0:
                    capture_initial_state(
                        candidate_result["success"],
                        candidate_coverage["line_coverage"],
                        candidate_coverage["branch_coverage"],
                        score
                    )
                
                candidates.append({
                    "test": candidate_test,
                    "result": candidate_result,
                    "coverage": candidate_coverage,
                    "evaluation": candidate_evaluation,
                    "score": score,
                    "generation_time": generation_result["generation_time"],
                    "worker_prompt_tokens": cand_worker_prompt_tokens,
                    "worker_completion_tokens": cand_worker_completion_tokens,
                    "worker_cost": round(cand_worker_cost, 6),
                    "worker_latency": round(cand_worker_latency, 2),
                    "evaluator_prompt_tokens": p_tokens,
                    "evaluator_completion_tokens": c_tokens,
                    "evaluator_cost": round(e_cost, 6),
                    "evaluator_latency": round(eval_time, 2)
                })
                
            candidates.sort(key=lambda x: x["score"], reverse=True)
            best_candidate = candidates[0]
            final_test = best_candidate["test"]
            result = best_candidate["result"]
            coverage_metrics = best_candidate["coverage"]
            evaluation_result = best_candidate["evaluation"]
            generation_time = time.time() - start_gen_time
            print(f"SELECTED BEST CANDIDATE with score: {best_candidate['score']}")
            
            best_of_n_candidates = [
                {
                    "candidate_index": idx + 1,
                    "score": c["score"],
                    "line_coverage": c["coverage"]["line_coverage"],
                    "branch_coverage": c["coverage"]["branch_coverage"],
                    "success": c["result"]["success"],
                    "generated_test": c["test"],
                    "worker_prompt_tokens": c["worker_prompt_tokens"],
                    "worker_completion_tokens": c["worker_completion_tokens"],
                    "worker_cost": c["worker_cost"],
                    "worker_latency": c["worker_latency"],
                    "evaluator_prompt_tokens": c["evaluator_prompt_tokens"],
                    "evaluator_completion_tokens": c["evaluator_completion_tokens"],
                    "evaluator_cost": c["evaluator_cost"],
                    "evaluator_latency": c["evaluator_latency"],
                    "cost": round(c["worker_cost"] + c["evaluator_cost"], 6),
                    "latency": round(c["worker_latency"] + c["evaluator_latency"], 2)
                }
                for idx, c in enumerate(candidates)
            ]

            # Evaluator-guided refinement loop on the best candidate
            if not is_real_world:
                max_eval_attempts = 2
                eval_attempt = 0
                eval_score_threshold = 80
                current_score = evaluation_result.get("score", 0)
                
                eval_execution_result = {
                    "success": result["success"],
                    "stdout": result["stdout"],
                    "stderr": result["stderr"],
                    "line_coverage": coverage_metrics["line_coverage"],
                    "branch_coverage": coverage_metrics["branch_coverage"]
                }

                while current_score < eval_score_threshold and eval_attempt < max_eval_attempts:
                    eval_attempt += 1
                    print(f"EVALUATOR-GUIDED REFINEMENT attempt {eval_attempt}/{max_eval_attempts} (score: {current_score})")

                    loop_worker_prompt_tokens = 0
                    loop_worker_completion_tokens = 0
                    loop_worker_cost = 0.0
                    loop_worker_latency = 0.0

                    guided_prompt = build_evaluator_guided_prompt(
                        source_code=source_code,
                        current_test=final_test,
                        execution_result=eval_execution_result,
                        evaluator_score=current_score,
                        issues_found=evaluation_result.get("issues_found", []),
                        suggestions=evaluation_result.get("suggestions", []),
                        assertion_quality_review=evaluation_result.get("assertion_quality_review", ""),
                        coverage_review=evaluation_result.get("coverage_review", ""),
                    )

                    guided_result, guided_cost = run_worker_text(guided_prompt, model_name)
                    refined_test = guided_result["content"]

                    loop_worker_prompt_tokens += guided_result["prompt_tokens"]
                    loop_worker_completion_tokens += guided_result["completion_tokens"]
                    loop_worker_cost += guided_cost
                    loop_worker_latency += guided_result["generation_time"]

                    worker_prompt_tokens += guided_result["prompt_tokens"]
                    worker_completion_tokens += guided_result["completion_tokens"]
                    worker_cost += guided_cost
                    worker_latency += guided_result["generation_time"]

                    total_prompt_tokens += guided_result["prompt_tokens"]
                    total_completion_tokens += guided_result["completion_tokens"]

                    # Re-run tests with improved test
                    executor.inject_generated_test(refined_test)
                    executor.build_source_project()
                    refined_result = executor.run_tests()
                    
                    # Run one attempt of self-healing if refined test fails compilation
                    if not refined_result["success"]:
                        healing_attempts += 1
                        print(f"Refined test compilation failed. Self-healing...")
                        errors = (refined_result["stdout"] or "") + "\n" + (refined_result["stderr"] or "")
                        healing_prompt = build_self_healing_prompt(source_code, refined_test, errors)
                        
                        healing_res, healing_cost = run_worker_text(healing_prompt, model_name)
                        refined_test = healing_res["content"]
                        
                        loop_worker_prompt_tokens += healing_res["prompt_tokens"]
                        loop_worker_completion_tokens += healing_res["completion_tokens"]
                        loop_worker_cost += healing_cost
                        loop_worker_latency += healing_res["generation_time"]
                        
                        worker_prompt_tokens += healing_res["prompt_tokens"]
                        worker_completion_tokens += healing_res["completion_tokens"]
                        worker_cost += healing_cost
                        worker_latency += healing_res["generation_time"]
                        
                        total_prompt_tokens += healing_res["prompt_tokens"]
                        total_completion_tokens += healing_res["completion_tokens"]
                        
                        executor.inject_generated_test(refined_test)
                        executor.build_source_project()
                        refined_result = executor.run_tests()
                        
                        healing_log.append({
                            "refinement_attempt": eval_attempt,
                            "attempt": 1,
                            "errors": errors,
                            "success": refined_result["success"],
                            "prompt_tokens": healing_res["prompt_tokens"],
                            "completion_tokens": healing_res["completion_tokens"],
                            "cost": round(healing_cost, 6),
                            "latency": healing_res["generation_time"]
                        })

                    refined_coverage = {"line_coverage": 0, "branch_coverage": 0}
                    coverage_file = executor.find_coverage_file()
                    if coverage_file:
                        refined_coverage = coverage_reader.read_coverage(coverage_file)

                    eval_execution_result = {
                        "success": refined_result["success"],
                        "stdout": refined_result["stdout"],
                        "stderr": refined_result["stderr"],
                        "line_coverage": refined_coverage["line_coverage"],
                        "branch_coverage": refined_coverage["branch_coverage"]
                    }

                    # Re-evaluate improved test
                    refined_evaluation, p_tokens, c_tokens, e_cost, eval_time = run_evaluator(
                        src_code=source_code,
                        gen_test=refined_test,
                        exec_res=eval_execution_result,
                        exp_test=expected_test,
                        m_name=None
                    )

                    evaluator_prompt_tokens += p_tokens
                    evaluator_completion_tokens += c_tokens
                    evaluator_cost += e_cost
                    evaluator_latency += eval_time

                    new_score = refined_evaluation.get("score", 0)
                    if not refined_result["success"]:
                        new_score = min(new_score, 10)
                        
                    evaluator_loop_log.append({
                        "attempt": eval_attempt,
                        "score_before": current_score,
                        "score_after": new_score,
                        "success": refined_result["success"],
                        "worker_prompt_tokens": loop_worker_prompt_tokens,
                        "worker_completion_tokens": loop_worker_completion_tokens,
                        "worker_cost": round(loop_worker_cost, 6),
                        "worker_latency": round(loop_worker_latency, 2),
                        "evaluator_prompt_tokens": p_tokens,
                        "evaluator_completion_tokens": c_tokens,
                        "evaluator_cost": round(e_cost, 6),
                        "evaluator_latency": round(eval_time, 2),
                        "cost": round(loop_worker_cost + e_cost, 6),
                        "latency": round(loop_worker_latency + eval_time, 2)
                    })
                    print(f"EVALUATOR-GUIDED score: {current_score} -> {new_score}")
                    
                    if new_score > current_score or (new_score == current_score and refined_result["success"] and not result["success"]):
                        final_test = refined_test
                        result = refined_result
                        coverage_metrics = refined_coverage
                        evaluation_result = refined_evaluation
                        current_score = new_score
                        
        else:
            # Generate single test
            start_gen_time = time.time()
            generation_result, gen_cost = run_worker_test(source_code, model_name)
            generated_test = generation_result["generated_test"]
            final_test = generated_test
            generation_time = generation_result["generation_time"]

            # accumulate
            worker_prompt_tokens += generation_result["prompt_tokens"]
            worker_completion_tokens += generation_result["completion_tokens"]
            worker_cost += gen_cost
            worker_latency += generation_result["generation_time"]

            total_prompt_tokens = generation_result["prompt_tokens"]
            total_completion_tokens = generation_result["completion_tokens"]

            if args.workflow == "agent":
                initial_test = generated_test
                review_prompt = build_review_prompt(source_code, generated_test)
                review_result, review_cost = run_worker_text(review_prompt, model_name)
                review_feedback = review_result["content"]

                # accumulate review
                worker_prompt_tokens += review_result["prompt_tokens"]
                worker_completion_tokens += review_result["completion_tokens"]
                worker_cost += review_cost
                worker_latency += review_result["generation_time"]

                refine_prompt = build_refine_prompt(source_code, generated_test, review_feedback)
                refine_result, refine_cost = run_worker_text(refine_prompt, model_name)
                final_test = refine_result["content"]

                # accumulate refine
                worker_prompt_tokens += refine_result["prompt_tokens"]
                worker_completion_tokens += refine_result["completion_tokens"]
                worker_cost += refine_cost
                worker_latency += refine_result["generation_time"]

                total_prompt_tokens += review_result["prompt_tokens"] + refine_result["prompt_tokens"]
                total_completion_tokens += review_result["completion_tokens"] + refine_result["completion_tokens"]

            if not is_real_world:
                # Run execution engine
                executor.inject_source_code(source_code)
                executor.inject_generated_test(final_test)
                executor.build_source_project()
                result = executor.run_tests()

                # capture initial state before healing if compiling fails
                if not result["success"]:
                    capture_initial_state(False, 0.0, 0.0, 0)

                # Self-healing retry loop
                if not result["success"] and args.workflow == "self_healing":
                    max_healing_attempts = 3
                    while not result["success"] and healing_attempts < max_healing_attempts:
                        healing_attempts += 1
                        errors = (result["stdout"] or "") + "\n" + (result["stderr"] or "")
                        healing_prompt = build_self_healing_prompt(source_code, final_test, errors)
                        
                        healing_res, healing_cost = run_worker_text(healing_prompt, model_name)
                        final_test = healing_res["content"]
                        
                        # accumulate healing
                        worker_prompt_tokens += healing_res["prompt_tokens"]
                        worker_completion_tokens += healing_res["completion_tokens"]
                        worker_cost += healing_cost
                        worker_latency += healing_res["generation_time"]
                        
                        total_prompt_tokens += healing_res["prompt_tokens"]
                        total_completion_tokens += healing_res["completion_tokens"]
                        
                        executor.inject_generated_test(final_test)
                        executor.build_source_project()
                        result = executor.run_tests()
                        
                        healing_log.append({
                            "attempt": healing_attempts,
                            "errors": errors,
                            "success": result["success"],
                            "prompt_tokens": healing_res["prompt_tokens"],
                            "completion_tokens": healing_res["completion_tokens"],
                            "cost": round(healing_cost, 6),
                            "latency": healing_res["generation_time"]
                        })

                # Get coverage metrics
                coverage_file = executor.find_coverage_file()
                if coverage_file:
                    coverage_metrics = coverage_reader.read_coverage(coverage_file)
            else:
                result = {"success": True, "stdout": "Real-world execution skipped", "stderr": ""}

            generation_time = time.time() - start_gen_time

            # Run Evaluator Agent
            eval_execution_result = {
                "success": result["success"],
                "stdout": result["stdout"],
                "stderr": result["stderr"],
                "line_coverage": coverage_metrics["line_coverage"],
                "branch_coverage": coverage_metrics["branch_coverage"]
            }
            
            evaluation_result, p_tokens, c_tokens, e_cost, eval_time = run_evaluator(
                src_code=source_code,
                gen_test=final_test,
                exec_res=eval_execution_result,
                exp_test=expected_test,
                m_name=None
            )
            # accumulate evaluator
            evaluator_prompt_tokens += p_tokens
            evaluator_completion_tokens += c_tokens
            evaluator_cost += e_cost
            evaluator_latency += eval_time

            # capture initial state for single / self_healing / agent workflows if not already captured
            capture_initial_state(
                result["success"],
                coverage_metrics["line_coverage"],
                coverage_metrics["branch_coverage"],
                evaluation_result.get("score", 0)
            )

            # Evaluator-guided refinement loop
            if args.workflow == "evaluator_guided" and not is_real_world:
                max_eval_attempts = 3
                eval_attempt = 0
                eval_score_threshold = 75
                current_score = evaluation_result.get("score", 0)

                while current_score < eval_score_threshold and eval_attempt < max_eval_attempts:
                    eval_attempt += 1
                    print(f"EVALUATOR-GUIDED REFINEMENT attempt {eval_attempt}/{max_eval_attempts} (score: {current_score})")

                    loop_worker_prompt_tokens = 0
                    loop_worker_completion_tokens = 0
                    loop_worker_cost = 0.0
                    loop_worker_latency = 0.0

                    guided_prompt = build_evaluator_guided_prompt(
                        source_code=source_code,
                        current_test=final_test,
                        execution_result=eval_execution_result,
                        evaluator_score=current_score,
                        issues_found=evaluation_result.get("issues_found", []),
                        suggestions=evaluation_result.get("suggestions", []),
                        assertion_quality_review=evaluation_result.get("assertion_quality_review", ""),
                        coverage_review=evaluation_result.get("coverage_review", ""),
                    )

                    guided_res, guided_cost = run_worker_text(guided_prompt, model_name)
                    final_test = guided_res["content"]

                    loop_worker_prompt_tokens += guided_res["prompt_tokens"]
                    loop_worker_completion_tokens += guided_res["completion_tokens"]
                    loop_worker_cost += guided_cost
                    loop_worker_latency += guided_res["generation_time"]

                    worker_prompt_tokens += guided_res["prompt_tokens"]
                    worker_completion_tokens += guided_res["completion_tokens"]
                    worker_cost += guided_cost
                    worker_latency += guided_res["generation_time"]

                    total_prompt_tokens     += guided_res["prompt_tokens"]
                    total_completion_tokens += guided_res["completion_tokens"]

                    # Re-run tests with improved test
                    executor.inject_generated_test(final_test)
                    executor.build_source_project()
                    result = executor.run_tests()

                    coverage_file = executor.find_coverage_file()
                    if coverage_file:
                        coverage_metrics = coverage_reader.read_coverage(coverage_file)

                    eval_execution_result = {
                        "success": result["success"],
                        "stdout": result["stdout"],
                        "stderr": result["stderr"],
                        "line_coverage": coverage_metrics["line_coverage"],
                        "branch_coverage": coverage_metrics["branch_coverage"]
                    }

                    # Re-evaluate improved test
                    evaluation_result, p_tokens, c_tokens, e_cost, eval_time = run_evaluator(
                        src_code=source_code,
                        gen_test=final_test,
                        exec_res=eval_execution_result,
                        exp_test=expected_test,
                        m_name=None
                    )
                    
                    evaluator_prompt_tokens += p_tokens
                    evaluator_completion_tokens += c_tokens
                    evaluator_cost += e_cost
                    evaluator_latency += eval_time

                    new_score = evaluation_result.get("score", 0)
                    evaluator_loop_log.append({
                        "attempt": eval_attempt,
                        "score_before": current_score,
                        "score_after": new_score,
                        "success": result["success"],
                        "worker_prompt_tokens": loop_worker_prompt_tokens,
                        "worker_completion_tokens": loop_worker_completion_tokens,
                        "worker_cost": round(loop_worker_cost, 6),
                        "worker_latency": round(loop_worker_latency, 2),
                        "evaluator_prompt_tokens": p_tokens,
                        "evaluator_completion_tokens": c_tokens,
                        "evaluator_cost": round(e_cost, 6),
                        "evaluator_latency": round(eval_time, 2),
                        "cost": round(loop_worker_cost + e_cost, 6),
                        "latency": round(loop_worker_latency + eval_time, 2)
                    })
                    print(f"EVALUATOR-GUIDED score: {current_score} -> {new_score}")
                    current_score = new_score

                print(f"EVALUATOR-GUIDED COMPLETED: final score {current_score} after {eval_attempt} refinement(s)")

        # Run Mutation Testing if enabled and compilation succeeded
        mutation_result = None
        if args.enable_mutation and not is_real_world and result["success"]:
            mutation_result = executor.run_mutation_testing()

        # Setup paths and directory
        safe_model_name = model_name.replace(".", "_").replace("-", "_")
        model_generated_path = f"{results_dir}/{safe_model_name}"
        Path(model_generated_path).mkdir(parents=True, exist_ok=True)
        generated_test_path = f"{model_generated_path}/{benchmark_id}.cs"

        # Save Final Test Code on disk
        with open(generated_test_path, "w", encoding="utf-8") as f:
            f.write(final_test)

        # Setup report dictionary
        benchmark_result = {
            "benchmark_id": benchmark_id,
            "category": category,
            "model": model_name,
            "success": result["success"],
            "generated_test": final_test,
            "stdout": result.get("stdout", ""),
            "stderr": result.get("stderr", ""),
            "line_coverage": coverage_metrics["line_coverage"],
            "branch_coverage": coverage_metrics["branch_coverage"],
            "generation_time": round(worker_latency, 2),
            "cost": round(worker_cost + evaluator_cost, 6),
            "evaluation_mode": (
                "semantic"
                if is_real_world
                else "execution"
            ),
            "execution_skipped": is_real_world,
            "workflow": args.workflow,
            "review_feedback": review_feedback,
            "evaluator_score": evaluation_result.get("score", 0),
            "evaluator_feedback": evaluation_result,
            "evaluator_model": evaluator.evaluator_model,
            "healing_attempts": healing_attempts,
            "healing_log": healing_log,
            "evaluator_loop_log": evaluator_loop_log,
            "initial_test": initial_test,
            "best_of_n_candidates": best_of_n_candidates,
            "worker_prompt_tokens": worker_prompt_tokens,
            "worker_completion_tokens": worker_completion_tokens,
            "worker_cost": round(worker_cost, 6),
            "worker_latency": round(worker_latency, 2),
            "evaluator_prompt_tokens": evaluator_prompt_tokens,
            "evaluator_completion_tokens": evaluator_completion_tokens,
            "evaluator_cost": round(evaluator_cost, 6),
            "evaluator_latency": round(evaluator_latency, 2),
            "prompt_tokens": worker_prompt_tokens + evaluator_prompt_tokens,
            "completion_tokens": worker_completion_tokens + evaluator_completion_tokens,
            "latency": round(worker_latency + evaluator_latency, 2),
            "initial_line_coverage": initial_line_coverage,
            "initial_branch_coverage": initial_branch_coverage,
            "initial_evaluator_score": initial_evaluator_score,
            "initial_success": initial_success,
            "mutation_score": mutation_result.get("mutation_score") if mutation_result else None,
            "total_mutants": mutation_result.get("total_mutants") if mutation_result else None,
            "killed_mutants": mutation_result.get("killed_mutants") if mutation_result else None,
            "survived_mutants": mutation_result.get("survived_mutants") if mutation_result else None,
            "ignored_mutants": mutation_result.get("ignored_mutants") if mutation_result else None,
            "timeout_mutants": mutation_result.get("timeout_mutants") if mutation_result else None
        }

        # Save report
        writer.save_result(benchmark_result, model_name, args.version, args.workflow)

        print(f"SUCCESS: {result['success']}")
        print(f"LINE COVERAGE: {coverage_metrics['line_coverage']}%")
        print(f"BRANCH COVERAGE: {coverage_metrics['branch_coverage']}%")
        if mutation_result:
            print(f"MUTATION SCORE: {mutation_result.get('mutation_score')}%")
        print("=" * 50)
        print("BENCHMARK COMPLETED")

end_time = time.time()
run_time = (end_time - start_time)
print(f"RUN TIME: {round(run_time, 2)} seconds")
print("=" * 50)
print("ALL MODELS COMPLETED")
