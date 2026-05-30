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
# PHASE 1: INITIAL WORKFLOWS (single, agent, ultimate_hybrid)
# ==============================================================================
Write-Host "`n>>> [PHASE 1] RUNNING INITIAL WORKFLOWS (single, agent, ultimate_hybrid) <<<" -ForegroundColor Green

# 1. Dataset V2 Runs
Write-Host "`n>>> Step 1: Starting Dataset V2 Runs..." -ForegroundColor Cyan

Write-Host "Running V2 Single-Pass Workflow..." -ForegroundColor Yellow
py main.py --version v2 --model gptmini --workflow single --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_single.txt
py main.py --version v2 --model llama --workflow single --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_single.txt
py main.py --version v2 --model deepseekv3 --workflow single --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_single.txt

Write-Host "Running V2 Agent Workflow..." -ForegroundColor Yellow
py main.py --version v2 --model gptmini --workflow agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_agent.txt
py main.py --version v2 --model llama --workflow agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_agent.txt
py main.py --version v2 --model deepseekv3 --workflow agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_agent.txt

Write-Host "Running V2 Ultimate Hybrid Workflow..." -ForegroundColor Yellow
py main.py --version v2 --model gptmini --workflow ultimate_hybrid --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_ultimate_hybrid.txt
py main.py --version v2 --model llama --workflow ultimate_hybrid --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_ultimate_hybrid.txt
py main.py --version v2 --model deepseekv3 --workflow ultimate_hybrid --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_ultimate_hybrid.txt


# 2. Dataset V1 Runs
Write-Host "`n>>> Step 2: Starting Dataset V1 Runs..." -ForegroundColor Cyan

Write-Host "Running V1 Single-Pass Workflow..." -ForegroundColor Yellow
py main.py --version v1 --model gptmini --workflow single --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_single.txt
py main.py --version v1 --model llama --workflow single --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_single.txt
py main.py --version v1 --model deepseekv3 --workflow single --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_single.txt

Write-Host "Running V1 Agent Workflow..." -ForegroundColor Yellow
py main.py --version v1 --model gptmini --workflow agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_agent.txt
py main.py --version v1 --model llama --workflow agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_agent.txt
py main.py --version v1 --model deepseekv3 --workflow agent --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_agent.txt

Write-Host "Running V1 Ultimate Hybrid Workflow..." -ForegroundColor Yellow
py main.py --version v1 --model gptmini --workflow ultimate_hybrid --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_ultimate_hybrid.txt
py main.py --version v1 --model llama --workflow ultimate_hybrid --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_ultimate_hybrid.txt
py main.py --version v1 --model deepseekv3 --workflow ultimate_hybrid --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_ultimate_hybrid.txt


# 3. First Round Summary
Write-Host "`n>>> Step 3: Generating First Round Analytical Summaries..." -ForegroundColor Green
py src/summary/main.py


# ==============================================================================
# PHASE 2: REFINEMENT WORKFLOWS (self_healing, best_of_n, evaluator_guided)
# ==============================================================================
Write-Host "`n>>> [PHASE 2] RUNNING REFINEMENT WORKFLOWS (self_healing, best_of_n, evaluator_guided) <<<" -ForegroundColor Green

# 4. Dataset V2 Runs
Write-Host "`n>>> Step 4: Starting Dataset V2 Runs..." -ForegroundColor Cyan

Write-Host "Running V2 Self-Healing Workflow..." -ForegroundColor Yellow
py main.py --version v2 --model gptmini --workflow self_healing --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_self_healing.txt
py main.py --version v2 --model llama --workflow self_healing --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_self_healing.txt
py main.py --version v2 --model deepseekv3 --workflow self_healing --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_self_healing.txt

Write-Host "Running V2 Best-of-N Workflow..." -ForegroundColor Yellow
py main.py --version v2 --model gptmini --workflow best_of_n --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_best_of_n.txt
py main.py --version v2 --model llama --workflow best_of_n --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_best_of_n.txt
py main.py --version v2 --model deepseekv3 --workflow best_of_n --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_best_of_n.txt

Write-Host "Running V2 Evaluator-Guided Workflow..." -ForegroundColor Yellow
py main.py --version v2 --model gptmini --workflow evaluator_guided --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/gptmini/run_log_evaluator_guided.txt
py main.py --version v2 --model llama --workflow evaluator_guided --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/llama/run_log_evaluator_guided.txt
py main.py --version v2 --model deepseekv3 --workflow evaluator_guided --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v2/deepseekv3/run_log_evaluator_guided.txt


# 5. Dataset V1 Runs
# Write-Host "`n>>> Step 5: Starting Dataset V1 Runs..." -ForegroundColor Cyan

# Write-Host "Running V1 Self-Healing Workflow..." -ForegroundColor Yellow
# py main.py --version v1 --model gptmini --workflow self_healing --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_self_healing.txt
# py main.py --version v1 --model llama --workflow self_healing --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_self_healing.txt
# py main.py --version v1 --model deepseekv3 --workflow self_healing --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_self_healing.txt

# Write-Host "Running V1 Best-of-N Workflow..." -ForegroundColor Yellow
# py main.py --version v1 --model gptmini --workflow best_of_n --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_best_of_n.txt
# py main.py --version v1 --model llama --workflow best_of_n --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_best_of_n.txt
# py main.py --version v1 --model deepseekv3 --workflow best_of_n --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_best_of_n.txt

# Write-Host "Running V1 Evaluator-Guided Workflow..." -ForegroundColor Yellow
# py main.py --version v1 --model gptmini --workflow evaluator_guided --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/gptmini/run_log_evaluator_guided.txt
# py main.py --version v1 --model llama --workflow evaluator_guided --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/llama/run_log_evaluator_guided.txt
# py main.py --version v1 --model deepseekv3 --workflow evaluator_guided --enable-mutation --skip-existing 2>&1 | Tee-Object -Append results/logs/v1/deepseekv3/run_log_evaluator_guided.txt


# 6. Final Round Summary
Write-Host "`n>>> Step 6: Generating Final Round Analytical Summaries..." -ForegroundColor Green
py src/summary/main.py


Write-Host "`n==================================================" -ForegroundColor Green
Write-Host "ALL PIPELINE RUNS COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
