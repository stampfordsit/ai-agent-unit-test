# PowerShell Pipeline Runner for C# AI Unit Test Benchmark
# This script executes benchmark runs sequentially in the requested order.
# It automatically pipes output to both the console and log files,
# and uses --skip-existing to allow safe recovery/resuming of runs.

Write-Host "==================================================" -ForegroundColor Green
Write-Host "STARTING BENCHMARK PIPELINE RUNNER" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Ensure logs directories exist for each version and model
$versions = @("v1", "v2")
$models = @("gptmini", "llama", "deepseekv3")

foreach ($version in $versions) {
    foreach ($model in $models) {
        $log_dir = "results/logs/$version/$model"
        if (!(Test-Path -Path $log_dir)) {
            New-Item -ItemType Directory -Force -Path $log_dir | Out-Null
        }
    }
}

# ==============================================================================
# PHASE 1: INITIAL WORKFLOWS (zero-shot, single-pass, agent, agent-pass, compiler-guided-multi-agent)
# ==============================================================================
Write-Host "`n>>> [PHASE 1] RUNNING INITIAL WORKFLOWS (zero-shot, single-pass, agent, agent-pass, compiler-guided-multi-agent) <<<" -ForegroundColor Green

# 1. Dataset V2 Runs
Write-Host "`n>>> Step 1: Starting Dataset V2 Runs..." -ForegroundColor Cyan

Write-Host "Running V2 Zero-Shot Workflow..." -ForegroundColor Yellow
py main.py --version v2 --model gptmini --workflow zero-shot --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_zero_shot.txt
py main.py --version v2 --model llama --workflow zero-shot --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_zero_shot.txt
py main.py --version v2 --model deepseekv3 --workflow zero-shot --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_zero_shot.txt

Write-Host "Running V2 Single-Pass Workflow..." -ForegroundColor Yellow
py main.py --version v2 --model gptmini --workflow single-pass --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_single_pass.txt
py main.py --version v2 --model llama --workflow single-pass --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_single_pass.txt
py main.py --version v2 --model deepseekv3 --workflow single-pass --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_single_pass.txt

Write-Host "Running V2 Agent Critique Workflow..." -ForegroundColor Yellow
py main.py --version v2 --model gptmini --workflow agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_agent.txt
py main.py --version v2 --model llama --workflow agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_agent.txt
py main.py --version v2 --model deepseekv3 --workflow agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_agent.txt

Write-Host "Running V2 Agent-Pass Workflow..." -ForegroundColor Yellow
py main.py --version v2 --model gptmini --workflow agent-pass --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_agent_pass.txt
py main.py --version v2 --model llama --workflow agent-pass --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_agent_pass.txt
py main.py --version v2 --model deepseekv3 --workflow agent-pass --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_agent_pass.txt

Write-Host "Running V2 Compiler-Guided Multi-Agent Workflow..." -ForegroundColor Yellow
py main.py --version v2 --model gptmini --workflow compiler-guided-multi-agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_compiler_guided_multi_agent.txt
py main.py --version v2 --model llama --workflow compiler-guided-multi-agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_compiler_guided_multi_agent.txt
py main.py --version v2 --model deepseekv3 --workflow compiler-guided-multi-agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_compiler_guided_multi_agent.txt


# 2. Dataset V1 Runs
Write-Host "`n>>> Step 2: Starting Dataset V1 Runs..." -ForegroundColor Cyan

Write-Host "Running V1 Zero-Shot Workflow..." -ForegroundColor Yellow
py main.py --version v1 --model gptmini --workflow zero-shot --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_zero_shot.txt
py main.py --version v1 --model llama --workflow zero-shot --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_zero_shot.txt
py main.py --version v1 --model deepseekv3 --workflow zero-shot --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_zero_shot.txt

#Write-Host "Running V1 Single-Pass Workflow..." -ForegroundColor Yellow
#py main.py --version v1 --model gptmini --workflow single-pass --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_single_pass.txt
#py main.py --version v1 --model llama --workflow single-pass --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_single_pass.txt
#py main.py --version v1 --model deepseekv3 --workflow single-pass --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_single_pass.txt

Write-Host "Running V1 Agent Critique Workflow..." -ForegroundColor Yellow
py main.py --version v1 --model gptmini --workflow agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_agent.txt
py main.py --version v1 --model llama --workflow agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_agent.txt
py main.py --version v1 --model deepseekv3 --workflow agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_agent.txt

