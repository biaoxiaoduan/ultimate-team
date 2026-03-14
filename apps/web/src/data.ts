import { ProviderConfig, Workspace } from './types';

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
