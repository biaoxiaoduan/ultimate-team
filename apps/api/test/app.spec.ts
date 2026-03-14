import { describe, expect, it } from 'vitest';

import { HealthController } from '../src/health/health.controller';
import { ProvidersController } from '../src/providers/providers.controller';
import { ProvidersService } from '../src/providers/providers.service';
import { WorkspacesController } from '../src/workspaces/workspaces.controller';
import { WorkspacesService } from '../src/workspaces/workspaces.service';

describe('API foundation', () => {
  function createControllers() {
    const workspacesService = new WorkspacesService();
    const providersService = new ProvidersService(workspacesService);
    return {
      healthController: new HealthController(),
      workspacesController: new WorkspacesController(workspacesService),
      providersController: new ProvidersController(providersService)
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
});
