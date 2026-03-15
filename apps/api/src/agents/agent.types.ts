export type AgentRole =
  | 'product_manager'
  | 'designer'
  | 'developer'
  | 'tester'
  | 'release_manager';

export type AgentTemplate = {
  id: string;
  name: string;
  role: AgentRole;
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
  createdAt: string;
  updatedAt: string;
};

export type CreateAgentInput = {
  templateId?: string;
  name?: string;
  providerId?: string;
  systemPrompt?: string;
  taskTypes?: string[];
  isEnabled?: boolean;
};

export type UpdateAgentInput = Partial<CreateAgentInput>;