#Write-Host "Running V1 Agent-Pass Workflow..." -ForegroundColor Yellow
#py main.py --version v1 --model gptmini --workflow agent-pass --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_agent_pass.txt
#py main.py --version v1 --model llama --workflow agent-pass --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_agent_pass.txt
#py main.py --version v1 --model deepseekv3 --workflow agent-pass --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_agent_pass.txt

Write-Host "Running V1 Compiler-Guided Multi-Agent Workflow..." -ForegroundColor Yellow
py main.py --version v1 --model gptmini --workflow compiler-guided-multi-agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_compiler_guided_multi_agent.txt
py main.py --version v1 --model llama --workflow compiler-guided-multi-agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_compiler_guided_multi_agent.txt
py main.py --version v1 --model deepseekv3 --workflow compiler-guided-multi-agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_compiler_guided_multi_agent.txt


# 3. First Round Summary
Write-Host "`n>>> Step 3: Generating First Round Analytical Summaries..." -ForegroundColor Green
py src/summary/main.py


# ==============================================================================
# PHASE 2: REFINEMENT WORKFLOWS (self-healing, best-of-n, evaluator-guided)
# ==============================================================================
#Write-Host "`n>>> [PHASE 2] RUNNING REFINEMENT WORKFLOWS (self-healing, best-of-n, evaluator-guided) <<<" -ForegroundColor Green

# 4. Dataset V2 Runs
#Write-Host "`n>>> Step 4: Starting Dataset V2 Runs..." -ForegroundColor Cyan

#Write-Host "Running V2 Self-Healing Workflow..." -ForegroundColor Yellow
#py main.py --version v2 --model gptmini --workflow self-healing --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_self_healing.txt
#py main.py --version v2 --model llama --workflow self-healing --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_self_healing.txt
#py main.py --version v2 --model deepseekv3 --workflow self-healing --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_self_healing.txt

#Write-Host "Running V2 Best-of-N Workflow..." -ForegroundColor Yellow
#py main.py --version v2 --model gptmini --workflow best-of-n --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_best_of_n.txt
#py main.py --version v2 --model llama --workflow best-of-n --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_best_of_n.txt
#py main.py --version v2 --model deepseekv3 --workflow best-of-n --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_best_of_n.txt

#Write-Host "Running V2 Evaluator-Guided Workflow..." -ForegroundColor Yellow
#py main.py --version v2 --model gptmini --workflow evaluator-guided --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_evaluator_guided.txt
#py main.py --version v2 --model llama --workflow evaluator-guided --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_evaluator_guided.txt
#py main.py --version v2 --model deepseekv3 --workflow evaluator-guided --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_evaluator_guided.txt


# 5. Dataset V1 Runs
# Write-Host "`n>>> Step 5: Starting Dataset V1 Runs..." -ForegroundColor Cyan

# Write-Host "Running V1 Self-Healing Workflow..." -ForegroundColor Yellow
# py main.py --version v1 --model gptmini --workflow self-healing --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_self_healing.txt
# py main.py --version v1 --model llama --workflow self-healing --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_self_healing.txt
# py main.py --version v1 --model deepseekv3 --workflow self-healing --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_self_healing.txt

# Write-Host "Running V1 Best-of-N Workflow..." -ForegroundColor Yellow
# py main.py --version v1 --model gptmini --workflow best-of-n --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_best_of_n.txt
# py main.py --version v1 --model llama --workflow best-of-n --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_best_of_n.txt
# py main.py --version v1 --model deepseekv3 --workflow best-of-n --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_best_of_n.txt

# Write-Host "Running V1 Evaluator-Guided Workflow..." -ForegroundColor Yellow
# py main.py --version v1 --model gptmini --workflow evaluator-guided --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_evaluator_guided.txt
# py main.py --version v1 --model llama --workflow evaluator-guided --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_evaluator_guided.txt
# py main.py --version v1 --model deepseekv3 --workflow evaluator-guided --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_evaluator_guided.txt


# 6. Final Round Summary
# Write-Host "`n>>> Step 6: Generating Final Round Analytical Summaries..." -ForegroundColor Green
# py src/summary/main.py


Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "ALL PIPELINE RUNS COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
