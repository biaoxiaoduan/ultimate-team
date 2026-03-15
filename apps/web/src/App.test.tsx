import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    const templates = [
      {
        id: 'template_product_manager',
        name: 'Product Manager',
        role: 'product_manager',
        description: 'Break down requirements.',
        defaultPrompt: 'Act as PM.',
        defaultTaskTypes: ['planning']
      },
      {
        id: 'template_developer',
        name: 'Developer',
        role: 'developer',
        description: 'Implement work.',
        defaultPrompt: 'Act as dev.',
        defaultTaskTypes: ['implementation']
      }
    ];

    const agents = [
      {
        id: 'agent_1',
        templateId: 'template_product_manager',
        name: 'PM Agent Alpha',
        providerId: 'provider_1',
        systemPrompt: 'Act as PM.',
        taskTypes: ['planning'],
        isEnabled: true
      }
    ];

    const requirements = [
      {
        id: 'req_1',
        projectId: 'project_demo',
        title: 'Initial requirement',
        summary: 'Need planning flow',
        goal: 'Generate draft plans',
        constraints: 'Single user',
        acceptanceCriteria: 'Plan can be confirmed',
        currentVersionId: 'req_ver_1',
        currentVersionNumber: 1,
        currentContent: 'Initial body',
        status: 'draft'
      }
    ];

    const versions = [
      {
        id: 'req_ver_1',
        requirementId: 'req_1',
        version: 1,
        content: 'Initial body'
      }
    ];

    const plans = [
      {
        id: 'plan_1',
        requirementId: 'req_1',
        sourceVersionId: 'req_ver_1',
        status: 'draft',
        title: 'Initial requirement delivery plan',
        summary: 'Goal: Generate draft plans | Constraints: Single user | Acceptance: Plan can be confirmed',
        iterations: [
          {
            id: 'iter_1',
            title: 'Iteration 1',
            goal: 'Foundation',
            scope: ['scope a'],
            risks: ['risk a'],
            workPackages: [
              {
                id: 'wp_1',
                role: 'product_manager',
                title: 'Refine scope',
                description: 'Refine scope'
              }
            ]
          }
        ]
      }
    ];

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string, init?: RequestInit) => {
        const method = init?.method ?? 'GET';

        if (input.endsWith('/workspaces')) {
          return createResponse([
            {
              id: 'ws_1',
              name: 'Local Workspace',
              rootPath: '/tmp/project',
              description: 'default',
              isDefault: true
            }
          ]);
        }

        if (input.endsWith('/providers')) {
          return createResponse([
            {
              id: 'provider_1',
              name: 'Primary Codex',
              providerType: 'codex',
              endpoint: 'https://api.openai.com',
              model: 'gpt-5',
              apiKeyMasked: 'se****en',
              isEnabled: true,
              workspaceId: 'ws_1'
            }
          ]);
        }

        if (input.endsWith('/requirements') && method === 'GET') {
          return createResponse(requirements);
        }

        if (input.endsWith('/requirements') && method === 'POST') {
          requirements.push({
            id: 'req_2',
            projectId: 'project_demo',
            title: 'Created requirement',
            summary: 'Created summary',
            goal: '',
            constraints: '',
            acceptanceCriteria: '',
            currentVersionId: 'req_ver_2',
            currentVersionNumber: 1,
            currentContent: 'Created body',
            status: 'draft'
          });
          return createResponse(requirements[1], 201);
        }

        if (input.includes('/requirements/req_1/versions') && method === 'GET') {
          return createResponse(versions);
        }

        if (input.includes('/requirements/req_1/versions') && method === 'POST') {
          versions.push({
            id: 'req_ver_2',
            requirementId: 'req_1',
            version: 2,
            content: 'Updated body'
          });
          requirements[0] = {
            ...requirements[0],
            currentVersionNumber: 2,
            currentVersionId: 'req_ver_2',
            currentContent: 'Updated body'
          };
          return createResponse(versions[1], 201);
        }

        if (input.endsWith('/iteration-plans') && method === 'GET') {
          return createResponse(plans);
        }

        if (input.endsWith('/agents/templates') && method === 'GET') {
          return createResponse(templates);
        }

        if (input.endsWith('/agents/instances') && method === 'GET') {
          return createResponse(agents);
        }

        if (input.endsWith('/agents/instances') && method === 'POST') {
          agents.push({
            id: 'agent_2',
            templateId: 'template_developer',
            name: 'Developer Agent Alpha',
            providerId: 'provider_1',
            systemPrompt: 'Implement approved work.',
            taskTypes: ['implementation'],
            isEnabled: true
          });
          return createResponse(agents[1], 201);
        }

        if (input.includes('/requirements/req_1/generate-plan') && method === 'POST') {
          plans.push({
            ...plans[0],
            id: 'plan_2',
            status: 'draft',
            title: 'Generated follow-up plan'
          });
          return createResponse(plans[1], 201);
        }

        if (input.includes('/iteration-plans/plan_1/confirm') && method === 'POST') {
          plans[0] = {
            ...plans[0],
            status: 'confirmed'
          };
          return createResponse(plans[0]);
        }

        if (input.includes('/agents/instances/agent_1') && method === 'PATCH') {
          agents[0] = {
            ...agents[0],
            isEnabled: false
          };
          return createResponse(agents[0]);
        }

        if (input.includes('/agents/instances/agent_1') && method === 'DELETE') {
          agents.splice(0, 1);
          return createResponse({ id: 'agent_1' });
        }

        if (input.includes('/agents/instances/agent_2') && method === 'DELETE') {
          agents.splice(1, 1);
          return createResponse({ id: 'agent_2' });
        }

        return createResponse({}, 404);
      })
    );
  });

  it('renders fetched planning data', async () => {
    render(<App />);

    expect(await screen.findByText(/requirements to iteration planning/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/initial requirement/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/initial requirement delivery plan/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/product manager/i)).length).toBeGreaterThan(0);
  });

  it('creates a requirement and confirms a plan', async () => {
    render(<App />);

    expect((await screen.findAllByText(/initial requirement/i)).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/requirement title/i), {
      target: { value: 'Created requirement' }
    });
    fireEvent.change(screen.getByLabelText(/requirement summary/i), {
      target: { value: 'Created summary' }
    });
    fireEvent.change(screen.getByLabelText(/requirement content/i), {
      target: { value: 'Created body' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create requirement/i }));

    expect((await screen.findAllByText(/created requirement/i)).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: /confirm plan/i })[0]);

    await waitFor(() => {
      expect(screen.getByText(/iteration plan confirmed/i)).toBeInTheDocument();
    });
  });

  it('creates and deletes an agent instance', async () => {
    render(<App />);

    expect(await screen.findByText(/pm agent alpha/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/agent template/i), {
      target: { value: 'template_developer' }
    });
    fireEvent.change(screen.getByLabelText(/agent name/i), {
      target: { value: 'Developer Agent Alpha' }
    });
    fireEvent.change(screen.getByLabelText(/agent provider/i), {
      target: { value: 'provider_1' }
    });
    fireEvent.change(screen.getByLabelText(/agent system prompt/i), {
      target: { value: 'Implement approved work.' }
    });
    fireEvent.change(screen.getByLabelText(/agent task types/i), {
      target: { value: 'implementation' }
    });

    fireEvent.click(screen.getByRole('button', { name: /create agent/i }));

    expect((await screen.findAllByText(/developer agent alpha/i)).length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole('button', { name: /delete/i })[1]);

    await waitFor(() => {
      expect(screen.queryByText(/developer agent alpha/i)).not.toBeInTheDocument();
    });
  });
});

function createResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as Response;
}
