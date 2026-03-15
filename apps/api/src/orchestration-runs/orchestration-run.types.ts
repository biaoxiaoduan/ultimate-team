import { AgentRole } from '../agents/agent.types';

export type RunStatus = 'draft' | 'running' | 'paused' | 'failed' | 'completed';
export type RunStageStatus =
  | 'pending'
  | 'ready'
  | 'running'
  | 'waiting_confirmation'
  | 'completed'
  | 'failed';
export type AgentTaskStatus = 'pending' | 'completed' | 'failed';
export type HandoffStatus = 'pending' | 'delivered';

export type RunStage = {
  id: string;
  runId: string;
  role: AgentRole;
  title: string;
  agentId: string;
  agentName: string;
  status: RunStageStatus;
  sequence: number;
  startedAt?: string;
  completedAt?: string;
  failureReason?: string;
};

export type AgentTask = {
  id: string;
  runId: string;
  stageId: string;
  agentId: string;
  taskType: string;
  prompt: string;
  inputSummary: string;
  outputSummary: string;
  status: AgentTaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type Handoff = {
  id: string;
  runId: string;
  fromStageId: string;
  toStageId: string;
  fromRole: AgentRole;
  toRole: AgentRole;
  title: string;
  summary: string;
  status: HandoffStatus;
  createdAt: string;
  deliveredAt?: string;
};

export type OrchestrationRun = {
  id: string;
  planId: string;
  requirementId: string;
  iterationId: string;
  iterationTitle: string;
  status: RunStatus;
  currentStageId: string | null;
  lastError: string | null;
  stages: RunStage[];
  tasks: AgentTask[];
  handoffs: Handoff[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrchestrationRunInput = {
  planId?: string;
  iterationId?: string;
};

export type FailRunStageInput = {
  reason?: string;
};
