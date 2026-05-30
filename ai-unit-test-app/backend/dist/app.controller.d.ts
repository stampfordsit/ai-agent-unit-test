declare class GenerateDto {
    sourceCode: string;
    model: string;
    workflow: string;
    source?: string;
    filePath?: string;
    runMutation?: boolean;
}
export declare class AppController {
    getModels(): {
        id: string;
        name: string;
    }[];
    generate(body: GenerateDto): Promise<unknown>;
    getBenchmarkRuns(): any[];
    getStaticSummary(version: string, workflow: string): {
        benchmarkSummary: any;
        categorySummary: any;
        costSummary: any;
        failureSummary: any;
        healingSummary: any;
        latencySummary: any;
        evaluatorSummary: any;
        selectorSummary: any;
        mutationSummary: any;
        categorySplit: any[];
    };
    getWebDemoSubmissions(): any[];
    getGithubSubmissions(): any[];
    getCicdLogs(): any[];
    cloneGithubRepo(body: {
        repoUrl: string;
    }): Promise<unknown>;
    createGithubPr(body: {
        repoUrl: string;
        tempDir: string;
        filePath: string;
        testCode: string;
        githubPat?: string;
    }): Promise<unknown>;
}
export {};
