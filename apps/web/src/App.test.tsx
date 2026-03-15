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
        id: 'template_designer',
        name: 'Designer',
        role: 'designer',
        description: 'Prepare design handoff.',
        defaultPrompt: 'Act as designer.',
        defaultTaskTypes: ['design_handoff']
      },
      {
        id: 'template_developer',
        name: 'Developer',
        role: 'developer',
        description: 'Implement work.',
        defaultPrompt: 'Act as dev.',
        defaultTaskTypes: ['implementation']
      },
      {
        id: 'template_tester',
        name: 'Tester',
        role: 'tester',
        description: 'Create test coverage.',
        defaultPrompt: 'Act as tester.',
        defaultTaskTypes: ['test_cases']
      },
      {
        id: 'template_release_manager',
        name: 'Release Manager',
        role: 'release_manager',
        description: 'Prepare release checks.',
        defaultPrompt: 'Act as release manager.',
        defaultTaskTypes: ['release_prep']
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
      },
      {
        id: 'agent_2',
        templateId: 'template_designer',
        name: 'Designer Agent Alpha',
        providerId: 'provider_1',
        systemPrompt: 'Act as designer.',
        taskTypes: ['design_handoff'],
        isEnabled: true
      },
      {
        id: 'agent_3',
        templateId: 'template_developer',
        name: 'Developer Agent Alpha',
        providerId: 'provider_1',
        systemPrompt: 'Implement approved work.',
        taskTypes: ['implementation'],
        isEnabled: true
      },
      {
        id: 'agent_4',
        templateId: 'template_tester',
        name: 'Tester Agent Alpha',
        providerId: 'provider_1',
        systemPrompt: 'Validate the delivery.',
        taskTypes: ['test_cases'],
        isEnabled: true
      },
      {
        id: 'agent_5',
        templateId: 'template_release_manager',
        name: 'Release Agent Alpha',
        providerId: 'provider_1',
        systemPrompt: 'Prepare release notes.',
        taskTypes: ['release_prep'],
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
            title: 'Iteration 1: foundation alignment',
            goal: 'Foundation',
            scope: ['scope a'],
            risks: ['risk a'],
            workPackages: [
              {
                id: 'wp_1',
                role: 'product_manager',
                title: 'Refine scope',
                description: 'Refine scope'
              },
              {
                id: 'wp_2',
                role: 'designer',
                title: 'Prepare design',
                description: 'Prepare design'
              },
              {
                id: 'wp_3',
                role: 'developer',
                title: 'Implement feature',
                description: 'Implement feature'
              },
              {
                id: 'wp_4',
                role: 'tester',
                title: 'Validate feature',
                description: 'Validate feature'
              },
              {
                id: 'wp_5',
                role: 'release_manager',
                title: 'Prepare release',
                description: 'Prepare release'
              }
            ]
          }
        ]
      }
    ];

    const runs: any[] = [];

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

        if (input.endsWith('/providers') && method === 'GET') {
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

        if (input.includes('/providers/provider_1') && method === 'PATCH') {
          return createResponse({
            id: 'provider_1',
            name: 'Primary Codex',
            providerType: 'codex',
            endpoint: 'https://api.openai.com',
            model: 'gpt-5',
            apiKeyMasked: 'se****en',
            isEnabled: false,
            workspaceId: 'ws_1'
          });
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

        if (input.includes('/requirements/req_1/generate-plan') && method === 'POST') {
          plans.push({
            ...plans[0],
            id: 'plan_2',
            status: 'draft',
            title: 'Generated follow-up plan'
          });
          return createResponse(plans[1], 201);
        }

        if (input.endsWith('/iteration-plans') && method === 'GET') {
          return createResponse(plans);
        }

        if (input.includes('/iteration-plans/plan_1/confirm') && method === 'POST') {
          plans[0] = {
            ...plans[0],
            status: 'confirmed'
          };
          return createResponse(plans[0]);
        }

        if (input.endsWith('/agents/templates') && method === 'GET') {
          return createResponse(templates);
        }

        if (input.endsWith('/agents/instances') && method === 'GET') {
          return createResponse(agents);
        }

        if (input.endsWith('/agents/instances') && method === 'POST') {
          agents.push({
            id: 'agent_6',
            templateId: 'template_developer',
            name: 'Developer Agent Beta',
            providerId: 'provider_1',
            systemPrompt: 'Implement approved work.',
            taskTypes: ['implementation'],
            isEnabled: true
          });
          return createResponse(agents[5], 201);
        }

        if (input.includes('/agents/instances/agent_1') && method === 'PATCH') {
          agents[0] = {
            ...agents[0],
            isEnabled: false
          };
          return createResponse(agents[0]);
        }

        if (input.includes('/agents/instances/agent_6') && method === 'DELETE') {
          agents.splice(5, 1);
          return createResponse({ id: 'agent_6' });
        }

        if (input.endsWith('/orchestration-runs') && method === 'GET') {
          return createResponse(runs);
        }

        if (input.endsWith('/orchestration-runs') && method === 'POST') {
          runs.unshift({
            id: 'run_1',
            planId: 'plan_1',
            requirementId: 'req_1',
            iterationId: 'iter_1',
            iterationTitle: 'Iteration 1: foundation alignment',
            status: 'draft',
            currentStageId: 'run_1_stage_1',
            lastError: null,
            stages: [
              {
                id: 'run_1_stage_1',
                runId: 'run_1',
                role: 'product_manager',
                title: 'Iteration 1: foundation alignment: Refine scope',
                agentId: 'agent_1',
                agentName: 'PM Agent Alpha',
                status: 'ready',
                sequence: 1
              },
              {
                id: 'run_1_stage_2',
                runId: 'run_1',
                role: 'designer',
                title: 'Iteration 1: foundation alignment: Prepare design',
                agentId: 'agent_2',
                agentName: 'Designer Agent Alpha',
                status: 'pending',
                sequence: 2
              }
            ],
            tasks: [],
            handoffs: []
          });
          return createResponse(runs[0], 201);
        }

        if (input.includes('/orchestration-runs/run_1/start') && method === 'POST') {
          runs[0] = {
            ...runs[0],
            status: 'running',
            stages: [
              {
                ...runs[0].stages[0],
                status: 'running'
              },
              runs[0].stages[1]
            ]
          };
          return createResponse(runs[0]);
        }

        if (input.includes('/orchestration-runs/run_1/stages/run_1_stage_1/execute') && method === 'POST') {
          runs[0] = {
            ...runs[0],
            stages: [
              {
                ...runs[0].stages[0],
                status: 'waiting_confirmation'
              },
              runs[0].stages[1]
            ],
            tasks: [
              {
                id: 'run_1_task_1',
                runId: 'run_1',
                stageId: 'run_1_stage_1',
                agentId: 'agent_1',
                taskType: 'product_manager',
                prompt: 'Execute PM stage',
                inputSummary: 'Start iteration',
                outputSummary: 'PM Agent Alpha prepared product_manager output.',
                status: 'completed',
                createdAt: '2026-03-15T10:00:00.000Z',
                updatedAt: '2026-03-15T10:00:00.000Z'
              }
            ],
            handoffs: [
              {
                id: 'handoff_1',
                runId: 'run_1',
                fromStageId: 'run_1_stage_1',
                toStageId: 'run_1_stage_2',
                fromRole: 'product_manager',
                toRole: 'designer',
                title: 'product_manager -> designer handoff',
                summary: 'Structured output passed to next role',
                status: 'delivered',
                createdAt: '2026-03-15T10:00:00.000Z',
                deliveredAt: '2026-03-15T10:00:00.000Z'
              }
            ]
          };
          return createResponse(runs[0]);
        }

        if (input.includes('/orchestration-runs/run_1/stages/run_1_stage_1/confirm') && method === 'POST') {
          runs[0] = {
            ...runs[0],
            currentStageId: 'run_1_stage_2',
            stages: [
              {
                ...runs[0].stages[0],
                status: 'completed'
              },
              {
                ...runs[0].stages[1],
                status: 'ready'
              }
            ]
          };
          return createResponse(runs[0]);
        }

        return createResponse({}, 404);
      })
    );
  });

  it('renders fetched planning and orchestration data', async () => {
    render(<App />);

    expect(await screen.findByText(/agent orchestration execution center/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/initial requirement/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/initial requirement delivery plan/i)).toBeInTheDocument();
    expect(await screen.findByText(/orchestration center/i)).toBeInTheDocument();
  });

  it('creates a requirement and confirms a plan', async () => {
    render(<App />);

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

    fireEvent.click(screen.getByRole('button', { name: /confirm plan/i }));

    await waitFor(() => {
      expect(screen.getByText(/iteration plan confirmed/i)).toBeInTheDocument();
    });
    expect((await screen.findAllByText(/confirmed/i)).length).toBeGreaterThan(0);
  });

  it('creates and deletes an agent instance', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/^template$/i), {
      target: { value: 'template_developer' }
    });
    fireEvent.change(screen.getByLabelText(/agent name/i), {
      target: { value: 'Developer Agent Beta' }
    });
    fireEvent.change(screen.getByLabelText(/^provider$/i), {
      target: { value: 'provider_1' }
    });
    fireEvent.change(screen.getByLabelText(/system prompt/i), {
      target: { value: 'Implement approved work.' }
    });
    fireEvent.change(screen.getByLabelText(/task types/i), {
      target: { value: 'implementation' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create agent/i }));

    expect(await screen.findByText(/developer agent beta/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /delete developer agent beta/i }));

    await waitFor(() => {
      expect(screen.queryByText(/developer agent beta/i)).not.toBeInTheDocument();
    });
  });

  it('creates a run and advances the first stage', async () => {
    render(<App />);

    await screen.findByText(/initial requirement delivery plan/i);

    fireEvent.click(screen.getByRole('button', { name: /confirm plan/i }));
    await screen.findByText(/iteration plan confirmed/i);

    fireEvent.change(screen.getByLabelText(/confirmed plan/i), {
      target: { value: 'plan_1' }
    });
    fireEvent.change(screen.getByLabelText(/^iteration$/i), {
      target: { value: 'iter_1' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create run/i }));

    expect(await screen.findByRole('button', { name: /start run/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start run/i }));
    await screen.findByText(/run started/i);

    fireEvent.click(screen.getByRole('button', { name: /execute stage/i }));
    expect(await screen.findByText(/pm agent alpha prepared product_manager output/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm stage/i }));

    await waitFor(() => {
      expect(screen.getByText(/current stage confirmed/i)).toBeInTheDocument();
    });
    expect(await screen.findByText(/structured output passed to next role/i)).toBeInTheDocument();
  });
});

function createResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data
  });
}
