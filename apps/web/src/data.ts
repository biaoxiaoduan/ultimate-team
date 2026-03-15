import {
  AgentInstance,
  AgentTemplate,
  Artifact,
  BuildRecord,
  IterationPlan,
  OrchestrationRun,
  ProviderConfig,
  Requirement,
  TestReport,
  Workspace
} from './types';

export const defaultWorkspaces: Workspace[] = [
  {
    id: 'ws_1',
    name: 'Local Workspace',
    rootPath: '/Users/duanyanbiao/Develop/ultimate-team',
    description: 'Default local workspace',
    isDefault: true
  }
];

export const defaultProviders: ProviderConfig[] = [
  {
    id: 'provider_1',
    name: 'Primary Codex',
    providerType: 'codex',
    endpoint: 'https://api.openai.com',
    model: 'gpt-5',
    apiKeyMasked: 'se****en',
    isEnabled: true,
    workspaceId: 'ws_1'
  },
  {
    id: 'provider_2',
    name: 'Primary Claude',
    providerType: 'claude_code',
    endpoint: 'https://api.anthropic.com',
    model: 'claude-sonnet',
    apiKeyMasked: 'cl****de',
    isEnabled: false,
    workspaceId: 'ws_1'
  }
];

export const defaultRequirements: Requirement[] = [];

export const defaultPlans: IterationPlan[] = [];

export const defaultAgentTemplates: AgentTemplate[] = [
  {
    id: 'template_product_manager',
    name: 'Product Manager',
    role: 'product_manager',
    description: 'Break down requirements and define acceptance.',
    defaultPrompt: 'Act as a product manager agent.',
    defaultTaskTypes: ['planning']
  },
  {
    id: 'template_designer',
    name: 'Designer',
    role: 'designer',
    description: 'Prepare design handoff.',
    defaultPrompt: 'Act as a designer agent.',
    defaultTaskTypes: ['design_handoff']
  },
  {
    id: 'template_developer',
    name: 'Developer',
    role: 'developer',
    description: 'Implement approved scope.',
    defaultPrompt: 'Act as a developer agent.',
    defaultTaskTypes: ['implementation']
  },
  {
    id: 'template_tester',
    name: 'Tester',
    role: 'tester',
    description: 'Create test coverage and reports.',
    defaultPrompt: 'Act as a tester agent.',
    defaultTaskTypes: ['test_cases']
  },
  {
    id: 'template_release_manager',
    name: 'Release Manager',
    role: 'release_manager',
    description: 'Prepare release configuration.',
    defaultPrompt: 'Act as a release manager agent.',
    defaultTaskTypes: ['release_prep']
  }
];

export const defaultAgentInstances: AgentInstance[] = [];

export const defaultRuns: OrchestrationRun[] = [];

export const defaultArtifacts: Artifact[] = [];

export const defaultTestReports: TestReport[] = [];

export const defaultBuildRecords: BuildRecord[] = [];
