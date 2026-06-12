'use client';

import React, { useState, useEffect } from 'react';

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

interface RunRecord {
  version: string;
  workflow: string;
  benchmark_id: string;
  category: string;
  model: string;
  success: boolean;
  line_coverage: number;
  branch_coverage: number;
  generation_time: number;
  cost: number;
  evaluator_score: number;
  healing_attempts: number;
  generated_test: string;
  stdout: string;
  stderr: string;
  evaluator_feedback: EvaluatorFeedback | null;
  healing_log: HealingAttempt[];
  evaluator_loop_log: {
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
  initial_test?: string;
  best_of_n_candidates?: {
    candidate_index: number;
    score: number;
    line_coverage: number;
    branch_coverage: number;
    success: boolean;
    generated_test: string;
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
  source_code?: string;
  expected_test?: string;
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
  latency?: number;
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
}

interface WebDemoSubmission {
  timestamp: string;
  sourceCode: string;
  model: string;
  workflow: string;
  filePath?: string;
  result: {
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
    initial_test?: string;
    best_of_n_candidates?: any[];
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
  };
}

interface CicdLogRecord {
  timestamp: string;
  file_path: string;
  success: boolean;
  line_coverage: number;
  evaluator_score: number;
  cost: number;
  latency: number;
  model: string;
  workflow: string;
  mutation_score?: number | null;
  total_mutants?: number | null;
  killed_mutants?: number | null;
  survived_mutants?: number | null;
  result?: any;
}

export default function Dashboard() {
  const [dashboardTab, setDashboardTab] = useState<'benchmarks' | 'static-reports' | 'web-demo' | 'github-demo' | 'ci-cd'>('benchmarks');
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [submissions, setSubmissions] = useState<WebDemoSubmission[]>([]);
  const [githubSubmissions, setGithubSubmissions] = useState<WebDemoSubmission[]>([]);
  const [cicdLogs, setCicdLogs] = useState<CicdLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [staticSummary, setStaticSummary] = useState<{
    benchmarkSummary: any[] | null;
    categorySummary: any[] | null;
    costSummary: any[] | null;
    failureSummary: any[] | null;
    healingSummary: any[] | null;
    latencySummary: any[] | null;
    categorySplit: any[] | null;
    evaluatorSummary?: any[] | null;
    selectorSummary?: any[] | null;
    mutationSummary?: any[] | null;
  } | null>(null);
  const [loadingStatic, setLoadingStatic] = useState(false);
  const [staticSubTab, setStaticSubTab] = useState<'charts' | 'overall' | 'category' | 'cost' | 'failure' | 'healing' | 'latency' | 'split' | 'evaluator' | 'selector' | 'mutation'>('charts');
  const [chartMetricType, setChartMetricType] = useState<'conditional' | 'effective'>('effective');

  // Filters state
  const [selectedVersion, setSelectedVersion] = useState<string>('all');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination / Search queries
  const [demoSearchQuery, setDemoSearchQuery] = useState<string>('');
  const [githubSearchQuery, setGithubSearchQuery] = useState<string>('');
  const [cicdSearchQuery, setCicdSearchQuery] = useState<string>('');

  // Modal detail view state
  const [selectedRun, setSelectedRun] = useState<RunRecord | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<WebDemoSubmission | null>(null);
  const [selectedCicdLog, setSelectedCicdLog] = useState<CicdLogRecord | null>(null);
  const [modalTab, setModalTab] = useState<'code' | 'logs' | 'evaluation' | 'candidates'>('code');

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [resRuns, resDemo, resGithubDemo, resCicd] = await Promise.all([
          fetch('http://localhost:3005/api/dashboard/benchmarks').catch(() => ({ ok: false })),
          fetch('http://localhost:3005/api/dashboard/web-demo').catch(() => ({ ok: false })),
          fetch('http://localhost:3005/api/dashboard/github-demo').catch(() => ({ ok: false })),
          fetch('http://localhost:3005/api/dashboard/ci-cd').catch(() => ({ ok: false }))
        ]);

        let dataRuns: RunRecord[] = [];
        let dataDemo: WebDemoSubmission[] = [];
        let dataGithubDemo: WebDemoSubmission[] = [];
        let dataCicd: CicdLogRecord[] = [];

        if (resRuns.ok) dataRuns = await (resRuns as Response).json();
        if (resDemo.ok) dataDemo = await (resDemo as Response).json();
        if (resGithubDemo.ok) dataGithubDemo = await (resGithubDemo as Response).json();
        if (resCicd.ok) dataCicd = await (resCicd as Response).json();

        setRuns(dataRuns);
        setSubmissions(dataDemo);
        setGithubSubmissions(dataGithubDemo);
        setCicdLogs(dataCicd);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Error occurred while loading reports.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dashboardTab]);

  // Load static summaries dynamically when version or workflow changes
  useEffect(() => {
    if (selectedVersion === 'all' || selectedWorkflow === 'all') {
      setStaticSummary(null);
      return;
    }

    const fetchStatic = async () => {
      setLoadingStatic(true);
      try {
        const res = await fetch(`http://localhost:3005/api/dashboard/static-summary?version=${selectedVersion}&workflow=${selectedWorkflow}`);
        if (res.ok) {
          const data = await res.json();
          setStaticSummary(data);
        } else {
          setStaticSummary(null);
        }
      } catch (err) {
        console.error('Error loading static summaries:', err);
        setStaticSummary(null);
      } finally {
        setLoadingStatic(false);
      }
    };

    fetchStatic();
  }, [selectedVersion, selectedWorkflow]);

  // Compute unique versions, models, workflows dynamically
  const versions = Array.from(new Set(runs.map((r) => r.version))).sort();
  const models = Array.from(new Set(runs.map((r) => r.model))).sort();
  const workflows = Array.from(new Set(runs.map((r) => r.workflow))).sort();
  const categories = Array.from(new Set(runs.map((r) => r.category || 'unknown'))).sort();

  // Filter benchmarks
  const filteredRuns = runs.filter((r) => {
    const matchVersion = selectedVersion === 'all' || r.version === selectedVersion;
    const matchWorkflow = selectedWorkflow === 'all' || r.workflow === selectedWorkflow;
    const matchModel = selectedModel === 'all' || r.model === selectedModel;
    const matchCategory = selectedCategory === 'all' || (r.category || 'unknown') === selectedCategory;
    const matchSearch =
      r.benchmark_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.workflow.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchVersion && matchWorkflow && matchModel && matchCategory && matchSearch;
  });

  // Filter web demo logs
  const filteredSubmissions = submissions.filter((s) => {
    return (
      s.model.toLowerCase().includes(demoSearchQuery.toLowerCase()) ||
      s.workflow.toLowerCase().includes(demoSearchQuery.toLowerCase()) ||
      (s.result.success ? 'passed' : 'failed').includes(demoSearchQuery.toLowerCase())
    );
  });

  // Statistics calculation for filtered benchmarks
  const totalRuns = filteredRuns.length;
  const successfulRuns = filteredRuns.filter((r) => r.success).length;
  const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;
  const avgLineCoverage =
    totalRuns > 0 ? filteredRuns.reduce((sum, r) => sum + r.line_coverage, 0) / totalRuns : 0;
  const avgBranchCoverage =
    totalRuns > 0 ? filteredRuns.reduce((sum, r) => sum + r.branch_coverage, 0) / totalRuns : 0;
  const avgEvaluatorScore =
    totalRuns > 0 ? filteredRuns.reduce((sum, r) => sum + r.evaluator_score, 0) / totalRuns : 0;
  const totalCost = filteredRuns.reduce((sum, r) => sum + r.cost, 0);
  const avgCost = totalRuns > 0 ? totalCost / totalRuns : 0;
  const avgLatency =
    totalRuns > 0 ? filteredRuns.reduce((sum, r) => sum + r.generation_time, 0) / totalRuns : 0;

  const runsWithMutation = filteredRuns.filter((r) => r.mutation_score != null);
  const avgMutationScore =
    runsWithMutation.length > 0
      ? runsWithMutation.reduce((sum, r) => sum + (r.mutation_score || 0), 0) / runsWithMutation.length
      : null;

  // Statistics calculation for web demo
  const totalDemo = filteredSubmissions.length;
  const successDemo = filteredSubmissions.filter((s) => s.result.success).length;
  const successRateDemo = totalDemo > 0 ? (successDemo / totalDemo) * 100 : 0;
  const avgScoreDemo =
    totalDemo > 0 ? filteredSubmissions.reduce((sum, s) => sum + s.result.evaluator_score, 0) / totalDemo : 0;
  const totalCostDemo = filteredSubmissions.reduce((sum, s) => sum + s.result.cost, 0);
  const avgLatencyDemo =
    totalDemo > 0 ? filteredSubmissions.reduce((sum, s) => sum + s.result.latency, 0) / totalDemo : 0;

  // Filter github-demo submissions
  const filteredGithubSubmissions = githubSubmissions.filter((s) => {
    return (
      s.model.toLowerCase().includes(githubSearchQuery.toLowerCase()) ||
      s.workflow.toLowerCase().includes(githubSearchQuery.toLowerCase()) ||
      (s.result.success ? 'passed' : 'failed').includes(githubSearchQuery.toLowerCase()) ||
      (s.filePath || '').toLowerCase().includes(githubSearchQuery.toLowerCase())
    );
  });

  // Filter ci-cd log records
  const filteredCicdLogs = cicdLogs.filter((s) => {
    return (
      s.model.toLowerCase().includes(cicdSearchQuery.toLowerCase()) ||
      s.workflow.toLowerCase().includes(cicdSearchQuery.toLowerCase()) ||
      (s.success ? 'passed' : 'failed').includes(cicdSearchQuery.toLowerCase()) ||
      (s.file_path || '').toLowerCase().includes(cicdSearchQuery.toLowerCase())
    );
  });

  // Statistics calculation for github demo
  const totalGithub = filteredGithubSubmissions.length;
  const successGithub = filteredGithubSubmissions.filter((s) => s.result.success).length;
  const successRateGithub = totalGithub > 0 ? (successGithub / totalGithub) * 100 : 0;
  const avgScoreGithub =
    totalGithub > 0 ? filteredGithubSubmissions.reduce((sum, s) => sum + s.result.evaluator_score, 0) / totalGithub : 0;
  const totalCostGithub = filteredGithubSubmissions.reduce((sum, s) => sum + s.result.cost, 0);
  const avgLatencyGithub =
    totalGithub > 0 ? filteredGithubSubmissions.reduce((sum, s) => sum + s.result.latency, 0) / totalGithub : 0;

