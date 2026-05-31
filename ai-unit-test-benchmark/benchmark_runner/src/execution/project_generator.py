import os
import subprocess
from pathlib import Path
import xml.etree.ElementTree as ET

class ProjectGenerator:
    def __init__(self, repo_root: str):
        self.repo_root = Path(repo_root).resolve()

    def find_csproj_for_file(self, cs_file_path: str) -> Path | None:
        """Find the nearest .csproj file for a given .cs file by walking up directories."""
        current_dir = Path(cs_file_path).resolve().parent
        while current_dir != self.repo_root.parent: # Don't go above repo root
            csprojs = list(current_dir.glob("*.csproj"))
            if csprojs:
                return csprojs[0] # Return the first found
            if current_dir == self.repo_root:
                break
            current_dir = current_dir.parent
        return None

    def get_target_framework(self, csproj_path: Path) -> str:
        """Extract TargetFramework from .csproj, default to net8.0 if not found."""
        try:
            tree = ET.parse(csproj_path)
            root = tree.getroot()
            tfm = root.find(".//TargetFramework")
            if tfm is not None and tfm.text:
                return tfm.text
            # Sometimes it's TargetFrameworks
            tfms = root.find(".//TargetFrameworks")
            if tfms is not None and tfms.text:
                return tfms.text.split(';')[0]
        except Exception as e:
            print(f"Error parsing {csproj_path}: {e}")
        return "net8.0"

    def setup_test_project(self, source_csproj: Path) -> Path:
        """Ensure a test project exists for the given source project. Creates one if missing."""
        source_name = source_csproj.stem
        test_project_name = f"{source_name}.Tests"
        
        # Look for existing test project in repo (could be anywhere, but usually in a tests/ folder or adjacent)
        # We will do a recursive search for test_project_name.csproj
        existing_test_csprojs = list(self.repo_root.rglob(f"{test_project_name}.csproj"))
        
        if existing_test_csprojs:
            print(f"Found existing test project: {existing_test_csprojs[0]}")
            # Ensure Moq and coverlet are installed just in case
            self._ensure_packages(existing_test_csprojs[0])
            return existing_test_csprojs[0]
            
        # Create new test project
        # We'll place it adjacent to the source project's folder
        parent_dir = source_csproj.parent.parent
        if parent_dir == self.repo_root:
             test_dir = self.repo_root / test_project_name
        else:
            # If source is in src/App, test should be in tests/App.Tests or next to src
            # Let's just put it next to the source project folder
            test_dir = source_csproj.parent.parent / test_project_name

        test_dir.mkdir(parents=True, exist_ok=True)
        test_csproj = test_dir / f"{test_project_name}.csproj"
        
        tfm = self.get_target_framework(source_csproj)
        print(f"Creating new xUnit test project for {source_name} targeting {tfm} at {test_dir}")
        
        # Create xUnit project
        subprocess.run(["dotnet", "new", "xunit", "-n", test_project_name, "-f", tfm], cwd=test_dir.parent, check=True, capture_output=True)
        
        # Add reference to source project
        # Calculate relative path from test to source
        rel_source_path = os.path.relpath(source_csproj, test_dir)
        subprocess.run(["dotnet", "add", test_csproj.name, "reference", rel_source_path], cwd=test_dir, check=True, capture_output=True)
        
        # Add required NuGet packages
        self._ensure_packages(test_csproj)
        
        # Add to solution if a .sln exists in repo root
        slns = list(self.repo_root.glob("*.sln"))
        if slns:
            rel_test_csproj = os.path.relpath(test_csproj, self.repo_root)
            subprocess.run(["dotnet", "sln", slns[0].name, "add", rel_test_csproj], cwd=self.repo_root, capture_output=True)
            
        return test_csproj
        
    def _ensure_packages(self, test_csproj: Path):
        """Ensure Moq and coverlet.msbuild are installed in the test project."""
        packages = ["Moq", "coverlet.msbuild"]
        for pkg in packages:
            print(f"Adding package {pkg} to {test_csproj.name}")
            subprocess.run(["dotnet", "add", test_csproj.name, "package", pkg], cwd=test_csproj.parent, capture_output=True)
