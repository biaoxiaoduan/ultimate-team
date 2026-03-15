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
  createdAt: string;
  updatedAt: string;
};

export type RequirementVersion = {
  id: string;
  requirementId: string;
  version: number;
  content: string;
  createdAt: string;
};

export type CreateRequirementInput = {
  projectId?: string;
  title?: string;
  summary?: string;
  goal?: string;
  constraints?: string;
  acceptanceCriteria?: string;
  content?: string;
};

export type UpdateRequirementInput = Partial<Omit<CreateRequirementInput, 'content'>>;

export type CreateRequirementVersionInput = {
  content?: string;
};
