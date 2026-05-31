import { Controller, Get, Post, Body, HttpException, HttpStatus, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';
import * as path from 'path';
import * as fs from 'fs';
import { exec, execSync } from 'child_process';

const workspaceRoot = path.resolve(process.cwd(), '..', '..');

class GenerateDto {
  @ApiProperty({
    description: 'The C# source code to generate unit tests for',
    example: 'public class Calculator { public int Add(int a, int b) => a + b; }'
  })
  sourceCode: string;

  @ApiProperty({
    description: 'The AI model to use for generation (e.g., gptmini, llama, deepseek, deepseekv3)',
    example: 'gptmini'
  })
  model: string;

  @ApiProperty({
    description: 'The workflow name/type to execute (e.g., agent)',
    example: 'agent'
  })
  workflow: string;

  @ApiProperty({ required: false })
  source?: string; // 'playground' or 'github'

  @ApiProperty({ required: false })
  filePath?: string;

  @ApiProperty({ required: false, description: 'Whether to run Mutation Testing or not' })
  runMutation?: boolean;

  @ApiProperty({ required: false, description: 'The directory name of the cloned repo in github_repos' })
  repoDir?: string;

  @ApiProperty({ required: false })
  methodName?: string;
}

@ApiTags('AI Unit Test Generation')
@Controller('api')
export class AppController {
  
  @Get('models')
  @ApiOperation({ summary: 'Get list of supported AI models' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of supported model objects',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'gptmini' },
          name: { type: 'string', example: 'GPT-4o Mini (Azure)' }
        }
      }
    }
  })
  getModels() {
    return [
      { id: 'gptmini', name: 'GPT-4o Mini (Azure)' },
      { id: 'llama', name: 'Llama 3.3 70B (Azure)' },
      { id: 'deepseekv3', name: 'DeepSeek-V3 (Azure)' }
    ];
  }




  @Post('generate')
  @ApiOperation({ summary: 'Generate unit tests for C# source code' })
  @ApiResponse({ status: 200, description: 'Tests generated and verified successfully' })
  @ApiResponse({ status: 400, description: 'Missing required parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error during script execution' })
  async generate(@Body() body: GenerateDto) {
    const { sourceCode, model, workflow, runMutation } = body;
    
    if (!sourceCode || !model || !workflow) {
      throw new HttpException('Missing required parameters', HttpStatus.BAD_REQUEST);
    }

    // Set up paths
    const benchmarkRunnerDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner');
    const pythonExe = path.join(workspaceRoot, 'ai-unit-test-benchmark', '.venv', 'Scripts', 'python.exe');
    const apiRunnerScript = path.join(benchmarkRunnerDir, 'api_runner.py');
    
    // Create unique temp C# file inside benchmark_runner
    const tempFileName = `temp_source_${Date.now()}.cs`;
    const tempFilePath = path.join(benchmarkRunnerDir, tempFileName);
    
    try {
      fs.writeFileSync(tempFilePath, sourceCode, 'utf8');
    } catch (err) {
      throw new HttpException(`Failed to write source file: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return new Promise((resolve, reject) => {
      // Build execution command
      let command = `"${pythonExe}" "${apiRunnerScript}" --model ${model} --workflow ${workflow} --file "${tempFilePath}"`;
      if (runMutation === false || (runMutation as any) === 'false' || String(runMutation) === 'false') {
        command += ' --no-mutation';
      }
      
      if (body.source === 'github' && body.repoDir && body.filePath) {
        const repoAbsPath = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'csharp_projects', 'github_repos', body.repoDir);
        command += ` --github-repo-path "${repoAbsPath}" --github-file-path "${body.filePath}"`;
      }
      
      if (body.methodName) {
        command += ` --method-name "${body.methodName}"`;
      }
      
      console.log(`[Backend] Executing AI sandbox runner: ${command}`);
      
      exec(command, { cwd: benchmarkRunnerDir }, (error, stdout, stderr) => {
        // Clean up temporary file immediately
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (e) {
          console.error('Failed to delete temp file:', e);
        }

        if (error) {
          console.error('Exec error:', error);
          console.error('Stderr:', stderr);
          reject(new HttpException(`Execution failed: ${stderr || error.message}`, HttpStatus.INTERNAL_SERVER_ERROR));
          return;
        }

        try {
          const parsedResult = JSON.parse(extractJson(stdout));
          
          // Save User Submission based on source
          try {
            const folderName = body.source === 'github' ? 'github_demo' : 'web_demo';
            const webDemoDir = path.join(benchmarkRunnerDir, 'results', folderName);
            if (!fs.existsSync(webDemoDir)) {
              fs.mkdirSync(webDemoDir, { recursive: true });
            }
            const timestamp = new Date().toISOString();
            const prefix = body.source === 'github' ? 'github_' : '';
            const submissionFileName = `submission_${prefix}${Date.now()}_${Math.floor(Math.random() * 100000)}.json`;
            const submissionFilePath = path.join(webDemoDir, submissionFileName);
            
            const payload = {
              timestamp,
              sourceCode,
              model,
              workflow,
              filePath: body.filePath || '',
              result: parsedResult
            };
            fs.writeFileSync(submissionFilePath, JSON.stringify(payload, null, 2), 'utf8');
          } catch (saveErr) {
            console.error('Failed to save web demo submission:', saveErr);
          }

          resolve(parsedResult);
        } catch (parseError) {
          console.error('JSON Parse error on output:', stdout);
          reject(new HttpException(`Failed to parse AI Engine output: ${stdout}`, HttpStatus.INTERNAL_SERVER_ERROR));
        }
      });
    });
  }

  @Get('dashboard/benchmarks')
  @ApiOperation({ summary: 'Get all benchmark runs dynamically' })
  getBenchmarkRuns() {
    const benchmarkRunnerDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner');
    const reportsDir = path.join(benchmarkRunnerDir, 'results', 'reports');
    const datasetsDir = path.join(benchmarkRunnerDir, 'benchmark_datasets');

    if (!fs.existsSync(reportsDir)) {
      return [];
    }

    const benchmarkMap = getBenchmarksMetadata(datasetsDir);
    const files = getJsonFilesRecursively(reportsDir);
    const runs: any[] = [];

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const data = JSON.parse(content);

        const relative = path.relative(reportsDir, file);
        const parts = relative.split(path.sep);
        const version = parts[0] || 'unknown';
        const workflow = parts[1] || 'unknown';

        const mapKey = `${version}_${data.benchmark_id}`;
        const sourceData = benchmarkMap[mapKey] || { source_code: '', expected_test: '', category: 'unknown' };

        runs.push({
          version,
          workflow,
          benchmark_id: data.benchmark_id,
          category: sourceData.category || data.category || 'unknown',
          model: data.model,
          success: data.success,
          line_coverage: data.line_coverage || 0,
          branch_coverage: data.branch_coverage || 0,
          generation_time: data.generation_time || 0,
          cost: data.cost || 0,
          evaluator_score: data.evaluator_score || (data.evaluator_feedback ? data.evaluator_feedback.score : 0) || 0,
          healing_attempts: data.healing_attempts || 0,
          generated_test: data.generated_test || '',
          stdout: data.stdout || '',
          stderr: data.stderr || '',
          evaluator_feedback: data.evaluator_feedback || null,
          healing_log: data.healing_log || [],
          evaluator_loop_log: data.evaluator_loop_log || [],
          initial_test: data.initial_test || '',
          best_of_n_candidates: data.best_of_n_candidates || [],
          source_code: sourceData.source_code,
          expected_test: sourceData.expected_test,
          mutation_score: data.mutation_score !== undefined ? data.mutation_score : null,
          total_mutants: data.total_mutants !== undefined ? data.total_mutants : null,
          killed_mutants: data.killed_mutants !== undefined ? data.killed_mutants : null,
          survived_mutants: data.survived_mutants !== undefined ? data.survived_mutants : null,
          ignored_mutants: data.ignored_mutants !== undefined ? data.ignored_mutants : null,
          timeout_mutants: data.timeout_mutants !== undefined ? data.timeout_mutants : null
        });
      } catch (e) {
        console.error(`Failed to parse file: ${file}`, e);
      }
    }
    return runs;
  }

  @Get('dashboard/static-summary')
  @ApiOperation({ summary: 'Get pre-calculated python summary reports' })
  getStaticSummary(
    @Query('version') version: string,
    @Query('workflow') workflow: string
  ) {
    const benchmarkRunnerDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner');
    const summaryDir = path.join(benchmarkRunnerDir, 'results', 'summary', version || 'v1', workflow || 'agent');

    const benchmarkSummaryPath = path.join(summaryDir, 'summary', 'benchmark_summary.json');
    const categorySummaryPath = path.join(summaryDir, 'category', 'category_summary.json');
    const costSummaryPath = path.join(summaryDir, 'cost', 'cost_efficiency.json');
    const failureSummaryPath = path.join(summaryDir, 'failure', 'failure_analysis.json');
    const healingSummaryPath = path.join(summaryDir, 'healing', 'self_healing_analysis.json');
    const latencySummaryPath = path.join(summaryDir, 'latency', 'latency_analysis.json');
    const evaluatorSummaryPath = path.join(summaryDir, 'evaluator', 'evaluator_guided_analysis.json');
    const selectorSummaryPath = path.join(summaryDir, 'selector', 'best_of_n_analysis.json');
    const mutationSummaryPath = path.join(summaryDir, 'mutation', 'mutation_analysis.json');

    const readJsonIfExists = (filePath: string) => {
      if (fs.existsSync(filePath)) {
        try {
          return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) {
          console.error(`Failed to parse JSON file at ${filePath}:`, e);
        }
      }
      return null;
    };

    const categorySplitList: any[] = [];
    if (fs.existsSync(summaryDir)) {
      try {
        const items = fs.readdirSync(summaryDir);
        const excludedDirs = ['category', 'cost', 'failure', 'healing', 'latency', 'summary', 'evaluator', 'selector', 'mutation'];
        for (const item of items) {
          const itemPath = path.join(summaryDir, item);
          if (fs.statSync(itemPath).isDirectory() && !excludedDirs.includes(item)) {
            const synthPath = path.join(itemPath, 'category_split', 'synthetic_summary.json');
            const rwPath = path.join(itemPath, 'category_split', 'real_world_summary.json');
            const overallPath = path.join(itemPath, 'category_split', 'overall_summary.json');

            const synth = readJsonIfExists(synthPath);
            const rw = readJsonIfExists(rwPath);
            const overall = readJsonIfExists(overallPath);

            if (synth || rw || overall) {
              categorySplitList.push({
                model: item,
                synthetic: synth,
                real_world: rw,
                overall: overall
              });
            }
          }
        }
      } catch (err) {
        console.error('Error scanning category split dirs:', err);
      }
    }

    return {
      benchmarkSummary: readJsonIfExists(benchmarkSummaryPath),
      categorySummary: readJsonIfExists(categorySummaryPath),
      costSummary: readJsonIfExists(costSummaryPath),
      failureSummary: readJsonIfExists(failureSummaryPath),
      healingSummary: readJsonIfExists(healingSummaryPath),
      latencySummary: readJsonIfExists(latencySummaryPath),
      evaluatorSummary: readJsonIfExists(evaluatorSummaryPath),
      selectorSummary: readJsonIfExists(selectorSummaryPath),
      mutationSummary: readJsonIfExists(mutationSummaryPath),
      categorySplit: categorySplitList
    };
  }

  @Get('dashboard/web-demo')
  @ApiOperation({ summary: 'Get all web demo submissions' })
  getWebDemoSubmissions() {
    const benchmarkRunnerDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner');
    const webDemoDir = path.join(benchmarkRunnerDir, 'results', 'web_demo');

    if (!fs.existsSync(webDemoDir)) {
      return [];
    }

    const files = fs.readdirSync(webDemoDir).filter(file => file.endsWith('.json'));
    const submissions: any[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(webDemoDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        submissions.push(data);
      } catch (e) {
        console.error(`Failed to parse web demo file: ${file}`, e);
      }
    }

    submissions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return submissions;
  }

  @Get('dashboard/github-demo')
  @ApiOperation({ summary: 'Get all GitHub ingestion submissions' })
  getGithubSubmissions() {
    const benchmarkRunnerDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner');
    const githubDemoDir = path.join(benchmarkRunnerDir, 'results', 'github_demo');

    if (!fs.existsSync(githubDemoDir)) {
      return [];
    }

    const files = fs.readdirSync(githubDemoDir).filter(file => file.endsWith('.json'));
    const submissions: any[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(githubDemoDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        submissions.push(data);
      } catch (e) {
        console.error(`Failed to parse github demo file: ${file}`, e);
      }
    }

    submissions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return submissions;
  }

  @Get('dashboard/ci-cd')
  @ApiOperation({ summary: 'Get all CI/CD Git hook run logs' })
  getCicdLogs() {
    const benchmarkRunnerDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner');
    const cicdDir = path.join(benchmarkRunnerDir, 'results', 'ci_cd');

    if (!fs.existsSync(cicdDir)) {
      return [];
    }

    const files = fs.readdirSync(cicdDir).filter(file => file.endsWith('.json'));
    const logs: any[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(cicdDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        logs.push(data);
      } catch (e) {
        console.error(`Failed to parse CI/CD log file: ${file}`, e);
      }
    }

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return logs;
  }

  @Post('github/clone')
  @ApiOperation({ summary: 'Clone GitHub repository and parse C# methods' })
  async cloneGithubRepo(@Body() body: { repoUrl: string }) {
    const { repoUrl } = body;
    if (!repoUrl) {
      throw new HttpException('Missing repoUrl parameter', HttpStatus.BAD_REQUEST);
    }

    const tempRoot = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'csharp_projects', 'github_repos');
    const tempDirName = `temp_repo_${Date.now()}`;
    const tempDirPath = path.join(tempRoot, tempDirName);
    
    try {
      fs.mkdirSync(tempRoot, { recursive: true });
      
      // Cleanup old temp_repo_ folders to save disk space
      const existingDirs = fs.readdirSync(tempRoot);
      for (const dir of existingDirs) {
        if (dir.startsWith('temp_repo_')) {
          const dirPath = path.join(tempRoot, dir);
          try {
            fs.rmSync(dirPath, { recursive: true, force: true });
            console.log(`[GitHub Ingest] Cleaned up old repo folder: ${dir}`);
          } catch (e) {
            console.error(`[GitHub Ingest] Failed to clean up ${dirPath}`, e);
          }
        }
      }
    } catch (err) {
      throw new HttpException(`Failed to create temp root: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return new Promise((resolve, reject) => {
      // Perform a standard full clone so we get .sln, .csproj, and test projects for native Coverlet execution
      const cloneCommand = `git clone --depth 1 --quiet "${repoUrl}" "${tempDirPath}"`;
      exec(cloneCommand, (cloneError, _, cloneStderr) => {
        if (cloneError) {
          console.error('Clone error:', cloneError);
          const cleanedError = cleanGitError(cloneStderr || cloneError.message);
          reject(new HttpException(`Failed to clone repository: ${cleanedError}`, HttpStatus.INTERNAL_SERVER_ERROR));
          return;
        }

        const parserDll = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'csharp_projects', 'RoslynParserCli', 'bin', 'Debug', 'net8.0', 'RoslynParserCli.dll');
        const csFiles = scanCsFiles(tempDirPath).filter(f => !path.relative(tempDirPath, f).toLowerCase().includes('test'));
        const parsedFiles: any[] = [];

        const parsePromises = csFiles.map(async (file) => {
          const content = fs.readFileSync(file, 'utf8');
          const nsMatch = content.match(/namespace\s+([\w\.]+)/);
          const namespaceName = nsMatch ? nsMatch[1] : 'BenchmarkSourceProject';
          
          const methods = await parseCsFile(parserDll, file);
          if (methods && methods.length > 0) {
            const relativePath = path.relative(tempDirPath, file);
            parsedFiles.push({
              filePath: relativePath,
              className: methods[0].ClassName,
              namespaceName: namespaceName,
              methods: methods.map(m => ({
                methodName: m.MethodName,
                signature: `${m.Modifiers.join(' ')} ${m.ReturnType} ${m.MethodName}(${m.Parameters.map((p: any) => `${p.Type} ${p.Name}`).join(', ')})`,
                body: m.Body
              }))
            });
          }
        });

        Promise.all(parsePromises).then(() => {
          resolve({
            tempDir: tempDirName,
            files: parsedFiles
          });
        });
      });
    });
  }

  @Post('github/create-pr')
  @ApiOperation({ summary: 'Create Pull Request with generated test code' })
  async createGithubPr(@Body() body: { repoUrl: string, tempDir: string, filePath: string, testCode: string, githubPat?: string, metrics?: any, methodName?: string }) {
    const { repoUrl, tempDir, filePath, testCode, metrics, methodName } = body;
    if (!repoUrl || !tempDir || !filePath || !testCode) {
      throw new HttpException('Missing required parameters', HttpStatus.BAD_REQUEST);
    }

    // Prefer PAT from request body (UI input), fall back to .env
    const githubToken = body.githubPat || getGithubToken();
    if (!githubToken) {
      throw new HttpException('GitHub Personal Access Token not provided. Enter it in the GitHub Ingestion UI or add GITHUB_PAT to benchmark_runner/.env', HttpStatus.BAD_REQUEST);
    }

    // Update workspaceRoot targeting csharp_projects/github_repos
    const tempDirPath = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'csharp_projects', 'github_repos', tempDir);

    if (!fs.existsSync(tempDirPath)) {
      throw new HttpException('Ingested repository session expired or directory not found', HttpStatus.NOT_FOUND);
    }

    const sourceDir = path.dirname(filePath);
    const sourceBase = path.basename(filePath, '.cs');
    const testFileName = methodName ? `${sourceBase}_${methodName}Tests.cs` : `${sourceBase}Tests.cs`;
    
    // Find the actual generated test file path in the tempDirPath
    const findTestFile = (dir: string, filename: string): string | null => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const fullPath = path.join(dir, file);
        if (file === 'bin' || file === 'obj' || file === 'StrykerOutput') continue;
        if (fs.statSync(fullPath).isDirectory()) {
          const res = findTestFile(fullPath, filename);
          if (res) return res;
        } else if (file === filename) {
          return fullPath;
        }
      }
      return null;
    };
    
    let testFileAbsolutePath = findTestFile(tempDirPath, testFileName);
    if (!testFileAbsolutePath) {
      // Fallback: place it next to the source file if not found
      const testFileRelativePath = path.join(sourceDir, testFileName);
      testFileAbsolutePath = path.join(tempDirPath, testFileRelativePath);
    }

    try {
      fs.mkdirSync(path.dirname(testFileAbsolutePath), { recursive: true });
      fs.writeFileSync(testFileAbsolutePath, testCode, 'utf8');
    } catch (err) {
      throw new HttpException(`Failed to write test file: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (!repoMatch) {
      throw new HttpException('Invalid GitHub repository URL format', HttpStatus.BAD_REQUEST);
    }
    const owner = repoMatch[1];
    const repo = repoMatch[2];

    const branchName = `ai-unit-tests-${Date.now()}`;

    return new Promise((resolve, reject) => {
      const authUrl = `https://${githubToken}@github.com/${owner}/${repo}.git`;
      
      // Add a robust .gitignore to prevent committing build artifacts
      const gitignorePath = path.join(tempDirPath, '.gitignore');
      const gitignoreContent = "\n[Bb]in/\n[Oo]bj/\nStrykerOutput/\ncoverage.cobertura.xml\n";
      fs.appendFileSync(gitignorePath, gitignoreContent);

      try {
        execSync(`git remote set-url origin "${authUrl}"`, { cwd: tempDirPath, stdio: 'pipe' });
        execSync(`git checkout -b "${branchName}"`, { cwd: tempDirPath, stdio: 'pipe' });
        execSync(`git add .`, { cwd: tempDirPath, stdio: 'pipe' });
        
        // Check if there are actual changes
        const status = execSync(`git status --porcelain`, { cwd: tempDirPath }).toString().trim();
        if (!status) {
          return reject(new HttpException('No new changes to commit. The generated tests are identical to the repository.', HttpStatus.BAD_REQUEST));
        }

        execSync(`git -c user.name="AI Unit Test Agent" -c user.email="agent@ai-unit-test.local" commit -m "Add AI-generated unit tests for ${sourceBase}"`, { cwd: tempDirPath, stdio: 'pipe' });
        execSync(`git push origin "${branchName}"`, { cwd: tempDirPath, stdio: 'pipe' });

        openPullRequest(githubToken, owner, repo, branchName, sourceBase, metrics)
          .then((prData) => resolve(prData))
          .catch((err) => reject(new HttpException(`Failed to create Pull Request: ${err.message}`, HttpStatus.INTERNAL_SERVER_ERROR)));
      } catch (err: any) {
        console.error(`Git command failed`, err.stderr?.toString() || err.message);
        reject(new HttpException(`Git operation failed: ${cleanGitError(err.stderr?.toString() || err.message)}`, HttpStatus.INTERNAL_SERVER_ERROR));
      }
    });
  }

  @Post('cicd/webhook')
  @ApiOperation({ summary: 'Webhook for GitHub Actions CI/CD to trigger automated AI test generation' })
  async cicdWebhook(@Body() body: { repoUrl: string, prNumber: string, branch: string, workflow?: string }) {
    const { repoUrl, prNumber, branch, workflow = 'ultimate_hybrid' } = body;
    
    if (!repoUrl) {
      throw new HttpException('Missing repoUrl', HttpStatus.BAD_REQUEST);
    }
    
    // Fire and forget: We run this asynchronously so the webhook returns 200 OK immediately
    this.runAutomatedCicdPipeline(repoUrl, prNumber, branch, workflow).catch(err => {
      console.error('[CI/CD Pipeline Error]', err);
    });
    
    return { status: 'Pipeline triggered', repoUrl, workflow };
  }

  private async runAutomatedCicdPipeline(repoUrl: string, prNumber: string, branch: string, workflow: string) {
    console.log(`[CI/CD] Starting automated pipeline for ${repoUrl} (PR #${prNumber})`);
    
    // 1. Clone Repo
    const tempRoot = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'csharp_projects', 'github_repos');
    const tempDirName = `cicd_repo_${Date.now()}`;
    const tempDirPath = path.join(tempRoot, tempDirName);
    
    fs.mkdirSync(tempRoot, { recursive: true });
    
    await new Promise((resolve, reject) => {
      exec(`git clone --depth 1 --quiet -b "${branch}" "${repoUrl}" "${tempDirPath}"`, (error) => {
        if (error) {
          // If branch doesn't exist, try default clone
          exec(`git clone --depth 1 --quiet "${repoUrl}" "${tempDirPath}"`, (error2) => {
             if (error2) return reject(error2);
             resolve(true);
          });
          return;
        }
        resolve(true);
      });
    });

    // 2. Scan for C# files (simplified logic: pick the first one that looks like business logic)
    const csFiles = scanCsFiles(tempDirPath).filter(f => !path.relative(tempDirPath, f).toLowerCase().includes('test'));
    if (csFiles.length === 0) {
      console.log(`[CI/CD] No C# files found to test in ${repoUrl}`);
      return;
    }

    const targetFile = csFiles[0]; 
    const relativePath = path.relative(tempDirPath, targetFile);
    const sourceCode = fs.readFileSync(targetFile, 'utf8');

    // 3. Run AI Generation natively
    const pythonExe = path.join(workspaceRoot, 'ai-unit-test-benchmark', '.venv', 'Scripts', 'python.exe');
    const apiRunnerScript = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'api_runner.py');
    const model = 'llama'; 

    const tempFileName = `temp_cicd_${Date.now()}.cs`;
    const tempFilePath = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', tempFileName);
    fs.writeFileSync(tempFilePath, sourceCode, 'utf8');

    const command = `"${pythonExe}" "${apiRunnerScript}" --model ${model} --workflow ${workflow} --file "${tempFilePath}" --github-repo-path "${tempDirPath}" --github-file-path "${relativePath}"`;
    
    console.log(`[CI/CD] Running test generation: ${command}`);
    
    await new Promise((resolve, reject) => {
      exec(command, { cwd: path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner') }, (error, stdout, stderr) => {
        try { fs.unlinkSync(tempFilePath); } catch (e) {}
        
        if (error) {
          console.error(`[CI/CD] Generation failed:`, stderr);
          return reject(error);
        }
        
        try {
          const parsedResult = JSON.parse(extractJson(stdout));
          
          // Save CI/CD log
          const cicdDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'results', 'ci_cd');
          if (!fs.existsSync(cicdDir)) fs.mkdirSync(cicdDir, { recursive: true });
          
          const logFile = path.join(cicdDir, `cicd_run_${Date.now()}.json`);
          fs.writeFileSync(logFile, JSON.stringify({
            timestamp: new Date().toISOString(),
            repoUrl,
            prNumber,
            branch,
            targetFile: relativePath,
            result: parsedResult
          }, null, 2));
          
          console.log(`[CI/CD] Successfully generated tests for ${relativePath}. Result saved.`);
          
          // Cleanup cloned repo
          try {
            fs.rmSync(tempDirPath, { recursive: true, force: true });
            console.log(`[CI/CD] Cleaned up temporary repository: ${tempDirPath}`);
          } catch (cleanupErr) {
            console.error(`[CI/CD] Failed to clean up repository: ${tempDirPath}`, cleanupErr);
          }
          
          resolve(parsedResult);
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}

// Recursively scan a folder for .json files
function getJsonFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getJsonFilesRecursively(filePath));
    } else if (file.endsWith('.json')) {
      results.push(filePath);
    }
  });
  return results;
}

