export type ArtifactCategory =
  | 'iteration_overview'
  | 'design_handoff'
  | 'development_doc'
  | 'api_doc'
  | 'test_cases'
  | 'test_report_doc'
  | 'release_doc';

export type Artifact = {
  id: string;
  runId: string;
  iterationId: string;
  stageId: string;
  agentId: string;
  category: ArtifactCategory;
  title: string;
  summary: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type TestReport = {
  id: string;
  runId: string;
  iterationId: string;
  artifactId: string;
  status: 'passed' | 'warning';
  totalCases: number;
  passedCases: number;
  failedCases: number;
  summary: string;
};

export type BuildRecord = {
  id: string;
  runId: string;
  iterationId: string;
  artifactId: string;
  status: 'ready' | 'blocked';
  environment: 'staging';
  commitReference: string;
  summary: string;
};
