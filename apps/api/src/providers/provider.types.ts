export type ProviderType = 'codex' | 'claude_code';

export type ProviderConfig = {
  id: string;
  name: string;
  providerType: ProviderType;
  endpoint: string;
  model: string;
  apiKeyMasked: string;
  isEnabled: boolean;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProviderInput = {
  name?: string;
  providerType?: ProviderType;
  endpoint?: string;
  model?: string;
  apiKey?: string;
  workspaceId?: string;
  isEnabled?: boolean;
};

export type UpdateProviderInput = Partial<CreateProviderInput>;
