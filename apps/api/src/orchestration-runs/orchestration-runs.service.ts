import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { AgentsService } from '../agents/agents.service';
import { IterationPlansService } from '../iteration-plans/iteration-plans.service';
import { PlanIteration, WorkPackage } from '../iteration-plans/iteration-plan.types';
import {
  AgentTask,
  CreateOrchestrationRunInput,
  FailRunStageInput,
  Handoff,
  OrchestrationRun,
  RunStage
} from './orchestration-run.types';

@Injectable()
export class OrchestrationRunsService {
  private readonly runs: OrchestrationRun[] = [];

  constructor(
    private readonly iterationPlansService: IterationPlansService,
    private readonly agentsService: AgentsService
  ) {}

  list() {
    return this.runs;
  }

  getById(id: string) {
    const run = this.runs.find((item) => item.id === id);
    if (!run) {
      throw new NotFoundException('orchestration run not found');
    }

    return run;
  }

  create(input: CreateOrchestrationRunInput) {
    if (!input.planId?.trim()) {
      throw new BadRequestException('planId is required');
    }

    if (!input.iterationId?.trim()) {
      throw new BadRequestException('iterationId is required');
    }

    const plan = this.iterationPlansService.getById(input.planId);
    if (plan.status !== 'confirmed') {
      throw new BadRequestException('plan must be confirmed');
    }

    const iteration = plan.iterations.find((item) => item.id === input.iterationId);
    if (!iteration) {
      throw new BadRequestException('iteration not found');
    }

    const now = new Date().toISOString();
    const runId = `run_${this.runs.length + 1}`;
    const stages = iteration.workPackages.map((workPackage, index) =>
      this.createStage(runId, workPackage, iteration, index)
    );

    const run: OrchestrationRun = {
      id: runId,
      planId: plan.id,
      requirementId: plan.requirementId,
      iterationId: iteration.id,
      iterationTitle: iteration.title,
      status: 'draft',
      currentStageId: stages[0]?.id ?? null,
      lastError: null,
      stages,
      tasks: [],
      handoffs: [],
      createdAt: now,
      updatedAt: now
    };

    this.runs.unshift(run);
    return run;
  }

  start(id: string) {
    const run = this.getById(id);
    if (run.status !== 'draft') {
      throw new BadRequestException('run can only start from draft');
    }

    const stage = getCurrentStage(run);
    if (stage.status !== 'ready') {
      throw new BadRequestException('current stage is not ready');
    }

    const now = new Date().toISOString();
    stage.status = 'running';
    stage.startedAt = now;
    run.status = 'running';
    run.startedAt = now;
    touchRun(run, now);
    return run;
  }

  executeStage(runId: string, stageId: string) {
    const run = this.getById(runId);
    ensureRunStatus(run, ['running']);

    const stage = ensureCurrentStage(run, stageId);
    if (stage.status !== 'ready' && stage.status !== 'running') {
      throw new BadRequestException('stage is not executable');
    }

    const now = new Date().toISOString();
    stage.status = 'waiting_confirmation';
    stage.startedAt ??= now;

    const task = createTask(run, stage, now);
    run.tasks.push(task);

    const nextStage = findNextStage(run, stage);
    if (nextStage) {
      run.handoffs.push(createHandoff(run, stage, nextStage, now));
    }

    touchRun(run, now);
    return run;
  }

  confirmStage(runId: string, stageId: string) {
    const run = this.getById(runId);
    ensureRunStatus(run, ['running']);

    const stage = ensureCurrentStage(run, stageId);
    if (stage.status !== 'waiting_confirmation') {
      throw new BadRequestException('stage is not waiting for confirmation');
    }

    const now = new Date().toISOString();
    stage.status = 'completed';
    stage.completedAt = now;

    const nextStage = findNextStage(run, stage);
    if (nextStage) {
      nextStage.status = 'ready';
      run.currentStageId = nextStage.id;
    } else {
      run.currentStageId = null;
      run.status = 'completed';
      run.completedAt = now;
    }

    touchRun(run, now);
    return run;
  }