  // Statistics calculation for ci-cd log records
  const totalCicd = filteredCicdLogs.length;
  const successCicd = filteredCicdLogs.filter((s) => s.success).length;
  const successRateCicd = totalCicd > 0 ? (successCicd / totalCicd) * 100 : 0;
  const avgScoreCicd =
    totalCicd > 0 ? filteredCicdLogs.reduce((sum, s) => sum + s.evaluator_score, 0) / totalCicd : 0;
  const totalCostCicd = filteredCicdLogs.reduce((sum, s) => sum + s.cost, 0);
  const avgLatencyCicd =
    totalCicd > 0 ? filteredCicdLogs.reduce((sum, s) => sum + s.latency, 0) / totalCicd : 0;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div>
          <h1>C# AI Unit Test Generation Platform</h1>
          <p>Multi-Agent LLM Review &amp; Self-Healing Sandbox Engine</p>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginRight: '1.5rem' }}>
          <a
            href="/?view=workflow"
            className="nav-link"
            style={{
              fontSize: '0.9rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            System Workflow
          </a>
          <a
            href="/?view=params"
            className="nav-link"
            style={{
              fontSize: '0.9rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            Report Parameters
          </a>
          <a
            href="/?view=dataset"
            className="nav-link"
            style={{
              fontSize: '0.9rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            Dataset
          </a>
          <a
            href="/?view=playground"
            className="nav-link"
            style={{
              fontSize: '0.9rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            Playground
          </a>
          <a
            href="/?view=github"
            className="nav-link"
            style={{
              fontSize: '0.9rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            GitHub Ingestion
          </a>
          <a
            href="/dashboard"
            className="nav-link active"
            style={{
              fontSize: '0.9rem',
              padding: '0.25rem 0.5rem'
            }}
          >
            Dashboard
          </a>
        </nav>
      </header>

      {/* Loading state */}
      {loading && (
        <div className="panel flex flex-col items-center justify-center p-12 text-slate-400 text-sm text-center">
          <div className="spinner mb-4" style={{ width: '40px', height: '40px', borderWidth: '4px' }} />
          <p className="text-base font-semibold">Aggregating run analytics...</p>
          <p className="text-xs text-slate-500 mt-1">Reading C# code repositories, JSON reports, and user sandbox histories</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="panel console-logs console-error p-6">
          <strong>Dashboard Failed to Initialize:</strong>
          <p className="mt-2 text-sm">{error}</p>
          <button className="btn-primary mt-4 self-start" onClick={() => window.location.reload()}>
            Retry Fetching Data
          </button>
        </div>
      )}

      {/* Main dashboard content */}
      {!loading && !error && (
        <div className="flex flex-col gap-6 w-full min-w-0">
          {/* Main Tab Selector */}
          <div className="tabs-header" style={{ borderBottom: '2px solid rgba(255,255,255,0.06)', gap: '1.5rem', flexWrap: 'wrap' }}>
            <button
              className={`tab-btn text-base pb-3 ${dashboardTab === 'benchmarks' ? 'active' : ''}`}
              onClick={() => setDashboardTab('benchmarks')}
            >
              Benchmark Dataset Analytics ({runs.length} Runs)
            </button>
            <button
              className={`tab-btn text-base pb-3 ${dashboardTab === 'static-reports' ? 'active' : ''}`}
              onClick={() => setDashboardTab('static-reports')}
            >
              Compiled Python Reports (Static Summaries)
            </button>
            <button
              className={`tab-btn text-base pb-3 ${dashboardTab === 'web-demo' ? 'active' : ''}`}
              onClick={() => setDashboardTab('web-demo')}
            >
              Playground Logs ({submissions.length} Logs)
            </button>
            <button
              className={`tab-btn text-base pb-3 ${dashboardTab === 'github-demo' ? 'active' : ''}`}
              onClick={() => setDashboardTab('github-demo')}
            >
              GitHub Ingest Logs ({githubSubmissions.length} Logs)
            </button>
            <button
              className={`tab-btn text-base pb-3 ${dashboardTab === 'ci-cd' ? 'active' : ''}`}
              onClick={() => setDashboardTab('ci-cd')}
            >
              CI/CD Hook Logs ({cicdLogs.length} Logs)
            </button>
          </div>

          {/* Dynamic Filters Panel */}
          {dashboardTab !== 'web-demo' && dashboardTab !== 'github-demo' && dashboardTab !== 'ci-cd' && (
            <div className="filters-panel">
              <div className="filter-item">
                <label htmlFor="version-filter">Dataset Version</label>
                <select
                  id="version-filter"
                  className="select-control"
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                >
                  <option value="all">All Versions ({versions.length})</option>
                  {versions.map((v) => (
                    <option key={v} value={v}>
                      {v.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-item">
                <label htmlFor="workflow-filter">Workflow Type</label>
                <select
                  id="workflow-filter"
                  className="select-control"
                  value={selectedWorkflow}
                  onChange={(e) => setSelectedWorkflow(e.target.value)}
                >
                  <option value="all">All Workflows ({workflows.length})</option>
                  {workflows.map((wf) => (
                    <option key={wf} value={wf}>
                      {wf.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {dashboardTab === 'benchmarks' && (
                <>
                  <div className="filter-item">
                    <label htmlFor="model-filter">AI Model under test</label>
                    <select
                      id="model-filter"
                      className="select-control"
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                    >
                      <option value="all">All Models ({models.length})</option>
                      {models.map((m) => (
                        <option key={m} value={m}>
                          {m.replace(/_/g, ' ').replace('Instruct', '').trim()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-item">
                    <label htmlFor="category-filter">Category</label>
                    <select
                      id="category-filter"
                      className="select-control"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">All Categories ({categories.length})</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-item" style={{ minWidth: '220px' }}>
                    <label htmlFor="benchmark-search">Search Benchmark ID</label>
                    <input
                      id="benchmark-search"
                      type="text"
                      className="search-input"
                      placeholder="Search ID (e.g. BENCH-005)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ maxWidth: '100%' }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 1: BENCHMARK ANALYTICS */}
          {dashboardTab === 'benchmarks' && (
            <>
              {/* Statistics Grid */}
              <div className="dashboard-grid-5">
                <div className="metric-card">
                  <span className="metric-label">Pass Rate</span>
                  <div className="flex items-baseline gap-2">
                    <span className="metric-value text-emerald-400">{successRate.toFixed(1)}%</span>
                  </div>
                  <span className="metric-subtext">
                    {successfulRuns} / {totalRuns} compiled &amp; tests passed
                  </span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Avg Line Coverage</span>
                  <span className="metric-value text-sky-400">{avgLineCoverage.toFixed(1)}%</span>
                  <div className="progress-bar-bg" style={{ marginTop: '0.25rem' }}>
                    <div className="progress-bar-fill success" style={{ width: `${avgLineCoverage}%`, backgroundColor: '#38bdf8' }} />
                  </div>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Avg Branch Coverage</span>
                  <span className="metric-value text-indigo-400">{avgBranchCoverage.toFixed(1)}%</span>
                  <div className="progress-bar-bg" style={{ marginTop: '0.25rem' }}>
                    <div className="progress-bar-fill success" style={{ width: `${avgBranchCoverage}%`, backgroundColor: '#6366f1' }} />
                  </div>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Avg Evaluator Score</span>
                  <span className="metric-value text-purple-400">{avgEvaluatorScore.toFixed(1)}<span className="text-xs text-slate-500 font-normal">/100</span></span>
                  <span className="metric-subtext">Semantic LLM Grader rating</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Avg Mutation Score</span>
                  <span className="metric-value text-pink-400">
                    {avgMutationScore !== null ? `${avgMutationScore.toFixed(1)}%` : 'N/A'}
                  </span>
                  {avgMutationScore !== null ? (
                    <div className="progress-bar-bg" style={{ marginTop: '0.25rem' }}>
                      <div className="progress-bar-fill" style={{ width: `${avgMutationScore}%`, backgroundColor: '#f472b6' }} />
                    </div>
                  ) : (
                    <span className="metric-subtext">No mutation metrics run</span>
                  )}
                </div>

                <div className="metric-card">
                  <span className="metric-label">Total Cost (USD)</span>
                  <span className="metric-value text-amber-400">${totalCost.toFixed(4)}</span>
                  <span className="metric-subtext">Avg: ${avgCost.toFixed(6)} / test run</span>
                </div>
              </div>

              {/* Charts grid */}
              <div className="chart-container">
                {/* Chart 1: Model Comparison */}
                <div className="chart-card">
                  <h3 className="chart-title">Model Performance Comparison</h3>
                  <p className="text-xs text-slate-500 mb-2">Compares average evaluator score, line coverage, and branch coverage for each model under active filters</p>
                  <ModelComparisonChart data={filteredRuns} />
                </div>

                {/* Chart 2: Workflow Efficiency */}
                <div className="chart-card">
                  <h3 className="chart-title">Workflow Efficiency (Score / Cost)</h3>
                  <p className="text-xs text-slate-500 mb-2">Compares semantic scores, latencies, and costs of orchestration workflows (higher score is better)</p>
                  <WorkflowComparisonChart data={filteredRuns} />
                </div>
              </div>

              {/* Detailed runs table */}
              <div className="table-panel">
                <div className="flex justify-between items-center">
                  <h3 className="panel-title">Gold Standard Benchmark Runs ({filteredRuns.length})</h3>
                </div>
                <div className="table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Benchmark ID</th>
                        <th>Category</th>
                        <th>Worker Model</th>
                        <th>Workflow</th>
                        <th>Status</th>
                        <th>Line Cov</th>
                        <th>Branch Cov</th>
                        <th>Mutation Score</th>
                        <th>Score</th>
                        <th>Cost</th>
                        <th>Latency</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRuns.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="text-center py-8 text-slate-500">
                            No benchmark records found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredRuns.slice(0, 100).map((r, idx) => (
                          <tr key={idx}>
                            <td className="font-semibold text-slate-400">{r.version.toUpperCase()}</td>
                            <td className="font-mono text-indigo-400 font-bold">{r.benchmark_id}</td>
                            <td className="text-slate-300 font-semibold text-xs">{r.category}</td>
                            <td>{r.model.replace('Llama-3.3-70B-Instruct', 'Llama-3.3').replace('DeepSeek-V3.2', 'DeepSeek-V3')}</td>
                            <td className="font-mono text-xs text-slate-400">
                              {r.workflow}
                            </td>
                            <td>
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold"
                                style={{
                                  background: r.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                  color: r.success ? '#10b981' : '#ef4444',
                                  border: `1px solid ${r.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                                }}
                              >
                                {r.success ? 'PASS' : 'FAIL'}
                              </span>
                            </td>
                            <td className="font-semibold text-sky-400">{r.line_coverage}%</td>
                            <td className="font-semibold text-indigo-400">{r.branch_coverage}%</td>
                            <td className="font-semibold text-pink-400">
                              {r.mutation_score != null ? `${r.mutation_score}%` : 'N/A'}
                            </td>
                            <td className="font-bold text-slate-200">{r.evaluator_score}</td>
                            <td className="text-slate-400 text-xs">${r.cost.toFixed(5)}</td>
                            <td className="text-slate-400 text-xs">{r.generation_time}s</td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => {
                                  setSelectedRun(r);
                                  setModalTab('code');
                                }}
                                title="View Details"
                                style={{
                                  background: 'rgba(99, 102, 241, 0.15)',
                                  color: '#a5b4fc',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                  padding: '0.4rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease'
                                }}
                                className="hover:scale-105 hover:bg-indigo-600 hover:text-white"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredRuns.length > 100 && (
                  <p className="text-xs text-slate-500 text-center">Showing first 100 results. Use filters to narrow down search.</p>
                )}
              </div>
            </>
          )}

          {/* TAB 2: WEB DEMO SUBMISSIONS LOGS */}
          {dashboardTab === 'web-demo' && (
            <>
              {/* Web Demo Stats Grid */}
              <div className="dashboard-grid-5">
                <div className="metric-card">
                  <span className="metric-label">Total Web Submissions</span>
                  <span className="metric-value text-indigo-400">{submissions.length}</span>
                  <span className="metric-subtext">Live runs triggered from Playground</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Sandbox Pass Rate</span>
                  <span className="metric-value text-emerald-400">{successRateDemo.toFixed(1)}%</span>
                  <span className="metric-subtext">Compile &amp; test success rate</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Avg Evaluator Score</span>
                  <span className="metric-value text-purple-400">{avgScoreDemo.toFixed(1)}<span className="text-xs text-slate-500 font-normal">/100</span></span>
                  <span className="metric-subtext">Semantic score for demo tests</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Total Latency</span>
                  <span className="metric-value text-sky-400">{avgLatencyDemo.toFixed(1)}s</span>
                  <span className="metric-subtext">Avg latency per submission</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Accumulated cost (USD)</span>
                  <span className="metric-value text-amber-400">${totalCostDemo.toFixed(4)}</span>
                  <span className="metric-subtext">Total cost of all web tests</span>
                </div>
              </div>

              {/* Web submissions logs table */}
              <div className="table-panel">
                <div className="flex justify-between items-center">
                  <h3 className="panel-title">Web Demo Submission Logs ({filteredSubmissions.length})</h3>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search logs (model, workflow, status)..."
                    value={demoSearchQuery}
                    onChange={(e) => setDemoSearchQuery(e.target.value)}
                  />
                </div>
                <div className="table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Model Used</th>
                        <th>Workflow</th>
                        <th>Sandbox Status</th>
                        <th>Line Cov</th>
                        <th>Branch Cov</th>
                        <th>🧬 Mutation</th>
                        <th>Evaluator Score</th>
                        <th>Cost</th>
                        <th>Latency</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-8 text-slate-500">
                            No web submissions found matching search query.
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissions.map((s, idx) => (
                          <tr key={idx}>
                            <td className="text-xs text-slate-400 font-mono">
                              {new Date(s.timestamp).toLocaleString()}
                            </td>
                            <td className="font-semibold">{s.model}</td>
                            <td className="font-mono text-xs text-slate-400">{s.workflow}</td>
                            <td>
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold"
                                style={{
                                  background: s.result.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                  color: s.result.success ? '#10b981' : '#ef4444',
                                  border: `1px solid ${s.result.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                                }}
                              >
                                {s.result.success ? 'PASSED' : 'FAILED'}
                              </span>
                            </td>
                            <td className="font-semibold text-sky-400">{s.result.line_coverage}%</td>
                            <td className="font-semibold text-indigo-400">{s.result.branch_coverage}%</td>
                            <td>
                              {s.result.mutation_score != null ? (
                                <span style={{
                                  fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px',
                                  background: s.result.mutation_score >= 70 ? 'rgba(249,115,22,0.15)' : s.result.mutation_score >= 40 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                                  color: s.result.mutation_score >= 70 ? '#f97316' : s.result.mutation_score >= 40 ? '#eab308' : '#f87171',
                                  border: `1px solid ${s.result.mutation_score >= 70 ? 'rgba(249,115,22,0.3)' : s.result.mutation_score >= 40 ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`
                                }}>{s.result.mutation_score}%</span>
                              ) : <span className="text-slate-600 text-xs">N/A</span>}
                            </td>
                            <td className="font-bold text-slate-200">{s.result.evaluator_score}</td>
                            <td className="text-slate-400 text-xs">${s.result.cost.toFixed(5)}</td>
                            <td className="text-slate-400 text-xs">{s.result.latency}s</td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => {
                                  setSelectedSubmission(s);
                                  setModalTab('code');
                                }}
                                title="View Details"
                                style={{
                                  background: 'rgba(99, 102, 241, 0.15)',
                                  color: '#a5b4fc',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                  padding: '0.4rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease'
                                }}
                                className="hover:scale-105 hover:bg-indigo-600 hover:text-white"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2.1: GITHUB INGESTION SUBMISSIONS LOGS */}
          {dashboardTab === 'github-demo' && (
            <>
              {/* GitHub Ingestion Stats Grid */}
              <div className="dashboard-grid-5">
                <div className="metric-card">
                  <span className="metric-label">Total Ingestion Runs</span>
                  <span className="metric-value text-indigo-400">{githubSubmissions.length}</span>
                  <span className="metric-subtext">Runs triggered from GitHub workspace</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Sandbox Pass Rate</span>
                  <span className="metric-value text-emerald-400">{successRateGithub.toFixed(1)}%</span>
                  <span className="metric-subtext">Compile &amp; test success rate</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Avg Evaluator Score</span>
                  <span className="metric-value text-purple-400">{avgScoreGithub.toFixed(1)}<span className="text-xs text-slate-500 font-normal">/100</span></span>
                  <span className="metric-subtext">Semantic score for ingested tests</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Total Latency</span>
                  <span className="metric-value text-sky-400">{avgLatencyGithub.toFixed(1)}s</span>
                  <span className="metric-subtext">Avg latency per submission</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Accumulated Cost (USD)</span>
                  <span className="metric-value text-amber-400">${totalCostGithub.toFixed(4)}</span>
                  <span className="metric-subtext">Total cost of all GitHub runs</span>
                </div>
              </div>

              {/* GitHub submissions logs table */}
              <div className="table-panel">
                <div className="flex justify-between items-center">
                  <h3 className="panel-title">GitHub Ingestion Submission Logs ({filteredGithubSubmissions.length})</h3>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search logs (model, workflow, file, status)..."
                    value={githubSearchQuery}
                    onChange={(e) => setGithubSearchQuery(e.target.value)}
                  />
                </div>
                <div className="table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Target File</th>
                        <th>Model Used</th>
                        <th>Workflow</th>
                        <th>Sandbox Status</th>
                        <th>Line Cov</th>
                        <th>Branch Cov</th>
                        <th>🧬 Mutation</th>
                        <th>Evaluator Score</th>
                        <th>Cost</th>
                        <th>Latency</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGithubSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center py-8 text-slate-500">
                            No GitHub ingestion logs found matching search query.
                          </td>
                        </tr>
                      ) : (
                        filteredGithubSubmissions.map((s, idx) => (
                          <tr key={idx}>
                            <td className="text-xs text-slate-400 font-mono">
                              {new Date(s.timestamp).toLocaleString()}
                            </td>
                            <td className="font-semibold text-xs text-indigo-400" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.filePath}>
                              {s.filePath ? s.filePath.split('/').pop()?.split('\\').pop() : 'N/A'}
                            </td>
                            <td className="font-semibold">{s.model}</td>
                            <td className="font-mono text-xs text-slate-400">{s.workflow}</td>
                            <td>
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold"
                                style={{
                                  background: s.result.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                  color: s.result.success ? '#10b981' : '#ef4444',
                                  border: `1px solid ${s.result.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                                }}
                              >
                                {s.result.success ? 'PASSED' : 'FAILED'}
                              </span>
                            </td>
                            <td className="font-semibold text-sky-400">{s.result.line_coverage}%</td>
                            <td className="font-semibold text-indigo-400">{s.result.branch_coverage}%</td>
                            <td>
                              {s.result.mutation_score != null ? (
                                <span style={{
                                  fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px',
                                  background: s.result.mutation_score >= 70 ? 'rgba(249,115,22,0.15)' : s.result.mutation_score >= 40 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                                  color: s.result.mutation_score >= 70 ? '#f97316' : s.result.mutation_score >= 40 ? '#eab308' : '#f87171',
                                  border: `1px solid ${s.result.mutation_score >= 70 ? 'rgba(249,115,22,0.3)' : s.result.mutation_score >= 40 ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`
                                }}>{s.result.mutation_score}%</span>
                              ) : <span className="text-slate-600 text-xs">N/A</span>}
                            </td>
                            <td className="font-bold text-slate-200">{s.result.evaluator_score}</td>
                            <td className="text-slate-400 text-xs">${s.result.cost.toFixed(5)}</td>
                            <td className="text-slate-400 text-xs">{s.result.latency}s</td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => {
                                  setSelectedSubmission(s);
                                  setModalTab('code');
                                }}
                                title="View Details"
                                style={{
                                  background: 'rgba(99, 102, 241, 0.15)',
                                  color: '#a5b4fc',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                  padding: '0.4rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease'
                                }}
                                className="hover:scale-105 hover:bg-indigo-600 hover:text-white"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2.2: CI/CD PRE-COMMIT HOOK LOGS */}
          {dashboardTab === 'ci-cd' && (
            <>
              {/* CI/CD Stats Grid */}
              <div className="dashboard-grid-5">
                <div className="metric-card">
                  <span className="metric-label">Total Commit Gates</span>
                  <span className="metric-value text-indigo-400">{cicdLogs.length}</span>
                  <span className="metric-subtext">Pre-commit checks triggered locally</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Git Gate Pass Rate</span>
                  <span className="metric-value text-emerald-400">{successRateCicd.toFixed(1)}%</span>
                  <span className="metric-subtext">Percentage of commits passed (coverage &ge; 80%)</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Avg Evaluator Score</span>
                  <span className="metric-value text-purple-400">{avgScoreCicd.toFixed(1)}<span className="text-xs text-slate-500 font-normal">/100</span></span>
                  <span className="metric-subtext">Semantic score for hook tests</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Total Latency</span>
                  <span className="metric-value text-sky-400">{avgLatencyCicd.toFixed(1)}s</span>
                  <span className="metric-subtext">Avg gate evaluation latency</span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Accumulated Cost (USD)</span>
                  <span className="metric-value text-amber-400">${totalCostCicd.toFixed(4)}</span>
                  <span className="metric-subtext">Total cost of local hook validations</span>
                </div>
              </div>

              {/* CI/CD logs table */}
              <div className="table-panel">
                <div className="flex justify-between items-center">
                  <h3 className="panel-title">Git Pre-commit Hook Log Records ({filteredCicdLogs.length})</h3>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search hook logs (file, model, status)..."
                    value={cicdSearchQuery}
                    onChange={(e) => setCicdSearchQuery(e.target.value)}
                  />
                </div>
                <div className="table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Modified File</th>
                        <th>Worker Model</th>
                        <th>Workflow</th>
                        <th>Gate Status</th>
                        <th>Line Cov</th>
                        <th>🧬 Mutation</th>
                        <th>Score</th>
                        <th>Cost</th>
                        <th>Latency</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCicdLogs.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="text-center py-8 text-slate-500">
                            No CI/CD Hook logs found matching search query.
                          </td>
                        </tr>
                      ) : (
                        filteredCicdLogs.map((log, idx) => (
                          <tr key={idx}>
                            <td className="text-xs text-slate-400 font-mono">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="font-semibold text-xs text-slate-300" style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.file_path}>
                              {log.file_path}
                            </td>
                            <td>{log.model}</td>
                            <td className="font-mono text-xs text-slate-400">{log.workflow}</td>
                            <td>
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold"
                                style={{
                                  background: log.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                  color: log.success ? '#10b981' : '#ef4444',
                                  border: `1px solid ${log.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                                }}
                              >
                                {log.success ? 'ALLOWED' : 'BLOCKED'}
                              </span>
                            </td>
                            <td className="font-semibold text-sky-400">{log.line_coverage}%</td>
                            <td>
                              {log.mutation_score != null ? (
                                <span style={{
                                  fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px',
                                  background: log.mutation_score >= 70 ? 'rgba(249,115,22,0.15)' : log.mutation_score >= 40 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                                  color: log.mutation_score >= 70 ? '#f97316' : log.mutation_score >= 40 ? '#eab308' : '#f87171',
                                  border: `1px solid ${log.mutation_score >= 70 ? 'rgba(249,115,22,0.3)' : log.mutation_score >= 40 ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`
                                }}>{log.mutation_score}%</span>
                              ) : <span className="text-slate-600 text-xs">N/A</span>}
                            </td>
                            <td className="font-bold text-slate-200">{log.evaluator_score}</td>
                            <td className="text-slate-400 text-xs">${log.cost.toFixed(5)}</td>
                            <td className="text-slate-400 text-xs">{log.latency}s</td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => {
                                  setSelectedCicdLog(log);
                                }}
                                title="View Stats"
                                style={{
                                  background: 'rgba(99, 102, 241, 0.15)',
                                  color: '#a5b4fc',
                                  border: '1px solid rgba(99, 102, 241, 0.3)',
                                  padding: '0.4rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease'
                                }}
                                className="hover:scale-105 hover:bg-indigo-600 hover:text-white"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2.5: PYTHON COMPILED REPORTS */}
          {dashboardTab === 'static-reports' && (
            <>
              {selectedVersion === 'all' || selectedWorkflow === 'all' ? (
                <div className="panel p-8 text-center text-slate-400">
                  <span className="text-lg font-semibold block mb-2 text-indigo-300">Select Specific Dataset &amp; Workflow</span>
                  <p className="text-sm text-slate-500">
                    Please select a specific Dataset Version and Workflow Type in the filters above to load the corresponding compiled Python summary reports.
                  </p>
                </div>
              ) : loadingStatic ? (
                <div className="panel p-8 text-center text-slate-400">
                  <div className="spinner mb-2 mx-auto" style={{ width: '24px', height: '24px', border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%' }} />
                  <p className="text-sm">Loading compiled reports...</p>
                </div>
              ) : !staticSummary || (!staticSummary.benchmarkSummary && !staticSummary.categorySummary && !staticSummary.costSummary && !staticSummary.failureSummary && !staticSummary.healingSummary && !staticSummary.latencySummary) ? (
                <div className="panel p-8 text-center text-slate-400">
                  <span className="text-lg font-semibold block mb-2 text-amber-400">No Compiled Reports Found</span>
                  <p className="text-sm text-slate-500">
                    No compiled summary files were found for <strong className="text-white">{selectedVersion.toUpperCase()}</strong> / <strong className="text-white">{selectedWorkflow.toUpperCase()}</strong>.
                    <br />
                    Make sure you have run the report compiler script (<code className="font-mono text-xs bg-slate-900/60 px-1 py-0.5 rounded border border-white/5">py src/summary/main.py</code>) on your system.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Secondary Sub-Tabs Selector */}
                  <div className="tabs-header mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', gap: '1rem', fontSize: '14px' }}>
                    <button
                      className={`tab-btn pb-2 ${staticSubTab === 'charts' ? 'active' : ''}`}
                      onClick={() => setStaticSubTab('charts')}
                    >
                      Overview &amp; Charts
                    </button>
                    <button
                      className={`tab-btn pb-2 ${staticSubTab === 'overall' ? 'active' : ''}`}
                      onClick={() => setStaticSubTab('overall')}
                    >
                      Overall Summary
                    </button>
                    <button
                      className={`tab-btn pb-2 ${staticSubTab === 'category' ? 'active' : ''}`}
                      onClick={() => setStaticSubTab('category')}
                    >
                      Category Performance
                    </button>
                    <button
                      className={`tab-btn pb-2 ${staticSubTab === 'split' ? 'active' : ''}`}
                      onClick={() => setStaticSubTab('split')}
                    >
                      Category Split (Synth vs RW)
                    </button>
                    <button
                      className={`tab-btn pb-2 ${staticSubTab === 'cost' ? 'active' : ''}`}
                      onClick={() => setStaticSubTab('cost')}
                    >
                      Cost Efficiency
                    </button>
                    <button
                      className={`tab-btn pb-2 ${staticSubTab === 'failure' ? 'active' : ''}`}
                      onClick={() => setStaticSubTab('failure')}
                    >
                      Failure Analysis
                    </button>
                    <button
                      className={`tab-btn pb-2 ${staticSubTab === 'healing' ? 'active' : ''}`}
                      onClick={() => setStaticSubTab('healing')}
                    >
                      Self-Healing Stats
                    </button>
                    <button
                      className={`tab-btn pb-2 ${staticSubTab === 'latency' ? 'active' : ''}`}
                      onClick={() => setStaticSubTab('latency')}
                    >
                      Latency Analysis
                    </button>
                    <button
                      className={`tab-btn pb-2 ${staticSubTab === 'evaluator' ? 'active' : ''}`}
                      onClick={() => setStaticSubTab('evaluator')}
                    >
                      Evaluator Review
                    </button>
                    <button
                      className={`tab-btn pb-2 ${staticSubTab === 'selector' ? 'active' : ''}`}
                      onClick={() => setStaticSubTab('selector')}
                    >
                      Candidate Selector
                    </button>
                    <button
                      className={`tab-btn pb-2 ${staticSubTab === 'mutation' ? 'active' : ''}`}
                      onClick={() => setStaticSubTab('mutation')}
                    >
                      Mutation Analysis
                    </button>
                  </div>

                  {/* SUB-TAB: OVERVIEW & CHARTS */}
                  {staticSubTab === 'charts' && (
                    <div className="flex flex-col gap-6">
                      {/* Metric cards */}
                      {(() => {
                        const totalDatasetSamples = staticSummary.healingSummary?.[0]?.total_runs || 89;
                        const passRates = staticSummary.benchmarkSummary ? staticSummary.benchmarkSummary.map(m => m.pass_rate || 0) : [];
                        const maxPassRate = passRates.length > 0 ? Math.max(...passRates) : 0;
                        const scores = staticSummary.benchmarkSummary ? staticSummary.benchmarkSummary.map(m => chartMetricType === 'conditional' ? (m.conditional_evaluator_score || 0) : (m.effective_evaluator_score || 0)) : [];
                        const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
                        return (
                          <div className="dashboard-grid-5">
                            <div className="metric-card border-indigo-500/10 bg-indigo-950/5">
                              <span className="metric-label text-indigo-400">Dataset Version</span>
                              <span className="metric-value text-indigo-300">{selectedVersion.toUpperCase()}</span>
                              <span className="metric-subtext">Active dataset under analysis</span>
                            </div>
                            <div className="metric-card border-purple-500/10 bg-purple-950/5">
                              <span className="metric-label text-purple-400">Dataset Size</span>
                              <span className="metric-value text-purple-300">{totalDatasetSamples} Benchmarks</span>
                              <span className="metric-subtext">Total test cases count</span>
                            </div>
                            <div className="metric-card border-emerald-500/10 bg-emerald-950/5">
                              <span className="metric-label text-emerald-400">Highest Pass Rate</span>
                              <span className="metric-value text-emerald-300">{maxPassRate.toFixed(1)}%</span>
                              <span className="metric-subtext">Best model pass rate</span>
                            </div>
                            <div className="metric-card border-sky-500/10 bg-sky-950/5">
                              <span className="metric-label text-sky-400">Best Average Score</span>
                              <span className="metric-value text-sky-300">{maxScore.toFixed(1)}/100</span>
                              <span className="metric-subtext">Highest semantic grader average</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Charts card */}
                      {staticSummary.benchmarkSummary && (
                        <div className="flex flex-col gap-6">
                          <div className="chart-container">
                            <div className="chart-card">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="chart-title">Model Performance (Pass Rate &amp; Coverage)</h3>
                                  <p className="text-xs text-slate-500">Compares average pass rate, line coverage, and branch coverage for each model under active filters</p>
                                </div>
                                <div className="flex gap-1 bg-slate-900/50 p-1 rounded-md border border-white/5">
                                  <button
                                    onClick={() => setChartMetricType('conditional')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${chartMetricType === 'conditional' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                  >
                                    CONDITIONAL
                                  </button>
                                  <button
                                    onClick={() => setChartMetricType('effective')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${chartMetricType === 'effective' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                                  >
                                    EFFECTIVE
                                  </button>
                                </div>
                              </div>
                              <StaticModelChart data={staticSummary.benchmarkSummary} metricType={chartMetricType} />
                            </div>

                            <div className="chart-card flex flex-col justify-between">
                              <div>
                                <h3 className="chart-title">Orchestration &amp; Compilation Cost Efficiency</h3>
                                <p className="text-xs text-slate-500 mb-4">Compares total API cost across all runs for each model (lower cost is better)</p>
                              </div>
                              <div className="flex flex-col gap-4">
                                {staticSummary.benchmarkSummary.map((row: any, idx: number) => (
                                  <div key={idx} className="flex flex-col gap-1.5">
                                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                                      <span className="text-slate-200">{row.model}</span>
                                      <span>
                                        Total Cost: <strong className="text-amber-400">${row.total_cost.toFixed(4)}</strong> | Avg Time: <strong className="text-slate-200">{row.avg_generation_time}s</strong>
                                      </span>
                                    </div>
                                    <div className="progress-bar-bg">
                                      <div className="progress-bar-fill" style={{ width: `${Math.min(row.pass_rate || 50, 100)}%`, background: 'linear-gradient(to right, #fb7185, #f43f5e)' }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Full-width Category Performance Chart */}
                          {staticSummary.categorySummary && (
                            <div className="panel p-6 border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-lg flex flex-col gap-2">
                              <h3 className="chart-title">Category Performance Comparison</h3>
                              <p className="text-xs text-slate-500 mb-2">Detailed pass rates per AI model across distinct C# function categories</p>
                              <CategoryPerformanceChart data={staticSummary.categorySummary} />
                            </div>
                          )}

                          <div className="chart-container">
                            {/* Category Split Chart */}
                            {staticSummary.categorySplit && (
                              <div className="chart-card">
                                <h3 className="chart-title">Category Split (Synthetic vs Real-World)</h3>
                                <p className="text-xs text-slate-500 mb-2">Compares pass rates between synthetic and real-world benchmark subsets</p>
                                <CategorySplitChart data={staticSummary.categorySplit} />
                              </div>
                            )}

                            {/* Cost Efficiency Chart */}
                            {staticSummary.costSummary && (
                              <div className="chart-card">
                                <h3 className="chart-title">Coverage per Dollar</h3>
                                <p className="text-xs text-slate-500 mb-2">Compares the average test line coverage achieved per USD spent</p>
                                <CostEfficiencyChart data={staticSummary.costSummary} />
                              </div>
                            )}
                          </div>

                          <div className="chart-container">
                            {/* Failure Analysis Chart */}
                            {staticSummary.failureSummary && (
                              <div className="chart-card">
                                <h3 className="chart-title">Compile Failure Counts</h3>
                                <p className="text-xs text-slate-500 mb-2">Total compile failures encountered before and during healing</p>
                                <FailureAnalysisChart data={staticSummary.failureSummary} />
                              </div>
                            )}

                            {/* Self-Healing Chart */}
                            {staticSummary.healingSummary && (
                              <div className="chart-card">
                                <h3 className="chart-title">Self-Healing Impact</h3>
                                <p className="text-xs text-slate-500 mb-2">Compilation success rate comparison (Before vs After Self-Healing)</p>
                                <SelfHealingChart data={staticSummary.healingSummary} />
                              </div>
                            )}
                          </div>

                          {/* Latency Chart - Full Width Panel */}
                          {staticSummary.latencySummary && (
                            <div className="panel p-6 border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-lg flex flex-col gap-2">
                              <h3 className="chart-title">Latency Range Comparison</h3>
                              <p className="text-xs text-slate-500 mb-2">Shows minimum, average, and maximum generation time per model</p>
                              <LatencyChart data={staticSummary.latencySummary} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: OVERALL */}
                  {staticSubTab === 'overall' && (
                    <div className="table-panel flex flex-col gap-6">
                      <div className="flex justify-between items-center">
                        <h3 className="panel-title text-emerald-400 font-bold">Compiled Model Performance Summary</h3>
                        <span className="text-xs text-slate-400">Source: results/summary/{selectedVersion}/{selectedWorkflow}/summary/benchmark_summary.json</span>
                      </div>
                      {staticSummary.benchmarkSummary && (
                        <div className="panel p-6 border border-white/5 bg-slate-900/10 rounded-lg">
                          <h3 className="chart-title mb-4">Overall Performance</h3>
                          <StaticModelChart data={staticSummary.benchmarkSummary} />
                        </div>
                      )}
                      {staticSummary.benchmarkSummary ? (
                        <div className="table-wrapper">
                          <table className="dashboard-table">
                            <thead>
                              <tr>
                                <th>AI Model</th>
                                <th>Pass Rate</th>
                                <th>Line Coverage (Cond/Eff)</th>
                                <th>Branch Coverage (Cond/Eff)</th>
                                <th>Mutation Score (Cond/Eff)</th>
                                <th>Grader Score (Cond/Eff)</th>
                                <th>Avg Healing Attempts</th>
                                <th>Avg Generation Time</th>
                                <th>Avg Cost</th>
                                <th>Total Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staticSummary.benchmarkSummary.map((row: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="font-semibold text-slate-200">{row.model}</td>
                                  <td className="font-bold text-emerald-400">{row.pass_rate}%</td>
                                  <td className="font-semibold text-sky-400 text-xs">
                                    <span title="Conditional Line Coverage">{row.conditional_line_coverage}%</span> <span className="text-slate-500">/</span> <span className="text-sky-200" title="Effective Line Coverage">{row.effective_line_coverage}%</span>
                                  </td>
                                  <td className="font-semibold text-indigo-400 text-xs">
                                    <span title="Conditional Branch Coverage">{row.conditional_branch_coverage}%</span> <span className="text-slate-500">/</span> <span className="text-indigo-200" title="Effective Branch Coverage">{row.effective_branch_coverage}%</span>
                                  </td>
                                  <td className="font-semibold text-pink-400 text-xs">
                                    <span title="Conditional Mutation Score">{row.conditional_mutation_score != null ? `${row.conditional_mutation_score}%` : 'N/A'}</span> <span className="text-slate-500">/</span> <span className="text-pink-200" title="Effective Mutation Score">{row.effective_mutation_score != null ? `${row.effective_mutation_score}%` : 'N/A'}</span>
                                  </td>
                                  <td className="font-bold text-purple-400 text-xs">
                                    <span title="Conditional Grader Score">{row.conditional_evaluator_score}</span> <span className="text-slate-500">/</span> <span className="text-purple-200" title="Effective Grader Score">{row.effective_evaluator_score}</span>
                                  </td>
                                  <td className="text-slate-300">{row.avg_healing_attempts}</td>
                                  <td className="text-slate-300">{row.avg_generation_time}s</td>
                                  <td className="text-slate-400 text-xs">${row.avg_cost.toFixed(6)}</td>
                                  <td className="text-slate-400 text-xs">${row.total_cost.toFixed(4)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 py-4 text-center">No overall summary data available.</p>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: CATEGORY */}
                  {staticSubTab === 'category' && (
                    <div className="table-panel flex flex-col gap-6">
                      <div className="flex justify-between items-center">
                        <h3 className="panel-title text-indigo-400 font-bold">Compiled Category Performance Summary</h3>
                        <span className="text-xs text-slate-400">Source: results/summary/{selectedVersion}/{selectedWorkflow}/category/category_summary.json</span>
                      </div>
                      {staticSummary.categorySummary && (
                        <div className="panel p-6 border border-white/5 bg-slate-900/10 rounded-lg">
                          <h3 className="chart-title mb-4">Category Performance Comparison</h3>
                          <CategoryPerformanceChart data={staticSummary.categorySummary} />
                        </div>
                      )}
                      {staticSummary.categorySummary ? (
                        <div className="table-wrapper">
                          <table className="dashboard-table">
                            <thead>
                              <tr>
                                <th>Category</th>
                                <th>AI Model</th>
                                <th>Pass Rate</th>
                                <th>Line Coverage (Cond/Eff)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staticSummary.categorySummary.map((row: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="font-mono text-indigo-300 font-bold">{row.category}</td>
                                  <td className="font-semibold text-slate-200">{row.model}</td>
                                  <td className="font-bold text-emerald-400">{row.pass_rate}%</td>
                                  <td className="font-semibold text-sky-400 text-xs">
                                    <span title="Conditional">{row.conditional_line_coverage}%</span> <span className="text-slate-500">/</span> <span className="text-sky-200" title="Effective">{row.effective_line_coverage}%</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 py-4 text-center">No category summary data available.</p>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: SPLIT */}
                  {staticSubTab === 'split' && (
                    <div className="flex flex-col gap-6">
                      <div className="flex justify-between items-center">
                        <h3 className="panel-title text-indigo-400 font-bold">Category Split Analysis (Synthetic vs Real-World)</h3>
                        <span className="text-xs text-slate-400">Source: results/summary/{selectedVersion}/{selectedWorkflow}/[model]/category_split/</span>
                      </div>
                      {staticSummary.categorySplit && (
                        <div className="panel p-6 border border-white/5 bg-slate-900/10 rounded-lg">
                          <h3 className="chart-title mb-4">Synthetic vs Real-World Split</h3>
                          <CategorySplitChart data={staticSummary.categorySplit} />
                        </div>
                      )}
                      {staticSummary.categorySplit && staticSummary.categorySplit.length > 0 ? (
                        staticSummary.categorySplit.map((modelSplit: any, idx: number) => (
                          <div key={idx} className="panel p-6 border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-lg flex flex-col gap-4">
                            <h4 className="text-lg font-bold text-slate-200 border-b border-white/5 pb-2">
                              Model: <span className="text-indigo-400">{modelSplit.model.replace(/_/g, ' ').trim()}</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Synthetic Summary */}
                              <div className="flex flex-col gap-2 bg-white/5 p-4 rounded border border-white/5">
                                <h5 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-2">Synthetic Benchmarks</h5>
                                {modelSplit.synthetic ? (
                                  <div className="flex flex-col gap-1 text-sm">
                                    <div className="flex justify-between border-b border-white/5 py-1">
                                      <span className="text-slate-400">Total Samples:</span>
                                      <span className="font-semibold text-slate-200">{modelSplit.synthetic.total}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 py-1">
                                      <span className="text-slate-400">Pass Rate:</span>
                                      <span className="font-bold text-emerald-400">{modelSplit.synthetic.pass_rate_pct}%</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 py-1">
                                      <span className="text-slate-400">Line Coverage (Cond/Eff):</span>
                                      <span className="font-semibold text-sky-400 text-xs">
                                        {modelSplit.synthetic.conditional_line_coverage_pct}% <span className="text-slate-500">/</span> <span className="text-sky-200">{modelSplit.synthetic.effective_line_coverage_pct}%</span>
                                      </span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 py-1">
                                      <span className="text-slate-400">Branch Coverage (Cond/Eff):</span>
                                      <span className="font-semibold text-indigo-400 text-xs">
                                        {modelSplit.synthetic.conditional_branch_coverage_pct}% <span className="text-slate-500">/</span> <span className="text-indigo-200">{modelSplit.synthetic.effective_branch_coverage_pct}%</span>
                                      </span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 py-1">
                                      <span className="text-slate-400">Avg Grader Score:</span>
                                      <span className="font-bold text-purple-400">{modelSplit.synthetic.avg_evaluator_score}/100</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 py-1">
                                      <span className="text-slate-400">Score Range (Max/Min):</span>
                                      <span className="text-slate-200">{modelSplit.synthetic.max_evaluator_score} / {modelSplit.synthetic.min_evaluator_score}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 py-1">
                                      <span className="text-slate-400">Avg Generation Time:</span>
                                      <span className="text-slate-200">{modelSplit.synthetic.avg_generation_time_sec}s</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-slate-400">Total Cost:</span>
                                      <span className="text-amber-400 font-mono">${modelSplit.synthetic.total_cost_usd.toFixed(4)}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500 py-2">No synthetic split data found.</p>
                                )}
                              </div>

                              {/* Real-World Summary */}
                              <div className="flex flex-col gap-2 bg-white/5 p-4 rounded border border-white/5">
                                <h5 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">Real-World Benchmarks</h5>
                                {modelSplit.real_world ? (
                                  <div className="flex flex-col gap-1 text-sm">
                                    <div className="flex justify-between border-b border-white/5 py-1">
                                      <span className="text-slate-400">Total Samples:</span>
                                      <span className="font-semibold text-slate-200">{modelSplit.real_world.total}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 py-1">
                                      <span className="text-slate-400">Pass Rate:</span>
                                      <span className="text-slate-500 italic">{modelSplit.real_world.pass_rate_pct || 'N/A (Execution Skipped)'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 py-1">
                                      <span className="text-slate-400">Line / Branch Coverage:</span>
                                      <span className="text-slate-500 italic">N/A (Execution Skipped)</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/5 py-1">
                                      <span className="text-slate-400">Avg Grader Score:</span>
                                      <span className="font-bold text-purple-400">{modelSplit.real_world.avg_evaluator_score ? `${modelSplit.real_world.avg_evaluator_score}/100` : 'N/A'}</span>
                                    </div>
                                    {modelSplit.real_world.max_evaluator_score !== undefined && (
                                      <div className="flex justify-between border-b border-white/5 py-1">
                                        <span className="text-slate-400">Score Range (Max/Min):</span>
                                        <span className="text-slate-200">{modelSplit.real_world.max_evaluator_score} / {modelSplit.real_world.min_evaluator_score}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between border-b border-white/5 py-1">
                                      <span className="text-slate-400">Avg Generation Time:</span>
                                      <span className="text-slate-200">{modelSplit.real_world.avg_generation_time_sec ? `${modelSplit.real_world.avg_generation_time_sec}s` : 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-slate-400">Total Cost:</span>
                                      <span className="text-amber-400 font-mono">${modelSplit.real_world.total_cost_usd ? modelSplit.real_world.total_cost_usd.toFixed(4) : '$0.0000'}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500 py-2">No real-world split data found.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 py-4 text-center">No category split data available.</p>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: COST */}
                  {staticSubTab === 'cost' && (
                    <div className="table-panel flex flex-col gap-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="panel-title text-amber-400 font-bold">Cost Efficiency Summary</h3>
                        <span className="text-xs text-slate-400">Source: results/summary/{selectedVersion}/{selectedWorkflow}/cost/cost_efficiency.json</span>
                      </div>
                      {staticSummary.costSummary && (
                        <div className="panel p-6 border border-white/5 bg-slate-900/10 rounded-lg">
                          <h3 className="chart-title mb-4">Coverage per Dollar</h3>
                          <CostEfficiencyChart data={staticSummary.costSummary} />
                        </div>
                      )}
                      {staticSummary.costSummary ? (
                        <div className="table-wrapper">
                          <table className="dashboard-table">
                            <thead>
                              <tr>
                                <th>AI Model</th>
                                <th>Avg Line Coverage</th>
                                <th>Avg Worker Cost</th>
                                <th>Avg Evaluator Cost</th>
                                <th>Avg Total Cost</th>
                                <th>Coverage per Dollar (Higher is Better)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staticSummary.costSummary.map((row: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="font-semibold text-slate-200">{row.model}</td>
                                  <td className="font-semibold text-sky-400">{row.avg_coverage}%</td>
                                  <td className="text-slate-400 font-mono text-xs">
                                    {row.avg_worker_cost != null ? `$${row.avg_worker_cost.toFixed(6)}` : 'N/A'}
                                  </td>
                                  <td className="text-slate-400 font-mono text-xs">
                                    {row.avg_evaluator_cost != null ? `$${row.avg_evaluator_cost.toFixed(6)}` : 'N/A'}
                                  </td>
                                  <td className="text-slate-300 font-mono text-xs font-bold">
                                    {row.avg_cost != null ? `$${row.avg_cost.toFixed(6)}` : 'N/A'}
                                  </td>
                                  <td className="font-bold text-emerald-400">
                                    {row.coverage_per_dollar != null ? `${row.coverage_per_dollar.toLocaleString(undefined, { maximumFractionDigits: 2 })}% / $` : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 py-4 text-center">No cost efficiency data available.</p>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: EVALUATOR REVIEW */}
                  {staticSubTab === 'evaluator' && (
                    <div className="table-panel flex flex-col gap-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="panel-title text-purple-400 font-bold">Evaluator-Guided Refinement Analysis</h3>
                        <span className="text-xs text-slate-400">Source: results/summary/{selectedVersion}/{selectedWorkflow}/evaluator/evaluator_guided_analysis.json</span>
                      </div>
                      {staticSummary.evaluatorSummary ? (
                        <>
                          <div className="panel p-6 border border-white/5 bg-slate-900/10 rounded-lg mb-6">
                            <h3 className="chart-title mb-4">Initial vs Final Score (Evaluator Grader)</h3>
                            <div className="flex flex-col gap-4">
                              <div className="flex gap-4 justify-end text-[10px] mb-2 text-slate-400">
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" /> Avg Initial Score</div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-500 rounded-sm" /> Avg Final Score</div>
                              </div>
                              <div style={{ position: 'relative', width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                                <svg width={600} height={270}>
                                  <defs>
                                    <linearGradient id="initScoreGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#6366f1" />
                                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
                                    </linearGradient>
                                    <linearGradient id="finalScoreGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#a855f7" />
                                      <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.4" />
                                    </linearGradient>
                                  </defs>
                                  {[0, 25, 50, 75, 100].map((v) => {
                                    const y = 220 - (v / 100) * 220 + 25;
                                    return (
                                      <g key={v}>
                                        <line x1={50} y1={y} x2={580} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                                        <text x={42} y={y + 4} fill="var(--text-secondary)" fontSize="9" textAnchor="end">{v}</text>
                                      </g>
                                    );
                                  })}
                                  {staticSummary.evaluatorSummary.map((d: any, i: number) => {
                                    const barWidth = 24;
                                    const groupX = 60 + i * (barWidth * 2 + 40) + 20;
                                    const initScore = Number(d.avg_initial_score) || 0;
                                    const finalScore = Number(d.avg_final_score) || 0;
                                    const yInit = 220 - (initScore / 100) * 220 + 25;
                                    const yFinal = 220 - (finalScore / 100) * 220 + 25;
                                    return (
                                      <g key={d.model}>
                                        <rect x={groupX} y={yInit || 0} width={barWidth} height={(initScore / 100) * 220 || 0} fill="url(#initScoreGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                                        <text x={groupX + barWidth / 2} y={(yInit || 0) - 4} fill="#818cf8" fontSize="9" fontWeight="bold" textAnchor="middle">{initScore}</text>
                                        
                                        <rect x={groupX + barWidth} y={yFinal || 0} width={barWidth} height={(finalScore / 100) * 220 || 0} fill="url(#finalScoreGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                                        <text x={groupX + barWidth + barWidth / 2} y={(yFinal || 0) - 4} fill="#c084fc" fontSize="9" fontWeight="bold" textAnchor="middle">{finalScore}</text>
                                        
                                        <text x={groupX + barWidth} y={265} fill="var(--text-secondary)" fontSize="9" fontWeight="700" textAnchor="middle">{d.model.replace(/_/g, ' ').replace('Instruct', '').trim()}</text>
                                      </g>
                                    );
                                  })}
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="table-wrapper">
                          <table className="dashboard-table">
                            <thead>
                              <tr>
                                <th>AI Model</th>
                                <th>Total Runs</th>
                                <th>Avg Initial Score</th>
                                <th>Avg Final Score</th>
                                <th>Avg Improvement</th>
                                <th>Needing Refinement</th>
                                <th>Refinement Rate</th>
                                <th>Success Refined Rate</th>
                                <th>Attempt 1 / 2 / 3</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staticSummary.evaluatorSummary.map((row: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="font-semibold text-slate-200">{row.model}</td>
                                  <td className="text-slate-300">{row.total_runs}</td>
                                  <td className="text-slate-300 font-semibold">{row.avg_initial_score}/100</td>
                                  <td className="text-purple-400 font-bold">{row.avg_final_score}/100</td>
                                  <td className="text-emerald-400 font-bold">+{row.avg_improvement}</td>
                                  <td className="text-slate-300">{row.runs_needing_refinement}</td>
                                  <td className="text-indigo-400 font-semibold">{row.refinement_rate_pct}%</td>
                                  <td className="text-emerald-400 font-bold">{row.refinement_success_rate_pct}%</td>
                                  <td className="text-slate-400 text-xs font-mono">
                                    {row.refined_in_1_attempts} / {row.refined_in_2_attempts} / {row.refined_in_3_attempts}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 py-4 text-center">No evaluator guided refinement analysis data available. (Ensure this workflow runs the Evaluator loop and you have compiled the reports)</p>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: SELECTOR */}
                  {staticSubTab === 'selector' && (
                    <div className="table-panel flex flex-col gap-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="panel-title text-indigo-400 font-bold">Best-of-N Candidate Selector Analysis</h3>
                        <span className="text-xs text-slate-400">Source: results/summary/{selectedVersion}/{selectedWorkflow}/selector/best_of_n_analysis.json</span>
                      </div>
                      {staticSummary.selectorSummary ? (
                        <>
                          <div className="panel p-6 border border-white/5 bg-slate-900/10 rounded-lg mb-6">
                            <h3 className="chart-title mb-4">First Candidate vs Best Selected Score</h3>
                            <div className="flex flex-col gap-4">
                              <div className="flex gap-4 justify-end text-[10px] mb-2 text-slate-400">
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-sky-500 rounded-sm" /> Avg First Score</div>
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Avg Selected Score</div>
                              </div>
                              <div style={{ position: 'relative', width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                                <svg width={600} height={270}>
                                  <defs>
                                    <linearGradient id="firstScoreGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#38bdf8" />
                                      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
                                    </linearGradient>
                                    <linearGradient id="selectedScoreGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#34d399" />
                                      <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
                                    </linearGradient>
                                  </defs>
                                  {[0, 25, 50, 75, 100].map((v) => {
                                    const y = 220 - (v / 100) * 220 + 25;
                                    return (
                                      <g key={v}>
                                        <line x1={50} y1={y} x2={580} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                                        <text x={42} y={y + 4} fill="var(--text-secondary)" fontSize="9" textAnchor="end">{v}</text>
                                      </g>
                                    );
                                  })}
                                  {staticSummary.selectorSummary.map((d: any, i: number) => {
                                    const barWidth = 24;
                                    const groupX = 60 + i * (barWidth * 2 + 40) + 20;
                                    const firstScore = Number(d.avg_first_candidate_score) || 0;
                                    const selectedScore = Number(d.avg_selected_score) || 0;
                                    const yFirst = 220 - (firstScore / 100) * 220 + 25;
                                    const ySel = 220 - (selectedScore / 100) * 220 + 25;
                                    return (
                                      <g key={d.model}>
                                        <rect x={groupX} y={yFirst || 0} width={barWidth} height={(firstScore / 100) * 220 || 0} fill="url(#firstScoreGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                                        <text x={groupX + barWidth / 2} y={(yFirst || 0) - 4} fill="#7dd3fc" fontSize="9" fontWeight="bold" textAnchor="middle">{firstScore}</text>
                                        
                                        <rect x={groupX + barWidth} y={ySel || 0} width={barWidth} height={(selectedScore / 100) * 220 || 0} fill="url(#selectedScoreGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                                        <text x={groupX + barWidth + barWidth / 2} y={(ySel || 0) - 4} fill="#6ee7b7" fontSize="9" fontWeight="bold" textAnchor="middle">{selectedScore}</text>
                                        
                                        <text x={groupX + barWidth} y={265} fill="var(--text-secondary)" fontSize="9" fontWeight="700" textAnchor="middle">{d.model.replace(/_/g, ' ').replace('Instruct', '').trim()}</text>
                                      </g>
                                    );
                                  })}
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="table-wrapper">
                          <table className="dashboard-table">
                            <thead>
                              <tr>
                                <th>AI Model</th>
                                <th>Total Runs</th>
                                <th>Avg C1 Score</th>
                                <th>Avg Selected Score</th>
                                <th>Score Improvement</th>
                                <th>Avg C1 Coverage</th>
                                <th>Avg Selected Coverage</th>
                                <th>Coverage Improvement</th>
                                <th>Selection Changed Rate</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staticSummary.selectorSummary.map((row: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="font-semibold text-slate-200">{row.model}</td>
                                  <td className="text-slate-300">{row.total_runs}</td>
                                  <td className="text-slate-300 font-semibold">{row.avg_first_candidate_score}/100</td>
                                  <td className="text-purple-400 font-bold">{row.avg_selected_score}/100</td>
                                  <td className="text-emerald-400 font-bold">+{row.avg_score_improvement}</td>
                                  <td className="text-sky-400 font-semibold">{row.avg_first_candidate_coverage}%</td>
                                  <td className="text-sky-400 font-bold">{row.avg_selected_coverage}%</td>
                                  <td className="text-emerald-400 font-bold">+{row.avg_coverage_improvement}%</td>
                                  <td className="text-indigo-400 font-bold">{row.selection_changed_pct}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 py-4 text-center">No candidate selector analysis data available. (Ensure this workflow generates candidates and you have compiled the reports)</p>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: MUTATION */}
                  {staticSubTab === 'mutation' && (
                    <div className="table-panel flex flex-col gap-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="panel-title text-pink-400 font-bold">Stryker.NET Mutation Testing Analysis</h3>
                        <span className="text-xs text-slate-400">Source: results/summary/{selectedVersion}/{selectedWorkflow}/mutation/mutation_analysis.json</span>
                      </div>
                      {staticSummary.mutationSummary ? (
                        <>
                          <div className="panel p-6 border border-white/5 bg-slate-900/10 rounded-lg mb-6">
                            <h3 className="chart-title mb-4">Mutation Score Performance</h3>
                            <div className="flex flex-col gap-4">
                              <div className="flex gap-4 justify-end text-[10px] mb-2 text-slate-400">
                                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" /> Avg Mutation Score</div>
                              </div>
                              <div style={{ position: 'relative', width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
                                <svg width={600} height={270}>
                                  <defs>
                                    <linearGradient id="mutScoreGrad" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="0%" stopColor="#f43f5e" />
                                      <stop offset="100%" stopColor="#be123c" stopOpacity="0.4" />
                                    </linearGradient>
                                  </defs>
                                  {[0, 25, 50, 75, 100].map((v) => {
                                    const y = 220 - (v / 100) * 220 + 25;
                                    return (
                                      <g key={v}>
                                        <line x1={50} y1={y} x2={580} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                                        <text x={42} y={y + 4} fill="var(--text-secondary)" fontSize="9" textAnchor="end">{v}</text>
                                      </g>
                                    );
                                  })}
                                  {staticSummary.mutationSummary.map((d: any, i: number) => {
                                    const barWidth = 36;
                                    const groupX = 60 + i * (barWidth + 50) + 20;
                                    const mutScore = Number(chartMetricType === 'conditional' ? d.conditional_mutation_score : d.effective_mutation_score) || 0;
                                    const yMut = 220 - (mutScore / 100) * 220 + 25;
                                    return (
                                      <g key={d.model}>
                                        <rect x={groupX} y={yMut || 0} width={barWidth} height={(mutScore / 100) * 220 || 0} fill="url(#mutScoreGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                                        <text x={groupX + barWidth / 2} y={(yMut || 0) - 4} fill="#fda4af" fontSize="9" fontWeight="bold" textAnchor="middle">{mutScore}%</text>
                                        
                                        <text x={groupX + barWidth / 2} y={265} fill="var(--text-secondary)" fontSize="9" fontWeight="700" textAnchor="middle">{d.model.replace(/_/g, ' ').replace('Instruct', '').trim()}</text>
                                      </g>
                                    );
                                  })}
                                </svg>
                              </div>
                            </div>
                          </div>
                          <div className="table-wrapper">
                          <table className="dashboard-table">
                            <thead>
                              <tr>
                                <th>AI Model</th>
                                <th>Total Runs</th>
                                <th>Runs w/ Mutation</th>
                                <th>Avg Mutation Score (Cond/Eff)</th>
                                <th>Avg Total Mutants</th>
                                <th>Avg Killed</th>
                                <th>Avg Survived</th>
                                <th>Avg Ignored</th>
                                <th>Avg Timeout</th>
                                <th>Total Mutants</th>
                                <th>Total Killed</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staticSummary.mutationSummary.map((row: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="font-semibold text-slate-200">{row.model}</td>
                                  <td className="text-slate-300">{row.total_runs}</td>
                                  <td className="text-slate-300">{row.runs_with_mutation}</td>
                                  <td className="text-pink-400 font-bold">
                                    <span title="Conditional">{row.conditional_mutation_score != null ? `${row.conditional_mutation_score}%` : 'N/A'}</span> <span className="text-slate-500">/</span> <span className="text-pink-200" title="Effective">{row.effective_mutation_score != null ? `${row.effective_mutation_score}%` : 'N/A'}</span>
                                  </td>
                                  <td className="text-slate-400">{row.avg_total_mutants != null ? row.avg_total_mutants : 'N/A'}</td>
                                  <td className="text-emerald-400 font-semibold">{row.avg_killed_mutants != null ? row.avg_killed_mutants : 'N/A'}</td>
                                  <td className="text-rose-400 font-semibold">{row.avg_survived_mutants != null ? row.avg_survived_mutants : 'N/A'}</td>
                                  <td className="text-slate-400">{row.avg_ignored_mutants != null ? row.avg_ignored_mutants : 'N/A'}</td>
                                  <td className="text-amber-400">{row.avg_timeout_mutants != null ? row.avg_timeout_mutants : 'N/A'}</td>
                                  <td className="text-slate-300 font-mono">{row.total_mutants_count}</td>
                                  <td className="text-emerald-400 font-bold font-mono">{row.total_killed_mutants}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        </>
                      ) : (
                        <p className="text-sm text-slate-500 py-4 text-center">
                          No mutation testing analysis data available. (Ensure you run with `--enable-mutation` flag and run the summary compiler)
                        </p>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: FAILURE */}
                  {staticSubTab === 'failure' && (
                    <div className="table-panel flex flex-col gap-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="panel-title text-rose-400 font-bold">Failure Analysis Summary</h3>
                        <span className="text-xs text-slate-400">Source: results/summary/{selectedVersion}/{selectedWorkflow}/failure/failure_analysis.json</span>
                      </div>
                      {staticSummary.failureSummary && (
                        <div className="panel p-6 border border-white/5 bg-slate-900/10 rounded-lg">
                          <h3 className="chart-title mb-4">Compile Failure Counts</h3>
                          <FailureAnalysisChart data={staticSummary.failureSummary} />
                        </div>
                      )}
                      {staticSummary.failureSummary ? (
                        <div className="table-wrapper">
                          <table className="dashboard-table">
                            <thead>
                              <tr>
                                <th>AI Model</th>
                                <th>Failure Type</th>
                                <th>Failure Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staticSummary.failureSummary.map((row: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="font-semibold text-slate-200">{row.model}</td>
                                  <td className="font-semibold text-rose-400 font-mono text-xs">{row.failure_type}</td>
                                  <td className="font-bold text-slate-300">{row.count}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 py-4 text-center">No failure analysis data available.</p>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: HEALING */}
                  {staticSubTab === 'healing' && (
                    <div className="table-panel flex flex-col gap-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="panel-title text-indigo-400 font-bold">Self-Healing Performance Summary</h3>
                        <span className="text-xs text-slate-400">Source: results/summary/{selectedVersion}/{selectedWorkflow}/healing/self_healing_analysis.json</span>
                      </div>
                      {staticSummary.healingSummary && (
                        <div className="panel p-6 border border-white/5 bg-slate-900/10 rounded-lg">
                          <h3 className="chart-title mb-4">Self-Healing Impact</h3>
                          <SelfHealingChart data={staticSummary.healingSummary} />
                        </div>
                      )}
                      {staticSummary.healingSummary ? (
                        <div className="table-wrapper">
                          <table className="dashboard-table">
                            <thead>
                              <tr>
                                <th>AI Model</th>
                                <th>Total Runs</th>
                                <th>Initial Success Count</th>
                                <th>Initial Compile Rate</th>
                                <th>Final Compile Rate</th>
                                <th>Healed Success Count</th>
                                <th>Healing Success Rate</th>
                                <th>Healed Fail Count</th>
                                <th>Healed in 1 / 2 / 3 attempts</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staticSummary.healingSummary.map((row: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="font-semibold text-slate-200">{row.model}</td>
                                  <td className="text-slate-300">{row.total_runs}</td>
                                  <td className="text-slate-300">{row.initial_success_count}</td>
                                  <td className="text-emerald-400 font-semibold">{row.initial_compile_rate}%</td>
                                  <td className="text-sky-400 font-semibold">{row.final_compile_rate}%</td>
                                  <td className="text-emerald-400 font-bold">{row.healed_success_count}</td>
                                  <td className="text-indigo-400 font-bold">{row.healing_success_rate}%</td>
                                  <td className="text-rose-400 font-semibold">{row.healed_fail_count}</td>
                                  <td className="text-slate-400 text-xs font-mono">
                                    {row.healed_in_1_attempts} / {row.healed_in_2_attempts} / {row.healed_in_3_attempts}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 py-4 text-center">No self-healing analysis data available.</p>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB: LATENCY */}
                  {staticSubTab === 'latency' && (
                    <div className="table-panel flex flex-col gap-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="panel-title text-sky-400 font-bold">Latency Analysis Summary</h3>
                        <span className="text-xs text-slate-400">Source: results/summary/{selectedVersion}/{selectedWorkflow}/latency/latency_analysis.json</span>
                      </div>
                      {staticSummary.latencySummary && (
                        <div className="panel p-6 border border-white/5 bg-slate-900/10 rounded-lg">
                          <h3 className="chart-title mb-4">Latency Range Comparison</h3>
                          <LatencyChart data={staticSummary.latencySummary} />
                        </div>
                      )}
                      {staticSummary.latencySummary ? (
                        <div className="table-wrapper">
                          <table className="dashboard-table">
                            <thead>
                              <tr>
                                <th>AI Model</th>
                                <th>Avg Generation Time</th>
                                <th>Max Time</th>
                                <th>Min Time</th>
                                <th>Total Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {staticSummary.latencySummary.map((row: any, idx: number) => (
                                <tr key={idx}>
                                  <td className="font-semibold text-slate-200">{row.model}</td>
                                  <td className="font-bold text-sky-400">{row.avg_time}s</td>
                                  <td className="text-slate-300">{row.max_time}s</td>
                                  <td className="text-slate-300">{row.min_time}s</td>
                                  <td className="text-slate-400 text-xs">{row.total_time}s</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 py-4 text-center">No latency analysis data available.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* DETAIL VIEW MODAL FOR BENCHMARKS */}
          {selectedRun && (
            <div className="modal-backdrop" onClick={() => setSelectedRun(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="flex flex-col">
                    <span className="modal-title flex items-center gap-2">
                      Run Details: <strong className="text-indigo-400">{selectedRun.benchmark_id}</strong>
                      <span className="badge text-[10px] font-mono">{selectedRun.version.toUpperCase()}</span>
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Model: <strong>{selectedRun.model}</strong> | Workflow: <strong>{selectedRun.workflow}</strong> | Category: <strong className="text-emerald-400">{selectedRun.category}</strong>
                    </span>
                  </div>
                  <button className="modal-close-btn" onClick={() => setSelectedRun(null)}>&times;</button>
                </div>
                <div className="modal-body">
                  {/* Modal Tabs Header */}
                  <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.1)', margin: '-1rem -1rem 1rem -1rem', borderRadius: '8px 8px 0 0' }}>
                    <button
                      onClick={() => setModalTab('code')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.55rem 1rem',
                        borderRadius: '8px 8px 0 0',
                        border: 'none',
                        background: modalTab === 'code' ? 'rgba(99,102,241,0.12)' : 'transparent',
                        color: modalTab === 'code' ? '#a5b4fc' : '#64748b',
                        fontSize: '0.82rem',
                        fontWeight: modalTab === 'code' ? 700 : 500,
                        cursor: 'pointer',
                        borderBottom: modalTab === 'code' ? '2px solid #6366f1' : '2px solid transparent',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span>⌬</span>
                      Source &amp; Tests
                    </button>
                    {selectedRun.workflow === 'best-of-n' && selectedRun.best_of_n_candidates && selectedRun.best_of_n_candidates.length > 0 && (
                      <button
                        onClick={() => setModalTab('candidates')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.55rem 1rem',
                          borderRadius: '8px 8px 0 0',
                          border: 'none',
                          background: modalTab === 'candidates' ? 'rgba(99,102,241,0.12)' : 'transparent',
                          color: modalTab === 'candidates' ? '#a5b4fc' : '#64748b',
                          fontSize: '0.82rem',
                          fontWeight: modalTab === 'candidates' ? 700 : 500,
                          cursor: 'pointer',
                          borderBottom: modalTab === 'candidates' ? '2px solid #6366f1' : '2px solid transparent',
                          transition: 'all 0.15s ease',
                          fontFamily: 'inherit',
                        }}
                      >
                        <span>☲</span>
                        Candidates ({selectedRun.best_of_n_candidates.length})
                      </button>
                    )}
                    <button
                      onClick={() => setModalTab('logs')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.55rem 1rem',
                        borderRadius: '8px 8px 0 0',
                        border: 'none',
                        background: modalTab === 'logs' ? 'rgba(99,102,241,0.12)' : 'transparent',
                        color: modalTab === 'logs' ? '#a5b4fc' : '#64748b',
                        fontSize: '0.82rem',
                        fontWeight: modalTab === 'logs' ? 700 : 500,
                        cursor: 'pointer',
                        borderBottom: modalTab === 'logs' ? '2px solid #6366f1' : '2px solid transparent',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span>◉</span>
                      Compiler Logs
                    </button>
                    <button
                      onClick={() => setModalTab('evaluation')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.55rem 1rem',
                        borderRadius: '8px 8px 0 0',
                        border: 'none',
                        background: modalTab === 'evaluation' ? 'rgba(99,102,241,0.12)' : 'transparent',
                        color: modalTab === 'evaluation' ? '#a5b4fc' : '#64748b',
                        fontSize: '0.82rem',
                        fontWeight: modalTab === 'evaluation' ? 700 : 500,
                        cursor: 'pointer',
                        borderBottom: modalTab === 'evaluation' ? '2px solid #6366f1' : '2px solid transparent',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span>⌘</span>
                      AI Evaluation details
                    </button>
                  </div>

                  {/* Tab Content: Code */}
                  {modalTab === 'code' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', minHeight: '420px' }}>
                      {/* Left: Source Code OR Expected Code */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>INPUT</span>
                          <span id="left-pane-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>Target C# Code (Class / Method)</span>
                        </div>
                        <div id="left-pane-code" className="code-viewer flex-1" style={{ maxHeight: 'none' }} data-show-expected="false">
                          <code>{selectedRun.source_code || '// No target source code available.'}</code>
                        </div>
                      </div>
                      {/* Right: Generated Test Code */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.15)' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>OUTPUT</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#a5b4fc' }}>Generated C# Test Code</span>
                          {selectedRun.expected_test && (
                            <button
                              className="text-[10px] text-slate-400 hover:text-white"
                              style={{ marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer' }}
                              onClick={() => {
                                // Simple swap of left column between Target Code and Expected Gold Standard Code
                                const leftPane = document.getElementById('left-pane-code');
                                if (leftPane) {
                                  const showExpected = leftPane.getAttribute('data-show-expected') === 'true';
                                  leftPane.setAttribute('data-show-expected', showExpected ? 'false' : 'true');
                                  leftPane.innerHTML = showExpected
                                    ? `<code>${selectedRun.source_code || ''}</code>`
                                    : `<code>${selectedRun.expected_test || ''}</code>`;
                                  const label = document.getElementById('left-pane-label');
                                  if (label) label.innerText = showExpected ? 'Target C# Code (Class / Method)' : 'Expected Gold Standard Test Code';
                                }
                              }}
                            >
                              [Toggle Gold Standard / Target Code]
                            </button>
                          )}
                        </div>
                        <div className="code-viewer flex-1" style={{ maxHeight: 'none', borderColor: 'rgba(99,102,241,0.15)' }}>
                          <code>{selectedRun.generated_test}</code>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Content: Candidates */}
                  {modalTab === 'candidates' && (
                    <div className="flex flex-col gap-4">
                      <span className="text-sm font-semibold text-slate-300">Best-of-N Candidate Generation Log</span>
                      <div className="flex flex-col gap-4">
                        {selectedRun.best_of_n_candidates?.map((c) => (
                          <div key={c.candidate_index} className="critique-card flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-200">Candidate #{c.candidate_index}</span>
                              <div className="flex gap-4 text-xs">
                                <span className="text-sky-400">Line Cov: <strong>{c.line_coverage}%</strong></span>
                                <span className="text-indigo-400">Branch Cov: <strong>{c.branch_coverage}%</strong></span>
                                <span className="text-purple-400">Grader Score: <strong>{c.score}</strong></span>
                                <span className={c.success ? 'text-emerald-400' : 'text-red-400'}>{c.success ? ' PASSED' : ' FAILED'}</span>
                              </div>
                            </div>
                            <div className="code-viewer" style={{ maxHeight: '200px' }}>
                              <code>{c.generated_test}</code>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tab Content: Compiler logs */}
                  {modalTab === 'logs' && (
                    <div className="flex flex-col gap-4 flex-1">
                      {/* Outcome + Healing banner */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', border: `1px solid ${selectedRun.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, background: selectedRun.success ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)' }}>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Build Outcome</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: selectedRun.success ? '#34d399' : '#f87171' }}>
                            {selectedRun.success ? '✓ PASS' : '✕ FAIL / COMPILER ERROR'}
                          </div>
                        </div>
                        <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Self-Healing Retries</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: selectedRun.healing_attempts > 0 ? '#fbbf24' : '#94a3b8' }}>
                            {selectedRun.healing_attempts > 0 ? `${selectedRun.healing_attempts} Attempt(s) Used` : 'None Required'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-slate-400">Build Stdout Log</span>
                        <pre className="console-logs" style={{ maxHeight: '250px' }}>{selectedRun.stdout || 'No logs captured.'}</pre>
                      </div>

                      {selectedRun.stderr && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-red-400">Build Stderr Log</span>
                          <pre className="console-logs console-error" style={{ maxHeight: '200px' }}>{selectedRun.stderr}</pre>
                        </div>
                      )}

                      {/* Healing log */}
                      {selectedRun.healing_log.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                          <span className="text-xs font-semibold text-slate-400">Self-Healing Retries Log ({selectedRun.healing_log.length})</span>
                          <div className="healing-list">
                            {selectedRun.healing_log.map((log) => (
                              <div key={log.attempt} className="healing-item text-xs flex flex-col gap-2 items-start">
                                <div className="w-full flex justify-between items-center">
                                  <div>
                                    <span className="healing-badge">Healing retry #{log.attempt}</span>
                                    <span className="text-slate-400 ml-2">{log.success ? 'Compiled successfully' : 'Compilation failed'}</span>
                                  </div>
                                  <span className={log.success ? 'text-emerald-400' : 'text-red-400'}>{log.success ? 'Fixed' : 'Failed'}</span>
                                </div>
                                {log.errors && (
                                  <div className="w-full mt-1 bg-red-900/10 border border-red-500/20 rounded p-2 text-[10px] font-mono text-red-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {log.errors}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evaluator log */}
                      {selectedRun.evaluator_loop_log && selectedRun.evaluator_loop_log.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4">
                          <span className="text-xs font-semibold text-slate-400">Evaluator-Guided Refinement Log ({selectedRun.evaluator_loop_log.length})</span>
                          <div className="healing-list">
                            {selectedRun.evaluator_loop_log.map((log) => (
                              <div key={log.attempt} className="healing-item text-xs flex flex-col gap-2 items-start">
                                <div className="w-full flex justify-between items-center">
                                  <div>
                                    <span className="healing-badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.3)' }}>Refine #{log.attempt}</span>
                                    <span className="text-slate-400 ml-2">Score: {log.score_before} 🎯 {log.score_after}</span>
                                  </div>
                                  <span className={log.success ? 'text-emerald-400' : 'text-red-400'}>{log.success ? '✅ Compiled' : '❌ Compile Error'}</span>
                                </div>
                                <div className="w-full mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                                  {(log as any).latency && <span>⏱️ Latency: {(log as any).latency.toFixed(2)}s</span>}
                                  {(log as any).cost && <span>💰 Cost: ${(log as any).cost.toFixed(5)}</span>}
                                  {((log as any).worker_prompt_tokens !== undefined || (log as any).worker_completion_tokens !== undefined) && (
                                    <span>🤖 Worker Tokens: {((log as any).worker_prompt_tokens || 0)}/{((log as any).worker_completion_tokens || 0)}</span>
                                  )}
                                  {((log as any).evaluator_prompt_tokens !== undefined || (log as any).evaluator_completion_tokens !== undefined) && (
                                    <span>🧠 Eval Tokens: {((log as any).evaluator_prompt_tokens || 0)}/{((log as any).evaluator_completion_tokens || 0)}</span>
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

                  {/* Tab Content: AI Evaluation */}
                  {modalTab === 'evaluation' && (
                    <div className="flex flex-col gap-4">
                      {selectedRun.evaluator_feedback ? (
                        <>
                          {/* ── Top metrics bar ── */}
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch', marginBottom: '0.25rem' }}>

                            {/* Circular Score Gauge */}
                            <div style={{
                              background: 'rgba(15,18,30,0.7)',
                              border: '1px solid rgba(99,102,241,0.2)',
                              borderRadius: '0.75rem',
                              padding: '1.25rem',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '130px',
                              gap: '0.5rem'
                            }}>
                              {(() => {
                                const score = selectedRun.evaluator_score;
                                const r = 36;
                                const circ = 2 * Math.PI * r;
                                const pct = Math.min(score, 100) / 100;
                                const dash = pct * circ;
                                const hue = Math.round(pct * 120); // 0=red,120=green
                                const color = `hsl(${hue},80%,60%)`;
                                return (
                                  <svg width="90" height="90" viewBox="0 0 90 90">
                                    <defs>
                                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                                        <stop offset="100%" stopColor="#818cf8" stopOpacity="1" />
                                      </linearGradient>
                                    </defs>
                                    {/* Track */}
                                    <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                                    {/* Progress */}
                                    <circle
                                      cx="45" cy="45" r={r} fill="none"
                                      stroke="url(#scoreGrad)" strokeWidth="8"
                                      strokeDasharray={`${dash} ${circ}`}
                                      strokeLinecap="round"
                                      transform="rotate(-90 45 45)"
                                      style={{ transition: 'stroke-dasharray 0.8s ease' }}
                                    />
                                    <text x="45" y="37" textAnchor="middle" dominantBaseline="middle"
                                      fill="white" fontSize="14" fontWeight="800">{score}</text>
                                    <text x="45" y="50" textAnchor="middle" dominantBaseline="middle"
                                      fill="rgba(148,163,184,0.6)" fontSize="7">/ 100</text>
                                    <text x="45" y="62" textAnchor="middle" dominantBaseline="middle"
                                      fill="rgba(148,163,184,0.5)" fontSize="6.5">Total Score</text>
                                  </svg>
                                );
                              })()}
                              <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'rgba(148,163,184,0.7)', lineHeight: '1.4', maxWidth: '110px' }}>
                                Evaluator Agent<br />semantic quality grade
                              </div>
                            </div>

                            {/* Middle metric cards: Correctness · Line Coverage · Branch Coverage */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '0 0 auto' }}>
                              {/* Correctness Rating */}
                              <div style={{
                                background: 'rgba(15,18,30,0.7)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '0.75rem',
                                padding: '0.75rem 1rem',
                                flex: 1
                              }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                                  Correctness Rating
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a5b4fc', lineHeight: 1 }}>
                                  <span style={{ fontSize: '0.75rem', color: 'rgba(148,163,184,0.6)', fontWeight: 600 }}>Level </span>{selectedRun.evaluator_feedback.correctness_rating}
                                  <span style={{ fontSize: '0.85rem', color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}> / 10</span>
                                </div>
                              </div>
                              {/* Line Coverage */}
                              <div style={{
                                background: 'rgba(15,18,30,0.7)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '0.75rem',
                                padding: '0.75rem 1rem',
                                flex: 1
                              }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                                  Line Coverage
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7dd3fc', lineHeight: 1 }}>
                                  {selectedRun.line_coverage}
                                  <span style={{ fontSize: '0.85rem', color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}>%</span>
                                </div>
                              </div>
                              {/* Branch Coverage */}
                              <div style={{
                                background: 'rgba(15,18,30,0.7)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '0.75rem',
                                padding: '0.75rem 1rem',
                                flex: 1
                              }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                                  Branch Coverage
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#86efac', lineHeight: 1 }}>
                                  {selectedRun.branch_coverage}
                                  <span style={{ fontSize: '0.85rem', color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}>%</span>
                                </div>
                              </div>
                              {/* Mutation Score */}
                              <div style={{
                                background: 'rgba(15,18,30,0.7)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '0.75rem',
                                padding: '0.75rem 1rem',
                                flex: 1
                              }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                                  Mutation Score
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f472b6', lineHeight: 1 }}>
                                  {selectedRun.mutation_score != null ? `${selectedRun.mutation_score}%` : 'N/A'}
                                </div>
                              </div>
                            </div>

                            {/* Compilation Check — tall card on the right */}
                            <div style={{
                              background: 'rgba(15,18,30,0.7)',
                              border: '1px solid rgba(99,102,241,0.2)',
                              borderRadius: '0.75rem',
                              padding: '1rem 1.1rem',
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem'
                            }}>
                              <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase' }}>
                                Compilation Check
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.85)', lineHeight: '1.65', flex: 1, overflowY: 'auto', maxHeight: '160px' }}>
                                {selectedRun.evaluator_feedback.compilation_review || 'N/A'}
                              </div>
                            </div>
                          </div>

                          {/* ── Detailed Telemetry & Initial State Breakdown ── */}
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', paddingTop: '0.75rem', paddingBottom: '0.25rem' }}>
                            Granular Telemetry &amp; Initial State
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            {/* Initial State Panel */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                              <div style={{ fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.25rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ color: '#818cf8' }}>✦</span> Initial State (Before loops)
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Success Status:</span><span style={{ fontWeight: 600, color: selectedRun.initial_success ? '#34d399' : '#f87171' }}>{selectedRun.initial_success ? 'PASSED' : 'FAILED'}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Line Coverage:</span><span style={{ fontWeight: 600, color: '#cbd5e1' }}>{selectedRun.initial_line_coverage !== undefined ? `${selectedRun.initial_line_coverage}%` : 'N/A'}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Branch Coverage:</span><span style={{ fontWeight: 600, color: '#cbd5e1' }}>{selectedRun.initial_branch_coverage !== undefined ? `${selectedRun.initial_branch_coverage}%` : 'N/A'}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Evaluator Score:</span><span style={{ fontWeight: 600, color: '#cbd5e1' }}>{selectedRun.initial_evaluator_score !== undefined ? `${selectedRun.initial_evaluator_score}/100` : 'N/A'}</span></div>
                              </div>
                            </div>

                            {/* Agent Telemetry Panel */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                              <div style={{ fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.25rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ color: '#f472b6' }}>⬢</span> Agent Telemetry Breakdowns
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#a5b4fc', fontSize: '0.7rem' }}>Worker Agent (LLM Creator):</div>
                                  <div style={{ paddingLeft: '0.4rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#cbd5e1' }}>
                                    <span>Latency: {selectedRun.worker_latency ?? 0}s</span>
                                    <span>Cost: ${selectedRun.worker_cost?.toFixed(5) ?? '0.00000'}</span>
                                    <span>Tokens: {selectedRun.worker_prompt_tokens ?? 0}p / {selectedRun.worker_completion_tokens ?? 0}c</span>
                                  </div>
                                </div>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.3rem' }}>
                                  <div style={{ fontWeight: 600, color: '#f472b6', fontSize: '0.7rem' }}>Evaluator Agent (Grader):</div>
                                  <div style={{ paddingLeft: '0.4rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#cbd5e1' }}>
                                    <span>Latency: {selectedRun.evaluator_latency ?? 0}s</span>
                                    <span>Cost: ${selectedRun.evaluator_cost?.toFixed(5) ?? '0.00000'}</span>
                                    <span>Tokens: {selectedRun.evaluator_prompt_tokens ?? 0}p / {selectedRun.evaluator_completion_tokens ?? 0}c</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* ── Section title for critique cards below ── */}
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', paddingTop: '0.5rem', paddingBottom: '0.25rem' }}>
                            Semantic Review Details
                          </div>

                          <div className="flex flex-col gap-3">
                            <div className="critique-card">
                              <div className="critique-title">Assertion Quality Critique</div>
                              <div className="critique-body">{selectedRun.evaluator_feedback.assertion_quality_review}</div>
                            </div>

                            <div className="critique-card">
                              <div className="critique-title">Mocking &amp; Dependency Check</div>
                              <div className="critique-body">{selectedRun.evaluator_feedback.mocking_review}</div>
                            </div>

                            <div className="critique-card">
                              <div className="critique-title">Coverage Critique</div>
                              <div className="critique-body">{selectedRun.evaluator_feedback.coverage_review}</div>
                            </div>

                            {selectedRun.evaluator_feedback.issues_found && selectedRun.evaluator_feedback.issues_found.length > 0 && (
                              <div className="critique-card border-red-950/40 bg-red-950/5">
                                <div className="critique-title text-red-400">Issues Flagged by Grader</div>
                                <ul className="list-disc pl-4 text-xs text-red-300">
                                  {selectedRun.evaluator_feedback.issues_found.map((issue, idx) => (
                                    <li key={idx} className="mb-1">{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {selectedRun.evaluator_feedback.suggestions && selectedRun.evaluator_feedback.suggestions.length > 0 && (
                              <div className="critique-card border-indigo-950/40 bg-indigo-950/5">
                                <div className="critique-title text-indigo-400">Refinement Suggestions</div>
                                <div>
                                  {selectedRun.evaluator_feedback.suggestions.map((suggestion, idx) => (
                                    <div key={idx} className="suggestion-item">{suggestion}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-slate-500 py-8">
                          No evaluation details were generated for this run.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* DETAIL VIEW MODAL FOR WEB DEMO SUBMISSIONS */}
          {selectedSubmission && (
            <div className="modal-backdrop" onClick={() => setSelectedSubmission(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1150px', background: 'linear-gradient(145deg, #111827 0%, #1e293b 100%)', border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)' }}>

                {/* Premium Header with gradient accent bar */}
                <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem 1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {/* Title row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '3px', height: '28px', background: 'linear-gradient(180deg, #6366f1, #a855f7)', borderRadius: '2px', flexShrink: 0 }} />
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                          Playground Submission
                        </span>
                        <span style={{
                          padding: '0.2rem 0.65rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: selectedSubmission.result.success ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: selectedSubmission.result.success ? '#34d399' : '#f87171',
                          border: `1px solid ${selectedSubmission.result.success ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}`,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase'
                        }}>
                          {selectedSubmission.result.success ? '✓ Build Passed' : '✕ Build Failed'}
                        </span>
                      </div>
                      {/* Meta info chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingLeft: '1rem' }}>
                        {[
                          { icon: '⬢', label: new Date(selectedSubmission.timestamp).toLocaleString() },
                          { icon: '✦', label: selectedSubmission.model },
                          { icon: '◎', label: selectedSubmission.workflow.replace(/_/g, ' ') },
                          ...(selectedSubmission.filePath ? [{ icon: '▣', label: selectedSubmission.filePath }] : []),
                        ].map((chip, i) => (
                          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                            <span>{chip.icon}</span>
                            <span>{chip.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedSubmission(null)}
                      style={{ flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Stats bar */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.75rem', marginTop: '1rem', paddingLeft: '1rem' }}>
                    {[
                      { label: 'Evaluator Score', value: `${selectedSubmission.result.evaluator_score}/100`, color: '#a5b4fc' },
                      { label: 'Line Coverage', value: `${selectedSubmission.result.line_coverage}%`, color: '#38bdf8' },
                      { label: 'Branch Coverage', value: `${selectedSubmission.result.branch_coverage}%`, color: '#6366f1' },
                      ...(selectedSubmission.result.mutation_score != null ? [{ label: '🧬 Mutation Score', value: `${selectedSubmission.result.mutation_score}%`, color: '#f97316' }] : []),
                      { label: 'Latency', value: `${selectedSubmission.result.latency}s`, color: '#fbbf24' },
                      { label: 'Cost (USD)', value: `$${selectedSubmission.result.cost.toFixed(5)}`, color: '#34d399' },
                      { label: 'Heal Retries', value: `${selectedSubmission.result.healing_attempts}`, color: '#f87171' },
                    ].map((stat) => (
                      <div key={stat.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem 0.75rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{stat.label}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem 1.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.1)' }}>
                  {[
                    { id: 'code', icon: '⌬', label: 'Source & Test Code' },
                    { id: 'logs', icon: '◉', label: 'Compiler Logs' },
                    { id: 'evaluation', icon: '⌘', label: 'AI Evaluation' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setModalTab(tab.id as 'code' | 'logs' | 'evaluation')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.55rem 1rem',
                        borderRadius: '8px 8px 0 0',
                        border: 'none',
                        background: modalTab === tab.id ? 'rgba(99,102,241,0.12)' : 'transparent',
                        color: modalTab === tab.id ? '#a5b4fc' : '#64748b',
                        fontSize: '0.82rem',
                        fontWeight: modalTab === tab.id ? 700 : 500,
                        cursor: 'pointer',
                        borderBottom: modalTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                        transition: 'all 0.15s ease',
                        fontFamily: 'inherit',
                      }}
                    >
                      <span>{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Modal Body */}
                <div className="modal-body" style={{ padding: '1.25rem 1.5rem', gap: '1.25rem' }}>

                  {/* Tab: Source & Test Code */}
                  {modalTab === 'code' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', minHeight: '420px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>INPUT</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8' }}>User Submitted C# Source Code</span>
                        </div>
                        <div className="code-viewer" style={{ flex: 1, maxHeight: 'none' }}>
                          <code>{selectedSubmission.sourceCode}</code>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.15)' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>OUTPUT</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#a5b4fc' }}>AI-Generated xUnit Test Code</span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(99,102,241,0.2)' }}>C#</span>
                        </div>
                        <div className="code-viewer" style={{ flex: 1, maxHeight: 'none', borderColor: 'rgba(99,102,241,0.15)' }}>
                          <code>{selectedSubmission.result.generated_test}</code>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab: Compiler Logs */}
                  {modalTab === 'logs' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {/* Outcome + Healing banner */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                        <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', border: `1px solid ${selectedSubmission.result.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, background: selectedSubmission.result.success ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)' }}>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Build Outcome</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: selectedSubmission.result.success ? '#34d399' : '#f87171' }}>
                            {selectedSubmission.result.success ? '✓ All Tests Passed' : '✕ Build / Tests Failed'}
                          </div>
                        </div>
                        <div style={{ padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Self-Healing Retries</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: selectedSubmission.result.healing_attempts > 0 ? '#fbbf24' : '#94a3b8' }}>
                            {selectedSubmission.result.healing_attempts > 0 ? `${selectedSubmission.result.healing_attempts} Attempt(s) Used` : 'None Required'}
                          </div>
                        </div>
                      </div>

                      {/* Healing log for selectedSubmission */}
                      {selectedSubmission.result.healing_log && selectedSubmission.result.healing_log.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                          <span className="text-xs font-semibold text-slate-400">Self-Healing Retries Log ({selectedSubmission.result.healing_log.length})</span>
                          <div className="healing-list">
                            {selectedSubmission.result.healing_log.map((log: any, idx: number) => (
                              <div key={idx} className="healing-item text-xs flex flex-col gap-2 items-start">
                                <div className="w-full flex justify-between items-center">
                                  <div>
                                    <span className="healing-badge">Healing retry #{log.attempt}</span>
                                    <span className="text-slate-400 ml-2">{log.success ? 'Compiled successfully' : 'Compilation failed'}</span>
                                  </div>
                                  <span className={log.success ? 'text-emerald-400' : 'text-red-400'}>{log.success ? 'Fixed' : 'Failed'}</span>
                                </div>
                                {log.errors && (
                                  <div className="w-full mt-1 bg-red-900/10 border border-red-500/20 rounded p-2 text-[10px] font-mono text-red-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {log.errors}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Evaluator log for selectedSubmission */}
                      {selectedSubmission.result.evaluator_loop_log && selectedSubmission.result.evaluator_loop_log.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4">
                          <span className="text-xs font-semibold text-slate-400">Evaluator-Guided Refinement Log ({selectedSubmission.result.evaluator_loop_log.length})</span>
                          <div className="healing-list">
                            {selectedSubmission.result.evaluator_loop_log.map((log: any, idx: number) => (
                              <div key={idx} className="healing-item text-xs flex flex-col gap-2 items-start">
                                <div className="w-full flex justify-between items-center">
                                  <div>
                                    <span className="healing-badge" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.3)' }}>Refine #{log.attempt}</span>
                                    <span className="text-slate-400 ml-2">Score: {log.score_before} 🎯 {log.score_after}</span>
                                  </div>
                                  <span className={log.success ? 'text-emerald-400' : 'text-red-400'}>{log.success ? '✅ Compiled' : '❌ Compile Error'}</span>
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
                                {log.errors && (
                                  <div className="w-full mt-1 bg-red-900/10 border border-red-500/20 rounded p-2 text-[10px] font-mono text-red-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                    {log.errors}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mutation Testing Panel */}
                      {selectedSubmission.result.mutation_score != null && (
                        <div style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '10px', padding: '0.9rem 1.1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>🧬 STRYKER MUTATION TESTING</span>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>dotnet-stryker analysis on final test</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mutation Score</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: selectedSubmission.result.mutation_score >= 70 ? '#f97316' : selectedSubmission.result.mutation_score >= 40 ? '#eab308' : '#f87171' }}>
                                  {selectedSubmission.result.mutation_score}%
                                </span>
                              </div>
                              <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', borderRadius: '4px',
                                  width: `${selectedSubmission.result.mutation_score}%`,
                                  background: selectedSubmission.result.mutation_score >= 70
                                    ? 'linear-gradient(90deg, #ea580c, #f97316)'
                                    : selectedSubmission.result.mutation_score >= 40
                                    ? 'linear-gradient(90deg, #ca8a04, #eab308)'
                                    : 'linear-gradient(90deg, #dc2626, #f87171)',
                                  transition: 'width 0.5s ease'
                                }} />
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.25rem' }}>
                                Formula: (Killed + Timeout) ÷ (Total − Ignored) × 100
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: '70px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '10px', padding: '0.6rem 0.75rem' }}>
                              <div style={{ fontSize: '1.6rem', fontWeight: 900, lineHeight: 1, color: selectedSubmission.result.mutation_score >= 70 ? '#f97316' : selectedSubmission.result.mutation_score >= 40 ? '#eab308' : '#f87171' }}>
                                {selectedSubmission.result.mutation_score}
                              </div>
                              <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600 }}>/ 100 pts</div>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                            {[
                              { label: 'Total', value: selectedSubmission.result.total_mutants, color: '#94a3b8', bg: 'rgba(255,255,255,0.04)' },
                              { label: '✓ Killed', value: selectedSubmission.result.killed_mutants, color: '#34d399', bg: 'rgba(16,185,129,0.07)' },
                              { label: '✗ Survived', value: selectedSubmission.result.survived_mutants, color: '#f87171', bg: 'rgba(239,68,68,0.07)' },
                              { label: '⏱ Timeout', value: selectedSubmission.result.timeout_mutants, color: '#fbbf24', bg: 'rgba(245,158,11,0.07)' },
                              { label: '— Ignored', value: selectedSubmission.result.ignored_mutants, color: '#64748b', bg: 'rgba(255,255,255,0.02)' },
                            ].map(({ label, value, color, bg }) => (
                              <div key={label} style={{ textAlign: 'center', background: bg, borderRadius: '8px', padding: '0.45rem 0.4rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{value ?? '—'}</div>
                                <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600, marginTop: '0.1rem' }}>{label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>STDOUT</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>dotnet test output</span>
                        </div>
                        <pre className="console-logs" style={{ maxHeight: '240px' }}>{selectedSubmission.result.stdout || 'No output captured.'}</pre>
                      </div>

                      {selectedSubmission.result.stderr && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>STDERR</span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>compiler / build errors</span>
                          </div>
                          <pre className="console-logs console-error" style={{ maxHeight: '200px' }}>{selectedSubmission.result.stderr}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab: AI Evaluation */}
                  {modalTab === 'evaluation' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {selectedSubmission.result.evaluator_feedback ? (
                        <>
                          {/* Score + Key Metrics */}
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch', marginBottom: '0.25rem' }}>

                            {/* Circular Score Gauge */}
                            <div style={{
                              background: 'rgba(15,18,30,0.7)',
                              border: '1px solid rgba(99,102,241,0.2)',
                              borderRadius: '0.75rem',
                              padding: '1.25rem',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: '130px',
                              gap: '0.5rem'
                            }}>
                              {(() => {
                                const score = selectedSubmission.result.evaluator_score;
                                const r = 36;
                                const circ = 2 * Math.PI * r;
                                const pct = Math.min(score, 100) / 100;
                                const dash = pct * circ;
                                const hue = Math.round(pct * 120); // 0=red,120=green
                                const color = `hsl(${hue},80%,60%)`;
                                return (
                                  <svg width="90" height="90" viewBox="0 0 90 90">
                                    <defs>
                                      <linearGradient id="submissionScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={color} stopOpacity="1" />
                                        <stop offset="100%" stopColor="#818cf8" stopOpacity="1" />
                                      </linearGradient>
                                    </defs>
                                    {/* Track */}
                                    <circle cx="45" cy="45" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                                    {/* Progress */}
                                    <circle
                                      cx="45" cy="45" r={r} fill="none"
                                      stroke="url(#submissionScoreGrad)" strokeWidth="8"
                                      strokeDasharray={`${dash} ${circ}`}
                                      strokeLinecap="round"
                                      transform="rotate(-90 45 45)"
                                      style={{ transition: 'stroke-dasharray 0.8s ease' }}
                                    />
                                    <text x="45" y="37" textAnchor="middle" dominantBaseline="middle"
                                      fill="white" fontSize="14" fontWeight="800">{score}</text>
                                    <text x="45" y="50" textAnchor="middle" dominantBaseline="middle"
                                      fill="rgba(148,163,184,0.6)" fontSize="7">/ 100</text>
                                    <text x="45" y="62" textAnchor="middle" dominantBaseline="middle"
                                      fill="rgba(148,163,184,0.5)" fontSize="6.5">Total Score</text>
                                  </svg>
                                );
                              })()}
                              <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'rgba(148,163,184,0.7)', lineHeight: '1.4', maxWidth: '110px' }}>
                                Evaluator Agent (GPT-4.1)<br />semantic quality grade
                              </div>
                            </div>

                            {/* Middle metric cards: Correctness · Line Coverage · Branch Coverage */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '0 0 auto' }}>
                              {/* Correctness Rating */}
                              <div style={{
                                background: 'rgba(15,18,30,0.7)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '0.75rem',
                                padding: '0.75rem 1rem',
                                flex: 1
                              }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                                  Correctness Rating
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a5b4fc', lineHeight: 1 }}>
                                  <span style={{ fontSize: '0.75rem', color: 'rgba(148,163,184,0.6)', fontWeight: 600 }}>Level </span>{selectedSubmission.result.evaluator_feedback.correctness_rating}
                                  <span style={{ fontSize: '0.85rem', color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}> / 10</span>
                                </div>
                              </div>
                              {/* Line Coverage */}
                              <div style={{
                                background: 'rgba(15,18,30,0.7)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '0.75rem',
                                padding: '0.75rem 1rem',
                                flex: 1
                              }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                                  Line Coverage
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7dd3fc', lineHeight: 1 }}>
                                  {selectedSubmission.result.line_coverage}
                                  <span style={{ fontSize: '0.85rem', color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}>%</span>
                                </div>
                              </div>
                              {/* Branch Coverage */}
                              <div style={{
                                background: 'rgba(15,18,30,0.7)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '0.75rem',
                                padding: '0.75rem 1rem',
                                flex: 1
                              }}>
                                <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                                  Branch Coverage
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#86efac', lineHeight: 1 }}>
                                  {selectedSubmission.result.branch_coverage}
                                  <span style={{ fontSize: '0.85rem', color: 'rgba(148,163,184,0.5)', fontWeight: 500 }}>%</span>
                                </div>
                              </div>
                            </div>

                            {/* Compilation Check — tall card on the right */}
                            <div style={{
                              background: 'rgba(15,18,30,0.7)',
                              border: '1px solid rgba(99,102,241,0.2)',
                              borderRadius: '0.75rem',
                              padding: '1rem 1.1rem',
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem'
                            }}>
                              <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase' }}>
                                Compilation Check
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'rgba(226,232,240,0.85)', lineHeight: '1.65', flex: 1, overflowY: 'auto', maxHeight: '160px' }}>
                                {selectedSubmission.result.evaluator_feedback.compilation_review || 'N/A'}
                              </div>
                            </div>
                          </div>

                          {/* ── Detailed Telemetry & Initial State Breakdown ── */}
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(148,163,184,0.5)', textTransform: 'uppercase', paddingTop: '0.75rem', paddingBottom: '0.25rem' }}>
                            Granular Telemetry &amp; Initial State
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            {/* Initial State Panel */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                              <div style={{ fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.25rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ color: '#818cf8' }}>✦</span> Initial State (Before loops)
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Success Status:</span><span style={{ fontWeight: 600, color: selectedSubmission.result.initial_success ? '#34d399' : '#f87171' }}>{selectedSubmission.result.initial_success ? 'PASSED' : 'FAILED'}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Line Coverage:</span><span style={{ fontWeight: 600, color: '#cbd5e1' }}>{selectedSubmission.result.initial_line_coverage !== undefined ? `${selectedSubmission.result.initial_line_coverage}%` : 'N/A'}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Branch Coverage:</span><span style={{ fontWeight: 600, color: '#cbd5e1' }}>{selectedSubmission.result.initial_branch_coverage !== undefined ? `${selectedSubmission.result.initial_branch_coverage}%` : 'N/A'}</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Evaluator Score:</span><span style={{ fontWeight: 600, color: '#cbd5e1' }}>{selectedSubmission.result.initial_evaluator_score !== undefined ? `${selectedSubmission.result.initial_evaluator_score}/100` : 'N/A'}</span></div>
                              </div>
                            </div>

                            {/* Agent Telemetry Panel */}
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                              <div style={{ fontWeight: 700, color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.25rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ color: '#f472b6' }}>⬢</span> Agent Telemetry Breakdowns
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#a5b4fc', fontSize: '0.7rem' }}>Worker Agent (LLM Creator):</div>
                                  <div style={{ paddingLeft: '0.4rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#cbd5e1' }}>
                                    <span>Latency: {selectedSubmission.result.worker_latency ?? 0}s</span>
                                    <span>Cost: ${selectedSubmission.result.worker_cost?.toFixed(5) ?? '0.00000'}</span>
                                    <span>Tokens: {selectedSubmission.result.worker_prompt_tokens ?? 0}p / {selectedSubmission.result.worker_completion_tokens ?? 0}c</span>
                                  </div>
                                </div>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.3rem' }}>
                                  <div style={{ fontWeight: 600, color: '#f472b6', fontSize: '0.7rem' }}>Evaluator Agent (Grader):</div>
                                  <div style={{ paddingLeft: '0.4rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#cbd5e1' }}>
                                    <span>Latency: {selectedSubmission.result.evaluator_latency ?? 0}s</span>
                                    <span>Cost: ${selectedSubmission.result.evaluator_cost?.toFixed(5) ?? '0.00000'}</span>
                                    <span>Tokens: {selectedSubmission.result.evaluator_prompt_tokens ?? 0}p / {selectedSubmission.result.evaluator_completion_tokens ?? 0}c</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Critique cards */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Semantic Review Details</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                              {[
                                { title: '◈ Assertion Quality', body: selectedSubmission.result.evaluator_feedback.assertion_quality_review, color: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.2)' },
                                { title: '◈ Mocking & Dependencies', body: selectedSubmission.result.evaluator_feedback.mocking_review, color: 'rgba(6,182,212,0.06)', borderColor: 'rgba(6,182,212,0.15)' },
                                { title: '◈ Coverage Analysis', body: selectedSubmission.result.evaluator_feedback.coverage_review, color: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.15)' },
                              ].map((card) => (
                                <div key={card.title} style={{ background: card.color, border: `1px solid ${card.borderColor}`, borderRadius: '10px', padding: '0.85rem 1rem' }}>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.4rem' }}>{card.title}</div>
                                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.5' }}>{card.body}</div>
                                </div>
                              ))}
                            </div>

                            {/* Issues */}
                            {selectedSubmission.result.evaluator_feedback.issues_found && selectedSubmission.result.evaluator_feedback.issues_found.length > 0 && (
                              <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171', marginBottom: '0.5rem' }}>◈ Issues Found by Evaluator</div>
                                <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  {selectedSubmission.result.evaluator_feedback.issues_found.map((issue, idx) => (
                                    <li key={idx} style={{ fontSize: '0.8rem', color: '#fca5a5', lineHeight: '1.5' }}>{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Suggestions */}
                            {selectedSubmission.result.evaluator_feedback.suggestions && selectedSubmission.result.evaluator_feedback.suggestions.length > 0 && (
                              <div style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '10px', padding: '0.85rem 1rem' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '0.5rem' }}>◈ Optimization Suggestions</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                  {selectedSubmission.result.evaluator_feedback.suggestions.map((suggestion, idx) => (
                                    <div key={idx} className="suggestion-item" style={{ fontSize: '0.8rem' }}>{suggestion}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-slate-500 py-8">
                          No evaluation details were generated for this run.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* DETAIL VIEW MODAL FOR CI/CD COMMIT HOOK RUNS */}
          {selectedCicdLog && (
            <div className="modal-backdrop" onClick={() => setSelectedCicdLog(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '1000px', width: '90%' }}>
                <div className="modal-header">
                  <div className="flex flex-col">
                    <span className="modal-title">CI/CD Commit Gate Check</span>
                    <span className="text-xs text-slate-400 mt-1">
                      Time: <strong>{new Date(selectedCicdLog.timestamp).toLocaleString()}</strong>
                    </span>
                  </div>
                  <button className="modal-close-btn" onClick={() => setSelectedCicdLog(null)}>&times;</button>
                </div>
                <div className="modal-body flex flex-col gap-4">
                  <div className="metrics-row bg-slate-900/30 p-4 border border-[rgba(255,255,255,0.06)] rounded-lg">
                    <div>
                      <div className="text-xs text-slate-400 font-semibold">Gate Status:</div>
                      <div className="text-xl font-extrabold" style={{ color: selectedCicdLog.success ? '#10b981' : '#ef4444' }}>
                        {selectedCicdLog.success ? 'ALLOWED / PASSED' : 'BLOCKED / FAILED'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold">Line Coverage:</div>
                      <div className="text-xl font-bold text-sky-400">{selectedCicdLog.line_coverage}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold">Grader Score:</div>
                      <div className="text-xl font-bold text-purple-400">{selectedCicdLog.evaluator_score} / 100</div>
                    </div>
                    {selectedCicdLog.mutation_score != null && (
                      <div>
                        <div className="text-xs text-slate-400 font-semibold">🧬 Mutation Score:</div>
                        <div className="text-xl font-bold" style={{
                          color: selectedCicdLog.mutation_score >= 70 ? '#f97316' : selectedCicdLog.mutation_score >= 40 ? '#eab308' : '#f87171'
                        }}>
                          {selectedCicdLog.mutation_score}%
                          <span className="text-xs font-normal text-slate-500 ml-1">
                            ({selectedCicdLog.killed_mutants}/{selectedCicdLog.total_mutants} killed)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 bg-slate-950/40 p-4 border border-[rgba(255,255,255,0.05)] rounded-lg text-sm">
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400">Target File Checked:</span>
                      <span className="font-semibold text-slate-200 font-mono text-xs">{selectedCicdLog.file_path}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400">Orchestration Model:</span>
                      <span className="font-semibold text-slate-200">{selectedCicdLog.model}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400">Workflow Type:</span>
                      <span className="font-semibold text-slate-200 font-mono text-xs">{selectedCicdLog.workflow}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-slate-400">Validation Latency:</span>
                      <span className="font-semibold text-slate-200">{selectedCicdLog.latency} seconds</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">API Cost (USD):</span>
                      <span className="font-bold text-amber-400">${selectedCicdLog.cost.toFixed(5)}</span>
                    </div>
                  </div>

                  {selectedCicdLog.result?.generated_test && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>OUTPUT</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#a5b4fc' }}>AI-Generated xUnit Test Code</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(99,102,241,0.2)' }}>C#</span>
                      </div>
                      <div className="code-viewer" style={{ flex: 1, maxHeight: '350px', borderColor: 'rgba(99,102,241,0.15)', overflowY: 'auto' }}>
                        <code>{selectedCicdLog.result.generated_test}</code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
              (แนวทางระบบหลายตัวแทนร่วมกับโมเดลภาษาขนาดใหญ่สำหรับการสร้างและปรับปรุงการทดสอบระดับหน่วยอัตโนมัติในโปรแกรมภาษา C#)
            </p>
          </div>

          <div style={{ flex: 1.2, minWidth: '280px' }}>
            <h4 style={{ color: '#f8fafc', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
              Researcher and University
            </h4>
            <p style={{ margin: '0.25rem 0' }}><strong>Researcher:</strong> Mr. Attaphon Pungjaree</p>
            <p style={{ margin: '0.25rem 0' }}><strong>Thesis Advisor:</strong> Dr. Thanapat Kangkachit</p>
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

// React grouped bar chart SVG rendering
const ModelComparisonChart = ({ data }: { data: any[] }) => {
  const modelsMap: Record<string, { count: number; score: number; line: number; branch: number }> = {};

  data.forEach((r) => {
    const model = r.model;
    if (!modelsMap[model]) {
      modelsMap[model] = { count: 0, score: 0, line: 0, branch: 0 };
    }
    modelsMap[model].count += 1;
    modelsMap[model].score += r.evaluator_score;
    modelsMap[model].line += r.line_coverage;
    modelsMap[model].branch += r.branch_coverage;
  });

  const chartData = Object.entries(modelsMap).map(([model, stats]) => ({
    model: model.replace(/_/g, ' ').replace('Instruct', '').trim(),
    score: Math.round(stats.score / stats.count),
    line: Math.round(stats.line / stats.count),
    branch: Math.round(stats.branch / stats.count)
  }));

  if (chartData.length === 0) {
    return <div className="text-slate-500 text-sm text-center py-10">No data available for filters selected.</div>;
  }

  const height = 240;
  const barWidth = 18;
  const groupSpacing = 35;
  const paddingLeft = 50;
  const paddingTop = 20;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 justify-end text-[10px] mb-2 text-slate-400">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" /> Score</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Line Cov</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-cyan-500 rounded-sm" /> Branch Cov</div>
      </div>
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg width={700} height={height + 50} style={{ minWidth: '400px' }}>
          {[0, 25, 50, 75, 100].map((v) => {
            const y = height - (v / 100) * height + paddingTop;
            return (
              <g key={v}>
                <line x1={paddingLeft} y1={y} x2="100%" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 4} fill="var(--text-secondary)" fontSize="9" textAnchor="end">{v}%</text>
              </g>
            );
          })}

          {chartData.map((d, i) => {
            const groupX = paddingLeft + i * (barWidth * 3 + groupSpacing) + 20;
            const pScore = Number(d.score) || 0;
            const pLine = Number(d.line) || 0;
            const pBranch = Number(d.branch) || 0;
            const yScore = height - (pScore / 100) * height + paddingTop;
            const yLine = height - (pLine / 100) * height + paddingTop;
            const yBranch = height - (pBranch / 100) * height + paddingTop;

            return (
              <g key={d.model}>
                {/* Score Bar */}
                <rect x={groupX} y={yScore || 0} width={barWidth} height={(pScore / 100) * height || 0} fill="url(#scoreGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                <text x={groupX + barWidth / 2} y={(yScore || 0) - 4} fill="#a5b4fc" fontSize="9" fontWeight="bold" textAnchor="middle">{pScore}%</text>

                {/* Line Coverage Bar */}
                <rect x={groupX + barWidth} y={yLine || 0} width={barWidth} height={(pLine / 100) * height || 0} fill="url(#lineGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                <text x={groupX + barWidth + barWidth / 2} y={(yLine || 0) - 4} fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">{pLine}%</text>

                {/* Branch Coverage Bar */}
                <rect x={groupX + barWidth * 2} y={yBranch || 0} width={barWidth} height={(pBranch / 100) * height || 0} fill="url(#branchGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                <text x={groupX + barWidth * 2 + barWidth / 2} y={(yBranch || 0) - 4} fill="#22d3ee" fontSize="9" fontWeight="bold" textAnchor="middle">{pBranch}%</text>

                {/* Axis Label */}
                <text x={groupX + barWidth * 1.5} y={height + paddingTop + 20} fill="var(--text-secondary)" fontSize="9" fontWeight="700" textAnchor="middle">
                  {d.model.replace('-Instruct', '').replace('gpt-4.1-mini', 'gpt-4.1')}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="branchGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

// React horizontal workflow efficiency comparison
const WorkflowComparisonChart = ({ data }: { data: any[] }) => {
  const workflowMap: Record<string, { count: number; score: number; cost: number; latency: number }> = {};

  data.forEach((r) => {
    const wf = r.workflow;
    if (!workflowMap[wf]) {
      workflowMap[wf] = { count: 0, score: 0, cost: 0, latency: 0 };
    }
    workflowMap[wf].count += 1;
    workflowMap[wf].score += r.evaluator_score;
    workflowMap[wf].cost += r.cost;
    workflowMap[wf].latency += r.generation_time;
  });

  const chartData = Object.entries(workflowMap).map(([wf, stats]) => ({
    workflow: wf.replace(/_/g, ' ').toUpperCase(),
    score: Math.round(stats.score / stats.count),
    cost: stats.cost / stats.count,
    latency: Math.round(stats.latency / stats.count)
  }));

  if (chartData.length === 0) {
    return <div className="text-slate-500 text-sm text-center py-10">No data available for filters selected.</div>;
  }

  chartData.sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-4">
      {chartData.map((d) => (
        <div key={d.workflow} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-[10px] font-semibold text-slate-400">
            <span className="text-slate-200">{d.workflow}</span>
            <span>
              Avg Cost: <strong className="text-amber-400">${d.cost.toFixed(5)}</strong> | Latency: <strong className="text-slate-200">{d.latency}s</strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-900/60 border border-white/5 h-5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-end px-3 transition-all duration-500"
                style={{ width: `${d.score}%` }}
              >
                <span className="text-[9px] font-bold text-white">{d.score}%</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Static Compiled Model Comparison SVG bar chart
const StaticModelChart = ({ data, metricType = 'effective' }: { data: any[], metricType?: 'conditional' | 'effective' }) => {
  const chartData = data.map((row) => ({
    model: row.model.replace(/_/g, ' ').replace('Instruct', '').trim(),
    passRate: row.pass_rate,
    lineCoverage: metricType === 'conditional' ? row.conditional_line_coverage : row.effective_line_coverage,
    branchCoverage: metricType === 'conditional' ? row.conditional_branch_coverage : row.effective_branch_coverage
  }));

  const height = 240;
  const barWidth = 18;
  const groupSpacing = 35;
  const paddingLeft = 50;
  const paddingTop = 20;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 justify-end text-[10px] mb-2 text-slate-400">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Pass Rate</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-sky-500 rounded-sm" /> Line Cov</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-cyan-500 rounded-sm" /> Branch Cov</div>
      </div>
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg width={700} height={height + 50} style={{ minWidth: '400px' }}>
          {[0, 25, 50, 75, 100].map((v) => {
            const y = height - (v / 100) * height + paddingTop;
            return (
              <g key={v}>
                <line x1={paddingLeft} y1={y} x2="100%" y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 4} fill="var(--text-secondary)" fontSize="9" textAnchor="end">{v}%</text>
              </g>
            );
          })}

          {chartData.map((d, i) => {
            const groupX = paddingLeft + i * (barWidth * 3 + groupSpacing) + 20;
            const pRate = Number(d.passRate) || 0;
            const lCov = Number(d.lineCoverage) || 0;
            const bCov = Number(d.branchCoverage) || 0;
            const yPass = height - (pRate / 100) * height + paddingTop;
            const yLine = height - (lCov / 100) * height + paddingTop;
            const yBranch = height - (bCov / 100) * height + paddingTop;

            return (
              <g key={d.model}>
                {/* Pass Rate Bar */}
                <rect x={groupX} y={yPass || 0} width={barWidth} height={(pRate / 100) * height || 0} fill="url(#passGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                <text x={groupX + barWidth / 2} y={(yPass || 0) - 4} fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">{pRate}%</text>

                {/* Line Coverage Bar */}
                <rect x={groupX + barWidth} y={yLine || 0} width={barWidth} height={(lCov / 100) * height || 0} fill="url(#lineGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                <text x={groupX + barWidth + barWidth / 2} y={(yLine || 0) - 4} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">{lCov}%</text>

                {/* Branch Coverage Bar */}
                <rect x={groupX + barWidth * 2} y={yBranch || 0} width={barWidth} height={(bCov / 100) * height || 0} fill="url(#branchGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                <text x={groupX + barWidth * 2 + barWidth / 2} y={(yBranch || 0) - 4} fill="#22d3ee" fontSize="9" fontWeight="bold" textAnchor="middle">{bCov}%</text>

                {/* Axis Label */}
                <text x={groupX + barWidth * 1.5} y={height + paddingTop + 20} fill="var(--text-secondary)" fontSize="9" fontWeight="700" textAnchor="middle">
                  {d.model}
                </text>
              </g>
            );
          })}

          <defs>
            <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="branchGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

// Helper functions for model styling and colors
const getModelColor = (modelName: string) => {
  const name = modelName.toLowerCase();
  if (name.includes('gpt')) return '#10b981'; // emerald
  if (name.includes('deepseek')) return '#0ea5e9'; // sky
  if (name.includes('llama')) return '#ec4899'; // rose/pink
  return '#a855f7'; // purple
};

const getModelGradient = (modelName: string) => {
  const name = modelName.toLowerCase();
  if (name.includes('gpt')) return 'url(#gptGrad)';
  if (name.includes('deepseek')) return 'url(#deepseekGrad)';
  if (name.includes('llama')) return 'url(#llamaGrad)';
  return 'url(#defaultGrad)';
};

// Grouped Horizontal Bar Chart for Category Performance
const CategoryPerformanceChart = ({ data }: { data: any[] }) => {
  const categories = Array.from(new Set(data.map((r) => r.category))).sort();
  const models = Array.from(new Set(data.map((r) => r.model))).sort();

  const lookup: Record<string, any> = {};
  data.forEach((r) => {
    lookup[`${r.category}_${r.model}`] = r;
  });

  const rowHeight = 70;
  const paddingLeft = 140;
  const paddingRight = 60;
  const paddingTop = 30;
  const svgWidth = 800;
  const chartHeight = categories.length * rowHeight + paddingTop + 20;
  const innerWidth = svgWidth - paddingLeft - paddingRight;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 justify-end text-[10px] mb-2 text-slate-400">
        {models.map((m) => (
          <div key={m} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: getModelColor(m) }} />
            {m.replace(/_/g, ' ').replace('Instruct', '').trim()}
          </div>
        ))}
      </div>
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg width={svgWidth} height={chartHeight}>
          <defs>
            <linearGradient id="gptGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="deepseekGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="llamaGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#be185d" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((v) => {
            const x = paddingLeft + (v / 100) * innerWidth;
            return (
              <g key={v}>
                <line x1={x} y1={paddingTop} x2={x} y2={chartHeight - 20} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={x} y={paddingTop - 8} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">{v}%</text>
              </g>
            );
          })}

          {categories.map((cat, i) => {
            const yStart = paddingTop + i * rowHeight + 10;
            return (
              <g key={cat}>
                <text x={paddingLeft - 15} y={yStart + 22} fill="var(--text-primary)" fontSize="11" fontWeight="600" textAnchor="end">
                  {cat.toUpperCase()}
                </text>

                {models.map((model, j) => {
                  const item = lookup[`${cat}_${model}`] || { pass_rate: 0 };
                  const barY = yStart + j * 16;
                  const barWidth = (item.pass_rate / 100) * innerWidth;

                  return (
                    <g key={model}>
                      <rect x={paddingLeft} y={barY || 0} width={Math.max(barWidth || 0, 2)} height="12" fill={getModelGradient(model)} rx="2" className="transition-all duration-300 hover:opacity-85" />
                      <text x={paddingLeft + Math.max(barWidth || 0, 2) + 6} y={(barY || 0) + 9} fill="#cbd5e1" fontSize="9" fontWeight="bold">
                        {item.pass_rate}%
                      </text>
                    </g>
                  );
                })}
                <line x1={paddingLeft} y1={yStart + rowHeight - 8} x2={svgWidth - 20} y2={yStart + rowHeight - 8} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Grouped Vertical Bar Chart for Category Split (Synthetic vs Real-world)
const CategorySplitChart = ({ data }: { data: any[] }) => {
  const height = 220;
  const barWidth = 25;
  const groupSpacing = 60;
  const paddingLeft = 50;
  const paddingTop = 25;
  const svgWidth = 600;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 justify-end text-[10px] mb-2 text-slate-400">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-sky-500 rounded-sm" /> Synthetic</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Real-World</div>
      </div>
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg width={svgWidth} height={height + 50}>
          <defs>
            <linearGradient id="splitSynthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="splitRwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((v) => {
            const y = height - (v / 100) * height + paddingTop;
            return (
              <g key={v}>
                <line x1={paddingLeft} y1={y} x2={svgWidth - 20} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 4} fill="var(--text-secondary)" fontSize="9" textAnchor="end">{v}%</text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const groupX = paddingLeft + i * (barWidth * 2 + groupSpacing) + 30;
            const synthPass = Number(d.synthetic?.pass_rate_pct) || 0;
            const rwPass = Number(d.real_world?.pass_rate_pct) || 0;

            const ySynth = height - (synthPass / 100) * height + paddingTop || 0;
            const yRw = height - (rwPass / 100) * height + paddingTop || 0;

            const hasSynth = d.synthetic && d.synthetic.total > 0;
            const hasRw = d.real_world && d.real_world.total > 0;

            return (
              <g key={d.model}>
                {/* Synthetic Bar */}
                {hasSynth ? (
                  <>
                    <rect x={groupX} y={ySynth || 0} width={barWidth} height={(synthPass / 100) * height || 0} fill="url(#splitSynthGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                    <text x={groupX + barWidth / 2} y={(ySynth || 0) - 4} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">{synthPass}%</text>
                  </>
                ) : (
                  <text x={groupX + barWidth / 2} y={height + paddingTop - 10} fill="var(--text-secondary)" fontSize="8" textAnchor="middle">N/A</text>
                )}

                {/* Real-World Bar */}
                {hasRw ? (
                  <>
                    <rect x={groupX + barWidth} y={yRw || 0} width={barWidth} height={(rwPass / 100) * height || 0} fill="url(#splitRwGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                    <text x={groupX + barWidth + barWidth / 2} y={(yRw || 0) - 4} fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">{rwPass}%</text>
                  </>
                ) : (
                  <text x={groupX + barWidth + barWidth / 2} y={height + paddingTop - 10} fill="var(--text-secondary)" fontSize="8" textAnchor="middle">N/A</text>
                )}

                {/* Axis Label */}
                <text x={groupX + barWidth} y={height + paddingTop + 20} fill="var(--text-secondary)" fontSize="9" fontWeight="700" textAnchor="middle">
                  {d.model.replace(/_/g, ' ').replace('Instruct', '').trim()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Horizontal Bar Chart for Coverage per Dollar
const CostEfficiencyChart = ({ data }: { data: any[] }) => {
  const height = 180;
  const barWidth = 30;
  const spacing = 20;
  const paddingLeft = 140;
  const paddingRight = 80;
  const paddingTop = 25;
  const svgWidth = 600;
  const innerWidth = svgWidth - paddingLeft - paddingRight;

  const maxVal = Math.max(...data.map(d => Number(d.coverage_per_dollar) || 1).filter(n => !isNaN(n)), 10);

  return (
    <div className="flex flex-col gap-4">
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg width={svgWidth} height={height + 20}>
          <defs>
            <linearGradient id="costGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const v = Math.round(p * maxVal);
            const x = paddingLeft + p * innerWidth;
            return (
              <g key={p}>
                <line x1={x} y1={paddingTop} x2={x} y2={height} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={x} y={paddingTop - 8} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">{v.toLocaleString()}%/$</text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const y = paddingTop + i * (barWidth + spacing) + 10;
            const w = ((Number(d.coverage_per_dollar) || 0) / maxVal) * innerWidth;

            return (
              <g key={d.model}>
                <text x={paddingLeft - 10} y={y + barWidth / 2 + 4} fill="var(--text-primary)" fontSize="9" fontWeight="700" textAnchor="end">
                  {d.model.replace(/_/g, ' ').replace('Instruct', '').trim()}
                </text>
                <rect x={paddingLeft} y={y || 0} width={Math.max(w || 0, 2)} height={barWidth} fill="url(#costGrad)" rx="3" className="transition-all duration-300 hover:opacity-85" />
                <text x={paddingLeft + Math.max(w || 0, 2) + 8} y={(y || 0) + barWidth / 2 + 4} fill="#fbbf24" fontSize="9" fontWeight="bold">
                  {Math.round(Number(d.coverage_per_dollar) || 0).toLocaleString()}%/$
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Vertical Bar Chart for Compile Failure Counts
const FailureAnalysisChart = ({ data }: { data: any[] }) => {
  const height = 220;
  const barWidth = 35;
  const spacing = 50;
  const paddingLeft = 50;
  const paddingTop = 25;
  const svgWidth = 600;

  const maxVal = Math.max(...data.map(d => Number(d.count) || 1).filter(n => !isNaN(n)), 10);

  return (
    <div className="flex flex-col gap-4">
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg width={svgWidth} height={height + 50}>
          <defs>
            <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const v = Math.round(p * maxVal);
            const y = height - p * height + paddingTop;
            return (
              <g key={p}>
                <line x1={paddingLeft} y1={y} x2={svgWidth - 20} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 4} fill="var(--text-secondary)" fontSize="9" textAnchor="end">{v}</text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const x = paddingLeft + i * (barWidth + spacing) + 40;
            const h = (d.count / maxVal) * height;
            const y = height - h + paddingTop;

            return (
              <g key={d.model + '_' + d.failure_type}>
                <rect x={x} y={y || 0} width={barWidth} height={h || 0} fill="url(#failGrad)" rx="3" className="transition-all duration-300 hover:opacity-85" />
                <text x={x + barWidth / 2} y={(y || 0) - 4} fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {d.count}
                </text>
                <text x={x + barWidth / 2} y={height + paddingTop + 18} fill="var(--text-secondary)" fontSize="9" fontWeight="700" textAnchor="middle">
                  {d.model.replace(/_/g, ' ').replace('Instruct', '').trim()}
                </text>
                <text x={x + barWidth / 2} y={height + paddingTop + 30} fill="var(--text-secondary)" fontSize="8" textAnchor="middle">
                  ({d.failure_type})
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Grouped Vertical Bar Chart for Self-Healing Impact
const SelfHealingChart = ({ data }: { data: any[] }) => {
  const height = 220;
  const barWidth = 25;
  const groupSpacing = 60;
  const paddingLeft = 50;
  const paddingTop = 25;
  const svgWidth = 600;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 justify-end text-[10px] mb-2 text-slate-400">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-sm" /> Initial Compile Rate</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Final Compile Rate</div>
      </div>
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg width={svgWidth} height={height + 50}>
          <defs>
            <linearGradient id="healInitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="healFinalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((v) => {
            const y = height - (v / 100) * height + paddingTop;
            return (
              <g key={v}>
                <line x1={paddingLeft} y1={y} x2={svgWidth - 20} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 4} fill="var(--text-secondary)" fontSize="9" textAnchor="end">{v}%</text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const groupX = paddingLeft + i * (barWidth * 2 + groupSpacing) + 30;
            const initRate = Number(d.initial_compile_rate) || 0;
            const finalRate = Number(d.final_compile_rate) || 0;

            const yInit = height - (initRate / 100) * height + paddingTop || paddingTop;
            const yFinal = height - (finalRate / 100) * height + paddingTop || paddingTop;

            return (
              <g key={d.model}>
                {/* Initial Compile Bar */}
                <rect x={groupX} y={yInit || 0} width={barWidth} height={(initRate / 100) * height || 0} fill="url(#healInitGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                <text x={groupX + barWidth / 2} y={(yInit || 0) - 4} fill="#f43f5e" fontSize="9" fontWeight="bold" textAnchor="middle">{initRate}%</text>

                {/* Final Compile Bar */}
                <rect x={groupX + barWidth} y={yFinal || 0} width={barWidth} height={(finalRate / 100) * height || 0} fill="url(#healFinalGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                <text x={groupX + barWidth + barWidth / 2} y={(yFinal || 0) - 4} fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle">{finalRate}%</text>

                {/* Axis Label */}
                <text x={groupX + barWidth} y={height + paddingTop + 20} fill="var(--text-secondary)" fontSize="9" fontWeight="700" textAnchor="middle">
                  {d.model.replace(/_/g, ' ').replace('Instruct', '').trim()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// Grouped Vertical Bar Chart for Latency Ranges
const LatencyChart = ({ data }: { data: any[] }) => {
  const height = 220;
  const barWidth = 18;
  const groupSpacing = 45;
  const paddingLeft = 50;
  const paddingTop = 25;
  const svgWidth = 600;

  const maxVal = Math.max(...data.map(d => Number(d.max_time) || 1).filter(n => !isNaN(n)), 60);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 justify-end text-[10px] mb-2 text-slate-400">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-sky-400 rounded-sm" /> Min Time</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" /> Avg Time</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-500 rounded-sm" /> Max Time</div>
      </div>
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
        <svg width={svgWidth} height={height + 50}>
          <defs>
            <linearGradient id="latMinGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="latAvgGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="latMaxGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const v = Math.round(p * maxVal);
            const y = height - p * height + paddingTop;
            return (
              <g key={p}>
                <line x1={paddingLeft} y1={y} x2={svgWidth - 20} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 4} fill="var(--text-secondary)" fontSize="9" textAnchor="end">{v}s</text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const groupX = paddingLeft + i * (barWidth * 3 + groupSpacing) + 20;

            const yMin = height - (d.min_time / maxVal) * height + paddingTop;
            const yAvg = height - (d.avg_time / maxVal) * height + paddingTop;
            const yMax = height - (d.max_time / maxVal) * height + paddingTop;

            return (
              <g key={d.model}>
                {/* Min Bar */}
                <rect x={groupX} y={yMin || 0} width={barWidth} height={((Number(d.min_time) || 0) / maxVal) * height || 0} fill="url(#latMinGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                <text x={groupX + barWidth / 2} y={(yMin || 0) - 4} fill="#7dd3fc" fontSize="8" fontWeight="bold" textAnchor="middle">{Number(d.min_time) || 0}s</text>

                {/* Avg Bar */}
                <rect x={groupX + barWidth} y={yAvg || 0} width={barWidth} height={((Number(d.avg_time) || 0) / maxVal) * height || 0} fill="url(#latAvgGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                <text x={groupX + barWidth + barWidth / 2} y={(yAvg || 0) - 4} fill="#a5b4fc" fontSize="8" fontWeight="bold" textAnchor="middle">{Number(d.avg_time) || 0}s</text>

                {/* Max Bar */}
                <rect x={groupX + barWidth * 2} y={yMax || 0} width={barWidth} height={((Number(d.max_time) || 0) / maxVal) * height || 0} fill="url(#latMaxGrad)" rx="2" className="transition-all duration-300 hover:opacity-85" />
                <text x={groupX + barWidth * 2 + barWidth / 2} y={(yMax || 0) - 4} fill="#d8b4fe" fontSize="8" fontWeight="bold" textAnchor="middle">{Number(d.max_time) || 0}s</text>

                {/* Axis Label */}
                <text x={groupX + barWidth * 1.5} y={height + paddingTop + 20} fill="var(--text-secondary)" fontSize="9" fontWeight="700" textAnchor="middle">
                  {d.model.replace(/_/g, ' ').replace('Instruct', '').trim()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

