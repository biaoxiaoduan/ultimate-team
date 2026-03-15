import { Injectable, NotFoundException } from '@nestjs/common';

import { RequirementsService } from '../requirements/requirements.service';
import { IterationPlan, PlanIteration, WorkPackage, WorkPackageRole } from './iteration-plan.types';

@Injectable()
export class IterationPlansService {
  private readonly plans: IterationPlan[] = [];

  constructor(private readonly requirementsService: RequirementsService) {}

  list() {
    return this.plans;
  }

  getById(id: string) {
    const plan = this.plans.find((item) => item.id === id);
    if (!plan) {
      throw new NotFoundException('iteration plan not found');
    }

    return plan;
  }

  generateDraft(requirementId: string) {
    const requirement = this.requirementsService.getById(requirementId);
    const now = new Date().toISOString();
    const plan: IterationPlan = {
      id: `plan_${this.plans.length + 1}`,
      requirementId: requirement.id,
      sourceVersionId: requirement.currentVersionId,
      status: 'draft',
      title: `${requirement.title} delivery plan`,
      summary: buildSummary(requirement),
      iterations: buildIterations(requirement),
      createdAt: now,
      updatedAt: now
    };

    this.plans.push(plan);
    return plan;
  }

  confirm(id: string) {
    const target = this.getById(id);

    this.plans.forEach((plan) => {
      if (plan.requirementId === target.requirementId) {
        plan.status = plan.id === target.id ? 'confirmed' : 'draft';
        plan.updatedAt = new Date().toISOString();
      }
    });

    this.requirementsService.markPlanned(target.requirementId);
    return target;
  }
}

function buildSummary(requirement: {
  title: string;
  goal: string;
  constraints: string;
  acceptanceCriteria: string;
}) {
  return [
    requirement.goal ? `Goal: ${requirement.goal}` : `Goal: deliver ${requirement.title}`,
    requirement.constraints ? `Constraints: ${requirement.constraints}` : 'Constraints: keep scope focused',
    requirement.acceptanceCriteria
      ? `Acceptance: ${requirement.acceptanceCriteria}`
      : 'Acceptance: complete MVP planning path'
  ].join(' | ');
}

function buildIterations(requirement: {
  title: string;
  goal: string;
  constraints: string;
  acceptanceCriteria: string;
}): PlanIteration[] {
  return [
    buildIteration(
      'iter_1',
      'Iteration 1: foundation alignment',
      `Clarify scope and define the first deliverable slice for ${requirement.title}.`,
      ['refine requirement scope', 'prepare design and technical baseline'],
      ['unclear scope may trigger rework']
    ),
    buildIteration(
      'iter_2',
      'Iteration 2: feature delivery',
      requirement.goal || `Build the main workflow for ${requirement.title}.`,
      ['implement primary workflow', 'prepare supporting APIs and UI'],
      ['feature complexity may expand beyond MVP']
    ),
    buildIteration(
      'iter_3',
      'Iteration 3: validation and release prep',
      requirement.acceptanceCriteria || 'Validate behavior and prepare release configuration.',
      ['complete testing and regression checks', 'prepare release notes and config'],
      ['test coverage gaps may block release']
    )
  ];
}

function buildIteration(
  id: string,
  title: string,
  goal: string,
  scope: string[],
  risks: string[]
): PlanIteration {
  return {
    id,
    title,
    goal,
    scope,
    risks,
    workPackages: createWorkPackages(id, title)
  };
}

function createWorkPackages(iterationId: string, iterationTitle: string): WorkPackage[] {
  const roles: Array<{ role: WorkPackageRole; title: string; description: string }> = [
    {
      role: 'product_manager',
      title: 'Refine requirement and acceptance',
      description: `Clarify requirement scope and acceptance rules for ${iterationTitle}.`
    },
    {
      role: 'designer',
      title: 'Prepare design handoff',
      description: `Define interface and interaction guidance for ${iterationTitle}.`
    },
    {
      role: 'developer',
      title: 'Implement planned scope',
      description: `Build the planned technical scope for ${iterationTitle}.`
    },
    {
      role: 'tester',
      title: 'Define and execute tests',
      description: `Create test coverage and verify the outcome for ${iterationTitle}.`
    },
    {
      role: 'release_manager',
      title: 'Prepare release configuration',
      description: `List release checks and deployment considerations for ${iterationTitle}.`
    }
  ];

  return roles.map((item, index) => ({
    id: `${iterationId}_wp_${index + 1}`,
    role: item.role,
    title: item.title,
    description: item.description
  }));
}
