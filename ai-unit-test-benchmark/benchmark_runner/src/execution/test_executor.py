import subprocess
import shutil

from pathlib import Path
from src.execution.project_generator import ProjectGenerator

class TestExecutor:

    def __init__(self, mode="benchmark", repo_path=None, file_path=None, method_name=None, sandbox_id=None):
        self.mode = mode
        self.method_name = method_name
        self.sandbox_id = f"_{sandbox_id}" if sandbox_id else ""
        if mode == "github_native":
            # Native GitHub project execution mode
            abs_repo_path = Path(repo_path).resolve()
            # file_path might be relative to repo_root or absolute, handle both
            if Path(file_path).is_absolute():
                abs_file_path = Path(file_path).resolve()
            else:
                abs_file_path = (abs_repo_path / file_path).resolve()

            generator = ProjectGenerator(str(abs_repo_path))
            source_csproj = generator.find_csproj_for_file(str(abs_file_path))
            if not source_csproj:
                print(f"WARNING: Could not find .csproj for {abs_file_path}. Falling back to sandbox mode.")
                # Fallback just in case
                self.test_project_path = str(abs_repo_path)
                self.source_project_path = str(abs_repo_path)
                file_basename = abs_file_path.stem
                self.source_file_path = str(abs_file_path)
                test_filename = f"{file_basename}_{self.method_name}Tests.cs" if self.method_name else f"{file_basename}Tests.cs"
                self.test_file_path = str(abs_repo_path / test_filename)
            else:
                test_csproj = generator.setup_test_project(source_csproj)
                self.test_project_path = str(test_csproj.parent)
                self.source_project_path = str(source_csproj.parent)
                file_basename = abs_file_path.stem
                self.source_file_path = str(abs_file_path)
                test_filename = f"{file_basename}_{self.method_name}Tests.cs" if self.method_name else f"{file_basename}Tests.cs"
                self.test_file_path = str(test_csproj.parent / test_filename)
                
        elif mode == "demo":
            self.test_project_path = "./csharp_projects/DemoTestProject"
            self.source_project_path = "./csharp_projects/DemoSourceProject"
            self.source_file_path = f"{self.source_project_path}/SourceCode.cs"
            self.test_file_path = f"{self.test_project_path}/GeneratedTests.cs"
        else:
            self.test_project_path = f"./csharp_projects/BenchmarkTestProject{self.sandbox_id}"
            self.source_project_path = f"./csharp_projects/BenchmarkSourceProject{self.sandbox_id}"
            self.source_file_path = f"{self.source_project_path}/SourceCode.cs"
            self.test_file_path = f"{self.test_project_path}/GeneratedTests.cs"
            
            # Setup dynamic sandbox by copying template if it doesn't exist
            if sandbox_id and not Path(self.test_project_path).exists():
                shutil.copytree("./csharp_projects/BenchmarkTestProject", self.test_project_path, dirs_exist_ok=True)
                shutil.copytree("./csharp_projects/BenchmarkSourceProject", self.source_project_path, dirs_exist_ok=True)

    def inject_source_code(self, source_code: str):
        if self.mode == "github_native":
            # Do not inject source code in native mode, the file is already there!
            print("SKIPPING SOURCE CODE INJECTION (Native Mode)")
            return
            
        print("WRITING SOURCE CODE")

        import re
        # Check if source code already defines a class, interface, or struct
        if re.search(r'\b(class|interface|struct)\s+\w+', source_code):
            wrapped_code = f'''
            namespace BenchmarkSourceProject;
            {source_code}
            '''
        else:
            wrapped_code = f'''
            namespace BenchmarkSourceProject;
            public class SourceService
            {{
            {source_code}
            }}
            '''
        with open(self.source_file_path,"w",encoding="utf-8") as f:
            f.write(wrapped_code)


    def inject_generated_test(self,generated_test: str):
        with open(self.test_file_path,"w",encoding="utf-8") as f:
            f.write(generated_test)

    def build_source_project(self):
        result = subprocess.run(["dotnet","build"],cwd=self.source_project_path,capture_output=True,text=True,encoding="utf-8",errors="replace")
        print("BUILDING SOURCE PROJECT")

    def run_tests(self):
        # Clear old coverage
        coverage_file = (f"{self.test_project_path}/coverage.cobertura.xml")

        if Path(coverage_file).exists():
            Path(coverage_file).unlink()

        shutil.rmtree(f"{self.test_project_path}/bin",ignore_errors=True)
        shutil.rmtree(f"{self.test_project_path}/obj",ignore_errors=True)
        
        # Determine paths to ignore in Coverlet
        # We only want coverage for the source project, ignore the test project itself
        # Coverlet uses [Assembly]* or similar. By default, MSBuild property excludes tests, but we can be explicit if needed.
        # It's usually fine by default.

        result = subprocess.run(["dotnet","test","/p:CollectCoverage=true","/p:CoverletOutputFormat=cobertura"],cwd=self.test_project_path,capture_output=True,text=True,encoding="utf-8",errors="replace")
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr
        }

    def find_coverage_file(self):
        coverage_file = Path(f"{self.test_project_path}/coverage.cobertura.xml")
        if coverage_file.exists():
            print("COVERAGE FILE FOUND")
            return str(coverage_file)
        print("COVERAGE FILE NOT FOUND")
        return None

    def run_mutation_testing(self) -> dict | None:
        print("RUNNING MUTATION TESTING")
        
        stryker_out_dir = Path(self.test_project_path) / "StrykerOutput"
        
        import shutil
        if stryker_out_dir.exists():
            shutil.rmtree(stryker_out_dir, ignore_errors=True)
            
        import json
        try:
            result = subprocess.run(
                ["dotnet-stryker", "--reporter", "json", "--output", "StrykerOutput"],
                cwd=self.test_project_path,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
            
            report_path = stryker_out_dir / "reports" / "mutation-report.json"
            if not report_path.exists():
                print(f"Stryker report not found at {report_path}. Stderr: {result.stderr}")
                return None
                
            with open(report_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                
            total_mutants = 0
            killed = 0
            survived = 0
            ignored = 0
            timeout = 0
            no_coverage = 0
            
            for file_path, file_data in data.get("files", {}).items():
                for mutant in file_data.get("mutants", []):
                    total_mutants += 1
                    status = mutant.get("status")
                    if status == "Killed":
                        killed += 1
                    elif status == "Survived":
                        survived += 1
                    elif status == "Ignored":
                        ignored += 1
                    elif status == "Timeout":
                        timeout += 1
                    elif status == "NoCoverage":
                        no_coverage += 1
                        
            active_mutants = total_mutants - ignored
            score = 0.0
            if active_mutants > 0:
                score = round(((killed + timeout) / active_mutants) * 100, 2)
                
            print(f"MUTATION TESTING COMPLETED: Score {score}% (Killed: {killed}, Survived: {survived+no_coverage}, Total tested: {active_mutants})")
            return {
                "mutation_score": score,
                "total_mutants": total_mutants,
                "killed_mutants": killed,
                "survived_mutants": survived + no_coverage,
                "ignored_mutants": ignored,
                "timeout_mutants": timeout
            }
        except Exception as e:
            print(f"Error running Mutation Testing: {e}")
            return None