# PowerShell Script to install C# Test Guardian pre-commit Git Hook
# Run this script from the benchmark_runner directory.

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WorkspaceRoot = (Get-Item $ScriptDir).Parent.Parent.FullName
$GitHooksDir = Join-Path $WorkspaceRoot ".git\hooks"
$PreCommitFile = Join-Path $GitHooksDir "pre-commit"

Write-Host "==================================================" -ForegroundColor Green
Write-Host "INSTALLING C# TEST GUARDIAN PRE-COMMIT GIT HOOK" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# 1. Ensure .git directory exists
if (-not (Test-Path (Join-Path $WorkspaceRoot ".git"))) {
    Write-Error "Error: .git directory not found at '$WorkspaceRoot'. Are you inside a Git repository?"
    Exit 1
}

# 2. Create hooks directory if not exists
if (-not (Test-Path $GitHooksDir)) {
    New-Item -ItemType Directory -Path $GitHooksDir | Out-Null
    Write-Host "✔ Created Git hooks directory." -ForegroundColor Cyan
}

# 3. Create hook script content
$HookContent = @"
#!/bin/sh
# AI Unit Test pre-commit Git hook
# Triggered automatically on git commit

echo "=================================================="
echo "🤖 Triggering C# Test Guardian pre-commit gate..."
echo "=================================================="

# Run test guardian Python script
if command -v py >/dev/null 2>&1; then
  py ai-unit-test-benchmark/benchmark_runner/csharp_test_guardian.py
else
  python ai-unit-test-benchmark/benchmark_runner/csharp_test_guardian.py
fi

exit `$?
"@

# 4. Write to pre-commit hook file
[System.IO.File]::WriteAllText($PreCommitFile, $HookContent)

# 5. Output Success
Write-Host "✔ Hook script successfully installed at:" -ForegroundColor Green
Write-Host "  $PreCommitFile" -ForegroundColor Cyan
Write-Host "`nTo test the hook, modify a C# source file, stage it (git add), and run 'git commit'." -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Green
