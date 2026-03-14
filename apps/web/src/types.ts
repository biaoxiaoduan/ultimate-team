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
