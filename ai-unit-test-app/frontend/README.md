# AI Unit Test Agent - Frontend Dashboard

> **This is a sub-project of the [AI Unit Test Agent Platform](../README.md). Please check the main README for overall setup and architecture details.**

This is the Next.js frontend dashboard for the **AI Agent for Automated Unit Test Generation and Optimization in C#**. It provides an interactive, modern web interface to write/paste code, ingest public GitHub repositories, choose AI models and workflows, run unit test generation, and view real-time metrics, console logs, test results, and comparative graphs.

## Features

The web application is split into three main modules accessible via the navigation header:

1. **Playground (Developer Workspace)**:
   - **C# Code Editor**: Input custom C# code to generate unit tests.
   - **Workflow & Model Selectors**: Select the AI model (GPT-4o Mini, Llama, DeepSeek) and strategy (Single-Pass, Agent Critique, Self-Healing, Best-of-N, Evaluator-Guided, or Ultimate Hybrid).
   - **Metrics Display**: Premium dynamic radial gauges showing test coverage and success scores.
   - **Console Log Stream**: Live output from the AI runner script executions.

2. **GitHub Ingest (`/?view=github`)**:
   - **GitHub PAT Input**: Enter your GitHub Personal Access Token directly in the UI (no `.env` editing required) to enable Pull Request creation.
   - **Remote Repo Cloning**: Paste any public C# repository URL to clone it (uses sparse blobless clone to avoid Windows long-path issues with committed `node_modules`).
   - **Interactive Method Selector**: Browse classes and methods parsed dynamically via Roslyn in an accordion tree. After selecting a method, a summary card shows the selection with a **� Change** button to re-select a different method without leaving the page.
   - **Pull Request Automation**: Create Git branches, commit unit tests, and open Pull Requests directly from the web interface.

3. **Dynamic Analytical Dashboard (`/dashboard`)**:
   - **Overview & Charts / Static Summaries**: View comparative graphs and compiled tables compiled by the Python reports compiler. It features sub-tab views for Overall Summary, Category split, Cost Efficiency (including Worker vs. Evaluator cost breakdown), Failure reasons, Self-Healing, Latency, **Evaluator Review** (refinement loops analysis), and **Candidate Selector** (Best-of-N selection details).
   - **Gold Standard Benchmark Analytics**: Tables showing research-run results mapped with source code and evaluator critiques in details modals.
   - **Playground Logs**: Historical submissions run manually.
   - **GitHub Ingest Logs**: Submissions triggered from remote repositories.
   - **CI/CD Hook Logs**: Records of local commits scanned and validated by the pre-commit Git hook.

4. **CI/CD Integration & Native Execution (New)**:
   - **Full-Repo Cloning**: Instead of partial clones, the system pulls the entire repository dependency tree, allowing C# projects to compile and resolve dependencies correctly natively.
   - **Project Generator**: Automatically scans for `.csproj` files linked to target `.cs` files. If a test project doesn't exist, it intelligently scaffolds a new `xUnit` test project on the fly (adding Moq and Coverlet automatically).
   - **Native Execution**: AI-generated tests are injected and executed directly inside the cloned GitHub project rather than a generic sandbox, ensuring real-world compilation and dependency resolution.
   - **Automated Webhook Actions**: Features a dedicated `POST /api/cicd/webhook` for GitHub Actions integration. You can embed the provided `ai-unit-test.yml` into any C# project to trigger AI unit test generation and validation automatically on Pull Requests using the `compiler-guided-multi-agent` workflow.

## Project Setup

Ensure you have [Node.js](https://nodejs.org/) installed.

```bash
# Install dependencies
npm install
```

## Running the Application

```bash
# Start development server
npm run dev

# Build production bundle
npm run build

# Start production server
npm run start
```

Open **[http://localhost:3000](http://localhost:3000)** to view the dashboard in your browser.

## Troubleshooting Note: Special Characters in Workspace Path

> [!NOTE]
> If your project resides in a folder path containing `#` (e.g. `.../AI Agent ... in C#/`), Tailwind CSS v4's internal resolver normally crashes with an `ERR_INVALID_ARG_VALUE` error because it inserts null bytes (`\0`) to escape the `#` symbol.
>
> We have successfully patched `@tailwindcss/node` and `@tailwindcss/postcss` in the project's `node_modules` to strip these null bytes, allowing Turbopack compilation to proceed smoothly.

---

## 🎓 Graduate Research Project Information

This platform is developed as part of a Master of Engineering (M.Eng.) thesis project at Dhurakij Pundit University.

| Detail | Description |
| :--- | :--- |
| **Research Topic** | A Multi-Agent LLM-Based Approach for Automated Unit Test Generation and Optimization in C# Programs <br> *(แนวทางระบบหลายตัวแทนร่วมกับโมเดลภาษาขนาดใหญ่สำหรับการสร้างและปรับปรุงการทดสอบระดับหน่วยอัตโนมัติในโปรแกรมภาษา C#)* |
| **Researcher** | **Mr. Attaphon Pungjaree** (Student ID: 645162020028) |
| **Thesis Advisor** | **Dr. Thanapat Kangkachit** |
| **Degree** | Master of Engineering (M.Eng.) |
| **Major** | Artificial Intelligence and Data Engineering |
| **College** | College of Engineering and Technology |
| **University** | **Dhurakij Pundit University** (110/1-4 Prachachuen Road Laksi, Bangkok, 10210) |
| **Contact** | ✉️ Email: [645162020028@dpu.ac.th](mailto:645162020028@dpu.ac.th) <br> 📞 Phone: 095-792-5262 |
