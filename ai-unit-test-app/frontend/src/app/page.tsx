'use client';

import { useState, useEffect } from 'react';
import Mermaid from './components/Mermaid';

interface Model {
  id: string;
  name: string;
}

interface HealingAttempt {
  attempt: number;
  errors: string;
  success: boolean;
}

interface EvaluatorFeedback {
  score: number;
  correctness_rating: number;
  compilation_review: string;
  assertion_quality_review: string;
  mocking_review: string;
  coverage_review: string;
  issues_found: string[] | null;
  suggestions: string[] | null;
}

interface GenerateResult {
  success: boolean;
  generated_test: string;
  stdout: string;
  stderr: string;
  line_coverage: number;
  branch_coverage: number;
  evaluator_score: number;
  evaluator_feedback: EvaluatorFeedback;
  cost: number;
  latency: number;
  healing_attempts: number;
  healing_log: HealingAttempt[];
  evaluator_loop_log?: {
    attempt: number;
    score_before: number;
    score_after: number;
    success: boolean;
    worker_prompt_tokens?: number;
    worker_completion_tokens?: number;
    worker_cost?: number;
    worker_latency?: number;
    evaluator_prompt_tokens?: number;
    evaluator_completion_tokens?: number;
    evaluator_cost?: number;
    evaluator_latency?: number;
    cost?: number;
    latency?: number;
  }[];
  worker_prompt_tokens?: number;
  worker_completion_tokens?: number;
  worker_cost?: number;
  worker_latency?: number;
  evaluator_prompt_tokens?: number;
  evaluator_completion_tokens?: number;
  evaluator_cost?: number;
  evaluator_latency?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  initial_line_coverage?: number;
  initial_branch_coverage?: number;
  initial_evaluator_score?: number;
  initial_success?: boolean;
  mutation_score?: number | null;
  total_mutants?: number | null;
  killed_mutants?: number | null;
  survived_mutants?: number | null;
  ignored_mutants?: number | null;
  timeout_mutants?: number | null;
  evaluator_model?: string;
}

const DEFAULT_CODE = `public int Divide(int numerator, int denominator)
{
    if (denominator == 0)
    {
        throw new System.DivideByZeroException("Denominator cannot be zero.");
    }
    return numerator / denominator;
}`;

// --- FlowArrow Component ---
function FlowArrow({ label }: { label?: string }) {
  return (
    <>
      <div className="flow-arrow-horizontal" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <span style={{ fontSize: '1.5rem', color: '#6366f1' }}>➔</span>
          {label && <span className="flow-arrow-text">{label}</span>}
        </div>
      </div>
      <div className="flow-arrow-vertical" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <span style={{ fontSize: '1.5rem', color: '#6366f1' }}>▼</span>
          {label && <span className="flow-arrow-text">{label}</span>}
        </div>
      </div>
    </>
  );
}

const BENCHMARK_FLOW = `sequenceDiagram
    autonumber
    actor Research as นักวิจัย / CLI
    participant main as main.py (CLI Orchestrator)
    participant DB as Dataset Loader
    participant AI as AI Worker & Evaluator
    participant Sandbox as Sandbox (.NET SDK & Coverlet)
    participant Disk as Local Disk (JSON/MD Summary)

    Research->>main: รันคำสั่ง py main.py --version v2 --model gptmini --workflow agent
    main->>DB: โหลดข้อมูลคลาสและ Expected Test จาก benchmark_datasets/v2/
    DB-->>main: รายการ Benchmark Samples ทั้งหมด
    
    loop แต่ละตัวอย่างคำถาม (Benchmark Sample)
        main->>main: ตรวจสอบและข้าม (Skip) หากเคยรันรายงานผลลัพธ์นี้ไปแล้ว (--skip-existing)
        main->>AI: ส่ง Source Code ให้ Worker Agent สร้าง Unit Test ตาม Workflow
        AI-->>main: ผลลัพธ์โค้ด Unit Test ฉบับสมบูรณ์
        
        main->>Sandbox: นำ Source Code + Test Code ไปวางในคลาสแซนด์บ็อกซ์การวิจัย
        main->>Sandbox: สั่งรันบิวด์และทดสอบ dotnet test --collect:"XPlat Code Coverage"
        Sandbox-->>main: ผลการรัน Assertions, โค้ดคัฟเวอร์เรจ Cobertura.xml
        
        main->>AI: ส่งโค้ด + ผลการรันให้ Evaluator Agent ให้คะแนนเชิงคุณภาพ
        AI-->>main: คะแนนประเมินดิบ (0-100) และข้อเสนอแนะเชิงลึก
        main->>Disk: บันทึกรายงานผลลัพธ์ของไฟล์นั้นในรูปแบบ JSON ที่ results/reports/
    end
    
    Research->>Disk: เรียกใช้ py src/summary/main.py เพื่อรวมรายงาน
    Disk-->>Research: สรุปผลตารางวิจัย Markdown, CSV และแผนภาพใน results/summary/`;

const DEMO_FLOW = `sequenceDiagram
    autonumber
    actor User as ผู้ใช้เว็บเดโม่
    participant Web as Next.js Frontend
    participant Nest as NestJS Backend (Port 3001)
    participant PyAPI as api_runner.py (Python Engine)
    participant DemoBox as Demo Sandbox Project
    participant Disk as Disk Log (results/web_demo/)

    User->>Web: วาง Source Code เลือกโมเดล/Workflow คลิก Generate
    Web->>Nest: ยิง POST /api/generate พร้อม JSON Payload
    
    Nest->>Nest: สร้างไฟล์ต้นฉบับจำลอง temp_source_{timestamp}.cs ในเครื่อง
    Nest->>PyAPI: สั่งประมวลผลกระบวนการผ่าน Child Process (api_runner.py)
    
    PyAPI->>PyAPI: ดึงซอร์สโค้ดจากไฟล์ชั่วคราวและส่งไปหาโมเดลเพื่อสร้างเทส
    PyAPI->>DemoBox: วางไฟล์โค้ด + เทสใน Sandbox เดโม่ (DemoSource/DemoTestProject)
    PyAPI->>DemoBox: สั่งบิวด์และเรียก dotnet test รัน Coverlet หา Coverage
    DemoBox-->>PyAPI: คืนค่า Log, Test Pass Status, XML Coverage
    
    PyAPI->>PyAPI: รันตัวประเมิน Evaluator Agent แบบด่วน (ไม่ใช้ Reference Test)
    PyAPI-->>Nest: แสดงผลลัพธ์โครงสร้าง JSON ทางหน้าคอนโซล (stdout)
    
    Nest->>Nest: ลบไฟล์ชั่วคราว temp_source_{timestamp}.cs ออกจากดิสก์
    Nest->>Disk: บันทึกข้อมูลรัน Log เก็บลง results/web_demo/submission_{timestamp}.json
    Nest-->>Web: ส่งค่าการสร้างและประเมินคุณภาพกลับไปแสดงผล
    Web-->>User: แสดงโค้ดสีสวยงาม ค่าเปรียบเทียบคัฟเวอร์เรจ และเกจวัดคุณภาพ`;

const GITHUB_PR_FLOW = `sequenceDiagram
    autonumber
    actor User as ผู้ใช้ระบบเดโม่
    participant Web as Next.js Frontend
    participant Nest as NestJS Backend
    participant Roslyn as Roslyn Parser CLI (.NET Assembly)
    participant GH as GitHub API & Git Client

    User->>Web: กรอก URL ของ GitHub Repository สาธารณะ
    Web->>Nest: ส่ง POST /api/github/clone พร้อม URL
    
    Nest->>GH: โคลน Repo ชั่วคราว (git clone --depth 1 --filter=blob:none --no-checkout)
    Nest->>GH: กำหนด Sparse Checkout เพื่อดึงเฉพาะไฟล์ *.cs เท่านั้น
    GH-->>Nest: ยืนยันดาวน์โหลดซอร์สโค้ดภาษา C# ของคลาสต่างๆ ลงโฟลเดอร์ temp
    
    loop ทุกไฟล์ *.cs ที่ค้นพบ
        Nest->>Roslyn: เรียกใช้ dotnet RoslynParserCli.dll <FilePath>
        Roslyn-->>Nest: ส่งกลับโครงสร้างคลาส เมทอด และพารามิเตอร์ (JSON)
    end
    
    Nest-->>Web: คืนค่าแผนผังไฟล์คลาสและเมทอดทั้งหมดให้ผู้ใช้งานเลือก
    
    User->>Web: เลือกเมทอดที่ต้องการสร้างเทสแล้วคลิกดำเนินการ
    Web->>Nest: ส่งคำร้องเพื่อเรียกใช้กระบวนการสร้างและประเมินโค้ด (คล้ายกับ Demo Flow)
    Nest-->>Web: โชว์ผลลัพธ์โค้ด Unit Test ที่คอมไพล์ผ่านและรันผ่านสำเร็จแล้ว
    
    User->>Web: คลิกปุ่ม "Create Pull Request"
    Web->>Nest: ส่ง POST /api/github/create-pr พร้อม Test Code และ GitHub PAT
    
    Nest->>Nest: เขียนไฟล์ Unit Test ลงในโฟลเดอร์โคลนชั่วคราว
    Nest->>GH: รันคำสั่ง Git สั่งสร้างกิ่งใหม่ (Checkout -b ai-unit-tests-{timestamp})
    Nest->>GH: สั่งแอดไฟล์ คอมมิต และพุชโค้ดขึ้นไปบน GitHub Remote Branch
    Nest->>GH: เรียกใช้ GitHub REST API เปิด PR เสนอเข้ารวมโค้ดไปยัง main/master
    GH-->>Web: ยืนยันการสร้าง PR พร้อมแสดงลิงก์ตอบกลับให้ผู้ใช้คลิกดู`;

const PRE_COMMIT_FLOW = `sequenceDiagram
    autonumber
    actor Dev as นักพัฒนาซอฟต์แวร์
    participant Hook as Git Hook (install_hook.ps1)
    participant Guardian as csharp_test_guardian.py
    participant API as api_runner.py (Self-Healing Mode)
    participant Disk as Local Results & Git Stage

    Dev->>Hook: รันคำสั่ง git commit -m "update business logic"
    Hook->>Guardian: ทริกเกอร์เรียกใช้งานสคริปต์ตรวจสอบก่อนผ่านด่าน
    
    Guardian->>Guardian: รันคำสั่ง git diff --cached --name-only
    Guardian->>Guardian: ตรวจหาไฟล์ *.cs ที่จัดเตรียมไว้ (Staged) ที่ไม่ใช่ไฟล์เทส
    
    alt ไม่มีไฟล์ซอร์สโค้ด C# ถูกจัดเตรียม
        Guardian-->>Dev: ข้ามด่านการตรวจสอบ (Allow Commit)
    else พบไฟล์คลาส C# ถูกจัดเตรียมไว้
        loop สำหรับแต่ละไฟล์คลาส C#
            Guardian->>API: สั่งรัน api_runner.py --workflow self_healing --file "<file>"
            API-->>Guardian: ส่งกลับ JSON ผลการทดลองสร้าง คอมไพล์ และระดับคัฟเวอร์เรจ
            
            alt รันพัง หรือ ค่าคัฟเวอร์เรจ < 80%
                Guardian-->>Dev: แจ้งเตือนข้อผิดพลาด ยกเลิกการคอมมิตทันที! (Exit 1)
            else บิวด์ผ่านสำเร็จ และ ค่าคัฟเวอร์เรจ >= 80%
                Guardian->>Disk: เขียนเซฟไฟล์ทดสอบใหม่เป็น <ClassName>Tests.cs คู่กับซอร์สโค้ด
                Guardian->>Disk: สั่ง git add <ClassName>Tests.cs จัดเตรียมไฟล์เทสให้อัตโนมัติ
                Guardian->>Disk: บันทึกประวัติการคอมมิตนี้เก็บไว้ใน results/ci_cd/
            end
        end
        Guardian-->>Dev: การทดสอบผ่านครบถ้วน อนุญาตให้ทำการคอมมิตสำเร็จ! (Exit 0)
    end`;

const WORKFLOW_SINGLE = `graph TD
    Source[Source Code Under Test] --> Worker[Worker Agent: Generate Test]
    Worker --> GenCode["C# Unit Test Code"]
    GenCode --> Sandbox["Sandbox: .NET Compile & Run"]
    Sandbox --> Eval["Evaluator Agent: Semantic Review"]
    Eval --> Done([Completed Report])`;

const WORKFLOW_AGENT = `graph TD
    Source[Source Code] --> Worker1[Worker Agent: Generate Test]
    Worker1 --> InitialTest[Initial Unit Test]
    
    InitialTest & Source --> Reviewer["Reviewer Agent: Critique"]
    Reviewer --> Critique[Feedback: Strengths, Weaknesses, Suggestions]
    
    Critique & InitialTest & Source --> Worker2[Worker Agent: Refine Test]
    Worker2 --> FinalTest[Improved Unit Test]
    
    FinalTest --> Sandbox["Sandbox: .NET Compile & Run"]
    Sandbox --> Eval["Evaluator Agent: Final Evaluation"]`;

const WORKFLOW_SELF_HEALING = `graph TD
    Start[Generate Initial Test] --> RunSandbox["Sandbox: Compile & Run"]
    RunSandbox --> CheckSuccess{Is Test Successful?}
    
    CheckSuccess -- Yes --> Done([Completed Report])
    
    CheckSuccess -- No --> CheckAttempts{"Attempts < 3?"}
    CheckAttempts -- Yes --> HealingPrompt["Build Self-Healing Prompt with Compiler Errors"]
    HealingPrompt --> Fix[AI: Fix Code]
    Fix --> RunSandbox
    
    CheckAttempts -- No --> Failed([End with Last Error])`;

const WORKFLOW_BEST_OF_N = `graph TD
    subgraph Parallel Candidate Runs
        C1[Generate Candidate 1] --> S1[Sandbox Run 1] --> E1[Evaluator Score 1]
        C2[Generate Candidate 2] --> S2[Sandbox Run 2] --> E2[Evaluator Score 2]
        C3[Generate Candidate 3] --> S3[Sandbox Run 3] --> E3[Evaluator Score 3]
    end
    
    E1 & E2 & E3 --> Compare{Select Best Score}
    Compare -->|Highest Score| Final[Final Best Candidate]`;

const WORKFLOW_EVALUATOR_GUIDED = `graph TD
    Start[Generate Initial Test] --> RunSandbox["Sandbox: Compile & Run"]
    RunSandbox --> Eval["Evaluator Agent Review"]
    Eval --> CheckScore{"Score >= 75 or Max Attempts?"}
    
    CheckScore -- Yes --> Done([Use Current Test])
    
    CheckScore -- No --> GuidePrompt["Build Guided Prompt with Specific Feedback"]
    GuidePrompt --> Refine[AI: Refine Test]
    Refine --> RunSandbox`;

const WORKFLOW_ULTIMATE_HYBRID = `flowchart TD
    %% Phase 1: Generation & Healing
    subgraph Phase 1: Candidate Ingestion
        A[Start Ultimate Hybrid] --> B[Generate N=3 Candidates at T=0.5]
    end

    subgraph Phase 2: Sandbox & Self-Healing
        B --> C1[Candidate 1]
        B --> C2[Candidate 2]
        B --> C3[Candidate 3]
        
        C1 --> SH1{Compile OK?} -- No --> H1[Self-Healing Max 2 attempts] --> SH1
        C2 --> SH2{Compile OK?} -- No --> H2[Self-Healing Max 2 attempts] --> SH2
        C3 --> SH3{Compile OK?} -- No --> H3[Self-Healing Max 2 attempts] --> SH3
    end

    %% Phase 3: Selection
    subgraph Phase 3: Evaluation & Selection
        SH1 -- Yes --> E1[Evaluate & Score 1]
        SH2 -- Yes --> E2[Evaluate & Score 2]
        SH3 -- Yes --> E3[Evaluate & Score 3]
        
        E1 & E2 & E3 --> Select[Select Best Candidate by Score]
    end

    %% Phase 4: Guided Refinement
    subgraph Phase 4: Evaluator-Guided Optimization
        Select --> LoopCond{Score >= 80 or Max 2 attempts?}
        LoopCond -- No --> Guide[Evaluator-Guided Refinement Prompt]
        Guide --> Refine[AI Refines Test]
        Refine --> BuildRefine{Compile OK?}
        BuildRefine -- No --> HealingRefine[Self-Healing 1 attempt] --> BuildRefine
        BuildRefine -- Yes --> ReEval[Re-Evaluate & Update Score]
        ReEval --> LoopCond
        
        LoopCond -- Yes --> Done([Save Best Final Unit Test])
    end`;