// Load C# source code and expected test code from benchmark datasets
function getBenchmarksMetadata(datasetsDir: string): Record<string, { source_code: string; expected_test: string; category: string }> {
  const map: Record<string, { source_code: string; expected_test: string; category: string }> = {};
  if (!fs.existsSync(datasetsDir)) return map;

  const getMetadataFiles = (dir: string): string[] => {
    let results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(getMetadataFiles(filePath));
      } else if (file === 'metadata.json') {
        results.push(filePath);
      }
    });
    return results;
  };

  const files = getMetadataFiles(datasetsDir);
  for (const file of files) {
    try {
      const folder = path.dirname(file);
      const metaContent = fs.readFileSync(file, 'utf8');
      const meta = JSON.parse(metaContent);
      const id = meta.id;

      // Extract version name from folder structure relative to dataset root
      const relative = path.relative(datasetsDir, file);
      const parts = relative.split(path.sep);
      const version = parts[0] || 'v1';

      const sourcePath = path.join(folder, 'source.cs');
      const expectedPath = path.join(folder, 'expected_test.cs');

      const source_code = fs.existsSync(sourcePath) ? fs.readFileSync(sourcePath, 'utf8') : '';
      const expected_test = fs.existsSync(expectedPath) ? fs.readFileSync(expectedPath, 'utf8') : '';

      if (id) {
        map[`${version}_${id}`] = { source_code, expected_test, category: meta.category || 'unknown' };
      }
    } catch (e) {
      console.error('Error reading dataset metadata', e);
    }
  }
  return map;
}

