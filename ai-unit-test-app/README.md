# AI Unit Test Agent Platform

An enterprise-grade, multi-agent AI system designed for automated C# unit test generation, evaluation, self-healing, and mutation testing analysis. This platform features a modern Next.js dashboard and a robust NestJS backend API gateway that integrates seamlessly with a local .NET sandbox environment and advanced AI workflows.

---

## 🏗️ Architecture Overview

The system is designed as a modular workspace consisting of the following core parts:

1. **Frontend Dashboard ([frontend](file:///g:/AI%20Agent%20in%20C%23/ai-unit-test-app/frontend))**:
   - Built with **Next.js** and styled with **Tailwind CSS**.
   - Contains the **Playground** workspace for manual code entry.
   - Provides **GitHub Ingest** to clone remote repositories, parse C# classes/methods using Roslyn, select methods, and create Pull Requests.
   - Features the **Analytical Dashboard** presenting comprehensive charts, metrics (success rate, code coverage, self-healing loops), and logs.
2. **Backend API Gateway ([backend](file:///g:/AI%20Agent%20in%20C%23/ai-unit-test-app/backend))**:
   - Built with **NestJS** (TypeScript) and documented with **Swagger/OpenAPI**.
   - Handles file management, clones repositories using Git sparse-checkouts, runs the Roslyn Parser CLI, and opens GitHub PRs.
   - Acts as the wrapper to execute the core Python AI runner scripts.
3. **AI Sandbox & Benchmark Runner (`ai-unit-test-benchmark`)** *(Sibling Directory)*:
   - Contains the **core Python engine** (`api_runner.py` and `main.py`).
   - Houses the benchmark datasets, self-healing compiler sandboxes, and mutation test frameworks.
   - Executes the LLM API calls and interacts with the .NET CLI.

---

## 📁 Repository Structure

```
ai-unit-test-app/               # Main web application repository
├── frontend/                  # Next.js web application (Dashboard & Playground)
│   ├── src/app/               # Pages, Components, and styles
│   └── package.json           # Frontend dependencies & scripts
├── backend/                   # NestJS backend API server
│   ├── src/                   # Controllers, modules, and services
│   └── package.json           # Backend dependencies & scripts
├── package.json               # Root configuration (development tools)
└── README.md                  # This documentation file

../ai-unit-test-benchmark/      # (Sibling Directory) Core AI engine and datasets
├── benchmark_runner/          # Python orchestrators, sandboxes, and results
│   ├── api_runner.py          # Entry point for backend API executions
│   ├── main.py                # Command-line benchmark orchestrator
│   ├── results/               # Dynamic runs, summaries, and static reports
│   └── .env                   # Environment variables (Azure keys, GitHub PAT)
└── benchmark_datasets/        # C# source files and expected reference tests
```

---

## ⚡ Quick Start

Follow these steps to run the frontend and backend locally.

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v18+) & **npm**
- **.NET SDK** (v8.0+)
- **Python** (v3.10+) with a virtual environment configured in `../ai-unit-test-benchmark/.venv`

---

### Step 1: Run the NestJS Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server in watch/development mode:
   ```bash
   npm run start:dev
   ```
   The backend will start on **[http://localhost:3005](http://localhost:3005)**.
   You can view the interactive Swagger API documentation at **[http://localhost:3005/api/docs](http://localhost:3005/api/docs)**.

---

### Step 2: Run the Next.js Frontend

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will start on **[http://localhost:3000](http://localhost:3000)**.
   Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

---

## 🔄 Core AI Workflows & Pipelines

The platform implements six main workflows to generate, evaluate, and optimize unit tests:

1. **Single-Pass (`single`)**: Basic single-pass generation using a worker agent.
2. **Multi-Agent Critique (`agent`)**: Reviewer agent critiques the worker agent's initial test code, which is then refined before compile/run tests.
3. **Self-Healing (`self_healing`)**: Compiler feedback loop where build errors are parsed and sent back to the AI to auto-fix code (up to 3 attempts).
4. **Best-of-N (`best_of_n`)**: Generates $N$ candidate tests in parallel, runs them in the sandbox, and chooses the one with the highest quality score.
5. **Evaluator-Guided (`evaluator_guided`)**: Iteratively refines the test code guided by the Evaluator Agent's structured scores and suggestions.
6. **Ultimate Hybrid (`ultimate_hybrid`)**: The ultimate pipeline combining Best-of-N, Self-Healing, and Evaluator-Guided refinements to achieve the highest possible coverage and test quality.

See the **System Workflow** page inside the dashboard (**[http://localhost:3000/?view=workflow](http://localhost:3000/?view=workflow)**) for detailed sequence diagrams of these processes.

---

## 🔐 Credentials & Environment Setup

The backend handles GitHub API operations and AI model requests.
- To use the **GitHub Ingestion** PR creation feature, you can input your **Personal Access Token (PAT)** directly in the frontend UI, or configure a `GITHUB_PAT` inside the sibling `ai-unit-test-benchmark/benchmark_runner/.env` file.
- The sibling directory `ai-unit-test-benchmark/benchmark_runner/.env` must contain credentials for Azure OpenAI / LLM API configurations to allow the runner to invoke models:
  ```env
  AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
  AZURE_OPENAI_API_KEY=your-api-key
  GITHUB_PAT=your-github-pat
  ```

---

## 📚 Component Documentation

For specific details regarding each component, please refer to their dedicated documentation:
- 💻 **[Frontend README](file:///g:/AI%20Agent%20in%20C%23/ai-unit-test-app/frontend/README.md)**: UI features, styling fixes, and Next.js Turbopack configuration.
- ⚙️ **[Backend README](file:///g:/AI%20Agent%20in%20C%23/ai-unit-test-app/backend/README.md)**: REST API endpoint details, schema definitions, and internal controllers.

---

## 🎓 Graduate Research Project Information

This platform is developed as part of a Master of Engineering (M.Eng.) thesis project at Dhurakij Pundit University.

| Detail | Description |
| :--- | :--- |
| **Research Topic** | A Multi-Agent LLM-Based Approach for Automated Unit Test Generation and Optimization in C# Programs <br> *(แนวทางแบบ Multi-Agent ร่วมกับ Large Language Models สำหรับการสร้างและปรับปรุง Unit Test อัตโนมัติในโปรแกรมภาษา C#)* |
| **Researcher** | **Mr. Attaphon Pungjaree** (Student ID: 645162020028) |
| **Thesis Advisor** | **Dr. Thanaphat Khankajit** |
| **Degree** | Master of Engineering (M.Eng.) |
| **Major** | Artificial Intelligence and Data Engineering |
| **College** | College of Engineering and Technology |
| **University** | **Dhurakij Pundit University** (110/1-4 Prachachuen Road Laksi, Bangkok, 10210) |
| **Contact** | ✉️ Email: [645162020028@dpu.ac.th](mailto:645162020028@dpu.ac.th) <br> 📞 Phone: 095-792-5262 |
