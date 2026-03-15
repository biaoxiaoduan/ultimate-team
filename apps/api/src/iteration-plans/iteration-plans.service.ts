import { Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { RequirementsService } from '../requirements/requirements.service';
import { IterationPlan, PlanIteration, WorkPackage, WorkPackageRole } from './iteration-plan.types';

@Injectable()
export class IterationPlansService {
  constructor(
    private readonly requirementsService: RequirementsService,
    private readonly databaseService: DatabaseService
  ) {}

  list() {
    return this.databaseService.connection
      .prepare(
        `
          SELECT id, requirement_id, source_version_id, status, title, summary, iterations_json, created_at, updated_at
          FROM iteration_plans
          ORDER BY pk DESC
        `
      )
      .all()
      .map(mapIterationPlanRow);
  }

  getById(id: string) {
    const plan = this.databaseService.connection
      .prepare(
        `
          SELECT id, requirement_id, source_version_id, status, title, summary, iterations_json, created_at, updated_at
          FROM iteration_plans
          WHERE id = ?
        `
      )
      .get(id);
    if (!plan) {
      throw new NotFoundException('iteration plan not found');
    }

    return mapIterationPlanRow(plan);
  }

  generateDraft(requirementId: string) {
    const requirement = this.requirementsService.getById(requirementId);
    const now = new Date().toISOString();
    const iterations = buildIterations(requirement);
    const result = this.databaseService.connection
      .prepare(
        `
          INSERT INTO iteration_plans (
            requirement_id, source_version_id, status, title, summary, iterations_json, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        requirement.id,
        requirement.currentVersionId,
        'draft',
        `${requirement.title} delivery plan`,
        buildSummary(requirement),
        JSON.stringify(iterations),
        now,
        now
      );
    const id = `plan_${result.lastInsertRowid}`;
    this.databaseService.connection
      .prepare('UPDATE iteration_plans SET id = ? WHERE pk = ?')
      .run(id, result.lastInsertRowid);
    return this.getById(id);
  }

  confirm(id: string) {
    const target = this.getById(id);
    const now = new Date().toISOString();

    this.databaseService.connection
      .prepare(
        `
          UPDATE iteration_plans
          SET status = 'draft', updated_at = ?
          WHERE requirement_id = ?
        `
      )
      .run(now, target.requirementId);
    this.databaseService.connection
      .prepare(
        `
          UPDATE iteration_plans
          SET status = 'confirmed', updated_at = ?
          WHERE id = ?
        `
      )
      .run(now, target.id);

    this.requirementsService.markPlanned(target.requirementId);
    return this.getById(id);
  }
}

function mapIterationPlanRow(row: Record<string, unknown>): IterationPlan {
  return {
    id: String(row.id),
    requirementId: String(row.requirement_id),
    sourceVersionId: String(row.source_version_id),
    status: row.status as IterationPlan['status'],
    title: String(row.title),
    summary: String(row.summary),
    iterations: JSON.parse(String(row.iterations_json)) as PlanIteration[],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
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
