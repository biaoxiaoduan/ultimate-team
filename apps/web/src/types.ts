export type Workspace = {
  id: string;
  name: string;
  rootPath: string;
  description: string;
  isDefault: boolean;
};

export type ProviderConfig = {
  id: string;
  name: string;
  providerType: 'codex' | 'claude_code';
  endpoint: string;
  model: string;
  apiKeyMasked: string;
  isEnabled: boolean;
  workspaceId: string;
};

export type Requirement = {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  goal: string;
  constraints: string;
  acceptanceCriteria: string;
  currentVersionId: string;
  currentVersionNumber: number;
  currentContent: string;
  status: 'draft' | 'planned';
};

export type RequirementVersion = {
  id: string;
  requirementId: string;
  version: number;
  content: string;
};

export type WorkPackage = {
  id: string;
  role: 'product_manager' | 'designer' | 'developer' | 'tester' | 'release_manager';
  title: string;
  description: string;
};

export type PlanIteration = {
  id: string;
  title: string;
  goal: string;
  scope: string[];
  risks: string[];
  workPackages: WorkPackage[];
};

export type IterationPlan = {
  id: string;
  requirementId: string;
  sourceVersionId: string;
  status: 'draft' | 'confirmed';
  title: string;
  summary: string;
  iterations: PlanIteration[];
};

export type AgentTemplate = {
  id: string;
  name: string;
  role: 'product_manager' | 'designer' | 'developer' | 'tester' | 'release_manager';
  description: string;
  defaultPrompt: string;
  defaultTaskTypes: string[];
};

export type AgentInstance = {
  id: string;
  templateId: string;
  name: string;
  providerId: string;
  systemPrompt: string;
  taskTypes: string[];
  isEnabled: boolean;
};
