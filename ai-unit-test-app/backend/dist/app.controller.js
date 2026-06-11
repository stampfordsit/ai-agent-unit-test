"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const workspaceRoot = path.resolve(process.cwd(), '..', '..');
class GenerateDto {
    sourceCode;
    model;
    workflow;
    source;
    filePath;
    runMutation;
    repoDir;
    methodName;
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The C# source code to generate unit tests for',
        example: 'public class Calculator { public int Add(int a, int b) => a + b; }'
    }),
    __metadata("design:type", String)
], GenerateDto.prototype, "sourceCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The AI model to use for generation (e.g., gptmini, llama, deepseek, deepseekv3)',
        example: 'gptmini'
    }),
    __metadata("design:type", String)
], GenerateDto.prototype, "model", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The workflow name/type to execute (e.g., agent)',
        example: 'agent'
    }),
    __metadata("design:type", String)
], GenerateDto.prototype, "workflow", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], GenerateDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], GenerateDto.prototype, "filePath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'Whether to run Mutation Testing or not' }),
    __metadata("design:type", Boolean)
], GenerateDto.prototype, "runMutation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, description: 'The directory name of the cloned repo in github_repos' }),
    __metadata("design:type", String)
], GenerateDto.prototype, "repoDir", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], GenerateDto.prototype, "methodName", void 0);
let AppController = class AppController {
    getModels() {
        return [
            { id: 'gptmini', name: 'GPT-4o Mini (Azure)' },
            { id: 'llama', name: 'Llama 3.3 70B (Azure)' },
            { id: 'deepseekv3', name: 'DeepSeek-V3 (Azure)' }
        ];
    }
    async generate(body) {
        const { sourceCode, model, workflow, runMutation } = body;
        if (!sourceCode || !model || !workflow) {
            throw new common_1.HttpException('Missing required parameters', common_1.HttpStatus.BAD_REQUEST);
        }
        const benchmarkRunnerDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner');
        const pythonExe = path.join(workspaceRoot, 'ai-unit-test-benchmark', '.venv', 'Scripts', 'python.exe');
        const apiRunnerScript = path.join(benchmarkRunnerDir, 'api_runner.py');
        const tempFileName = `temp_source_${Date.now()}.cs`;
        const tempFilePath = path.join(benchmarkRunnerDir, tempFileName);
        try {
            fs.writeFileSync(tempFilePath, sourceCode, 'utf8');
        }
        catch (err) {
            throw new common_1.HttpException(`Failed to write source file: ${err.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return new Promise((resolve, reject) => {
            let command = `"${pythonExe}" "${apiRunnerScript}" --model ${model} --workflow ${workflow} --file "${tempFilePath}"`;
            if (runMutation === false || runMutation === 'false' || String(runMutation) === 'false') {
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
            (0, child_process_1.exec)(command, { cwd: benchmarkRunnerDir }, (error, stdout, stderr) => {
                try {
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                    }
                }
                catch (e) {
                    console.error('Failed to delete temp file:', e);
                }
                if (error) {
                    console.error('Exec error:', error);
                    console.error('Stderr:', stderr);
                    reject(new common_1.HttpException(`Execution failed: ${stderr || error.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR));
                    return;
                }
                try {
                    const parsedResult = JSON.parse(extractJson(stdout));
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
                    }
                    catch (saveErr) {
                        console.error('Failed to save web demo submission:', saveErr);
                    }
                    resolve(parsedResult);
                }
                catch (parseError) {
                    console.error('JSON Parse error on output:', stdout);
                    reject(new common_1.HttpException(`Failed to parse AI Engine output: ${stdout}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR));
                }
            });
        });
    }
    getBenchmarkRuns() {
        const benchmarkRunnerDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner');
        const reportsDir = path.join(benchmarkRunnerDir, 'results', 'reports');
        const datasetsDir = path.join(benchmarkRunnerDir, 'benchmark_datasets');
        if (!fs.existsSync(reportsDir)) {
            return [];
        }
        const benchmarkMap = getBenchmarksMetadata(datasetsDir);
        const files = getJsonFilesRecursively(reportsDir);
        const runs = [];
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
            }
            catch (e) {
                console.error(`Failed to parse file: ${file}`, e);
            }
        }
        return runs;
    }
    getStaticSummary(version, workflow) {
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
        const readJsonIfExists = (filePath) => {
            if (fs.existsSync(filePath)) {
                try {
                    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
                }
                catch (e) {
                    console.error(`Failed to parse JSON file at ${filePath}:`, e);
                }
            }
            return null;
        };
        const categorySplitList = [];
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
            }
            catch (err) {
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
    getWebDemoSubmissions() {
        const benchmarkRunnerDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner');
        const webDemoDir = path.join(benchmarkRunnerDir, 'results', 'web_demo');
        if (!fs.existsSync(webDemoDir)) {
            return [];
        }
        const files = fs.readdirSync(webDemoDir).filter(file => file.endsWith('.json'));
        const submissions = [];
        for (const file of files) {
            try {
                const filePath = path.join(webDemoDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                submissions.push(data);
            }
            catch (e) {
                console.error(`Failed to parse web demo file: ${file}`, e);
            }
        }
        submissions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return submissions;
    }
    getGithubSubmissions() {
        const benchmarkRunnerDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner');
        const githubDemoDir = path.join(benchmarkRunnerDir, 'results', 'github_demo');
        if (!fs.existsSync(githubDemoDir)) {
            return [];
        }
        const files = fs.readdirSync(githubDemoDir).filter(file => file.endsWith('.json'));
        const submissions = [];
        for (const file of files) {
            try {
                const filePath = path.join(githubDemoDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                submissions.push(data);
            }
            catch (e) {
                console.error(`Failed to parse github demo file: ${file}`, e);
            }
        }
        submissions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return submissions;
    }
    getCicdLogs() {
        const benchmarkRunnerDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner');
        const cicdDir = path.join(benchmarkRunnerDir, 'results', 'ci_cd');
        if (!fs.existsSync(cicdDir)) {
            return [];
        }
        const files = fs.readdirSync(cicdDir).filter(file => file.endsWith('.json'));
        const logs = [];
        for (const file of files) {
            try {
                const filePath = path.join(cicdDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const data = JSON.parse(content);
                logs.push(data);
            }
            catch (e) {
                console.error(`Failed to parse CI/CD log file: ${file}`, e);
            }
        }
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return logs;
    }
    async cloneGithubRepo(body) {
        const { repoUrl } = body;
        if (!repoUrl) {
            throw new common_1.HttpException('Missing repoUrl parameter', common_1.HttpStatus.BAD_REQUEST);
        }
        const tempRoot = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'csharp_projects', 'github_repos');
        const tempDirName = `temp_repo_${Date.now()}`;
        const tempDirPath = path.join(tempRoot, tempDirName);
        try {
            fs.mkdirSync(tempRoot, { recursive: true });
            const existingDirs = fs.readdirSync(tempRoot);
            for (const dir of existingDirs) {
                if (dir.startsWith('temp_repo_')) {
                    const dirPath = path.join(tempRoot, dir);
                    try {
                        fs.rmSync(dirPath, { recursive: true, force: true });
                        console.log(`[GitHub Ingest] Cleaned up old repo folder: ${dir}`);
                    }
                    catch (e) {
                        console.error(`[GitHub Ingest] Failed to clean up ${dirPath}`, e);
                    }
                }
            }
        }
        catch (err) {
            throw new common_1.HttpException(`Failed to create temp root: ${err.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return new Promise((resolve, reject) => {
            const cloneCommand = `git clone --depth 1 --quiet "${repoUrl}" "${tempDirPath}"`;
            (0, child_process_1.exec)(cloneCommand, (cloneError, _, cloneStderr) => {
                if (cloneError) {
                    console.error('Clone error:', cloneError);
                    const cleanedError = cleanGitError(cloneStderr || cloneError.message);
                    reject(new common_1.HttpException(`Failed to clone repository: ${cleanedError}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR));
                    return;
                }
                const parserDll = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'csharp_projects', 'RoslynParserCli', 'bin', 'Debug', 'net8.0', 'RoslynParserCli.dll');
                const csFiles = scanCsFiles(tempDirPath).filter(f => !path.relative(tempDirPath, f).toLowerCase().includes('test'));
                const parsedFiles = [];
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
                                signature: `${m.Modifiers.join(' ')} ${m.ReturnType} ${m.MethodName}(${m.Parameters.map((p) => `${p.Type} ${p.Name}`).join(', ')})`,
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
    async createGithubPr(body) {
        const { repoUrl, tempDir, filePath, testCode, metrics, methodName } = body;
        if (!repoUrl || !tempDir || !filePath || !testCode) {
            throw new common_1.HttpException('Missing required parameters', common_1.HttpStatus.BAD_REQUEST);
        }
        const githubToken = body.githubPat || getGithubToken();
        if (!githubToken) {
            throw new common_1.HttpException('GitHub Personal Access Token not provided. Enter it in the GitHub Ingestion UI or add GITHUB_PAT to benchmark_runner/.env', common_1.HttpStatus.BAD_REQUEST);
        }
        const tempDirPath = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'csharp_projects', 'github_repos', tempDir);
        if (!fs.existsSync(tempDirPath)) {
            throw new common_1.HttpException('Ingested repository session expired or directory not found', common_1.HttpStatus.NOT_FOUND);
        }
        const sourceDir = path.dirname(filePath);
        const sourceBase = path.basename(filePath, '.cs');
        const testFileName = methodName ? `${sourceBase}_${methodName}Tests.cs` : `${sourceBase}Tests.cs`;
        const findTestFile = (dir, filename) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                if (file === 'bin' || file === 'obj' || file === 'StrykerOutput')
                    continue;
                if (fs.statSync(fullPath).isDirectory()) {
                    const res = findTestFile(fullPath, filename);
                    if (res)
                        return res;
                }
                else if (file === filename) {
                    return fullPath;
                }
            }
            return null;
        };
        let testFileAbsolutePath = findTestFile(tempDirPath, testFileName);
        if (!testFileAbsolutePath) {
            const testFileRelativePath = path.join(sourceDir, testFileName);
            testFileAbsolutePath = path.join(tempDirPath, testFileRelativePath);
        }
        try {
            fs.mkdirSync(path.dirname(testFileAbsolutePath), { recursive: true });
            fs.writeFileSync(testFileAbsolutePath, testCode, 'utf8');
        }
        catch (err) {
            throw new common_1.HttpException(`Failed to write test file: ${err.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
        if (!repoMatch) {
            throw new common_1.HttpException('Invalid GitHub repository URL format', common_1.HttpStatus.BAD_REQUEST);
        }
        const owner = repoMatch[1];
        const repo = repoMatch[2];
        const branchName = `ai-unit-tests-${Date.now()}`;
        return new Promise((resolve, reject) => {
            const authUrl = `https://${githubToken}@github.com/${owner}/${repo}.git`;
            const gitignorePath = path.join(tempDirPath, '.gitignore');
            const gitignoreContent = "\n[Bb]in/\n[Oo]bj/\nStrykerOutput/\ncoverage.cobertura.xml\n";
            fs.appendFileSync(gitignorePath, gitignoreContent);
            try {
                (0, child_process_1.execSync)(`git remote set-url origin "${authUrl}"`, { cwd: tempDirPath, stdio: 'pipe' });
                (0, child_process_1.execSync)(`git checkout -b "${branchName}"`, { cwd: tempDirPath, stdio: 'pipe' });
                (0, child_process_1.execSync)(`git add .`, { cwd: tempDirPath, stdio: 'pipe' });
                const status = (0, child_process_1.execSync)(`git status --porcelain`, { cwd: tempDirPath }).toString().trim();
                if (!status) {
                    return reject(new common_1.HttpException('No new changes to commit. The generated tests are identical to the repository.', common_1.HttpStatus.BAD_REQUEST));
                }
                (0, child_process_1.execSync)(`git -c user.name="AI Unit Test Agent" -c user.email="agent@ai-unit-test.local" commit -m "Add AI-generated unit tests for ${sourceBase}"`, { cwd: tempDirPath, stdio: 'pipe' });
                (0, child_process_1.execSync)(`git push origin "${branchName}"`, { cwd: tempDirPath, stdio: 'pipe' });
                openPullRequest(githubToken, owner, repo, branchName, sourceBase, metrics)
                    .then((prData) => resolve(prData))
                    .catch((err) => reject(new common_1.HttpException(`Failed to create Pull Request: ${err.message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR)));
            }
            catch (err) {
                console.error(`Git command failed`, err.stderr?.toString() || err.message);
                reject(new common_1.HttpException(`Git operation failed: ${cleanGitError(err.stderr?.toString() || err.message)}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR));
            }
        });
    }
    async cicdWebhook(body) {
        const { repoUrl, prNumber, branch, workflow = 'compiler-guided-multi-agent' } = body;
        if (!repoUrl) {
            throw new common_1.HttpException('Missing repoUrl', common_1.HttpStatus.BAD_REQUEST);
        }
        this.runAutomatedCicdPipeline(repoUrl, prNumber, branch, workflow).catch(err => {
            console.error('[CI/CD Pipeline Error]', err);
        });
        return { status: 'Pipeline triggered', repoUrl, workflow };
    }
    async runAutomatedCicdPipeline(repoUrl, prNumber, branch, workflow) {
        console.log(`[CI/CD] Starting automated pipeline for ${repoUrl} (PR #${prNumber})`);
        const tempRoot = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'csharp_projects', 'github_repos');
        const tempDirName = `cicd_repo_${Date.now()}`;
        const tempDirPath = path.join(tempRoot, tempDirName);
        fs.mkdirSync(tempRoot, { recursive: true });
        await new Promise((resolve, reject) => {
            (0, child_process_1.exec)(`git clone --depth 1 --quiet -b "${branch}" "${repoUrl}" "${tempDirPath}"`, (error) => {
                if (error) {
                    (0, child_process_1.exec)(`git clone --depth 1 --quiet "${repoUrl}" "${tempDirPath}"`, (error2) => {
                        if (error2)
                            return reject(error2);
                        resolve(true);
                    });
                    return;
                }
                resolve(true);
            });
        });
        const allCsFiles = scanCsFiles(tempDirPath);
        const testFiles = allCsFiles.filter(f => {
            const rel = path.relative(tempDirPath, f).toLowerCase();
            return rel.includes('test') || rel.endsWith('tests.cs');
        });
        const sourceFiles = allCsFiles.filter(f => !testFiles.includes(f));
        const filesToTest = [];
        for (const sourceFile of sourceFiles) {
            const baseName = path.basename(sourceFile, '.cs');
            const hasTest = testFiles.some(tf => path.basename(tf, '.cs').toLowerCase().includes(baseName.toLowerCase() + 'test'));
            if (!hasTest) {
                filesToTest.push(sourceFile);
            }
        }
        if (filesToTest.length === 0) {
            console.log(`[CI/CD] All ${sourceFiles.length} C# files already have tests. Nothing to do for ${repoUrl}`);
            try {
                fs.rmSync(tempDirPath, { recursive: true, force: true });
            }
            catch (e) { }
            return;
        }
        console.log(`[CI/CD] Found ${filesToTest.length} files without tests. Starting generation queue...`);
        const pythonExe = path.join(workspaceRoot, 'ai-unit-test-benchmark', '.venv', 'Scripts', 'python.exe');
        const apiRunnerScript = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'api_runner.py');
        const model = 'llama';
        let generatedCount = 0;
        for (const targetFile of filesToTest) {
            const relativePath = path.relative(tempDirPath, targetFile);
            const sourceCode = fs.readFileSync(targetFile, 'utf8');
            const tempFileName = `temp_cicd_${Date.now()}.cs`;
            const tempFilePath = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', tempFileName);
            fs.writeFileSync(tempFilePath, sourceCode, 'utf8');
            const command = `"${pythonExe}" "${apiRunnerScript}" --model ${model} --workflow ${workflow} --file "${tempFilePath}" --github-repo-path "${tempDirPath}" --github-file-path "${relativePath}"`;
            console.log(`[CI/CD] Generating tests for ${relativePath}...`);
            try {
                await new Promise((resolve) => {
                    (0, child_process_1.exec)(command, { cwd: path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner') }, (error, stdout, stderr) => {
                        try {
                            fs.unlinkSync(tempFilePath);
                        }
                        catch (e) { }
                        if (error) {
                            console.error(`[CI/CD] Generation failed for ${relativePath}:`, stderr);
                            return resolve(false);
                        }
                        generatedCount++;
                        console.log(`[CI/CD] Successfully generated tests for ${relativePath}`);
                        try {
                            const parsedResult = JSON.parse(extractJson(stdout));
                            const cicdDir = path.join(workspaceRoot, 'ai-unit-test-benchmark', 'benchmark_runner', 'results', 'ci_cd');
                            if (!fs.existsSync(cicdDir))
                                fs.mkdirSync(cicdDir, { recursive: true });
                            const logFile = path.join(cicdDir, `cicd_run_${Date.now()}.json`);
                            fs.writeFileSync(logFile, JSON.stringify({
                                timestamp: new Date().toISOString(),
                                file_path: relativePath,
                                success: parsedResult.success || false,
                                line_coverage: parsedResult.line_coverage || 0,
                                evaluator_score: parsedResult.evaluator_score || 0,
                                cost: parsedResult.cost || 0,
                                latency: parsedResult.latency || 0,
                                model: model || 'llama',
                                workflow: workflow || 'compiler-guided-multi-agent',
                                mutation_score: parsedResult.mutation_score,
                                total_mutants: parsedResult.total_mutants,
                                killed_mutants: parsedResult.killed_mutants,
                                survived_mutants: parsedResult.survived_mutants,
                                repoUrl,
                                prNumber,
                                branch,
                                targetFile: relativePath,
                                result: parsedResult
                            }, null, 2));
                        }
                        catch (e) { }
                        resolve(true);
                    });
                });
            }
            catch (err) {
                console.error(`[CI/CD] Pipeline error on ${relativePath}:`, err);
            }
        }
        if (generatedCount > 0) {
            console.log(`[CI/CD] Generated ${generatedCount} test files. Committing and pushing to GitHub...`);
            const githubToken = getGithubToken();
            if (githubToken) {
                try {
                    const repoUrlObj = new URL(repoUrl);
                    const owner = repoUrlObj.pathname.split('/')[1];
                    const repo = repoUrlObj.pathname.split('/')[2].replace('.git', '');
                    const authUrl = `https://${githubToken}@github.com/${owner}/${repo}.git`;
                    (0, child_process_1.execSync)(`git remote set-url origin "${authUrl}"`, { cwd: tempDirPath, stdio: 'pipe' });
                    (0, child_process_1.execSync)(`git add .`, { cwd: tempDirPath, stdio: 'pipe' });
                    const status = (0, child_process_1.execSync)(`git status --porcelain`, { cwd: tempDirPath }).toString().trim();
                    if (status) {
                        (0, child_process_1.execSync)(`git -c user.name="AI Unit Test Agent" -c user.email="agent@ai-unit-test.local" commit -m "test: auto-generate missing unit tests via CI/CD"`, { cwd: tempDirPath, stdio: 'pipe' });
                        (0, child_process_1.execSync)(`git push origin "${branch}"`, { cwd: tempDirPath, stdio: 'pipe' });
                        console.log(`[CI/CD] Successfully pushed generated tests to branch ${branch}!`);
                    }
                }
                catch (gitErr) {
                    console.error(`[CI/CD] Failed to push generated tests to GitHub:`, gitErr.stderr?.toString() || gitErr.message);
                }
            }
            else {
                console.log(`[CI/CD] Skipping push to GitHub because GITHUB_PAT is not configured.`);
            }
        }
        try {
            fs.rmSync(tempDirPath, { recursive: true, force: true });
            console.log(`[CI/CD] Cleaned up temporary repository: ${tempDirPath}`);
        }
        catch (cleanupErr) {
            console.error(`[CI/CD] Failed to clean up repository: ${tempDirPath}`, cleanupErr);
        }
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)('models'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of supported AI models' }),
    (0, swagger_1.ApiResponse)({
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
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getModels", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate unit tests for C# source code' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Tests generated and verified successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Missing required parameters' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error during script execution' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GenerateDto]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)('dashboard/benchmarks'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all benchmark runs dynamically' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getBenchmarkRuns", null);
__decorate([
    (0, common_1.Get)('dashboard/static-summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pre-calculated python summary reports' }),
    __param(0, (0, common_1.Query)('version')),
    __param(1, (0, common_1.Query)('workflow')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getStaticSummary", null);
__decorate([
    (0, common_1.Get)('dashboard/web-demo'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all web demo submissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getWebDemoSubmissions", null);
__decorate([
    (0, common_1.Get)('dashboard/github-demo'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all GitHub ingestion submissions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getGithubSubmissions", null);
__decorate([
    (0, common_1.Get)('dashboard/ci-cd'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all CI/CD Git hook run logs' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getCicdLogs", null);
__decorate([
    (0, common_1.Post)('github/clone'),
    (0, swagger_1.ApiOperation)({ summary: 'Clone GitHub repository and parse C# methods' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "cloneGithubRepo", null);
__decorate([
    (0, common_1.Post)('github/create-pr'),
    (0, swagger_1.ApiOperation)({ summary: 'Create Pull Request with generated test code' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "createGithubPr", null);
__decorate([
    (0, common_1.Post)('cicd/webhook'),
    (0, swagger_1.ApiOperation)({ summary: 'Webhook for GitHub Actions CI/CD to trigger automated AI test generation' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "cicdWebhook", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('AI Unit Test Generation'),
    (0, common_1.Controller)('api')
], AppController);
function getJsonFilesRecursively(dir) {
    let results = [];
    if (!fs.existsSync(dir))
        return results;
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getJsonFilesRecursively(filePath));
        }
        else if (file.endsWith('.json')) {
            results.push(filePath);
        }
    });
    return results;
}
function getBenchmarksMetadata(datasetsDir) {
    const map = {};
    if (!fs.existsSync(datasetsDir))
        return map;
    const getMetadataFiles = (dir) => {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach((file) => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(getMetadataFiles(filePath));
            }
            else if (file === 'metadata.json') {
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
        }
        catch (e) {
            console.error('Error reading dataset metadata', e);
        }
    }
    return map;
}
function getGithubToken() {
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
function scanCsFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir))
        return results;
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            const base = path.basename(filePath).toLowerCase();
            if (base !== 'bin' && base !== 'obj' && base !== '.git' && base !== 'node_modules' && base !== 'packages' && base !== '.vs') {
                results = results.concat(scanCsFiles(filePath));
            }
        }
        else if (file.endsWith('.cs')) {
            results.push(filePath);
        }
    });
    return results;
}
async function parseCsFile(parserDllPath, filePath) {
    return new Promise((resolve) => {
        const command = `dotnet "${parserDllPath}" "${filePath}"`;
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Failed to parse file ${filePath}:`, stderr || error.message);
                resolve([]);
                return;
            }
            try {
                const methods = JSON.parse(extractJson(stdout));
                resolve(methods);
            }
            catch (e) {
                console.error(`Failed to parse JSON for file ${filePath}:`, stdout);
                resolve([]);
            }
        });
    });
}
function extractJson(str) {
    const firstBrace = str.indexOf('{');
    const firstBracket = str.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIdx = firstBrace;
        endIdx = str.lastIndexOf('}');
    }
    else if (firstBracket !== -1) {
        startIdx = firstBracket;
        endIdx = str.lastIndexOf(']');
    }
    if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
        throw new Error('No JSON structure found in string');
    }
    return str.substring(startIdx, endIdx + 1);
}
function cleanGitError(raw) {
    const lines = raw
        .split('\n')
        .map(line => line.replace(/.*\r/, ''))
        .map(line => line.trim())
        .filter(line => line.length > 0);
    const meaningful = lines.slice(-5);
    return meaningful.join('\n') || raw.trim();
}
async function openPullRequest(token, owner, repo, branch, component, metrics) {
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
//# sourceMappingURL=app.controller.js.map