export default function Home() {
  const [sourceCode, setSourceCode] = useState(DEFAULT_CODE);
  const [model, setModel] = useState('gptmini');
  const [workflow, setWorkflow] = useState('single');
  const [activeTab, setActiveTab] = useState('code');

  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTelemetry, setShowTelemetry] = useState(true);

  const [workspaceMode, setWorkspaceMode] = useState<'manual' | 'github' | 'workflow' | 'params'>('manual');
  const [workflowSubTab, setWorkflowSubTab] = useState<'orchestration' | 'pipelines'>('orchestration');
  const [paramsSubTab, setParamsSubTab] = useState<'parameters' | 'summary'>('parameters');
  const [summaryReportTab, setSummaryReportTab] = useState<'overall' | 'category' | 'split' | 'cost' | 'failure' | 'healing' | 'latency' | 'evaluator' | 'selector' | 'mutation'>('overall');
  const [orchestrationTab, setOrchestrationTab] = useState<'single' | 'agent' | 'self_healing' | 'best_of_n' | 'evaluator_guided' | 'ultimate_hybrid'>('single');
  const [pipelineTab, setPipelineTab] = useState<'benchmark' | 'demo' | 'github' | 'hook'>('benchmark');
  const [paramsGroupTab, setParamsGroupTab] = useState<'group1' | 'group2' | 'group3' | 'group4' | 'group5' | 'group6'>('group1');
  const [ultimateSubTab, setUltimateSubTab] = useState<'flow' | 'details'>('flow');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubRepoData, setGithubRepoData] = useState<{ tempDir: string; files: { filePath: string; className: string; namespaceName?: string; methods: { methodName: string; signature: string; body: string }[] }[] } | null>(null);
  const [selectedFilePath, setSelectedFilePath] = useState('');
  const [githubTempDir, setGithubTempDir] = useState('');
  const [prLoading, setPrLoading] = useState(false);
  const [prResultUrl, setPrResultUrl] = useState('');
  const [prError, setPrError] = useState<string | null>(null);
  const [githubPat, setGithubPat] = useState('');
  const [selectedMethodName, setSelectedMethodName] = useState('');
  const [runMutation, setRunMutation] = useState(true);

  const handleGithubImport = async () => {
    if (!githubRepoUrl) return;
    setGithubLoading(true);
    setError(null);
    setGithubRepoData(null);
    setSelectedFilePath('');
    setGithubTempDir('');

    try {
      const response = await fetch('http://localhost:3005/api/github/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl: githubRepoUrl }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to clone repository');
      }

      const data = await response.json();
      setGithubRepoData(data);
      setGithubTempDir(data.tempDir);
    } catch (err: unknown) {
      setError((err as Error).message || 'An error occurred during GitHub repository clone.');
    } finally {
      setGithubLoading(false);
    }
  };

  const handleCreatePR = async () => {
    if (!result || !githubTempDir || !selectedFilePath) return;
    setPrLoading(true);
    setPrError(null);
    setPrResultUrl('');

    try {
      const response = await fetch('http://localhost:3005/api/github/create-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoUrl: githubRepoUrl,
          tempDir: githubTempDir,
          filePath: selectedFilePath,
          testCode: result.generated_test,
          methodName: selectedMethodName,
          githubPat: githubPat || undefined,
          metrics: {
            latency: result.latency,
            cost: result.cost,
            healing_attempts: result.healing_attempts,
            evaluator_model: result.evaluator_model,
            evaluator_score: result.evaluator_feedback?.score || 100,
            line_coverage: result.line_coverage,
            branch_coverage: result.branch_coverage,
            success: result.success
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to create Pull Request');
      }

      const data = await response.json();
      if (data.html_url) {
        setPrResultUrl(data.html_url);
      } else {
        setPrResultUrl(githubRepoUrl + '/pulls');
      }
    } catch (err: unknown) {
      setPrError((err as Error).message || 'An error occurred during Pull Request creation.');
    } finally {
      setPrLoading(false);
    }
  };

  // Fetch models on load
  useEffect(() => {
    fetch('http://localhost:3005/api/models')
      .then((res) => res.json())
      .then((data) => setModels(data))
      .catch((err) => {
        console.error('Failed to fetch models:', err);
        // Fallback models if backend is not started yet
        setModels([
          { id: 'gptmini', name: 'GPT-4o Mini (Azure)' },
          { id: 'llama', name: 'Llama 3.3 70B (Azure)' },
          { id: 'deepseekv3', name: 'DeepSeek-V3 (Azure)' }
        ]);
      });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      setTimeout(() => {
        if (view === 'github') {
          setWorkspaceMode('github');
        } else if (view === 'workflow') {
          setWorkspaceMode('workflow');
        } else if (view === 'params') {
          setWorkspaceMode('params');
        }
      }, 0);
    }
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveTab('code');
    setPrResultUrl('');
    setPrError(null);

    try {
      const response = await fetch('http://localhost:3005/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceCode,
          model,
          workflow,
          source: workspaceMode,
          filePath: selectedFilePath,
          runMutation: runMutation,
          repoDir: workspaceMode === 'github' ? githubTempDir : undefined,
          methodName: selectedMethodName
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Server returned an error');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: unknown) {
      setError((err as Error).message || 'An error occurred during test generation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div>
          <h1>C# AI Unit Test Generation Platform</h1>
          <p>Multi-Agent LLM Review &amp; Self-Healing Sandbox Engine</p>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginRight: '1.5rem' }}>
          <button
            onClick={() => {
              setWorkspaceMode('workflow');
              setResult(null);
              setError(null);
              setPrResultUrl('');
              setPrError(null);
              setSelectedMethodName('');
              window.history.pushState({}, '', '/?view=workflow');
            }}
            className={`nav-link ${workspaceMode === 'workflow' ? 'active' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '0.25rem 0.5rem',
              fontFamily: 'inherit'
            }}
          >
            System Workflow
          </button>
          <button
            onClick={() => {
              setWorkspaceMode('params');
              setResult(null);
              setError(null);
              setPrResultUrl('');
              setPrError(null);
              setSelectedMethodName('');
              window.history.pushState({}, '', '/?view=params');
            }}
            className={`nav-link ${workspaceMode === 'params' ? 'active' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '0.25rem 0.5rem',
              fontFamily: 'inherit'
            }}
          >
            Report Parameters
          </button>
          <button
            onClick={() => {
              setWorkspaceMode('manual');
              setResult(null);
              setError(null);
              setPrResultUrl('');
              setPrError(null);
              setSelectedMethodName('');
              setSourceCode(DEFAULT_CODE);
              setModel('gptmini');
              setWorkflow('single');
              setRunMutation(true);
              window.history.pushState({}, '', '/');
            }}
            className={`nav-link ${workspaceMode === 'manual' ? 'active' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '0.25rem 0.5rem',
              fontFamily: 'inherit'
            }}
          >
            Playground
          </button>
          <button
            onClick={() => {
              setWorkspaceMode('github');
              setResult(null);
              setError(null);
              setPrResultUrl('');
              setGithubRepoUrl('');
              setSelectedFilePath('');
              setGithubTempDir('');
              setPrError(null);
              setSelectedMethodName('');
              setGithubRepoData(null);
              setGithubPat('');
              setModel('gptmini');
              setWorkflow('single');
              setRunMutation(true);
              window.history.pushState({}, '', '/?view=github');
            }}
            className={`nav-link ${workspaceMode === 'github' ? 'active' : ''}`}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '0.25rem 0.5rem',
              fontFamily: 'inherit'
            }}
          >
            GitHub Ingestion
          </button>
          <a
            href="/dashboard"
            className="nav-link"
            style={{
              fontSize: '0.9rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            Dashboard
          </a>
        </nav>
      </header>

      {/* Main Layout or System Workflow / Params View */}
      {workspaceMode === 'workflow' ? (
        <section className="panel" style={{ width: '100%', maxWidth: '100%', gap: '1.5rem', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="panel-title" style={{ fontSize: '1.35rem' }}>System Workflows &amp; Pipelines</h2>
            <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <button
                className={`tab-btn ${workflowSubTab === 'orchestration' ? 'active' : ''}`}
                onClick={() => setWorkflowSubTab('orchestration')}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', borderBottom: 'none' }}
              >
                3 Orchestration Workflows
              </button>
              <button
                className={`tab-btn ${workflowSubTab === 'pipelines' ? 'active' : ''}`}
                onClick={() => setWorkflowSubTab('pipelines')}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', borderBottom: 'none' }}
              >
                4 Operational Pipelines
              </button>
            </div>
          </div>

          {workflowSubTab === 'orchestration' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                ระบบนี้มีกระบวนการสร้างและปรับปรุงคุณภาพ Unit Test ภาษา C# (โดยใช้ xUnit) ทั้งหมด 3 รูปแบบหลัก (Workflows) โดยมีรายละเอียดโครงสร้างและขั้นตอนการดำเนินงานดังนี้:
              </p>

              {/* 3 Orchestration Workflows Sub-Tabs Header */}
              <div className="tabs-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  className={`tab-btn pb-2 ${orchestrationTab === 'single' ? 'active' : ''}`}
                  onClick={() => setOrchestrationTab('single')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                >
                  1. Single-Pass
                </button>
                <button
                  className={`tab-btn pb-2 ${orchestrationTab === 'agent' ? 'active' : ''}`}
                  onClick={() => setOrchestrationTab('agent')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                >
                  2. Multi-Agent Critique
                </button>
                <button
                  className={`tab-btn pb-2 ${orchestrationTab === 'ultimate_hybrid' ? 'active' : ''}`}
                  onClick={() => setOrchestrationTab('ultimate_hybrid')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                >
                  3. Ultimate Hybrid
                </button>
              </div>

              {/* Workflow 1 */}
              {orchestrationTab === 'single' && (
                <div style={{ border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="gradient-text">1. Single-Pass Generation</span>
                    <code style={{ fontSize: '0.75rem', color: '#818cf8', background: 'rgba(129, 140, 248, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>single</code>
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                    <strong>แนวคิดการทำงาน</strong>: เป็นรูปแบบการสร้าง Unit Test แบบตรงไปตรงมาที่สุด โดยส่ง Source Code ให้กับโมเดล AI (Worker Agent) เพื่อสร้างชุดทดสอบออกมารอบเดียว จากนั้นระบบจะนำโค้ดที่ได้เข้าระบบทดสอบทันทีโดยไม่มีการวนลูปแก้ไขใดๆ
                  </p>

                  <Mermaid chart={WORKFLOW_SINGLE} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>ขั้นตอนการทำงานโดยละเอียด:</span>
                    <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: 0 }}>
                      <li><strong>การวิเคราะห์อินพุต</strong>: ระบบดึง Class Name จาก C# Source Code เพื่อปรับแต่งกฎการสร้าง (เช่น กำหนดให้ชื่อคลาสทดสอบสอดคล้องกันและใช้ namespace <code>BenchmarkTestProject.Tests</code>)</li>
                      <li><strong>การเรียกใช้โมเดล</strong>: ส่ง Prompt พร้อม Source Code ให้ AI Generate โค้ด Unit Test โดยใช้โมเดล Worker (เช่น GPT-4o Mini, Llama 3.3 70B, หรือ DeepSeek)</li>
                      <li><strong>การประเมินผลใน Sandbox</strong>: นำโค้ด Unit Test ที่ได้ไปเขียนลงไฟล์ในโปรเจกต์ Sandbox เรียกคำสั่ง <code>.NET Build</code> และ <code>.NET Test</code> พร้อมเปิดใช้งาน <code>Coverlet</code> สำหรับวิเคราะห์โค้ดคัฟเวอร์เรจ (Code Coverage)</li>
                      <li><strong>การประเมินเชิงความหมาย (Semantic Evaluation)</strong>: ส่งผลลัพธ์การคอมไพล์และค่า Coverage ไปให้ <strong>Evaluator Agent</strong> เพื่อให้คะแนนคุณภาพของ Unit Test (0-100 คะแนน) และสรุปประเด็นปัญหา</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Workflow 2 */}
              {orchestrationTab === 'agent' && (
                <div style={{ border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="gradient-text">2. Multi-Agent Critique &amp; Refinement</span>
                    <code style={{ fontSize: '0.75rem', color: '#818cf8', background: 'rgba(129, 140, 248, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>agent</code>
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                    <strong>แนวคิดการทำงาน</strong>: ใช้การทำงานร่วมกันระหว่างโมเดล AI 2 ตัวที่มีบทบาทต่างกัน คือ <strong>Worker Agent</strong> (ผู้สร้าง) และ <strong>Reviewer Agent</strong> (ผู้ตรวจสอบและวิจารณ์เชิงลึก) เพื่อปรับปรุงโค้ดทดสอบก่อนที่จะเข้าสู่ขั้นตอนการคอมไพล์จริง
                  </p>

                  <Mermaid chart={WORKFLOW_AGENT} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>ขั้นตอนการทำงานโดยละเอียด:</span>
                    <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: 0 }}>
                      <li><strong>สร้างแบบร่างแรก</strong>: Worker Agent สร้าง Unit Test ฉบับแรกออกมาตามปกติ</li>
                      <li><strong>ขั้นตอนวิจารณ์ (Critique Phase)</strong>: ส่ง Source Code และ Unit Test ฉบับแรกให้ <strong>Reviewer Agent</strong> ช่วยวิเคราะห์จุดแข็ง จุดอ่อน และระบุแนวทางการพัฒนา เช่น การ Mocking, Edge Cases, หรือความหมายของ Assertion ต่างๆ</li>
                      <li><strong>ขั้นตอนการปรับปรุง (Refinement Phase)</strong>: นำคำวิจารณ์ของ Reviewer Agent กลับมาใส่ใน Prompt เพื่อให้ Worker Agent ปรับปรุงแก้ไขโค้ดการทดสอบจนได้โค้ดขั้นสุดท้าย (Final Test)</li>
                      <li><strong>รันบน Sandbox</strong>: นำโค้ดสุดท้ายมารัน in Sandbox เพื่อเก็บรายงานผลการทดสอบ คัฟเวอร์เรจ และคำประเมินจาก Evaluator Agent</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Workflow 3 (Ultimate Hybrid) */}
              {orchestrationTab === 'ultimate_hybrid' && (
                <div style={{ border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="gradient-text">3. Ultimate Hybrid (Proposed Framework)</span>
                    <code style={{ fontSize: '0.75rem', color: '#818cf8', background: 'rgba(129, 140, 248, 0.1)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>ultimate_hybrid</code>
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                    <strong>แนวคิดการทำงาน</strong>: เป็นกรอบการทำงานขั้นสูงสุดที่ระบบนำเสนอ (Proposed Framework) โดยนำจุดเด่นของ <strong>Best-of-N Candidate Generation</strong>, <strong>Compiler Feedback Self-Healing</strong>, และ <strong>Evaluator-Guided Iterative Refinement</strong> มารวมเข้าไว้ด้วยกันอย่างเป็นระบบเพื่อประสิทธิภาพและความสมบูรณ์แบบของโค้ดที่สูงที่สุด
                  </p>

                  {/* Ultimate Hybrid Sub-Tabs Header */}
                  <div className="tabs-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <button
                      className={`tab-btn pb-2 ${ultimateSubTab === 'flow' ? 'active' : ''}`}
                      onClick={() => setUltimateSubTab('flow')}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                    >
                      1. Flowchart &amp; Grid
                    </button>
                    <button
                      className={`tab-btn pb-2 ${ultimateSubTab === 'details' ? 'active' : ''}`}
                      onClick={() => setUltimateSubTab('details')}
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                    >
                      2. Integration Details (Workflows)
                    </button>
                  </div>

                  {ultimateSubTab === 'flow' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <Mermaid chart={WORKFLOW_ULTIMATE_HYBRID} />

                      <div className="flow-grid-container">
                        <div className="flow-grid-card">
                          <span className="flow-grid-card-number">Phase 1: Ingestion &amp; Healing</span>
                          <span className="flow-node-badge">Best-of-N + Self-Healing</span>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                            ระบบสร้างโค้ดทดสอบเริ่มต้นจำนวน N=3 ชุดในเวลาเดียวกัน โดยกำหนดระดับความหลากหลาย (T=0.5) นำโค้ดเข้า Sandbox หากตัวเลือกใดคอมไพล์หรือรันไม่ผ่าน จะเข้าสู่กระบวนการ Self-Healing ย่อยเป็นจำนวนสูงสุด 2 รอบเพื่อพยายามแก้ไขจุดบกพร่องพื้นฐาน
                          </p>
                        </div>
                        <div className="flow-grid-card">
                          <span className="flow-grid-card-number">Phase 2: Evaluation &amp; Selection</span>
                          <span className="flow-node-badge">Best Score Selection</span>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                            นำตัวเลือกที่ผ่านกระบวนการรักษาแล้วมาคำนวณโค้ดคัฟเวอร์เรจและให้ Evaluator Agent ให้คะแนน คัดเลือกตัวเลือกที่ได้คะแนนประเมินสูงสุดมาพัฒนาต่อ (เป็นตัวแทนที่ดีที่สุดในการเข้าสู่ขั้นตอนถัดไป)
                          </p>
                        </div>
                        <div className="flow-grid-card">
                          <span className="flow-grid-card-number">Phase 3: Guided Optimization</span>
                          <span className="flow-node-badge">Evaluator-Guided Refinement</span>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                            หากคะแนนตัวเลือกสูงสุดยังไม่ผ่านเกณฑ์เป้าหมาย (80/100 คะแนน) ระบบจะส่ง Feedback เจาะจงให้ AI ปรับปรุงโค้ดอีกสูงสุด 2 รอบ และหากพบ Compile error อีก ระบบจะสั่งรัน Self-Healing เพิ่มอีก 1 รอบทันทีก่อนจบกระบวนการ
                          </p>
                        </div>
                        <div className="flow-grid-card">
                          <span className="flow-grid-card-number">Phase 4: Guard Gear</span>
                          <span className="flow-node-badge">Refinement Self-Healing</span>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: '1.4' }}>
                            ในขั้นตอน Guided Refinement หากเกิด Compile errors จากโค้ดที่ได้รับการปรับปรุง ระบบมีกลไกคุ้มกัน (Guard Gear) ที่จะสั่งเรียก Compiler Self-Healing ย่อยให้อีก 1 รอบทันทีเพื่อแก้ไขให้สมบูรณ์แบบก่อนส่งคืนโค้ดทดสอบสุดท้าย
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
                        รายละเอียดกลไกควบคุมคุณภาพเชิงลึกในแต่ละเฟส (Integration of Workflows):
                      </span>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Phase 1 Integration */}
                        <div style={{ borderLeft: '3px solid #818cf8', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#a5b4fc', margin: 0 }}>
                            Phase 1: Ingestion &amp; Healing (ผสมผสาน Best-of-N + Self-Healing)
                          </h4>
                          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: 0 }}>
                            <li>
                              <strong>กลไกการสร้างตัวเลือก (Best-of-N Candidates)</strong>: ป้องกันข้อจำกัดเรื่องความไม่เสถียรของ LLM (Hallucinations) โดยระบบจะสั่งให้สร้างตัวเลือก Unit Test ขึ้นมาพร้อมกัน <strong>N = 3 ชุด</strong> ด้วยอุณหภูมิความหลากหลาย <strong>T = 0.5</strong>
                            </li>
                            <li>
                              <strong>กลไกการเยียวยาข้อผิดพลาด (Compiler Self-Healing)</strong>: นำโค้ดแต่ละชุดเข้าสู่ Sandbox เพื่อตรวจสอบความถูกต้อง หากตัวเลือกรหัสใดคอมไพล์ไม่ผ่าน (เกิดรหัสผิด CSxxxx จาก Roslyn) หรือการรันเทสพัง ระบบจะจับข้อมูล Log stderr/stdout แล้วส่งกลับไปให้ AI แก้ไขทันทีสูงสุดชุดละ <strong>2 รอบ</strong> เพื่อรักษาโครงสร้างโค้ดและคอมไพล์ให้ผ่านสำเร็จ
                            </li>
                          </ul>

                          <details style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                            <summary style={{ fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 600, cursor: 'pointer', outline: 'none', userSelect: 'none' }}>
                              ➔ คลิกเพื่อดูแผนภาพกลไกย่อย (Best-of-N &amp; Self-Healing Diagrams)
                            </summary>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                              <div style={{ flex: '1 1 280px', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem', fontWeight: 700, textAlign: 'center' }}>Best-of-N Candidate Generation</span>
                                <Mermaid chart={WORKFLOW_BEST_OF_N} />
                              </div>
                              <div style={{ flex: '1 1 280px', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                                <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem', fontWeight: 700, textAlign: 'center' }}>Compiler Feedback Self-Healing</span>
                                <Mermaid chart={WORKFLOW_SELF_HEALING} />
                              </div>
                            </div>
                          </details>
                        </div>

                        {/* Phase 2 Integration */}
                        <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#818cf8', margin: 0 }}>
                            Phase 2: Evaluation &amp; Selection (ประเมินคุณภาพและคัดกรอง)
                          </h4>
                          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: 0 }}>
                            <li>
                              <strong>การเก็บตัววัดทางเทคนิค (Sandbox telemetry)</strong>: ทำการรันเทสบนแซนด์บ็อกซ์จริงเพื่อคำนวณ <code>Line Coverage</code> และ <code>Branch Coverage</code> ผ่านเครื่องมือ Coverlet
                            </li>
                            <li>
                              <strong>การให้คะแนนเชิงความหมาย (Evaluator Critique)</strong>: ให้ Evaluator Agent ประเมินความถูกต้องของความหมายโค้ด ความหลากหลายของการ Assert และความถูกต้องของการ Mocking ออกมาเป็นคะแนน (0-100) โดยหากมีตัวเลือกใดรันไม่ผ่านจนรอบสุดท้าย จะถูกปรับลดคะแนนประเมินเหลือ <strong>&le; 10 คะแนน</strong> ทันที เพื่อป้องกันการปะปน และทำการเลือกตัวที่มีคะแนนสูงสุด (Best Candidate) เข้าสู่รอบถัดไป
                            </li>
                          </ul>
                        </div>

                        {/* Phase 3 Integration */}
                        <div style={{ borderLeft: '3px solid #ec4899', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f472b6', margin: 0 }}>
                            Phase 3: Guided Optimization (ขัดเกลาประสิทธิภาพสูงสุดโดยมีผู้แนะนำ)
                          </h4>
                          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: 0 }}>
                            <li>
                              <strong>ระบบวนรอบปรับปรุงตามรีวิว (Evaluator-Guided Iterative Refinement)</strong>: หากตัวเลือกที่ดีที่สุดได้คะแนนน้อยกว่าเกณฑ์คุณภาพมาตรฐาน (<strong>80 คะแนน</strong>) ระบบจะนำรีวิวของ Evaluator Agent (เช่น ข้อเสนอแนะในการ Mock, เพิ่มกรณีขอบ boundary cases) ไปส่งเป็นพร้อมต์ชี้นำเพื่อให้ AI ขยายขอบเขตและขัดเกลาโค้ดเพิ่มขึ้น โดยเปิดโอกาสให้แก้ตัวสูงสุด <strong>2 รอบ</strong>
                            </li>
                          </ul>

                          <details style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.5rem 0.75rem', maxWidth: '600px' }}>
                            <summary style={{ fontSize: '0.78rem', color: '#f472b6', fontWeight: 600, cursor: 'pointer', outline: 'none', userSelect: 'none' }}>
                              ➔ คลิกเพื่อดูแผนภาพกลไกย่อย (Evaluator-Guided Diagram)
                            </summary>
                            <div style={{ marginTop: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                              <span style={{ fontSize: '0.75rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem', fontWeight: 700, textAlign: 'center' }}>Evaluator-Guided Iterative Refinement</span>
                              <Mermaid chart={WORKFLOW_EVALUATOR_GUIDED} />
                            </div>
                          </details>
                        </div>

                        {/* Phase 4 Integration */}
                        <div style={{ borderLeft: '3px solid #a855f7', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#c084fc', margin: 0 }}>
                            Phase 4: Guard Gear (ด่านป้องกันโค้ดเสียระหว่างปรับปรุง)
                          </h4>
                          <ul style={{ paddingLeft: '1.25rem', fontSize: '0.825rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.35rem', margin: 0 }}>
                            <li>
                              <strong>ระบบป้องกันล้มเหลว (Refinement Self-Healing)</strong>: ในขั้นตอน Guided Refinement หากโค้ดที่ผ่านการปรับปรุงใหม่เกิด compile error กลางทาง ระบบจะมีสลักล็อกรักษาความปลอดภัย (Guard Gear) ที่จะส่ง compiler feedback รัน Self-Healing ให้อีก <strong>1 รอบการแก้มือทันที</strong> เพื่อรักษาโค้ดให้ยังสามารถบิวด์และนำส่งคืนได้แบบไม่มีข้อผิดพลาด
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                ระบบมีกระบวนการดำเนินงานหลักทั้งหมด 4 รูปแบบ ซึ่งขับเคลื่อนตั้งแต่ขั้นตอนการวิจัยเชิงลึก (Benchmarking) ไปจนถึงการใช้งานจริงในหน้าเว็บ (Web Application) และการป้องกันคุณภาพโค้ดในเครื่องของผู้พัฒนา (Git Pre-commit Hook) รายละเอียดเชิงลึกมีดังนี้:
              </p>

              {/* 4 Operational Pipelines Sub-Tabs Header */}
              <div className="tabs-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                  className={`tab-btn pb-2 ${pipelineTab === 'benchmark' ? 'active' : ''}`}
                  onClick={() => setPipelineTab('benchmark')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                >
                  1. Benchmark Execution
                </button>
                <button
                  className={`tab-btn pb-2 ${pipelineTab === 'demo' ? 'active' : ''}`}
                  onClick={() => setPipelineTab('demo')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                >
                  2. Playground / Demo API
                </button>
                <button
                  className={`tab-btn pb-2 ${pipelineTab === 'github' ? 'active' : ''}`}
                  onClick={() => setPipelineTab('github')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                >
                  3. GitHub Ingest &amp; PR
                </button>
                <button
                  className={`tab-btn pb-2 ${pipelineTab === 'hook' ? 'active' : ''}`}
                  onClick={() => setPipelineTab('hook')}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                >
                  4. Git Pre-commit Hook
                </button>
              </div>

              {/* Pipeline 1 */}
              {pipelineTab === 'benchmark' && (
                <div style={{ border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    1. Benchmark Execution Flow (กระบวนการรันชุดประเมินผลเชิงเปรียบเทียบ)
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                    <strong>จุดประสงค์</strong>: ใช้สำหรับรันประเมินคุณภาพโมเดล AI กับชุดข้อมูลทดสอบมาตรฐาน (V1 หรือ V2 Dataset) แบบอัตโนมัติผ่านอินเตอร์เฟสบรรทัดคำสั่ง (CLI) เพื่อทำวิจัยและวัดผลเชิงลึก
                  </p>

                  <Mermaid chart={BENCHMARK_FLOW} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>ขั้นตอนการทำงานอย่างละเอียด:</span>
                    <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: 0 }}>
                      <li><strong>การตั้งค่าอินพุต</strong>: นักวิจัยเลือกเวอร์ชันของดาต้าเซ็ต โมเดล และ Workflow ที่จะประเมินผ่าน Argument</li>
                      <li><strong>การรันแซนด์บ็อกซ์แยก</strong>: กระบวนการรันและคำนวณคัฟเวอร์เรจจะกระทำภายใต้โปรเจกต์ <code>BenchmarkSourceProject</code> และ <code>BenchmarkTestProject</code> เพื่อแยกส่วนจากการทดสอบบนเว็บเดโม</li>
                      <li><strong>การเก็บสถิติ</strong>: บันทึกเวลาที่ใช้ (Latency), ค่าใช้จ่ายของโทเค็น (Token Cost) ตามจริง และคะแนนประเมินคุณภาพอย่างละเอียดลงในรายงานเดี่ยวรายข้อก่อนสรุปผลรวม</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Pipeline 2 */}
              {pipelineTab === 'demo' && (
                <div style={{ border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    2. Demo API / Playground Flow (ระบบจัดการการทำเดโม่และ Playground บนหน้าเว็บ)
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                    <strong>จุดประสงค์</strong>: อำนวยความสะดวกให้ผู้ใช้งานสามารถทดสอบวางโค้ด C# สดๆ บนหน้าเว็บเพื่อรันสร้าง Unit Test และตรวจสอบผลลัพธ์ความถูกต้องรวมถึงคัฟเวอร์เรจแบบอินเทอร์แอคทีฟ
                  </p>

                  <Mermaid chart={DEMO_FLOW} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>ขั้นตอนการทำงานอย่างละเอียด:</span>
                    <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: 0 }}>
                      <li><strong>การแยก Sandbox</strong>: โปรเจกต์ที่ใช้ประมวลผลในฝั่งเว็บจะรันบน <code>DemoSourceProject</code> และ <code>DemoTestProject</code> เพื่อไม่ให้ปะปนกับกระบวนการทดสอบวิจัยหลัก</li>
                      <li><strong>ประมวลผลแบบไร้การอ้างอิง (No Reference)</strong>: เนื่องจากเป็นโค้ดใหม่ที่ผู้ใช้วางสดๆ Evaluator Agent จะเปลี่ยนบทบาทมาประเมินคุณภาพชุดทดสอบโดยพิจารณาเชิงเทคนิคและการกระจายกรณีทดสอบแทนการเทียบกับเฉลยของมนุษย์ (Gold Standard)</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Pipeline 3 */}
              {pipelineTab === 'github' && (
                <div style={{ border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    3. GitHub Ingest &amp; PR Creation Flow (ระบบดึงโค้ดและส่ง Pull Request กลับบน GitHub)
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                    <strong>จุดประสงค์</strong>: เพื่อประยุกต์ใช้งานกับโปรเจกต์ภายนอก โดยระบบจะดึงคลาสและเมทอดของโปรเจกต์มาวิเคราะห์ และเปิด Pull Request เสนอโค้ดชุดทดสอบที่ผ่านการบิวด์เรียบร้อยกลับขึ้นไปที่ GitHub ของผู้ใช้
                  </p>

                  <Mermaid chart={GITHUB_PR_FLOW} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>ขั้นตอนการทำงานอย่างละเอียด:</span>
                    <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: 0 }}>
                      <li><strong>Shallow &amp; Sparse Clone</strong>: ป้องกันข้อผิดพลาดความยาวของพาร์ทบน Windows (MAX_PATH) โดยไม่ดึงไฟล์ที่ไม่เกี่ยวข้องอย่าง <code>node_modules</code> หรือเอกสารการบิวด์ ดึงมาเฉพาะคลาสโค้ดต้นฉบับภาษา C# เท่านั้น</li>
                      <li><strong>การสแกนด้วย Roslyn</strong>: คลาสตัวแยกโครงสร้างไวยากรณ์ (Roslyn Parser) จะส่งคืนโครงสร้างเมทอดสาธารณะอย่างละเอียดเพื่อนำมาแสดงบนหน้าเว็บให้เลือกง่ายๆ</li>
                      <li><strong>การเปิด PR</strong>: มีระบบป้องกันความล้มเหลว (Fallback Mechanism) โดยจะลองส่ง PR ไปยังกิ่งหลัก <code>main</code> ก่อน หากไม่มีก็จะสลับไปส่งที่กิ่ง <code>master</code> แทนโดยอัตโนมัติ</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Pipeline 4 */}
              {pipelineTab === 'hook' && (
                <div style={{ border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                    4. CI/CD Git Pre-commit Hook Flow (ด่านสกัดและคุ้มกันข้อบกพร่องก่อนการคอมมิต)
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                    <strong>จุดประสงค์</strong>: เป็นประตูควบคุมคุณภาพระดับ Local ป้องกันไม่ให้นักพัฒนาคอมมิตโค้ดที่มีจุดบกพร่อง บิวด์ไม่ผ่าน หรือมีคัฟเวอร์เรจของการทดสอบต่ำกว่าเกณฑ์ที่กำหนด
                  </p>

                  <Mermaid chart={PRE_COMMIT_FLOW} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1' }}>ขั้นตอนการทำงานอย่างละเอียด:</span>
                    <ol style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '0.25rem', margin: 0 }}>
                      <li><strong>กระบวนการติดตั้ง</strong>: ติดตั้งครั้งเดียวผ่านคำสั่ง PowerShell (<code>.\\install_hook.ps1</code>) เพื่อเชื่อมประสานโปรแกรมควบคุมของระบบเข้ากับโฟลเดอร์ภายในโครงการ <code>.git/hooks/pre-commit</code></li>
                      <li><strong>ระบบจัดเตรียมอัตโนมัติ (Auto-Staging)</strong>: เมื่อ Unit Test ถูกสร้างขึ้นมาและได้รับการตรวจสอบจนผ่านเกณฑ์ 80% คัฟเวอร์เรจแล้ว ตัวคุ้มกันจะสั่ง <code>git add</code> เพื่อนำไฟล์เทสใหม่เข้าไปร่วมอยู่ในคอมมิตเดียวกันของนักพัฒนาทันทีโดยไม่ต้องสั่งงานซ้ำ</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      ) : workspaceMode === 'params' ? (
        <section className="panel" style={{ width: '100%', maxWidth: '100%', gap: '1.5rem', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '1rem', width: '100%' }}>
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.35rem' }}>Report Parameters &amp; Field Descriptions</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
                คำอธิบายพารามิเตอร์และฟิลด์ข้อมูลต่าง ๆ ที่ปรากฏในโครงสร้างรายงานผลลัพธ์ (JSON Report) และตารางสรุปผล
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <button
                className={`tab-btn ${paramsSubTab === 'parameters' ? 'active' : ''}`}
                onClick={() => setParamsSubTab('parameters')}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', borderBottom: 'none' }}
              >
                JSON Report Fields &amp; Schema
              </button>
              <button
                className={`tab-btn ${paramsSubTab === 'summary' ? 'active' : ''}`}
                onClick={() => setParamsSubTab('summary')}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.85rem', borderBottom: 'none' }}
              >
                Summary Report Columns
              </button>
            </div>
          </div>

          {paramsSubTab === 'parameters' ? (
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'stretch', width: '100%' }}>
              {/* Left Column: Sample JSON */}
              <div style={{ flex: '1 1 400px', minWidth: '400px', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#a5b4fc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: 'rgba(99,102,241,0.15)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 800, border: '1px solid rgba(99,102,241,0.3)' }}>JSON EXAMPLE</span>
                  โครงสร้างข้อมูลรายงานผลลัพธ์รายข้อตัวอย่าง (Sample JSON Report Output)
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: '1.5' }}>
                  ตัวอย่างโครงสร้าง JSON เต็มรูปแบบที่ได้รับหลังจากเสร็จสิ้นการประมวลผลของ AI Worker, Sandbox และ Evaluator:
                </p>
                <pre style={{
                  background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '1.25rem', fontSize: '0.78rem', color: '#cbd5e1', maxHeight: '600px', overflowY: 'auto', fontFamily: 'monospace', lineHeight: '1.6', whiteSpace: 'pre-wrap'
                }}>
                  {`{
  "benchmark_id": "CSHARP-BENCH-001",
  "model": "gpt-4.1-mini",
  "success": true,
  "generated_test": "using BenchmarkSourceProject;\\nusing System.Threading.Tasks;\\nusing Xunit;\\n\\nnamespace BenchmarkTestProject.Tests\\n{\\n    public class DownloadServiceTests\\n    {\\n        [Fact]\\n        public async Task DownloadAsync_WhenCalled_ReturnsOK()\\n        {\\n            var service = new DownloadService();\\n            var result = await service.DownloadAsync();\\n            Assert.Equal(\\"OK\\", result);\\n        }\\n    }\\n}",
  "stdout": "Build succeeded!\\nPassed!  - Failed: 0, Passed: 1, Skipped: 0, Total: 1",
  "stderr": "",
  "line_coverage": 100.0,
  "branch_coverage": 100.0,
  "generation_time": 14.08,
  "cost": 0.001198,
  "evaluation_mode": "execution",
  "execution_skipped": false,
  "workflow": "agent",
  "evaluator_score": 95,
  "evaluator_feedback": {
    "score": 95,
    "correctness_rating": 9,
    "compilation_review": "The test compiled and ran successfully.",
    "assertion_quality_review": "The assertion correctly verifies DownloadAsync.",
    "mocking_review": "N/A",
    "coverage_review": "The test achieves 100% line and branch coverage.",
    "issues_found": [],
    "suggestions": [
      "Remove unused using directives."
    ]
  },
  "healing_attempts": 0,
  "healing_log": [],
  "evaluator_loop_log": [],
  "initial_test": "...",
  "best_of_n_candidates": [],
  "worker_prompt_tokens": 12450,
  "worker_completion_tokens": 850,
  "worker_cost": 0.0035,
  "worker_latency": 15.2,
  "evaluator_prompt_tokens": 5120,
  "evaluator_completion_tokens": 620,
  "evaluator_cost": 0.00125,
  "evaluator_latency": 5.4,
  "prompt_tokens": 17570,
  "completion_tokens": 1470,
  "latency": 20.6,
  "initial_line_coverage": 45.5,
  "initial_branch_coverage": 30.0,
  "initial_evaluator_score": 60,
  "initial_success": false
}`}
                </pre>
              </div>

              {/* Right Column: Group Tabs and Descriptions */}
              <div style={{ flex: '2 1 600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="tabs-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <button className={`tab-btn pb-2 ${paramsGroupTab === 'group1' ? 'active' : ''}`} onClick={() => setParamsGroupTab('group1')} style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}>1. Core Execution</button>
                  <button className={`tab-btn pb-2 ${paramsGroupTab === 'group2' ? 'active' : ''}`} onClick={() => setParamsGroupTab('group2')} style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}>2. Self-Healing</button>
                  <button className={`tab-btn pb-2 ${paramsGroupTab === 'group3' ? 'active' : ''}`} onClick={() => setParamsGroupTab('group3')} style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}>3. Telemetry</button>
                  <button className={`tab-btn pb-2 ${paramsGroupTab === 'group4' ? 'active' : ''}`} onClick={() => setParamsGroupTab('group4')} style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}>4. Evaluator Loop</button>
                  <button className={`tab-btn pb-2 ${paramsGroupTab === 'group5' ? 'active' : ''}`} onClick={() => setParamsGroupTab('group5')} style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}>5. Best-of-N</button>
                  <button className={`tab-btn pb-2 ${paramsGroupTab === 'group6' ? 'active' : ''}`} onClick={() => setParamsGroupTab('group6')} style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}>6. Benchmark-Only</button>
                </div>

                {paramsGroupTab === 'group1' && (
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#818cf8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: 'rgba(99,102,241,0.15)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 800, border: '1px solid rgba(99,102,241,0.3)' }}>GROUP 1</span>
                      Core Execution Fields (ข้อมูลพื้นฐานที่จำเป็นสำหรับการสร้างและทดสอบ)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'success', type: 'boolean', desc: 'สถานะการทำบิวด์และรันเทสว่าสำเร็จหรือไม่ (true = คอมไพล์และรันเทสผ่านไม่มีข้อผิดพลาด, false = เกิดข้อผิดพลาดในการคอมไพล์หรือบิวด์ล้มเหลว)', example: 'true / false' },
                        { field: 'generated_test', type: 'string', desc: 'โค้ดโปรแกรม Unit Test ภาษา C# ที่สร้างขึ้นโดย AI มีโครงสร้างครบถ้วนประกอบด้วย using directives, class และ method definitions สำหรับทดสอบ', example: 'using Xunit;\npublic class DivideTests { ... }' },
                        { field: 'stdout', type: 'string', desc: 'ผลลัพธ์การรันคำสั่งจาก dotnet CLI standard output ที่บอกรายละเอียดการบิวด์และรันข้อสอบต่างๆ เช่น จำนวนข้อที่ผ่านหรือล้มเหลว', example: 'Passed! - 3 tests passed, 0 failed' },
                        { field: 'stderr', type: 'string', desc: 'ข้อความแสดงข้อผิดพลาด (Error Log) จากหน้าต่าง dotnet CLI standard error เช่น Compile Error, Build Error หรือ Type Error', example: "error CS0246: The type 'Mock' could not be found" },
                        { field: 'line_coverage', type: 'number (0-100)', desc: 'เปอร์เซ็นต์ความครอบคลุมของบรรทัดโค้ด (Line Coverage) ที่คำนวณโดย Coverlet ระหว่างการเรียก dotnet test โดยแสดงสัดส่วนบรรทัดที่ถูกรันจริงเทียบกับบรรทัดทั้งหมด', example: '85.71' },
                        { field: 'branch_coverage', type: 'number (0-100)', desc: 'เปอร์เซ็นต์ความครอบคลุมของกิ่งเงื่อนไข (Branch Coverage) ที่วิเคราะห์ทุกวิถีการตัดสินใจ เช่น if/else, switch หรือ ternary operators ที่ผ่านการทดสอบ', example: '75.00' },
                        { field: 'cost', type: 'number (USD)', desc: 'ประมาณการค่าใช้จ่ายที่เกิดขึ้นจริงในการเรียกใช้งาน LLM API โดยคำนวณจากปริมาณ Token ขาเข้าและขาออกคูณกับอัตราค่าบริการของโมเดลนั้นๆ', example: '0.00052' },
                        { field: 'latency', type: 'number (seconds)', desc: 'ระยะเวลาที่ใช้ในการประมวลผลทั้งหมดนับตั้งแต่เริ่มส่ง Prompt ไปหา AI จนกระทั่งรันเสร็จสิ้นบน Sandbox และคำนวณคะแนน (วัดตามจริง)', example: '8.34' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 2: Self-Healing Fields */}
                {paramsGroupTab === 'group2' && (
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f59e0b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: 'rgba(245,158,11,0.15)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: '#fbbf24', fontWeight: 800, border: '1px solid rgba(245,158,11,0.3)' }}>GROUP 2</span>
                      Self-Healing Fields (กลุ่มฟิลด์การจัดการคอมไพเลอร์ฟีดแบ็กและเยียวยาแก้ไขตัวเอง)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'healing_attempts', type: 'number (0-3)', desc: 'จำนวนรอบที่ระบบพยายามแก้ไขโค้ดตัวเอง (Self-Healing) เมื่อเกิด Compile Error หรือ Assert ล้มเหลว โดย AI จะได้รับ Log ข้อผิดพลาดเพื่อแก้ไข (0 = ผ่านในการรันรอบแรก)', example: '2' },
                        { field: 'healing_log', type: 'array', desc: 'รายการบันทึก (Logs) ของแต่ละรอบการทำ Healing ประกอบด้วยรอบการแก้ไข ผลลัพธ์ความสำเร็จ และข้อความข้อผิดพลาดที่พบจาก Sandbox', example: '[{ attempt: 1, success: false, errors: "..." }, ...]' },
                        { field: 'healing_log[].attempt', type: 'number', desc: 'ตัวเลขระบุรอบของการทำ Self-Heal (เริ่มต้นจากรอบที่ 1)', example: '1, 2, 3' },
                        { field: 'healing_log[].errors', type: 'string', desc: 'รายละเอียดข้อผิดพลาด (edge cases) และเส้นทางกรณีผิดพลาดได้ครอบคลุมหรือไม่', example: 'Assertions cover the main path but miss the divide-by-zero edge case.' },
                        { field: 'evaluator_feedback.mocking_review', type: 'string', desc: 'บทวิจารณ์การจำลองวัตถุ (Mock/Stub) และการแยกส่วน dependencies ภายนอกออกจากตัวคลาสทดสอบอย่างเหมาะสม เพื่อประสิทธิภาพในการรันแบบแยกเดี่ยว', example: 'Mocking of IRepository is well-structured using Moq.' },
                        { field: 'evaluator_feedback.coverage_review', type: 'string', desc: 'คำวิจารณ์และข้อเสนอแนะเกี่ยวกับค่า Code Coverage ที่ได้ ว่ายังมีส่วนของเงื่อนไขหรือบรรทัดใดที่ยังขาดการทดสอบ', example: 'Branch coverage is lacking for the else-if condition on line 34.' },
                        { field: 'evaluator_feedback.issues_found', type: 'string[]', desc: 'รายการปัญหาที่ตรวจพบโดย Evaluator เช่น ปัญหาชนิดข้อมูลไม่ตรงกัน, การลืมประกาศ namespace หรือการใช้ Assert ผิดลักษณะ', example: '["Missing Assert.Throws for invalid input", "Unused variable detected"]' },
                        { field: 'evaluator_feedback.suggestions', type: 'string[]', desc: 'ข้อเสนอแนะเชิงลึกจากเอเจนต์ประเมินผลสำหรับชี้แนะให้ปรับแต่งขยาย Unit Test เพื่อเพิ่มความปลอดภัยและอัตราความครอบคลุมที่สูงขึ้น', example: '["Add a test for null input", "Use Assert.InRange for boundary values"]' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(16,185,129,0.02)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Granular Telemetry & Initial State Fields */}
                {paramsGroupTab === 'group3' && (
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ec4899', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: 'rgba(236,72,153,0.15)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: '#f472b6', fontWeight: 800, border: '1px solid rgba(236,72,153,0.3)' }}>GROUP 3</span>
                      Granular Telemetry &amp; Initial State Fields (กลุ่มฟิลด์ค่าเก็บวิเคราะห์ทรัพยากรรายเอเจนต์และระดับเริ่มต้น)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'worker_prompt_tokens', type: 'number', desc: 'จำนวน Token ขาเข้าสะสมของ Worker Agent ในระหว่างดำเนินการเขียนโค้ดและรันลูปเยียวยา', example: '8500' },
                        { field: 'worker_completion_tokens', type: 'number', desc: 'จำนวน Token ขาออกสะสมของ Worker Agent ในการประมวลผลคำสั่งทั้งหมด', example: '1240' },
                        { field: 'worker_cost', type: 'number (USD)', desc: 'ต้นทุนสะสมทางการเงินที่เกิดจาก Worker LLM Model เพียงตัวเดียว', example: '0.002450' },
                        { field: 'worker_latency', type: 'number (seconds)', desc: 'ระยะเวลาสะสมที่สูญเสียไปในระบบการสร้างและแก้ไขโค้ดโดย Worker Agent', example: '15.42' },
                        { field: 'evaluator_prompt_tokens', type: 'number', desc: 'จำนวน Token ขาเข้าสะสมของ Evaluator Agent (Grader) ระหว่างการวิเคราะห์คุณภาพเชิงประจักษ์', example: '4210' },
                        { field: 'evaluator_completion_tokens', type: 'number', desc: 'จำนวน Token ขาออกสะสมของ Evaluator Agent ในการตอบสรุปผลลัพธ์ประเมิน', example: '820' },
                        { field: 'evaluator_cost', type: 'number (USD)', desc: 'ต้นทุนสะสมทางการเงินที่เกิดจาก Evaluator LLM Model เพียงตัวเดียว', example: '0.000520' },
                        { field: 'evaluator_latency', type: 'number (seconds)', desc: 'ระยะเวลาสะสมที่สูญเสียไปในการประเมินผลโดย Evaluator Agent', example: '5.42' },
                        { field: 'prompt_tokens', type: 'number', desc: 'จำนวน Token ขาเข้าสะสมรวมของทุกเอเจนต์ในการรันครั้งนี้', example: '17570' },
                        { field: 'completion_tokens', type: 'number', desc: 'จำนวน Token ขาออกสะสมรวมของทุกเอเจนต์ในการรันครั้งนี้', example: '1470' },
                        { field: 'initial_line_coverage', type: 'number (0-100)', desc: 'เปอร์เซ็นต์ Line Coverage แรกสุดที่โมเดลทำได้ก่อนเข้าลูปซ่อมแซมโค้ด', example: '45.50' },
                        { field: 'initial_branch_coverage', type: 'number (0-100)', desc: 'เปอร์เซ็นต์ Branch Coverage แรกสุดที่โมเดลทำได้ก่อนเข้าลูปซ่อมแซมโค้ด', example: '30.00' },
                        { field: 'initial_evaluator_score', type: 'number (0-100)', desc: 'คะแนนประเมินโดย Grader Agent แรกสุดก่อนเข้าลูปซ่อมแซมโค้ด', example: '60' },
                        { field: 'initial_success', type: 'boolean', desc: 'สถานะความสำเร็จในการคอมไพล์และรันผ่านตั้งแต่รอบแรกสุด', example: 'true / false' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(236,72,153,0.02)', border: '1px solid rgba(236,72,153,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(236,72,153,0.1)', color: '#f472b6', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 4: Evaluator-Guided Loop Fields */}
                {paramsGroupTab === 'group4' && (
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#a855f7', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: 'rgba(168,85,247,0.15)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: '#c084fc', fontWeight: 800, border: '1px solid rgba(168,85,247,0.3)' }}>GROUP 4</span>
                      Evaluator-Guided Loop Fields (ฟิลด์วิเคราะห์ประวัติการขัดเกลาและเพิ่มประสิทธิภาพที่มีผู้ชี้นำ)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'evaluator_loop_log', type: 'array | null', desc: 'ประวัติการวนลูปขัดเกลาโค้ดโดยผู้นำทาง (Evaluator-Guided Refinement) ใน workflow แบบมีผู้ชี้แนะ เก็บรวบรวมรอบ คะแนนที่เพิ่มขึ้น และคำติชมป้อนกลับ', example: '[{ attempt: 1, score_before: 62, score_after: 81, success: true }]' },
                        { field: 'evaluator_loop_log[].attempt', type: 'number', desc: 'รอบของการขัดเกลาโค้ดปัจจุบัน (เช่น รอบที่ 1 ถึงรอบสูงสุดที่กำหนด 3 รอบ)', example: '1, 2, 3' },
                        { field: 'evaluator_loop_log[].score_before', type: 'number (0-100)', desc: 'คะแนนคุณภาพประเมินจากเอเจนต์ก่อนที่จะเริ่มรันการขัดเกลาโค้ดในรอบนั้นๆ', example: '62' },
                        { field: 'evaluator_loop_log[].score_after', type: 'number (0-100)', desc: 'คะแนนคุณภาพที่พัฒนาขึ้นหลังจากการขัดเกลาและแก้ไขโค้ดตามรอบประเมินชี้แนะสำเร็จ', example: '81' },
                        { field: 'evaluator_loop_log[].success', type: 'boolean', desc: 'สถานะความสำเร็จในการรันรอบขัดเกลา (เช่น มีการผ่านการประเมินหรือสามารถคอมไพล์ได้สำเร็จไม่มีข้อผิดพลาดขวางกั้น)', example: 'true / false' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(168,85,247,0.02)', border: '1px solid rgba(168,85,247,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 5: Best-of-N Fields */}
                {paramsGroupTab === 'group5' && (
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#06b6d4', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: 'rgba(6,182,212,0.15)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: '#67e8f9', fontWeight: 800, border: '1px solid rgba(6,182,212,0.3)' }}>GROUP 5</span>
                      Best-of-N Candidate Fields (ฟิลด์ผลการทดสอบผู้สมัครคู่ขนานในโมเดลทางเลือก)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'best_of_n_candidates', type: 'array | null', desc: 'รายการของโค้ดผู้สมัครทั้งหมด (Candidates) ที่สร้างขึ้นแบบคู่ขนานในกระบวนการ Best-of-N เพื่อนำมาประเมินและคัดเลือก', example: '[{ candidate_index: 0, score: 80, line_coverage: 85, success: true, ... }]' },
                        { field: 'best_of_n_candidates[].candidate_index', type: 'number (0-2)', desc: 'ดัชนีระบุตัวเลือก Candidate (เช่น ตัวเลือกที่ 0, 1 หรือ 2)', example: '0, 1, 2' },
                        { field: 'best_of_n_candidates[].score', type: 'number (0-100)', desc: 'คะแนนประเมินโดยเอเจนต์สำหรับ Candidate รายนี้ เพื่อนำไปใช้จัดอันดับเปรียบเทียบหาตัวเลือกที่ดีที่สุด (Best Candidate)', example: '75' },
                        { field: 'best_of_n_candidates[].line_coverage', type: 'number (0-100)', desc: 'เปอร์เซ็นต์โค้ดคัฟเวอร์เรจแนวบรรทัดของ Candidate นี้ หลังรันใน Sandbox', example: '88.00' },
                        { field: 'best_of_n_candidates[].branch_coverage', type: 'number (0-100)', desc: 'เปอร์เซ็นต์โค้ดคัฟเวอร์เรจแนวกิ่งเงื่อนไขของ Candidate นี้ หลังรันใน Sandbox', example: '75.00' },
                        { field: 'best_of_n_candidates[].success', type: 'boolean', desc: 'สถานะว่า Candidate นี้รันเทสผ่านและไม่มี Compile Error หรือไม่', example: 'true / false' },
                        { field: 'best_of_n_candidates[].generated_test', type: 'string', desc: 'โค้ด Unit Test ที่สร้างขึ้นสำหรับ Candidate รายนี้', example: 'using Xunit;\npublic class Tests { ... }' },
                        { field: 'initial_test', type: 'string | null', desc: 'ซอร์สโค้ดของ Unit Test ตัวตั้งต้น (Initial Test) ก่อนจะเริ่มกระบวนการขัดเกลาหรือรักษาตัวเองในลูป', example: 'using Xunit;\npublic class Tests { [Fact] ... }' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(6,182,212,0.02)', border: '1px solid rgba(6,182,212,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(6,182,212,0.1)', color: '#67e8f9', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 6: Benchmark-Only Fields */}
                {paramsGroupTab === 'group6' && (
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f87171', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ background: 'rgba(248,113,113,0.15)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: '#fca5a5', fontWeight: 800, border: '1px solid rgba(248,113,113,0.3)' }}>GROUP 6</span>
                      Benchmark-Only Fields (ฟิลด์รายงานเฉพาะการรันชุดประเมินผลเชิงเปรียบเทียบ)
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'version', type: 'string', desc: 'เวอร์ชันของ Dataset เชิงเปรียบเทียบที่ใช้รัน Benchmark (เช่น v1 หรือ v2)', example: 'v1 / v2' },
                        { field: 'workflow', type: 'string', desc: 'ชื่อกระบวนการสั่งการ (Workflow) ที่กำหนดให้ระบบทำ Unit Test Generation ในรอบประเมินผลนี้', example: 'single / agent / self_healing / best_of_n / evaluator_guided / ultimate_hybrid' },
                        { field: 'benchmark_id', type: 'string', desc: 'รหัสประจำตัวของตัวอย่างทดสอบ (Benchmark ID) ภายในชุดข้อมูลที่ถูกหยิบมารัน เช่น BM_001', example: 'BM_001, BM_042' },
                        { field: 'category', type: 'string', desc: 'หมวดหมู่ทางเทคนิคของโค้ดตัวอย่างในคลังทดสอบ เช่น พีชคณิตพื้นฐาน, การประมวลผลสตริง, งานอะซิงโครนัส หรือ LINQ', example: 'arithmetic / string / async / collections' },
                        { field: 'model', type: 'string', desc: 'โมเดลภาษาขนาดใหญ่ (LLM) ที่ได้รับเลือกให้ทำบทบาท Worker Agent ในการเขียน Unit Test', example: 'gptmini / llama / deepseek / deepseekv3' },
                        { field: 'generation_time', type: 'number (seconds)', desc: 'ระยะเวลาในการสร้าง Unit Test โดยโมเดล (หน่วยวินาที) ซึ่งเป็นหนึ่งในมิติของประสิทธิภาพความเร็ว (Latency)', example: '12.5' },
                        { field: 'source_code', type: 'string | null', desc: 'ซอร์สโค้ดภาษา C# ของ Method หรือ Class ตั้งต้นที่เป็นเป้าหมายในการให้ AI เขียนเทสทดสอบ', example: 'public int Add(int a, int b) { return a + b; }' },
                        { field: 'expected_test', type: 'string | null', desc: 'ชุดทดสอบมาตรฐาน (Expected Test/Gold Standard) ที่เขียนโดยมนุษย์ในชุดข้อมูล เพื่อใช้เป็นตัวเปรียบเทียบประเมินความสอดคล้อง', example: '[Fact]\npublic void Add_Returns_Sum() { Assert.Equal(5, obj.Add(2, 3)); }' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(248,113,113,0.02)', border: '1px solid rgba(248,113,113,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(248,113,113,0.1)', color: '#fca5a5', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: 'rgba(52,211,153,0.15)', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 800, border: '1px solid rgba(52,211,153,0.3)' }}>SUMMARY FIELDS</span>
                  Compiled Summary Report Columns (คอลัมน์และโครงสร้างตารางรายงานผลลัพธ์รวมทั้ง 9 รายงาน)
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                  คำอธิบายฟิลด์ข้อมูลตารางสรุปผลลัพธ์ของแต่ละประเภทรายงานที่ถูกรวบรวมจากประวัติการรันและคำนวณผ่านสคริปต์คอมไพเลอร์รายงาน (ข้อมูลจากโฟลเดอร์ <code>results/summary/</code>):
                </p>

                {/* 9 Reports Tab Header */}
                <div className="tabs-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <button
                    className={`tab-btn pb-2 ${summaryReportTab === 'overall' ? 'active' : ''}`}
                    onClick={() => setSummaryReportTab('overall')}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                  >
                    1. Overall Summary
                  </button>
                  <button
                    className={`tab-btn pb-2 ${summaryReportTab === 'category' ? 'active' : ''}`}
                    onClick={() => setSummaryReportTab('category')}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                  >
                    2. Category Performance
                  </button>
                  <button
                    className={`tab-btn pb-2 ${summaryReportTab === 'split' ? 'active' : ''}`}
                    onClick={() => setSummaryReportTab('split')}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                  >
                    3. Category Split
                  </button>
                  <button
                    className={`tab-btn pb-2 ${summaryReportTab === 'cost' ? 'active' : ''}`}
                    onClick={() => setSummaryReportTab('cost')}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                  >
                    4. Cost Efficiency
                  </button>
                  <button
                    className={`tab-btn pb-2 ${summaryReportTab === 'failure' ? 'active' : ''}`}
                    onClick={() => setSummaryReportTab('failure')}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                  >
                    5. Failure Analysis
                  </button>
                  <button
                    className={`tab-btn pb-2 ${summaryReportTab === 'healing' ? 'active' : ''}`}
                    onClick={() => setSummaryReportTab('healing')}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                  >
                    6. Self-Healing Stats
                  </button>
                  <button
                    className={`tab-btn pb-2 ${summaryReportTab === 'latency' ? 'active' : ''}`}
                    onClick={() => setSummaryReportTab('latency')}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                  >
                    7. Latency Analysis
                  </button>
                  <button
                    className={`tab-btn pb-2 ${summaryReportTab === 'evaluator' ? 'active' : ''}`}
                    onClick={() => setSummaryReportTab('evaluator')}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                  >
                    8. Evaluator Guided
                  </button>
                  <button
                    className={`tab-btn pb-2 ${summaryReportTab === 'selector' ? 'active' : ''}`}
                    onClick={() => setSummaryReportTab('selector')}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                  >
                    9. Candidate Selector
                  </button>
                  <button
                    className={`tab-btn pb-2 ${summaryReportTab === 'mutation' ? 'active' : ''}`}
                    onClick={() => setSummaryReportTab('mutation')}
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', borderBottom: 'none' }}
                  >
                    10. Mutation Testing
                  </button>
                </div>

                {/* Description and Grid based on selected tab */}
                {summaryReportTab === 'overall' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>benchmark_summary.json</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>รายงานสรุปความสำเร็จและภาพรวมคะแนนของทุกโมเดล</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'model', type: 'string', desc: 'ชื่อของ AI Model หรือโมเดลจำลองที่นำมาประเมินผลเชิงเปรียบเทียบในการทดลอง', example: '"gpt-4.1-mini", "DeepSeek-V3", "Llama_3_3_70B_Instruct"' },
                        { field: 'pass_rate', type: 'number (0-100)', desc: 'อัตราส่วนการทำงานสำเร็จ (Pass Rate %) คำนวณจากเปอร์เซ็นต์ของจำนวนข้อสอบทั้งหมดใน Dataset ที่ชุดทดสอบของโมเดลสามารถคอมไพล์ผ่านและรันผ่านครบถ้วนไม่มีข้อผิดพลาด', example: '95.51' },
                        { field: 'avg_line_coverage', type: 'number (0-100)', desc: 'ค่าเฉลี่ยเปอร์เซ็นต์ความครอบคลุมบรรทัดคำสั่งโค้ด (Line Coverage) ในคลาสที่ถูกทดสอบจริงหลังจากรันการทดสอบใน Sandbox', example: '98.32' },
                        { field: 'avg_branch_coverage', type: 'number (0-100)', desc: 'ค่าเฉลี่ยเปอร์เซ็นต์ความครอบคลุมกิ่งเงื่อนไขหรือทางเลือกการตัดสินใจตรรกะ (Branch Coverage) ในคลาสเป้าหมายทั้งหมด', example: '88.15' },
                        { field: 'avg_mutation_score', type: 'number (0-100) / null', desc: 'ค่าเฉลี่ยคะแนน Mutation Score (%) ที่คำนวณจากอัตราส่วนของ Mutants ที่ถูกกำจัด (Killed) หรือหมดเวลา (Timeout) ต่อจำนวน Mutants ที่เกิดขึ้นทั้งหมด โดยวิเคราะห์และดำเนินการผ่าน Stryker.NET (มีค่าเฉพาะรอบการทำงานที่เปิดใช้งาน Mutation Testing)', example: '85.71' },
                        { field: 'avg_evaluator_score', type: 'number (0-100)', desc: 'ค่าเฉลี่ยคะแนนเชิงคุณภาพและความรัดกุมในการเขียนเคสทดสอบ (Grader Score) ประเมินความถูกต้องโดย Evaluator Agent (GPT-4)', example: '92.40' },
                        { field: 'avg_healing_attempts', type: 'number (0-3)', desc: 'ค่าเฉลี่ยจำนวนครั้งของการวิ่งกระบวนการแก้ไขเยียวยาข้อผิดพลาด (Self-Healing Loop) เพื่อซ่อมแซมโค้ดที่คอมไพล์พังให้กลับมาใช้งานได้จริง', example: '0.45' },
                        { field: 'avg_generation_time', type: 'number (seconds)', desc: 'ค่าเฉลี่ยเวลารวม (Latency) ที่ใช้ในการประมวลผลสร้างและรันคำสั่งทดสอบจริงต่อ 1 ตัวอย่าง', example: '12.45' },
                        { field: 'avg_cost', type: 'number (USD)', desc: 'ค่าใช้จ่าย API Token เฉลี่ยต่อ 1 ตัวอย่างทดสอบ (Input/Output สะสมรวมทุกเอเจนต์ย่อย)', example: '0.000412' },
                        { field: 'total_cost', type: 'number (USD)', desc: 'ยอดรวมค่าใช้จ่าย API สะสมทั้งหมด (Total cost in USD) ในการรันทุกๆ ตัวอย่างทดสอบของ Dataset ใน Workflow นั้นๆ', example: '0.036668' },
                        { field: 'avg_worker_cost', type: 'number (USD)', desc: 'ค่าใช้จ่าย API ของ Worker Agent เฉลี่ยต่อ 1 ตัวอย่างทดสอบ', example: '0.000120' },
                        { field: 'avg_evaluator_cost', type: 'number (USD)', desc: 'ค่าใช้จ่าย API ของ Evaluator Agent เฉลี่ยต่อ 1 ตัวอย่างทดสอบ', example: '0.000292' },
                        { field: 'avg_worker_latency', type: 'number (seconds)', desc: 'ระยะเวลาประมวลผลเฉลี่ยที่ Worker Agent ใช้ในการสร้าง/แก้ไขโค้ด', example: '7.85' },
                        { field: 'avg_evaluator_latency', type: 'number (seconds)', desc: 'ระยะเวลาประมวลผลเฉลี่ยที่ Evaluator Agent ใช้ในการตรวจคุณภาพ', example: '4.60' },
                        { field: 'avg_initial_line_coverage', type: 'number (0-100)', desc: 'ค่าเฉลี่ยเปอร์เซ็นต์ Line Coverage แรกสุดที่โมเดลทำได้ก่อนเข้าลูปซ่อมแซมโค้ด', example: '55.30' },
                        { field: 'avg_initial_branch_coverage', type: 'number (0-100)', desc: 'ค่าเฉลี่ยเปอร์เซ็นต์ Branch Coverage แรกสุดที่โมเดลทำได้ก่อนเข้าลูปซ่อมแซมโค้ด', example: '42.00' },
                        { field: 'avg_initial_evaluator_score', type: 'number (0-100)', desc: 'ค่าเฉลี่ยคะแนน Evaluator แรกสุดประเมินโดย Grader Agent ก่อนเข้าลูป', example: '62.50' },
                        { field: 'avg_initial_success_rate', type: 'number (0-100)', desc: 'อัตราความสำเร็จในการคอมไพล์ผ่านตั้งแต่การรันรอบแรกสุดโดยเฉลี่ย (%)', example: '57.30' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summaryReportTab === 'category' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>category_summary.json</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>รายงานแจกแจงผลงานแยกตามชนิดหมวดหมู่โค้ด C#</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'category', type: 'string', desc: 'หมวดหมู่ทางเทคนิคหรือคุณลักษณะของโค้ด C# ที่นำมาทดสอบ เช่น async, collections, generics, linq, math, string เป็นต้น', example: '"async", "collections", "generics"' },
                        { field: 'model', type: 'string', desc: 'ชื่อของ AI Model ที่ได้รับการประเมินในหมวดหมู่ข้อมูลนี้', example: '"DeepSeek_V3_2", "gpt_4_1_mini"' },
                        { field: 'pass_rate', type: 'number (0-100)', desc: 'อัตราการทำผ่านของชุดทดสอบ (Pass Rate %) เฉพาะสำหรับตัวอย่างทดสอบที่อยู่ในหมวดหมู่นี้', example: '85.0' },
                        { field: 'avg_line_coverage', type: 'number (0-100)', desc: 'ค่าเฉลี่ยเปอร์เซ็นต์ความครอบคลุมบรรทัดคำสั่งโค้ด (Line Coverage %) ในคลาสเป้าหมายสำหรับหมวดหมู่นี้', example: '78.50' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summaryReportTab === 'split' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>synthetic_summary.json / real_world_summary.json</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>รายงานแยกประสิทธิภาพโค้ดจำลองเชิงทฤษฎี VS โค้ดใช้งานจริง</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'total', type: 'number', desc: 'จำนวนตัวอย่างทดสอบทั้งหมด (Benchmark samples) ที่จัดอยู่ในกลุ่มย่อยนี้', example: '89' },
                        { field: 'category', type: 'string', desc: 'ประเภทกลุ่มชุดข้อมูลที่ถูกแยกวิเคราะห์ ได้แก่ synthetic (ข้อมูลสังเคราะห์เชิงทฤษฎี) หรือ real_world (ข้อมูลโค้ดจากโปรเจกต์ใช้งานจริง)', example: '"synthetic", "real_world"' },
                        { field: 'pass_rate_pct', type: 'number (0-100)', desc: 'อัตราส่วนรันผ่าน Sandbox (%) เฉพาะของกลุ่มข้อมูลย่อยนี้', example: '57.30' },
                        { field: 'avg_line_coverage_pct', type: 'number (0-100)', desc: 'เปอร์เซ็นต์ความครอบคลุมของบรรทัดโค้ดเฉลี่ยสำหรับกลุ่มข้อมูลนี้', example: '56.18' },
                        { field: 'avg_branch_coverage_pct', type: 'number (0-100)', desc: 'เปอร์เซ็นต์ความครอบคลุมของกิ่งเงื่อนไขตรรกะเฉลี่ยสำหรับกลุ่มข้อมูลนี้', example: '56.18' },
                        { field: 'avg_evaluator_score', type: 'number (0-100)', desc: 'ค่าเฉลี่ยคะแนนเชิงคุณภาพ (Semantic Score) ที่ได้รับจาก Grader Agent ในกลุ่มนี้', example: '75.0' },
                        { field: 'max_evaluator_score', type: 'number (0-100)', desc: 'คะแนน Grader Score สูงสุดที่โมเดลนี้ทำได้ในกลุ่มข้อมูลนี้', example: '100' },
                        { field: 'min_evaluator_score', type: 'number (0-100)', desc: 'คะแนน Grader Score ต่ำสุดที่โมเดลนี้ได้รับในกลุ่มข้อมูลนี้', example: '30' },
                        { field: 'avg_generation_time_sec', type: 'number (seconds)', desc: 'ค่าเฉลี่ยระยะเวลาที่ใช้ในการประมวลผลต่อ 1 ตัวอย่างทดสอบในกลุ่มนี้', example: '42.48' },
                        { field: 'total_generation_time_sec', type: 'number (seconds)', desc: 'ยอดรวมเวลาทั้งหมดที่ใช้ไปกับการประมวลผลสร้างโค้ดทั้งหมดสำหรับกลุ่มนี้', example: '3780.88' },
                        { field: 'avg_cost_usd', type: 'number (USD)', desc: 'ค่าใช้จ่ายเฉลี่ยต่อ 1 ตัวอย่างทดสอบของกลุ่มข้อมูลนี้', example: '0.002994' },
                        { field: 'total_cost_usd', type: 'number (USD)', desc: 'ยอดรวมค่าใช้จ่าย API สุทธิทั้งหมดสำหรับกลุ่มข้อมูลย่อยนี้', example: '0.266472' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summaryReportTab === 'cost' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>cost_efficiency.json</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>วิเคราะห์ความคุ้มค่าของอัตราคัฟเวอร์เรจทดสอบที่ได้ ต่อค่าใช้จ่ายเงินดอลลาร์</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'model', type: 'string', desc: 'ชื่อของ AI Model ที่นำมาประเมินประสิทธิภาพด้านความคุ้มค่า', example: '"gpt_4_1_mini", "DeepSeek_V3_2"' },
                        { field: 'avg_coverage', type: 'number (0-100)', desc: 'ค่าเฉลี่ยเปอร์เซ็นต์ความครอบคลุมรหัสโค้ด (Coverage %) ที่โมเดลทำได้สำเร็จ', example: '56.18' },
                        { field: 'avg_cost', type: 'number (USD)', desc: 'ค่าใช้จ่ายสะสมเฉลี่ยรวมต่อหนึ่งตัวอย่างทดลอง (USD)', example: '0.002994' },
                        { field: 'avg_worker_cost', type: 'number (USD)', desc: 'ค่าเฉลี่ยต้นทุนสะสมทางการเงินที่เกิดจาก Worker LLM Model ต่อหนึ่งตัวอย่างทดสอบ (USD)', example: '0.002450' },
                        { field: 'avg_evaluator_cost', type: 'number (USD)', desc: 'ค่าเฉลี่ยต้นทุนสะสมทางการเงินที่เกิดจาก Evaluator LLM Model ต่อหนึ่งตัวอย่างทดสอบ (USD)', example: '0.000520' },
                        { field: 'coverage_per_dollar', type: 'number', desc: 'ดัชนีประสิทธิภาพความครอบคลุมต่อหนึ่งดอลลาร์สหรัฐ (ค่ายิ่งสูงยิ่งแสดงถึงประสิทธิภาพความประหยัดและคุ้มค่าที่สุด)', example: '18763.70' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summaryReportTab === 'failure' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>failure_analysis.json</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>วิเคราะห์ความล้มเหลวและบั๊กคอมไพล์เลอร์ที่พบสำหรับแต่ละโมเดล</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'model', type: 'string', desc: 'ชื่อของ AI Model ที่เกิดข้อผิดพลาดในการประมวลผลทดสอบ', example: '"Llama_3_3_70B_Instruct", "DeepSeek_V3_2"' },
                        { field: 'failure_type', type: 'string', desc: 'ประเภทของข้อผิดพลาดที่เกิดขึ้น เช่น Compile Error (คอมไพล์ไม่ผ่าน), Execution Error (รันเทสล้มเหลว) หรือ Timeout', example: '"Compile Error", "Execution Error"' },
                        { field: 'count', type: 'number', desc: 'จำนวนครั้งที่เกิดความล้มเหลวตามประเภทนั้น ๆ ตลอดการทดสอบในดาต้าเซ็ต', example: '86' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summaryReportTab === 'healing' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>self_healing_analysis.json</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>สถิติความสำเร็จของการวนลูปเยียวยาโค้ดพัง (Compile Self-Healing)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'model', type: 'string', desc: 'ชื่อของ AI Model ที่ใช้ในระบบเยียวยาโค้ดอัตโนมัติ (Self-Healing)', example: '"DeepSeek_V3_2", "gpt_4_1_mini"' },
                        { field: 'total_runs', type: 'number', desc: 'จำนวนการทดสอบรันทั้งหมดใน Workflow นี้', example: '89' },
                        { field: 'initial_success_count', type: 'number', desc: 'จำนวนข้อทดสอบที่คอมไพล์และรันผ่านสมบูรณ์ตั้งแต่รอบแรกสุด (ไม่ต้องเรียก Self-Healing)', example: '51' },
                        { field: 'initial_compile_rate', type: 'number (0-100)', desc: 'อัตราความสำเร็จในการคอมไพล์ผ่านตั้งแต่รอบแรกสุด (%)', example: '57.30' },
                        { field: 'final_compile_rate', type: 'number (0-100)', desc: 'อัตราความสำเร็จในการคอมไพล์ผ่านสุดท้ายหลังจากผ่านกระบวนการ Self-Healing ทั้งหมดเรียบร้อยแล้ว (%)', example: '57.30' },
                        { field: 'healed_success_count', type: 'number', desc: 'จำนวนตัวอย่างทดสอบที่รอบแรกคอมไพล์พัง แต่ได้รับการแก้ไขเยียวยาด้วยเอเจนต์ย่อยจนรันผ่านได้สำเร็จในรอบถัดไป', example: '12' },
                        { field: 'healing_success_rate', type: 'number (0-100)', desc: 'อัตราความสำเร็จของลูปการรักษาเยียวยาโค้ดคำนวณจากข้อที่ได้รับการเยียวยาสำเร็จเทียบกับข้อที่เสียทั้งหมด (%)', example: '31.57' },
                        { field: 'healed_fail_count', type: 'number', desc: 'จำนวนตัวอย่างทดสอบที่พยายามรันเยียวยาครบ 3 รอบการพยายามแล้วแต่ก็ยังคงบิวด์ไม่ผ่าน', example: '26' },
                        { field: 'healed_in_1_attempts', type: 'number', desc: 'จำนวนข้อที่เยียวยาซ่อมแซมสำเร็จในลูปการพยายามรอบที่ 1', example: '8' },
                        { field: 'healed_in_2_attempts', type: 'number', desc: 'จำนวนข้อที่เยียวยาซ่อมแซมสำเร็จในลูปการพยายามรอบที่ 2', example: '3' },
                        { field: 'healed_in_3_attempts', type: 'number', desc: 'จำนวนข้อที่เยียวยาซ่อมแซมสำเร็จในลูปการพยายามรอบที่ 3', example: '1' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summaryReportTab === 'latency' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>latency_analysis.json</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>วิเคราะห์ความเร็วการตอบสนองและระยะเวลาประมวลผลของโมเดล</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'model', type: 'string', desc: 'ชื่อของ AI Model ที่เข้าประเมินค่าความหน่วยเวลา (Latency)', example: '"DeepSeek_V3_2", "gpt_4_1_mini"' },
                        { field: 'avg_time', type: 'number (seconds)', desc: 'ระยะเวลาประมวลผลสร้างโค้ดเฉลี่ยต่อหนึ่งตัวอย่างทดสอบ (วินาที)', example: '42.48' },
                        { field: 'max_time', type: 'number (seconds)', desc: 'ระยะเวลาสูงสุดที่ใช้ไปในการรันข้อที่ช้าที่สุด (วินาที)', example: '64.06' },
                        { field: 'min_time', type: 'number (seconds)', desc: 'ระยะเวลาต่ำสุดที่ใช้ในการรันข้อที่เร็วที่สุด (วินาที)', example: '14.08' },
                        { field: 'total_time', type: 'number (seconds)', desc: 'เวลารวมสะสมทั้งหมดที่ใช้ไปกับการประมวลผลรันทั้งชุดข้อมูล (วินาที)', example: '3780.88' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summaryReportTab === 'evaluator' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>evaluator_summary.json</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>รายงานวิเคราะห์ประสิทธิภาพการขัดเกลาโค้ดโดยผู้ชี้แนะ (Evaluator-Guided Refinement)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'model', type: 'string', desc: 'ชื่อของ AI Model ที่ได้รับการประเมินผลเชิงเปรียบเทียบในกระบวนการขัดเกลา', example: '"gptmini", "deepseekv3"' },
                        { field: 'total_runs', type: 'number', desc: 'จำนวนรอบรันการสร้าง Unit Test ทั้งหมดใน Dataset สำหรับ Workflow นี้', example: '89' },
                        { field: 'avg_initial_score', type: 'number (0-100)', desc: 'ค่าเฉลี่ยคะแนนความพึงพอใจประเมินคุณภาพในรอบแรกสุดก่อนเข้าลูปขัดเกลาโค้ด (Initial Evaluator Score)', example: '62.50' },
                        { field: 'avg_final_score', type: 'number (0-100)', desc: 'ค่าเฉลี่ยคะแนนความพึงพอใจการประเมินคุณภาพสุดท้าย หลังเสร็จสิ้นการขัดเกลา (Final Evaluator Score)', example: '85.40' },
                        { field: 'avg_improvement', type: 'number', desc: 'ค่าเฉลี่ยของส่วนต่างคะแนนประเมินคุณภาพที่พัฒนาเพิ่มขึ้นระหว่างคะแนนรอบสุดท้ายเทียบกับรอบแรกสุด', example: '22.90' },
                        { field: 'runs_needing_refinement', type: 'number', desc: 'จำนวนรอบรันการสร้างเทสที่ต้องได้รับการปรับปรุงโค้ดขัดเกลาจริงเนื่องจากคะแนนรอบแรกไม่ผ่านเกณฑ์', example: '38' },
                        { field: 'refinement_rate_pct', type: 'number (0-100)', desc: 'เปอร์เซ็นต์อัตราการต้องเข้าสู่ลูปขัดเกลาโค้ดจริงของตัวอย่างทั้งหมด (%)', example: '42.70' },
                        { field: 'refinement_success_rate_pct', type: 'number (0-100)', desc: 'อัตราความสำเร็จเฉลี่ยในการพัฒนาคะแนนโค้ดให้สูงขึ้นหลังเข้าสู่กระบวนการขัดเกลา (%)', example: '78.95' },
                        { field: 'refined_in_1_attempts', type: 'number', desc: 'จำนวนครั้งที่ขัดเกลาและพัฒนาคุณภาพจนผ่านเกณฑ์สำเร็จในลูปการขัดเกลารอบแรก', example: '20' },
                        { field: 'refined_in_2_attempts', type: 'number', desc: 'จำนวนครั้งที่ขัดเกลาและพัฒนาคุณภาพจนผ่านเกณฑ์สำเร็จในลูปการขัดเกลารอบที่ 2', example: '6' },
                        { field: 'refined_in_3_attempts', type: 'number', desc: 'จำนวนครั้งที่ขัดเกลาและพัฒนาคุณภาพจนผ่านเกณฑ์สำเร็จในลูปการขัดเกลารอบที่ 3', example: '4' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summaryReportTab === 'mutation' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>mutation_analysis.json</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>รายงานสรุปและเปรียบเทียบสถิติการทำ Mutation Testing (Stryker.NET) ของแต่ละโมเดล</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'model', type: 'string', desc: 'ชื่อของ AI Model ที่เข้าทดสอบ', example: '"gptmini", "deepseekv3"' },
                        { field: 'total_runs', type: 'number', desc: 'จำนวนรอบรันการทดสอบ Unit Test ทั้งหมดของ Dataset', example: '89' },
                        { field: 'runs_with_mutation', type: 'number', desc: 'จำนวนรอบรันที่ทำงานร่วมกับการตรวจวิเคราะห์ Mutation Testing สำเร็จ', example: '88' },
                        { field: 'avg_mutation_score', type: 'number (0-100) / null', desc: 'ค่าเฉลี่ยคะแนน Mutation Score (%) ที่ประเมินโดย Stryker.NET (สัดส่วนของ Mutants ที่ถูก Killed/Timeout ต่อ active mutants)', example: '85.71' },
                        { field: 'avg_total_mutants', type: 'number', desc: 'ค่าเฉลี่ยจำนวน Mutants ทั้งหมดที่เกิดขึ้นในแต่ละรอบทดสอบ', example: '25.40' },
                        { field: 'avg_killed_mutants', type: 'number', desc: 'ค่าเฉลี่ยจำนวน Mutants ที่ถูกชุดทดสอบฆ่าตาย (Killed) ในแต่ละรอบ', example: '20.10' },
                        { field: 'avg_survived_mutants', type: 'number', desc: 'ค่าเฉลี่ยจำนวน Mutants ที่มีชีวิตรอด (Survived - ชุดทดสอบครอบคลุมไม่ถึงหรือขาด Assertion)', example: '3.40' },
                        { field: 'avg_ignored_mutants', type: 'number', desc: 'ค่าเฉลี่ยจำนวน Mutants ที่ถูกละเว้น/ไม่ประเมิน (Ignored - เช่น คอมไพล์ไม่ผ่านหรือไม่ถูกเรียก)', example: '1.20' },
                        { field: 'avg_timeout_mutants', type: 'number', desc: 'ค่าเฉลี่ยจำนวน Mutants ที่ทำให้ลูปทำงานเกินกำหนดเวลารัน (Timeout)', example: '0.70' },
                        { field: 'total_mutants_count', type: 'number', desc: 'ผลรวมสะสมของ Mutants ทั้งหมดที่เกิดขึ้นจากการทดสอบทุกตัวอย่างโค้ดในโมเดลนี้', example: '2260' },
                        { field: 'total_killed_mutants', type: 'number', desc: 'ผลรวมสะสมของ Mutants ที่ถูกฆ่าตายทั้งหมดในโมเดลนี้', example: '1850' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {summaryReportTab === 'selector' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.25)' }}>selector_summary.json</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>รายงานเปรียบเทียบสถิติและวิเคราะห์ประสิทธิภาพของตัวคัดเลือกผู้สมัครที่ดีที่สุด (Candidate Selector)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                      {[
                        { field: 'model', type: 'string', desc: 'ชื่อของ AI Model ที่เข้าประเมินผลเชิงเปรียบเทียบในกระบวนการคัดสรรผู้สมัครที่ดีที่สุด', example: '"gptmini", "deepseekv3"' },
                        { field: 'total_runs', type: 'number', desc: 'จำนวนรอบรันการทดสอบสร้าง Unit Test ทั้งหมดของ Dataset สำหรับ Workflow นี้', example: '89' },
                        { field: 'avg_first_candidate_score', type: 'number (0-100)', desc: 'ค่าเฉลี่ยคะแนนความพึงพอใจการประเมินคุณภาพ (Grader Score) ของ Candidate ตัวแรกสุด (Index 0)', example: '64.20' },
                        { field: 'avg_first_candidate_coverage', type: 'number (0-100)', desc: 'ค่าเฉลี่ยเปอร์เซ็นต์ความครอบคลุมรหัสโค้ด (Line Coverage %) ของ Candidate ตัวแรกสุด', example: '70.15' },
                        { field: 'avg_selected_score', type: 'number (0-100)', desc: 'ค่าเฉลี่ยคะแนนประเมินคุณภาพของ Candidate ที่ได้รับเลือกให้เป็น Best Candidate', example: '82.40' },
                        { field: 'avg_selected_coverage', type: 'number (0-100)', desc: 'ค่าเฉลี่ยเปอร์เซ็นต์ความครอบคลุมบรรทัดรหัสโค้ดของ Candidate ที่ได้รับเลือกเป็น Best Candidate', example: '89.32' },
                        { field: 'avg_score_improvement', type: 'number', desc: 'ค่าเฉลี่ยผลต่างคะแนนประเมินคุณภาพที่พัฒนาสูงขึ้นเมื่อสลับไปเลือกใช้ Candidate ที่ดีที่สุดแทนตัวแรกสุด', example: '18.20' },
                        { field: 'avg_coverage_improvement', type: 'number', desc: 'ค่าเฉลี่ยผลต่างเปอร์เซ็นต์ความครอบคลุมบรรทัดรหัสโค้ด (Coverage %) ที่พัฒนาเพิ่มขึ้นหลังคัดเลือก Candidate', example: '19.17' },
                        { field: 'selection_changed_pct', type: 'number (0-100)', desc: 'เปอร์เซ็นต์ที่ระบบเลือก Candidate ตัวอื่นแทน Candidate ตัวแรก (Index 0) เนื่องจากมีผลงานหรือคะแนนดีกว่า (%)', example: '35.40' }
                      ].map((p) => (
                        <div key={p.field} style={{ background: 'rgba(52,211,153,0.02)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: '10px', padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <code style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>{p.field}</code>
                            <span style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{p.type}</span>
                          </div>
                          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.4rem 0', lineHeight: '1.5' }}>{p.desc}</p>
                          <div style={{ fontSize: '0.72rem', color: '#475569', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                            Ex: {p.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </section>
      ) : (
        <main className="main-grid">
          {/* Left Column: Code Input & Config */}
          <section className="panel">
            <h2 className="panel-title">
              {workspaceMode === 'github' ? 'GitHub Ingestion Workspace' : 'Developer Workspace'}
            </h2>

            {workspaceMode === 'manual' ? (
              <div className="form-group">
                <label htmlFor="source-code-editor">
                  C# Target Method / Class {selectedFilePath && <span style={{ color: '#818cf8', fontSize: '0.75rem', marginLeft: '0.5rem' }}>({selectedFilePath})</span>}
                </label>
                <textarea
                  id="source-code-editor"
                  className="editor-textarea"
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  placeholder="Paste C# target code here..."
                  disabled={loading}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4" style={{ marginBottom: '1.5rem' }}>

                {/* GitHub PAT input */}
                <div className="form-group">
                  <label htmlFor="github-pat" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    GitHub Personal Access Token
                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>(required for Create PR)</span>
                  </label>
                  <input
                    id="github-pat"
                    type="password"
                    className="select-control"
                    style={{ width: '100%', height: '42px', padding: '0 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#f1f5f9', boxSizing: 'border-box' }}
                    value={githubPat}
                    onChange={(e) => setGithubPat(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  />
                </div>

                {/* Repo URL input */}
                <div className="form-group">
                  <label htmlFor="github-url">GitHub Repository URL</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      id="github-url"
                      type="text"
                      className="select-control"
                      style={{ flex: 1, height: '42px', padding: '0 0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#f1f5f9' }}
                      value={githubRepoUrl}
                      onChange={(e) => setGithubRepoUrl(e.target.value)}
                      placeholder="https://github.com/user/repo"
                      disabled={githubLoading}
                    />
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ margin: 0, padding: '0 1.25rem', height: '42px', whiteSpace: 'nowrap' }}
                      onClick={handleGithubImport}
                      disabled={githubLoading || !githubRepoUrl}
                    >
                      {githubLoading ? 'Cloning...' : 'Load'}
                    </button>
                  </div>
                </div>

                {githubLoading && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    <div className="spinner" style={{ margin: '0 auto 0.5rem auto' }} />
                    <p className="text-xs">Cloning repository &amp; scanning C# syntax...</p>
                  </div>
                )}

                {/* Selected method indicator */}
                {selectedMethodName && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected Method</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#a5b4fc' }}>
                        <span style={{ color: '#818cf8', marginRight: '0.3rem' }}>🛠️</span>{selectedMethodName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.15rem' }}>{selectedFilePath}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethodName('');
                        setSelectedFilePath('');
                        setSourceCode('');
                        setResult(null);
                        setError(null);
                      }}
                      style={{ flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.4rem 0.85rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', transition: 'all 0.15s ease' }}
                    >
                      ↩ Change
                    </button>
                  </div>
                )}

                {/* File/method browser shown when repo loaded and no method selected yet */}
                {githubRepoData && !selectedMethodName && (
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.75rem', background: 'rgba(0,0,0,0.1)' }}>
                    <span className="text-xs font-semibold text-slate-400" style={{ display: 'block', marginBottom: '0.5rem' }}>Select Method to Test:</span>
                    {githubRepoData.files.length === 0 ? (
                      <p className="text-xs text-slate-500">No C# files containing public methods found.</p>
                    ) : (
                      githubRepoData.files.map((file, fIdx) => (
                        <div key={fIdx} style={{ marginBottom: '0.75rem' }}>
                          <div className="text-xs font-bold text-slate-300" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', paddingBottom: '0.25rem', marginBottom: '0.25rem' }}>
                            <svg className="w-3 h-3" style={{ color: '#818cf8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                            {file.filePath}
                          </div>
                          <div style={{ paddingLeft: '0.5rem' }}>
                            {file.methods.map((method, mIdx) => (
                              <button
                                key={mIdx}
                                type="button"
                                onClick={() => {
                                  const classWrap = `namespace ${file.namespaceName || 'BenchmarkSourceProject'}
{
    public class ${file.className}
    {
${method.body.split('\n').map(line => '        ' + line).join('\n')}
    }
}`;
                                  setSourceCode(classWrap);
                                  setSelectedFilePath(file.filePath);
                                  setSelectedMethodName(method.methodName);
                                  setResult(null);
                                  setError(null);
                                  // Stay in github mode ⌨️ do NOT switch to manual
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  textAlign: 'left',
                                  padding: '0.35rem 0.5rem',
                                  margin: '0.15rem 0',
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#94a3b8',
                                  fontSize: '0.75rem',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <span style={{ color: '#818cf8', marginRight: '0.25rem' }}>⌨️</span>
                                {method.methodName}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="model-select">Select AI Worker Model</label>
              <select
                id="model-select"
                className="select-control"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={loading}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Evaluator Model (Fixed for now) */}
            <div className="form-group">
              <label htmlFor="evaluator-model-select" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>AI Evaluator Model</span>
                <span style={{ fontSize: '0.65rem', color: '#818cf8', background: 'rgba(129,140,248,0.1)', padding: '0.05rem 0.3rem', borderRadius: '4px', border: '1px solid rgba(129,140,248,0.2)', fontWeight: 700 }}>FIXED</span>
              </label>
              <select
                id="evaluator-model-select"
                className="select-control"
                value="gpt4"
                disabled={true}
                style={{ opacity: 0.7, cursor: 'not-allowed', background: 'rgba(255,255,255,0.02)', borderStyle: 'dashed' }}
              >
                <option value="gpt4">GPT-4o (Azure) - Grader &amp; Reviewer</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="workflow-select">Orchestration Workflow</label>
              <select
                id="workflow-select"
                className="select-control"
                value={workflow}
                onChange={(e) => setWorkflow(e.target.value)}
                disabled={loading}
              >
                <option value="single">Single-pass (Direct Prompt)</option>
                <option value="agent">Worker + Reviewer Agent (Critique)</option>
                <option value="self_healing">Self-Healing Loop (Compiler Feedback)</option>
                <option value="best_of_n">Best-of-N Candidate Selection</option>
                <option value="evaluator_guided">Evaluator-Guided Refinement Loop</option>
                <option value="ultimate_hybrid">Ultimate Hybrid (Best-of-N + Healing + Guided Refinement)</option>
              </select>
            </div>

            {/* Option to toggle Mutation Testing */}
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}>
              <input
                id="run-mutation-checkbox"
                type="checkbox"
                checked={runMutation}
                onChange={(e) => setRunMutation(e.target.checked)}
                disabled={loading}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#f97316' }}
              />
              <label htmlFor="run-mutation-checkbox" style={{ cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem', width: '100%' }}>
                <span>🧬 Run Stryker Mutation Testing</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>(adds ~30-45s)</span>
              </label>
            </div>

            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={loading || (workspaceMode === 'github' && !selectedMethodName)}
              style={{ opacity: loading || (workspaceMode === 'github' && !selectedMethodName) ? 0.5 : 1, cursor: loading || (workspaceMode === 'github' && !selectedMethodName) ? 'not-allowed' : 'pointer' }}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Processing Agents...
                </>
              ) : (
                'Run AI Test Generation'
              )}
            </button>

            {error && (
              <div className="console-logs console-error">
                <strong>Error Encountered:</strong>
                <p>{error}</p>
              </div>
            )}
          </section>

          {/* Right Column: Dynamic Results Tab Panel */}
          <section className="panel">
            <h2 className="panel-title">Execution &amp; Evaluation Feedback</h2>

            {/* Performance Stats Banner */}
            {result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', width: '100%' }}>
                <div className="flex gap-6 justify-between p-3 border border-[rgba(255,255,255,0.06)] rounded-lg bg-[rgba(255,255,255,0.01)] text-xs text-slate-400">
                  <div><strong>Latency:</strong> {result.latency}s</div>
                  <div><strong>Total Cost:</strong> ${result.cost.toFixed(5)}</div>
                  <div><strong>Self-Heal Retries:</strong> {result.healing_attempts}</div>
                  <div><strong>Evaluator Model:</strong> <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{result.evaluator_model || 'GPT-4o'}</span></div>
                  <button
                    onClick={() => setShowTelemetry(!showTelemetry)}
                    style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', padding: 0 }}
                  >
                    {showTelemetry ? 'Hide Details ▲' : 'Show Telemetry ▼'}
                  </button>
                </div>

                {showTelemetry && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    padding: '1rem',
                    border: '1px solid rgba(99, 102, 241, 0.15)',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.02)',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {/* Column 1: Initial State */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderRight: '1px solid rgba(255,255,255,0.06)', paddingRight: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.2rem', marginBottom: '0.2rem' }}>
                        Initial State (Before loops)
                      </div>
                      <div><strong>Success:</strong> <span style={{ color: result.initial_success ? '#34d399' : '#f87171' }}>{result.initial_success ? 'PASSED' : 'FAILED'}</span></div>
                      <div><strong>Line Coverage:</strong> {result.initial_line_coverage ?? 0}%</div>
                      <div><strong>Branch Coverage:</strong> {result.initial_branch_coverage ?? 0}%</div>
                      <div><strong>Evaluator Score:</strong> {result.initial_evaluator_score ?? 0}/100</div>
                    </div>

                    {/* Column 2: Agent Footprints */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <div style={{ fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.2rem', marginBottom: '0.2rem' }}>
                        Agent Telemetry Breakdowns
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ fontWeight: 600, color: '#a5b4fc' }}>Worker Agent (LLM Creator):</div>
                        <div>• Latency: {result.worker_latency ?? 0}s</div>
                        <div>• Cost: ${result.worker_cost?.toFixed(5) ?? '0.00000'}</div>
                        <div>• Tokens: {result.worker_prompt_tokens ?? 0} prompt / {result.worker_completion_tokens ?? 0} completion</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ fontWeight: 600, color: '#f43f5e' }}>Evaluator Agent (Grader):</div>
                        <div>• Latency: {result.evaluator_latency ?? 0}s</div>
                        <div>• Cost: ${result.evaluator_cost?.toFixed(5) ?? '0.00000'}</div>
                        <div>• Tokens: {result.evaluator_prompt_tokens ?? 0} prompt / {result.evaluator_completion_tokens ?? 0} completion</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="tabs-header">
              <button
                className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
                onClick={() => setActiveTab('code')}
              >
                Generated Test
              </button>
              <button
                className={`tab-btn ${activeTab === 'execution' ? 'active' : ''}`}
                onClick={() => setActiveTab('execution')}
              >
                Execution logs
              </button>
              <button
                className={`tab-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
                onClick={() => setActiveTab('evaluation')}
              >
                AI Evaluation
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 flex flex-col gap-4">
              {!result && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 text-sm text-center">
                  <svg className="w-12 h-12 mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p>Click &quot;Run AI Test Generation&quot; to start the execution engine.</p>
                </div>
              )}

              {loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 text-sm text-center">
                  <div className="spinner mb-4" style={{ width: '32px', height: '32px', borderWidth: '4px' }} />
                  <p>Spawning child processes...</p>
                  <p className="text-xs text-slate-500 mt-1">Compiling sandboxes, running Coverlet analyzer and Stryker Mutation Testing</p>
                </div>
              )}

              {result && (
                <>
                  {/* Tab 1: Code */}
                  {activeTab === 'code' && (
                    <div className="flex flex-col gap-4">
                      <div className="code-viewer">
                        <code>{result.generated_test}</code>
                      </div>
                      {githubTempDir && selectedFilePath && (
                        <div className="flex flex-col gap-2 p-3 border border-[rgba(255,255,255,0.06)] rounded-lg bg-[rgba(255,255,255,0.01)]">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                            <div>
                              <span className="text-xs font-semibold text-slate-300" style={{ display: 'block' }}>GitHub Export Action</span>
                              <span className="text-xs text-slate-500">Push tests and create a Pull Request to your branch automatically.</span>
                            </div>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ margin: 0, padding: '0 1rem', height: '36px', whiteSpace: 'nowrap', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                              onClick={handleCreatePR}
                              disabled={prLoading}
                            >
                              {prLoading ? 'Creating PR...' : 'Create GitHub PR'}
                            </button>
                          </div>

                          {prResultUrl && (
                            <div className="console-logs" style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.1)' }}>
                              <strong>PR Created Successfully!</strong>
                              <p style={{ marginTop: '0.25rem' }}>
                                View Pull Request here: <a href={prResultUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline' }}>{prResultUrl}</a>
                              </p>
                            </div>
                          )}

                          {prError && (
                            <div className="console-logs console-error">
                              <strong>Export Error:</strong>
                              <p>{prError}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Execution Logs */}
                  {activeTab === 'execution' && (
                    <div className="flex flex-col gap-4">
                      {/* Execution Success Indicator */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">Test Runner Outcome:</span>
                        <span className={`badge ${result.success ? 'success' : 'danger'}`} style={{
                          background: result.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: result.success ? '#34d399' : '#f87171',
                          borderColor: result.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                        }}>
                          {result.success ? 'PASSED (0 Errors)' : 'FAILED / COMPILATION ERROR'}
                        </span>
                      </div>

                      {/* Coverage details */}
                      {/* Coverage details */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '1.25rem',
                        marginTop: '1rem',
                        width: '100%'
                      }}>
                        {/* Line Coverage Card */}
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.55)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderTop: '3px solid #06b6d4',
                          borderRadius: '12px',
                          padding: '1.1rem 1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.65rem',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                          transition: 'all 0.3s ease',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>▓</span> Line Coverage
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#06b6d4' }}>
                              {result.line_coverage}%
                            </span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', height: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{
                              background: 'linear-gradient(90deg, #0891b2, #06b6d4)',
                              height: '100%',
                              borderRadius: '9999px',
                              width: `${result.line_coverage}%`,
                              boxShadow: '0 0 8px rgba(6, 182, 212, 0.4)',
                              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                            }} />
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            Statement level execution density
                          </div>
                        </div>

                        {/* Branch Coverage Card */}
                        <div style={{
                          background: 'rgba(15, 23, 42, 0.55)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderTop: '3px solid #6366f1',
                          borderRadius: '12px',
                          padding: '1.1rem 1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.65rem',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                          transition: 'all 0.3s ease',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span>☳</span> Branch Coverage
                            </span>
                            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#6366f1' }}>
                              {result.branch_coverage}%
                            </span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', height: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{
                              background: 'linear-gradient(90deg, #4f46e5, #6366f1)',
                              height: '100%',
                              borderRadius: '9999px',
                              width: `${result.branch_coverage}%`,
                              boxShadow: '0 0 8px rgba(99, 102, 241, 0.4)',
                              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                            }} />
                          </div>
                          <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                            Decision point logical path execution
                          </div>
                        </div>

                        {/* Mutation Score Card */}
                        {result && (
                          <div style={{
                            background: 'rgba(15, 23, 42, 0.65)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderTop: '3px solid #f97316',
                            borderRadius: '12px',
                            padding: '1.1rem 1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.65rem',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                            transition: 'all 0.3s ease',
                            gridColumn: '1 / -1'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>🧬</span> Stryker Mutation Score
                              </span>
                              <span style={{
                                fontSize: '1.1rem',
                                fontWeight: 800,
                                color: (result.mutation_score ?? 0) >= 70 ? '#f97316' : (result.mutation_score ?? 0) >= 40 ? '#eab308' : '#f87171'
                              }}>
                                {(result.mutation_score ?? 0)}%
                              </span>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '9999px', height: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <div style={{
                                background: (result.mutation_score ?? 0) >= 70
                                  ? 'linear-gradient(90deg, #ea580c, #f97316)'
                                  : (result.mutation_score ?? 0) >= 40
                                    ? 'linear-gradient(90deg, #ca8a04, #eab308)'
                                    : 'linear-gradient(90deg, #dc2626, #f87171)',
                                height: '100%',
                                borderRadius: '9999px',
                                width: `${result.mutation_score}%`,
                                boxShadow: `0 0 8px ${(result.mutation_score ?? 0) >= 70 ? 'rgba(249, 115, 22, 0.4)' : (result.mutation_score ?? 0) >= 40 ? 'rgba(234, 179, 8, 0.4)' : 'rgba(248, 113, 113, 0.4)'}`,
                                transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                              }} />
                            </div>

                            {/* Detailed Mutation counts with visual badges */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.1rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
                                <span>Total Mutants: <strong>{result.total_mutants}</strong></span>
                                <span style={{ color: '#34d399' }}>✓ Killed: <strong>{result.killed_mutants}</strong></span>
                              </div>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '0.3rem',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.04)',
                                borderRadius: '6px',
                                padding: '0.35rem 0.5rem',
                                textAlign: 'center',
                                fontSize: '0.62rem',
                                fontWeight: 600
                              }}>
                                <div style={{ color: '#f87171' }}>
                                  <div style={{ color: 'rgba(248, 113, 113, 0.6)', fontSize: '0.55rem', textTransform: 'uppercase' }}>Survived</div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{result.survived_mutants}</div>
                                </div>
                                <div style={{ color: '#fbbf24', borderLeft: '1px solid rgba(255,255,255,0.06)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                                  <div style={{ color: 'rgba(251, 191, 36, 0.6)', fontSize: '0.55rem', textTransform: 'uppercase' }}>Timeout</div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{result.timeout_mutants}</div>
                                </div>
                                <div style={{ color: '#94a3b8' }}>
                                  <div style={{ color: 'rgba(148, 163, 184, 0.6)', fontSize: '0.55rem', textTransform: 'uppercase' }}>Ignored</div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{result.ignored_mutants}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Build terminal outputs */}
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-slate-400">Dotnet CLI Stdout</span>
                        <pre className="console-logs">
                          {result.stdout || 'No compiler output captured.'}
                        </pre>
                      </div>

                      {result.stderr && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-red-400">Dotnet CLI Stderr</span>
                          <pre className="console-logs console-error">
                            {result.stderr}
                          </pre>
                        </div>
                      )}

                      {/* Self-healing history logs */}
                      {result.healing_attempts > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-sm font-semibold text-slate-300">Self-Healing Retries Log</span>
                          <div className="healing-list">
                            {result.healing_log.map((log, idx) => (
                              <div key={idx} className="healing-item flex-col items-start gap-2">
                                <div className="w-full flex justify-between items-center">
                                  <div>
                                    <span className="healing-badge">Heal #{log.attempt}</span>
                                    <span className="text-xs text-slate-400 ml-2">
                                      {log.success ? 'Successfully Compiled' : 'Compilation Failed'}
                                    </span>
                                  </div>
                                  <span className={`text-xs ${log.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {log.success ? '🛠️ Fixed' : '⚠️ Unresolved'}
                                  </span>
                                </div>
                                {log.errors && (
                                  <div className="w-full mt-1 bg-red-900/10 border border-red-500/20 rounded p-2 text-[11px] font-mono text-red-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                    {log.errors}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evaluator-guided history logs */}
                      {result.evaluator_loop_log && result.evaluator_loop_log.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4">
                          <span className="text-sm font-semibold text-slate-300">Evaluator-Guided Refinement Log</span>
                          <div className="healing-list">
                            {result.evaluator_loop_log.map((log, idx) => (
                              <div key={idx} className="healing-item flex-col items-start gap-2">
                                <div className="w-full flex justify-between items-center">
                                  <div>
                                    <span className="healing-badge" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                                      Refine #{log.attempt}
                                    </span>
                                    <span className="text-xs text-slate-400 ml-2">
                                      Score: {log.score_before} 🎯 {log.score_after}
                                    </span>
                                  </div>
                                  <span className={`text-xs ${log.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {log.success ? '✅ Compiled' : '❌ Compile Error'}
                                  </span>
                                </div>
                                <div className="w-full mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                                  {log.latency && <span>⏱️ Latency: {log.latency.toFixed(2)}s</span>}
                                  {log.cost && <span>💰 Cost: ${log.cost.toFixed(5)}</span>}
                                  {(log.worker_prompt_tokens !== undefined || log.worker_completion_tokens !== undefined) && (
                                    <span>🤖 Worker Tokens: {(log.worker_prompt_tokens || 0)}/{(log.worker_completion_tokens || 0)}</span>
                                  )}
                                  {(log.evaluator_prompt_tokens !== undefined || log.evaluator_completion_tokens !== undefined) && (
                                    <span>🧠 Eval Tokens: {(log.evaluator_prompt_tokens || 0)}/{(log.evaluator_completion_tokens || 0)}</span>
                                  )}
                                </div>
                                {(log as any).errors && (
                                  <div className="w-full mt-1 bg-red-900/10 border border-red-500/20 rounded p-2 text-[10px] font-mono text-red-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {(log as any).errors}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Evaluation */}
                  {activeTab === 'evaluation' && (
                    <div className="flex flex-col gap-4">
                      {/* Circle Score Gauge */}
                      <div className="metrics-row">
                        <div className="score-circle" style={{ '--score-percentage': result.evaluator_score } as React.CSSProperties}>
                          <div className="flex flex-col items-center justify-center text-center">
                            {result.evaluator_score}
                            <span>Score</span>
                          </div>
                        </div>

                        <div className="score-details flex flex-col gap-2">
                          <div>
                            <div className="text-xs text-slate-400">Correctness Grade:</div>
                            <div className="text-sm font-bold text-indigo-400">Level {result.evaluator_feedback.correctness_rating} / 10</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-400">Compilation Check:</div>
                            <div className="text-sm text-slate-300">{result.evaluator_feedback.compilation_review || 'N/A'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Critiques */}
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-semibold text-slate-300">Semantic Reviews</span>

                        <div className="critique-card">
                          <div className="critique-title">Assertion Quality</div>
                          <div className="critique-body">{result.evaluator_feedback.assertion_quality_review}</div>
                        </div>

                        <div className="critique-card">
                          <div className="critique-title">Mocking &amp; Dependencies</div>
                          <div className="critique-body">{result.evaluator_feedback.mocking_review}</div>
                        </div>

                        <div className="critique-card">
                          <div className="critique-title">Coverage Critique</div>
                          <div className="critique-body">{result.evaluator_feedback.coverage_review}</div>
                        </div>

                        {/* Issues found */}
                        {result.evaluator_feedback.issues_found && result.evaluator_feedback.issues_found.length > 0 && (
                          <div className="critique-card border-red-900/30 bg-red-900/5">
                            <div className="critique-title text-red-400">Issues Found</div>
                            <ul className="list-disc pl-4 text-xs text-red-300">
                              {result.evaluator_feedback.issues_found.map((issue, idx) => (
                                <li key={idx} className="mb-1">{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Suggestions list */}
                        {result.evaluator_feedback.suggestions && result.evaluator_feedback.suggestions.length > 0 && (
                          <div className="critique-card border-indigo-900/30 bg-indigo-900/5">
                            <div className="critique-title text-indigo-400">Optimization Suggestions</div>
                            <div>
                              {result.evaluator_feedback.suggestions.map((suggestion, idx) => (
                                <div key={idx} className="suggestion-item">{suggestion}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        </main>
      )}

      {/* Research Project Footer */}
      <footer className="footer-panel" style={{
        marginTop: '3rem',
        paddingTop: '2rem',
        paddingBottom: '1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        color: '#94a3b8',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ flex: 1.5, minWidth: '280px' }}>
            <h4 style={{ color: '#f8fafc', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              Graduate Research Project (M.Eng.)
            </h4>
            <p style={{ margin: '0.25rem 0', lineHeight: '1.5' }}>
              <strong>Research Topic:</strong> A Multi-Agent LLM-Based Approach for Automated Unit Test Generation and Optimization in C# Programs
            </p>
            <p style={{ margin: '0.25rem 0', lineHeight: '1.5' }}>
              (การประยุกต์ใช้แนวทางหลายเอเจนต์โดยใช้โมเดลภาษาขนาดใหญ่สำหรับการสร้างและเพิ่มประสิทธิภาพ Unit Test อัตโนมัติในโปรแกรม C#)
            </p>
          </div>

          <div style={{ flex: 1.2, minWidth: '280px' }}>
            <h4 style={{ color: '#f8fafc', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              Researcher and University
            </h4>
            <p style={{ margin: '0.25rem 0' }}><strong>Researcher:</strong> Mr. Attaphon Pungjaree</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Thesis Advisor:</strong> Dr. Thanaphat Khankajit</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Major:</strong> Artificial Intelligence and Data Engineering</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Degree:</strong> Master of Engineering (M.Eng.)</p>
            <p style={{ margin: '0.25rem 0' }}><strong>College:</strong> College of Engineering and Technology</p>
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <h4 style={{ color: '#f8fafc', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              Contact channels
            </h4>
            <p style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>645162020028@dpu.ac.th</span>
            </p>
            <p style={{ margin: '0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>Phone Number: 095-792-5262</span>
            </p>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          paddingTop: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#64748b'
        }}>
          <div>© 2026 C# AI Unit Test Generation Platform. All Rights Reserved.</div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ color: '#818cf8', fontWeight: '600' }}>Dhurakij Pundit University</span>
            <span> • </span>
            <span>110/1-4 Prachachuen Road Laksi, Bangkok, 10210</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

