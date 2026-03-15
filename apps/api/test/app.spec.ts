import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';

import { ArtifactsController } from '../src/artifacts/artifacts.controller';
import { ArtifactsService } from '../src/artifacts/artifacts.service';
import { AgentsController } from '../src/agents/agents.controller';
import { AgentsService } from '../src/agents/agents.service';
import { DatabaseService } from '../src/database/database.service';
import { HealthController } from '../src/health/health.controller';
import { IterationPlansController } from '../src/iteration-plans/iteration-plans.controller';
import { IterationPlansService } from '../src/iteration-plans/iteration-plans.service';
import { OrchestrationRunsController } from '../src/orchestration-runs/orchestration-runs.controller';
import { OrchestrationRunsService } from '../src/orchestration-runs/orchestration-runs.service';
import { ProvidersController } from '../src/providers/providers.controller';
import { ProvidersService } from '../src/providers/providers.service';
import { RequirementsController } from '../src/requirements/requirements.controller';
import { RequirementsService } from '../src/requirements/requirements.service';
import { WorkspacesController } from '../src/workspaces/workspaces.controller';
import { WorkspacesService } from '../src/workspaces/workspaces.service';

describe('API foundation', () => {
  function createControllers(dbPath = ':memory:') {
    const databaseService = new DatabaseService(dbPath);
    const workspacesService = new WorkspacesService(databaseService);
    const providersService = new ProvidersService(workspacesService, databaseService);
    const requirementsService = new RequirementsService(databaseService);
    const iterationPlansService = new IterationPlansService(requirementsService, databaseService);
    const agentsService = new AgentsService(providersService, databaseService);
    const orchestrationRunsService = new OrchestrationRunsService(
      iterationPlansService,
      agentsService,
      databaseService
    );
    const artifactsService = new ArtifactsService(orchestrationRunsService);
    return {
      databaseService,
      healthController: new HealthController(),
      workspacesController: new WorkspacesController(workspacesService),
      providersController: new ProvidersController(providersService),
      requirementsController: new RequirementsController(requirementsService),
      iterationPlansController: new IterationPlansController(iterationPlansService),
      agentsController: new AgentsController(agentsService),
      orchestrationRunsController: new OrchestrationRunsController(orchestrationRunsService),
      artifactsController: new ArtifactsController(artifactsService)
    };
  }

  it('returns health status', () => {
    const { healthController } = createControllers();

    expect(healthController.getHealth()).toEqual({ status: 'ok' });
  });

  it('creates a workspace and switches default workspace', () => {
    const { workspacesController } = createControllers();

    const created = workspacesController.create({
      name: 'Second Workspace',
      rootPath: '/tmp/second',
      description: 'secondary'
    });

    expect(created.name).toBe('Second Workspace');

    const defaultWorkspace = workspacesController.setDefault(created.id);
    expect(defaultWorkspace.isDefault).toBe(true);

    const allWorkspaces = workspacesController.list();
    const currentDefault = allWorkspaces.find((workspace) => workspace.isDefault);
    expect(currentDefault?.id).toBe(created.id);
  });

  it('creates and updates a provider configuration', () => {
    const { providersController } = createControllers();

    const provider = providersController.create({
      name: 'Primary Codex',
      providerType: 'codex',
      endpoint: 'https://api.example.com',
      model: 'gpt-5',
      apiKey: 'secret-token',
      workspaceId: 'ws_1',
      isEnabled: true
    });

    expect(provider.apiKeyMasked).toContain('****');

    const updated = providersController.update(provider.id, {
      name: 'Primary Claude',
      providerType: 'claude_code',
      model: 'claude-4-sonnet',
      isEnabled: false
    });

    expect(updated.name).toBe('Primary Claude');
    expect(updated.providerType).toBe('claude_code');
    expect(updated.isEnabled).toBe(false);
  });

  it('rejects invalid workspace creation', () => {
    const { workspacesController } = createControllers();

    expect(() =>
      workspacesController.create({
        rootPath: '/tmp/invalid'
      })
    ).toThrowError('name is required');
  });

  it('creates a requirement with initial version and appends a new version', () => {
    const { requirementsController } = createControllers();

    const requirement = requirementsController.create({
      projectId: 'project_demo',
      title: 'Agent orchestration MVP',
      summary: 'Need requirement center',
      goal: 'Generate iteration plan drafts',
      constraints: 'Single user first',
      acceptanceCriteria: 'A confirmed plan exists',
      content: 'Initial requirement body'
    });

    expect(requirement.currentVersionNumber).toBe(1);
    expect(requirement.currentContent).toBe('Initial requirement body');

    const version = requirementsController.addVersion(requirement.id, {
      content: 'Updated requirement body'
    });

    expect(version.version).toBe(2);

    const versions = requirementsController.listVersions(requirement.id);
    expect(versions).toHaveLength(2);
    expect(versions[1].content).toBe('Updated requirement body');
  });

  it('generates and confirms an iteration plan', () => {
    const { requirementsController, iterationPlansController } = createControllers();

    const requirement = requirementsController.create({
      projectId: 'project_demo',
      title: 'Planning core flow',
      summary: 'Need planning flow',
      goal: 'Create plan draft',
      constraints: 'Keep MVP focused',
      acceptanceCriteria: 'Confirmed plan exists',
      content: 'Detailed product requirement'
    });

    const plan = iterationPlansController.generate(requirement.id);

    expect(plan.status).toBe('draft');
    expect(plan.iterations).toHaveLength(3);
    expect(plan.iterations[0].workPackages).toHaveLength(5);

    const confirmed = iterationPlansController.confirm(plan.id);
    expect(confirmed.status).toBe('confirmed');

    const plans = iterationPlansController.list();
    expect(plans[0].status).toBe('confirmed');
  });

  it('keeps only one confirmed plan per requirement', () => {
    const { requirementsController, iterationPlansController } = createControllers();

    const requirement = requirementsController.create({
      title: 'Plan conflict handling',
      content: 'Requirement body'
    });

    const first = iterationPlansController.generate(requirement.id);
    const second = iterationPlansController.generate(requirement.id);

    iterationPlansController.confirm(first.id);
    iterationPlansController.confirm(second.id);

    const plans = iterationPlansController.list();
    const confirmedPlans = plans.filter((plan) => plan.status === 'confirmed');
    expect(confirmedPlans).toHaveLength(1);
    expect(confirmedPlans[0].id).toBe(second.id);
  });

  it('returns built-in agent templates', () => {
    const { agentsController } = createControllers();

    const templates = agentsController.listTemplates();

    expect(templates).toHaveLength(5);
    expect(templates[0].role).toBe('product_manager');
  });

  it('creates, updates, and deletes an agent instance', () => {
    const { agentsController, providersController } = createControllers();

    providersController.create({
      name: 'Primary Codex',
      providerType: 'codex',
      workspaceId: 'ws_1',
      endpoint: 'https://api.example.com',
      model: 'gpt-5',
      apiKey: 'secret'
    });

    const agent = agentsController.create({
      templateId: 'template_developer',
      name: 'Developer Agent Alpha',
      providerId: 'provider_1',
      systemPrompt: 'Implement approved work.',
      taskTypes: ['implementation', 'api_design'],
      isEnabled: true
    });

    expect(agent.name).toBe('Developer Agent Alpha');
    expect(agent.taskTypes).toContain('implementation');

    const updated = agentsController.update(agent.id, {
      name: 'Developer Agent Beta',
      isEnabled: false,
      taskTypes: ['implementation']
    });

    expect(updated.name).toBe('Developer Agent Beta');
    expect(updated.isEnabled).toBe(false);

    const removed = agentsController.remove(agent.id);
    expect(removed.id).toBe(agent.id);
    expect(agentsController.listInstances()).toHaveLength(0);
  });

  it('rejects agent creation with invalid provider', () => {
    const { agentsController } = createControllers();

    expect(() =>
      agentsController.create({
        templateId: 'template_tester',
        name: 'Broken Agent',
        providerId: 'missing_provider'
      })
    ).toThrowError('provider not found');
  });

  it('creates a run and advances to the next stage after confirmation', () => {
    const {
      agentsController,
      iterationPlansController,
      orchestrationRunsController,
      providersController,
      requirementsController
    } = createControllers();

    seedAgents(agentsController, providersController);
    const plan = createConfirmedPlan(requirementsController, iterationPlansController);

    const run = orchestrationRunsController.create({
      planId: plan.id,
      iterationId: plan.iterations[0].id
    });

    expect(run.status).toBe('draft');
    expect(run.stages[0].status).toBe('ready');
    expect(run.stages[1].status).toBe('pending');

    const started = orchestrationRunsController.start(run.id);
    expect(started.status).toBe('running');
    expect(started.stages[0].status).toBe('running');

    const executed = orchestrationRunsController.executeStage(run.id, started.stages[0].id);
    expect(executed.tasks).toHaveLength(1);
    expect(executed.handoffs).toHaveLength(1);
    expect(executed.stages[0].status).toBe('waiting_confirmation');

    const confirmed = orchestrationRunsController.confirmStage(run.id, executed.stages[0].id);
    expect(confirmed.stages[0].status).toBe('completed');
    expect(confirmed.currentStageId).toBe(confirmed.stages[1].id);
    expect(confirmed.stages[1].status).toBe('ready');
  });

  it('supports pause, resume, fail, and retry for the current stage', () => {
    const {
      agentsController,
      iterationPlansController,
      orchestrationRunsController,
      providersController,
      requirementsController
    } = createControllers();

    seedAgents(agentsController, providersController);
    const plan = createConfirmedPlan(requirementsController, iterationPlansController);
    const run = orchestrationRunsController.create({
      planId: plan.id,
      iterationId: plan.iterations[0].id
    });

    orchestrationRunsController.start(run.id);

    const paused = orchestrationRunsController.pause(run.id);
    expect(paused.status).toBe('paused');

    const resumed = orchestrationRunsController.resume(run.id);
    expect(resumed.status).toBe('running');

    const failed = orchestrationRunsController.failStage(run.id, resumed.stages[0].id, {
      reason: 'Design handoff missing key fields'
    });
    expect(failed.status).toBe('failed');
    expect(failed.stages[0].status).toBe('failed');
    expect(failed.lastError).toContain('missing key fields');

    const retried = orchestrationRunsController.retryStage(run.id, failed.stages[0].id);
    expect(retried.status).toBe('running');
    expect(retried.stages[0].status).toBe('ready');
    expect(retried.lastError).toBeNull();
  });

  it('rejects run creation without a confirmed plan or missing role agents', () => {
    const {
      agentsController,
      iterationPlansController,
      orchestrationRunsController,
      providersController,
      requirementsController
    } = createControllers();

    providersController.create({
      name: 'Primary Codex',
      providerType: 'codex',
      workspaceId: 'ws_1',
      endpoint: 'https://api.example.com',
      model: 'gpt-5',
      apiKey: 'secret'
    });

    agentsController.create({
      templateId: 'template_product_manager',
      name: 'PM Agent Alpha',
      providerId: 'provider_1',
      isEnabled: true
    });

    const requirement = requirementsController.create({
      title: 'Run creation validation',
      content: 'Need orchestration checks'
    });
    const draftPlan = iterationPlansController.generate(requirement.id);

    expect(() =>
      orchestrationRunsController.create({
        planId: draftPlan.id,
        iterationId: draftPlan.iterations[0].id
      })
    ).toThrowError('plan must be confirmed');

    const confirmedPlan = iterationPlansController.confirm(draftPlan.id);

    expect(() =>
      orchestrationRunsController.create({
        planId: confirmedPlan.id,
        iterationId: confirmedPlan.iterations[0].id
      })
    ).toThrowError('designer agent is required');
  });

  it('generates artifacts, test reports, and build records from completed run stages', () => {
    const {
      agentsController,
      artifactsController,
      iterationPlansController,
      orchestrationRunsController,
      providersController,
      requirementsController
    } = createControllers();

    seedAgents(agentsController, providersController);
    const plan = createConfirmedPlan(requirementsController, iterationPlansController);
    const run = orchestrationRunsController.create({
      planId: plan.id,
      iterationId: plan.iterations[0].id
    });

    completeRun(run.id, orchestrationRunsController);

    const artifacts = artifactsController.list();
    expect(artifacts.length).toBeGreaterThanOrEqual(7);
    expect(artifacts.some((artifact) => artifact.category === 'development_doc')).toBe(true);
    expect(artifacts.some((artifact) => artifact.category === 'test_report_doc')).toBe(true);

    const runArtifacts = artifactsController.listByRun(run.id);
    expect(runArtifacts.every((artifact) => artifact.runId === run.id)).toBe(true);

    const iterationArtifacts = artifactsController.listByIteration(plan.iterations[0].id);
    expect(iterationArtifacts.length).toBe(runArtifacts.length);

    const artifactDetail = artifactsController.getById(runArtifacts[0].id);
    expect(artifactDetail.id).toBe(runArtifacts[0].id);

    const testReports = artifactsController.listTestReports(run.id);
    expect(testReports).toHaveLength(1);
    expect(testReports[0].status).toBe('passed');

    const buildRecords = artifactsController.listBuildRecords(run.id);
    expect(buildRecords).toHaveLength(1);
    expect(buildRecords[0].status).toBe('ready');
  });

  it('persists requirements and providers across service recreation when using a file database', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'ultimate-team-db-'));
    const dbPath = join(tempDir, 'test.db');

    try {
      const first = createControllers(dbPath);
      const provider = first.providersController.create({
        name: 'Persistent Codex',
        providerType: 'codex',
        workspaceId: 'ws_1',
        endpoint: 'https://api.example.com',
        model: 'gpt-5',
        apiKey: 'secret'
      });
      const requirement = first.requirementsController.create({
        title: 'Persistent requirement',
        content: 'Stored in sqlite'
      });

      first.databaseService.onModuleDestroy();

      const second = createControllers(dbPath);
      expect(second.providersController.list()).toHaveLength(1);
      expect(second.providersController.list()[0].id).toBe(provider.id);
      expect(second.requirementsController.list()).toHaveLength(1);
      expect(second.requirementsController.list()[0].id).toBe(requirement.id);

      second.databaseService.onModuleDestroy();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

function seedAgents(agentsController: AgentsController, providersController: ProvidersController) {
  providersController.create({
    name: 'Primary Codex',
    providerType: 'codex',
    workspaceId: 'ws_1',
    endpoint: 'https://api.example.com',
    model: 'gpt-5',
    apiKey: 'secret'
  });

  agentsController.create({
    templateId: 'template_product_manager',
    name: 'PM Agent Alpha',
    providerId: 'provider_1',
    isEnabled: true
  });
  agentsController.create({
    templateId: 'template_designer',
    name: 'Designer Agent Alpha',
    providerId: 'provider_1',
    isEnabled: true
  });
  agentsController.create({
    templateId: 'template_developer',
    name: 'Developer Agent Alpha',
    providerId: 'provider_1',
    isEnabled: true
  });
  agentsController.create({
    templateId: 'template_tester',
    name: 'Tester Agent Alpha',
    providerId: 'provider_1',
    isEnabled: true
  });
  agentsController.create({
    templateId: 'template_release_manager',
    name: 'Release Manager Agent Alpha',
    providerId: 'provider_1',
    isEnabled: true
  });
}

function createConfirmedPlan(
  requirementsController: RequirementsController,
  iterationPlansController: IterationPlansController
) {
  const requirement = requirementsController.create({
    title: 'Planning core flow',
    summary: 'Need planning flow',
    goal: 'Create plan draft',
    constraints: 'Keep MVP focused',
    acceptanceCriteria: 'Confirmed plan exists',
    content: 'Detailed product requirement'
  });

  const plan = iterationPlansController.generate(requirement.id);
  return iterationPlansController.confirm(plan.id);
}

function completeRun(runId: string, orchestrationRunsController: OrchestrationRunsController) {
  let run = orchestrationRunsController.start(runId);

  while (run.currentStageId) {
    const stage = run.stages.find((item) => item.id === run.currentStageId);
    if (!stage) {
      throw new Error('stage not found during completion');
    }

    run = orchestrationRunsController.executeStage(run.id, stage.id);
    run = orchestrationRunsController.confirmStage(run.id, stage.id);
  }

  return run;
}
