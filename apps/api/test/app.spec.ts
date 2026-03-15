import { describe, expect, it } from 'vitest';

import { AgentsController } from '../src/agents/agents.controller';
import { AgentsService } from '../src/agents/agents.service';
import { HealthController } from '../src/health/health.controller';
import { IterationPlansController } from '../src/iteration-plans/iteration-plans.controller';
import { IterationPlansService } from '../src/iteration-plans/iteration-plans.service';
import { ProvidersController } from '../src/providers/providers.controller';
import { ProvidersService } from '../src/providers/providers.service';
import { RequirementsController } from '../src/requirements/requirements.controller';
import { RequirementsService } from '../src/requirements/requirements.service';
import { WorkspacesController } from '../src/workspaces/workspaces.controller';
import { WorkspacesService } from '../src/workspaces/workspaces.service';

describe('API foundation', () => {
  function createControllers() {
    const workspacesService = new WorkspacesService();
    const providersService = new ProvidersService(workspacesService);
    const requirementsService = new RequirementsService();
    const iterationPlansService = new IterationPlansService(requirementsService);
    const agentsService = new AgentsService(providersService);
    return {
      healthController: new HealthController(),
      workspacesController: new WorkspacesController(workspacesService),
      providersController: new ProvidersController(providersService),
      requirementsController: new RequirementsController(requirementsService),
      iterationPlansController: new IterationPlansController(iterationPlansService),
      agentsController: new AgentsController(agentsService)
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
});