// Read GitHub Token from .env file of benchmark_runner
function getGithubToken(): string {
  const envPath = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GITHUB_PAT=(.*)/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return process.env.GITHUB_PAT || '';
}

// Scan directory recursively for .cs files
function scanCsFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      const base = path.basename(filePath).toLowerCase();
      if (base !== 'bin' && base !== 'obj' && base !== '.git' && base !== 'node_modules' && base !== 'packages' && base !== '.vs') {
        results = results.concat(scanCsFiles(filePath));
      }
    } else if (file.endsWith('.cs')) {
      results.push(filePath);
    }
  });
  return results;
}

// Parse CS file via RoslynParserCli.dll assembly execution
async function parseCsFile(parserDllPath: string, filePath: string): Promise<any[]> {
  return new Promise((resolve) => {
    const command = `dotnet "${parserDllPath}" "${filePath}"`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Failed to parse file ${filePath}:`, stderr || error.message);
        resolve([]);
        return;
      }
      try {
        const methods = JSON.parse(extractJson(stdout));
        resolve(methods);
      } catch (e) {
        console.error(`Failed to parse JSON for file ${filePath}:`, stdout);
        resolve([]);
      }
    });
  });
}

// Helper function to extract JSON object or array from a string containing other text
function extractJson(str: string): string {
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  
  let startIdx = -1;
  let endIdx = -1;
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    endIdx = str.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    endIdx = str.lastIndexOf(']');
  }
  
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error('No JSON structure found in string');
  }
  
  return str.substring(startIdx, endIdx + 1);
}

// Helper to strip git progress noise (\r-based lines) from stderr and return only real error lines
function cleanGitError(raw: string): string {
  // Split on newlines, remove carriage-return progress lines (e.g. "Updating files: 15%...")
  const lines = raw
    .split('\n')
    .map(line => line.replace(/.*\r/, ''))   // strip everything before the last \r on each line
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Return last 5 lines which usually contain the actual error
  const meaningful = lines.slice(-5);
  return meaningful.join('\n') || raw.trim();
}

// Open Pull Request via GitHub REST API (fallback to master base branch if main base branch fails)
async function openPullRequest(token: string, owner: string, repo: string, branch: string, component: string, metrics?: any): Promise<any> {
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;
  
  let bodyContent = `This Pull Request adds C# unit tests generated using the Multi-Agent C# Test Framework.\n\n### Included Components:\n- Target Class: \`${component}\`\n- Test Case Coverage: Automated assertions, mocks, and sandbox-verified compliance.\n`;
  if (metrics) {
    bodyContent += `\n### 📊 AI Generation Metrics:\n`;
    bodyContent += `- **Status**: ${metrics.success ? '✅ Passed Run' : '❌ Failed Run'}\n`;
    bodyContent += `- **Line Coverage**: ${metrics.line_coverage !== undefined ? metrics.line_coverage.toFixed(2) : 0}%\n`;
    bodyContent += `- **Branch Coverage**: ${metrics.branch_coverage !== undefined ? metrics.branch_coverage.toFixed(2) : 0}%\n`;
    bodyContent += `- **Latency**: ${metrics.latency || 0}s\n`;
    bodyContent += `- **Total Cost**: $${metrics.cost ? metrics.cost.toFixed(5) : 0}\n`;
    bodyContent += `- **Self-Healing Retries**: ${metrics.healing_attempts || 0}\n`;
    if (metrics.evaluator_model) {
      bodyContent += `- **Evaluator**: ${metrics.evaluator_model}\n`;
      bodyContent += `- **Final Quality Score**: ${metrics.evaluator_score || 'N/A'}/100\n`;
    }
  }

  const body = JSON.stringify({
    title: `🤖 Add AI-generated unit tests for ${component}`,
    head: branch,
    base: 'main',
    body: bodyContent
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'NestJS-AI-Test-Agent'
    },
    body
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (errorText.includes('base') || errorText.includes('master')) {
      const fallbackBody = JSON.stringify({
        title: `🤖 Add AI-generated unit tests for ${component}`,
        head: branch,
        base: 'master',
        body: `This Pull Request adds C# unit tests generated using the Multi-Agent C# Test Framework.`
      });
      const fallbackResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'NestJS-AI-Test-Agent'
        },
        body: fallbackBody
      });
      if (fallbackResponse.ok) {
        return fallbackResponse.json();
      }
    }
    throw new Error(`GitHub API returned ${response.status}: ${errorText}`);
  }

  return response.json();
}
