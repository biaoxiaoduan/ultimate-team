import { AgentRole } from '../agents/agent.types';

export type WorkPackageRole = AgentRole;

export type WorkPackage = {
  id: string;
  role: WorkPackageRole;
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
  createdAt: string;
  updatedAt: string;
};
