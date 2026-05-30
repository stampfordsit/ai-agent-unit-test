import subprocess
import sys
import os
import json
from pathlib import Path

def run_cmd(cmd, cwd=None):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=cwd)
    return result.returncode, result.stdout.strip(), result.stderr.strip()

def main():
    print("==================================================")
    print("🛡️  CSHARP TEST GUARDIAN (Git pre-commit CI/CD gate)")
    print("==================================================")
    
    # 1. Get staged C# files
    code, stdout, stderr = run_cmd("git diff --cached --name-only")
    if code != 0:
        print(f"❌ Error running git diff: {stderr}")
        sys.exit(1)
        
    staged_files = stdout.splitlines()
    cs_files = [f for f in staged_files if f.endswith(".cs") and not f.endswith("Tests.cs")]
    
    if not cs_files:
        print("✔ No C# source files modified. Allowing commit.")
        sys.exit(0)
        
    print(f"🔍 Detected {len(cs_files)} C# file(s) to verify:")
    for f in cs_files:
        print(f"  - {f}")
        
    # Find script directory
    script_dir = Path(__file__).resolve().parent
    api_runner_script = script_dir / "api_runner.py"
    venv_python = script_dir / ".venv" / "Scripts" / "python.exe"
    
    if not venv_python.exists():
        # Fallback to system python
        venv_python = "py"
        
    coverage_threshold = 80
    success = True
    
    for cs_file in cs_files:
        abs_file_path = Path(os.getcwd()) / cs_file
        print(f"\n⚡ Generating & validating tests for {cs_file}...")
        
        # Run api_runner.py
        cmd = f'"{venv_python}" "{api_runner_script}" --model gptmini --workflow self_healing --file "{abs_file_path}"'
        code, stdout, stderr = run_cmd(cmd, cwd=str(script_dir))
        
        if code != 0:
            print(f"❌ Verification failed for {cs_file}: Runner crashed.")
            print(stderr)
            success = False
            continue
            
        try:
            # Find the JSON output block in stdout
            start_idx = stdout.find('{')
            end_idx = stdout.rfind('}')
            if start_idx != -1 and end_idx != -1:
                json_str = stdout[start_idx:end_idx+1]
            else:
                json_str = stdout
                
            result = json.loads(json_str)
        except Exception as e:
            print(f"❌ Verification failed: Failed to parse output JSON. Raw output:")
            print(stdout)
            success = False
            continue
            
        is_success = result.get("success", False)
        coverage = result.get("line_coverage", 0)
        
        if not is_success:
            print(f"❌ TEST SUITE FAILED for {cs_file}")
            print("--- Dotnet Build Errors ---")
            print(result.get("stdout", "") + "\n" + result.get("stderr", ""))
            success = False
            continue
            
        if coverage < coverage_threshold:
            print(f"❌ COVERAGE FAILURE for {cs_file}: Line coverage is {coverage}%, but threshold is {coverage_threshold}%")
            success = False
            continue
            
        print(f"✔ Tests compiled successfully with {coverage}% line coverage!")
        
        # Save test file next to the source file
        test_file_path = abs_file_path.with_name(f"{abs_file_path.stem}Tests.cs")
        test_file_path.write_text(result.get("generated_test", ""), encoding="utf-8")
        print(f"💾 Generated test saved to {test_file_path.name}")
        
        # Stage the generated test file
        relative_test_path = Path(cs_file).with_name(f"{Path(cs_file).stem}Tests.cs")
        run_cmd(f'git add "{relative_test_path}"')
        print(f"➕ Staged generated test: {relative_test_path}")

        # Write JSON result log to results/ci_cd
        try:
            import datetime
            import time
            ci_cd_dir = script_dir / "results" / "ci_cd"
            ci_cd_dir.mkdir(parents=True, exist_ok=True)
            log_payload = {
                "timestamp": datetime.datetime.now().isoformat(),
                "file_path": cs_file,
                "success": is_success,
                "line_coverage": coverage,
                "evaluator_score": result.get("evaluator_score", 0),
                "cost": result.get("cost", 0),
                "latency": result.get("latency", 0),
                "model": "gptmini",
                "workflow": "self_healing",
                "mutation_score": result.get("mutation_score", None),
                "total_mutants": result.get("total_mutants", None),
                "killed_mutants": result.get("killed_mutants", None),
                "survived_mutants": result.get("survived_mutants", None)
            }
            log_file = ci_cd_dir / f"run_commit_{int(time.time())}_{cs_file.replace('/', '_').replace(chr(92), '_')}.json"
            with open(log_file, "w", encoding="utf-8") as f:
                json.dump(log_payload, f, indent=2)
            print(f"📊 Saved CI/CD commit log: results/ci_cd/{log_file.name}")
        except Exception as e:
            print(f"⚠️ Failed to write CI/CD result log: {e}")

    print("\n==================================================")
    if success:
        print("✔ ALL TESTS PASSED! Allowing commit.")
        sys.exit(0)
    else:
        print("❌ PRE-COMMIT GATE FAILED! Please resolve errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