  failStage(runId: string, stageId: string, input: FailRunStageInput) {
    const run = this.getById(runId);
    ensureRunStatus(run, ['running']);

    const stage = ensureCurrentStage(run, stageId);
    if (stage.status !== 'ready' && stage.status !== 'running' && stage.status !== 'waiting_confirmation') {
      throw new BadRequestException('stage cannot be failed from current status');
    }

    if (!input.reason?.trim()) {
      throw new BadRequestException('reason is required');
    }

    const now = new Date().toISOString();
    stage.status = 'failed';
    stage.failureReason = input.reason.trim();
    run.status = 'failed';
    run.lastError = stage.failureReason;
    touchRun(run, now);
    return run;
  }

  retryStage(runId: string, stageId: string) {
    const run = this.getById(runId);
    const stage = ensureCurrentStage(run, stageId);
    if (stage.status !== 'failed') {
      throw new BadRequestException('stage is not failed');
    }

    const now = new Date().toISOString();
    stage.status = 'ready';
    stage.failureReason = undefined;
    stage.startedAt = undefined;
    stage.completedAt = undefined;
    run.status = 'running';
    run.lastError = null;
    touchRun(run, now);
    return run;
  }

  pause(id: string) {
    const run = this.getById(id);
    ensureRunStatus(run, ['running']);

    const now = new Date().toISOString();
    run.status = 'paused';
    touchRun(run, now);
    return run;
  }

  resume(id: string) {
    const run = this.getById(id);
    ensureRunStatus(run, ['paused', 'failed']);

    const now = new Date().toISOString();
    run.status = 'running';
    touchRun(run, now);
    return run;
  }

  private createStage(runId: string, workPackage: WorkPackage, iteration: PlanIteration, index: number): RunStage {
    const agent = this.agentsService.findEnabledByRole(workPackage.role);
    if (!agent) {
      throw new BadRequestException(`${workPackage.role} agent is required`);
    }

    return {
      id: `${runId}_stage_${index + 1}`,
      runId,
      role: workPackage.role,
      title: `${iteration.title}: ${workPackage.title}`,
      agentId: agent.id,
      agentName: agent.name,
      status: index === 0 ? 'ready' : 'pending',
      sequence: index + 1
    };
  }
}

function ensureRunStatus(run: OrchestrationRun, allowed: OrchestrationRun['status'][]) {
  if (!allowed.includes(run.status)) {
    throw new BadRequestException(`run status must be ${allowed.join(' or ')}`);
  }
}

function getCurrentStage(run: OrchestrationRun) {
  if (!run.currentStageId) {
    throw new BadRequestException('run has no current stage');
  }

  const stage = run.stages.find((item) => item.id === run.currentStageId);
  if (!stage) {
    throw new BadRequestException('current stage not found');
  }

  return stage;
}

function ensureCurrentStage(run: OrchestrationRun, stageId: string) {
  const stage = getCurrentStage(run);
  if (stage.id !== stageId) {
    throw new BadRequestException('only the current stage can be operated');
  }

  return stage;
}

function findNextStage(run: OrchestrationRun, stage: RunStage) {
  return run.stages.find((item) => item.sequence === stage.sequence + 1);
}

function createTask(run: OrchestrationRun, stage: RunStage, now: string): AgentTask {
  const previousHandoff = run.handoffs[run.handoffs.length - 1];
  const inputSummary = previousHandoff
    ? `Continue from handoff: ${previousHandoff.summary}`
    : `Start ${run.iterationTitle} using confirmed plan context.`;

  return {
    id: `${run.id}_task_${run.tasks.length + 1}`,
    runId: run.id,
    stageId: stage.id,
    agentId: stage.agentId,
    taskType: stage.role,
    prompt: `Execute ${stage.role} stage for ${run.iterationTitle}: ${stage.title}.`,
    inputSummary,
    outputSummary: `${stage.agentName} prepared ${stage.role} output for ${run.iterationTitle}.`,
    status: 'completed',
    createdAt: now,
    updatedAt: now
  };
}

function createHandoff(run: OrchestrationRun, stage: RunStage, nextStage: RunStage, now: string): Handoff {
  return {
    id: `${run.id}_handoff_${run.handoffs.length + 1}`,
    runId: run.id,
    fromStageId: stage.id,
    toStageId: nextStage.id,
    fromRole: stage.role,
    toRole: nextStage.role,
    title: `${stage.role} -> ${nextStage.role} handoff`,
    summary: `${stage.agentName} completed ${stage.title} and handed structured output to ${nextStage.agentName}.`,
    status: 'delivered',
    createdAt: now,
    deliveredAt: now
  };
}

function touchRun(run: OrchestrationRun, now: string) {
  run.updatedAt = now;
}
