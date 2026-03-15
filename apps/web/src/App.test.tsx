import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    window.history.pushState({}, '', '/');

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
        defaultPrompt: 'Act as developer.',
        defaultTaskTypes: ['implementation']
      },
      {
        id: 'template_tester',
        name: 'Tester',
        role: 'tester',
        description: 'Validate work.',
        defaultPrompt: 'Act as tester.',
        defaultTaskTypes: ['test_cases']
      },
      {
        id: 'template_release_manager',
        name: 'Release Manager',
        role: 'release_manager',
        description: 'Prepare release.',
        defaultPrompt: 'Act as release manager.',
        defaultTaskTypes: ['release_prep']
      }
    ];

    const providers = [
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
        systemPrompt: 'Act as developer.',
        taskTypes: ['implementation'],
        isEnabled: true
      },
      {
        id: 'agent_4',
        templateId: 'template_tester',
        name: 'Tester Agent Alpha',
        providerId: 'provider_1',
        systemPrompt: 'Act as tester.',
        taskTypes: ['test_cases'],
        isEnabled: true
      },
      {
        id: 'agent_5',
        templateId: 'template_release_manager',
        name: 'Release Agent Alpha',
        providerId: 'provider_1',
        systemPrompt: 'Act as release manager.',
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
        goal: 'Generate delivery plans',
        constraints: 'Single user',
        acceptanceCriteria: 'Plan can be confirmed',
        currentVersionId: 'req_ver_1',
        currentVersionNumber: 1,
        currentContent: 'Initial body',
        status: 'draft'
      }
    ];

    const versionsByRequirement: Record<string, Array<Record<string, unknown>>> = {
      req_1: [
        {
          id: 'req_ver_1',
          requirementId: 'req_1',
          version: 1,
          content: 'Initial body'
        }
      ]
    };

    const plans = [
      {
        id: 'plan_1',
        requirementId: 'req_1',
        sourceVersionId: 'req_ver_1',
        status: 'draft',
        title: 'Initial requirement delivery plan',
        summary: 'Goal: Generate delivery plans | Constraints: Single user | Acceptance: Plan can be confirmed',
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
                title: 'Design handoff',
                description: 'Design handoff'
              },
              {
                id: 'wp_3',
                role: 'developer',
                title: 'Implementation',
                description: 'Implementation'
              },
              {
                id: 'wp_4',
                role: 'tester',
                title: 'Validation',
                description: 'Validation'
              },
              {
                id: 'wp_5',
                role: 'release_manager',
                title: 'Release prep',
                description: 'Release prep'
              }
            ]
          }
        ]
      }
    ];

    const runs: any[] = [
      {
        id: 'run_2',
        planId: 'plan_1',
        requirementId: 'req_1',
        iterationId: 'iter_1',
        iterationTitle: 'Iteration 1: foundation alignment',
        status: 'completed',
        currentStageId: null,
        lastError: null,
        stages: [],
        tasks: [],
        handoffs: []
      }
    ];

    const artifacts = [
      {
        id: 'artifact_release',
        runId: 'run_2',
        iterationId: 'iter_1',
        stageId: 'run_2_stage_5',
        agentId: 'agent_5',
        category: 'release_doc',
        title: 'Release preparation for Iteration 1',
        summary: 'Release checklist prepared.',
        content: 'Release notes and environment checks.',
        createdAt: '2026-03-15T10:00:00.000Z',
        updatedAt: '2026-03-15T10:00:00.000Z'
      },
      {
        id: 'artifact_test_report',
        runId: 'run_2',
        iterationId: 'iter_1',
        stageId: 'run_2_stage_4',
        agentId: 'agent_4',
        category: 'test_report_doc',
        title: 'Test report for Iteration 1',
        summary: 'Regression validation passed.',
        content: 'All planned regression cases passed.',
        createdAt: '2026-03-15T10:00:00.000Z',
        updatedAt: '2026-03-15T10:00:00.000Z'
      }
    ];

    const testReports = [
      {
        id: 'test_report_1',
        runId: 'run_2',
        iterationId: 'iter_1',
        artifactId: 'artifact_test_report',
        status: 'passed',
        totalCases: 12,
        passedCases: 12,
        failedCases: 0,
        summary: 'Core regression path passed.'
      }
    ];

    const buildRecords = [
      {
        id: 'build_record_1',
        runId: 'run_2',
        iterationId: 'iter_1',
        artifactId: 'artifact_release',
        status: 'ready',
        environment: 'staging',
        commitReference: 'run_2-release',
        summary: 'Release checklist prepared for staging.'
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

        if (input.endsWith('/providers') && method === 'GET') {
          return createResponse(providers);
        }

        if (input.includes('/providers/provider_1') && method === 'PATCH') {
          providers[0] = {
            ...providers[0],
            isEnabled: !providers[0].isEnabled
          };
          return createResponse(providers[0]);
        }

        if (input.endsWith('/requirements') && method === 'GET') {
          return createResponse(requirements);
        }

        if (input.endsWith('/requirements') && method === 'POST') {
          const body = parseBody(init);
          const created = {
            id: 'req_2',
            projectId: 'project_demo',
            title: body.title,
            summary: body.summary,
            goal: body.goal,
            constraints: body.constraints,
            acceptanceCriteria: body.acceptanceCriteria,
            currentVersionId: 'req_ver_2',
            currentVersionNumber: 1,
            currentContent: body.content,
            status: 'draft'
          };
          requirements.push(created);
          versionsByRequirement.req_2 = [
            {
              id: 'req_ver_2',
              requirementId: 'req_2',
              version: 1,
              content: body.content
            }
          ];
          return createResponse(created, 201);
        }

        if (input.includes('/requirements/') && input.endsWith('/versions') && method === 'GET') {
          const requirementId = input.split('/requirements/')[1].split('/versions')[0];
          return createResponse(versionsByRequirement[requirementId] ?? []);
        }

        if (input.includes('/requirements/') && input.endsWith('/versions') && method === 'POST') {
          const requirementId = input.split('/requirements/')[1].split('/versions')[0];
          const body = parseBody(init);
          const nextVersion = (versionsByRequirement[requirementId]?.length ?? 0) + 1;
          const version = {
            id: `req_ver_${requirementId}_${nextVersion}`,
            requirementId,
            version: nextVersion,
            content: body.content
          };
          versionsByRequirement[requirementId] = [...(versionsByRequirement[requirementId] ?? []), version];
          const requirementIndex = requirements.findIndex((item) => item.id === requirementId);
          requirements[requirementIndex] = {
            ...requirements[requirementIndex],
            currentVersionId: version.id,
            currentVersionNumber: nextVersion,
            currentContent: body.content
          };
          return createResponse(version, 201);
        }

        if (input.includes('/generate-plan') && method === 'POST') {
          const requirementId = input.split('/requirements/')[1].split('/generate-plan')[0];
          const planId = requirementId === 'req_2' ? 'plan_2' : 'plan_1';
          const requirement = requirements.find((item) => item.id === requirementId)!;
          const createdPlan = {
            id: planId,
            requirementId,
            sourceVersionId: requirement.currentVersionId,
            status: 'draft',
            title: `${requirement.title} delivery plan`,
            summary: `Goal: ${requirement.goal || 'Deliver scope'} | Constraints: ${requirement.constraints || 'Focused scope'} | Acceptance: ${requirement.acceptanceCriteria || 'Confirmed plan exists'}`,
            iterations: plans[0].iterations
          };
          const existingIndex = plans.findIndex((item) => item.id === planId);
          if (existingIndex >= 0) {
            plans[existingIndex] = createdPlan;
          } else {
            plans.push(createdPlan);
          }
          return createResponse(createdPlan, 201);
        }

        if (input.endsWith('/iteration-plans') && method === 'GET') {
          return createResponse(plans);
        }

        if (input.includes('/iteration-plans/') && input.endsWith('/confirm') && method === 'POST') {
          const planId = input.split('/iteration-plans/')[1].split('/confirm')[0];
          const index = plans.findIndex((plan) => plan.id === planId);
          plans[index] = {
            ...plans[index],
            status: 'confirmed'
          };
          return createResponse(plans[index]);
        }

        if (input.endsWith('/agents/templates') && method === 'GET') {
          return createResponse(templates);
        }

        if (input.endsWith('/agents/instances') && method === 'GET') {
          return createResponse(agents);
        }

        if (input.endsWith('/agents/instances') && method === 'POST') {
          const body = parseBody(init);
          const created = {
            id: 'agent_6',
            templateId: body.templateId,
            name: body.name,
            providerId: body.providerId,
            systemPrompt: body.systemPrompt,
            taskTypes: body.taskTypes,
            isEnabled: body.isEnabled
          };
          agents.push(created);
          return createResponse(created, 201);
        }

        if (input.includes('/agents/instances/agent_6') && method === 'DELETE') {
          agents.splice(agents.findIndex((agent) => agent.id === 'agent_6'), 1);
          return createResponse({ id: 'agent_6' });
        }

        if (input.includes('/agents/instances/') && method === 'PATCH') {
          const agentId = input.split('/agents/instances/')[1];
          const body = parseBody(init);
          const index = agents.findIndex((agent) => agent.id === agentId);
          agents[index] = {
            ...agents[index],
            ...body
          };
          return createResponse(agents[index]);
        }

        if (input.endsWith('/orchestration-runs') && method === 'GET') {
          return createResponse(runs);
        }

        if (input.endsWith('/orchestration-runs') && method === 'POST') {
          const body = parseBody(init);
          const createdRun = {
            id: 'run_1',
            planId: body.planId,
            requirementId: 'req_1',
            iterationId: body.iterationId,
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
                title: 'Iteration 1: foundation alignment: Design handoff',
                agentId: 'agent_2',
                agentName: 'Designer Agent Alpha',
                status: 'pending',
                sequence: 2
              }
            ],
            tasks: [],
            handoffs: []
          };
          runs.unshift(createdRun);
          return createResponse(createdRun, 201);
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

        if (input.includes('/artifacts') && method === 'GET' && !input.includes('/artifacts/')) {
          return createResponse(artifacts);
        }

        if (input.includes('/test-reports') && method === 'GET') {
          return createResponse(testReports);
        }

        if (input.includes('/build-records') && method === 'GET') {
          return createResponse(buildRecords);
        }

        if (input.includes('/artifacts/artifact_') && method === 'GET') {
          const artifactId = input.split('/artifacts/')[1];
          const artifact = artifacts.find((item) => item.id === artifactId);
          return createResponse(artifact ?? {}, artifact ? 200 : 404);
        }

        return createResponse({}, 404);
      })
    );
  });

  it('renders the dashboard and navigates into the project flow', async () => {
    render(<App />);

    expect(await screen.findByText(/workspace dashboard/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open project/i }));

    expect(await screen.findByText(/project overview/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^requirements$/i }));

    expect(await screen.findByRole('heading', { name: /^requirements$/i })).toBeInTheDocument();
    expect(await screen.findByText(/initial requirement/i)).toBeInTheDocument();
  });

  it('creates a requirement from a modal and confirms a generated plan', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /open project/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^requirements$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /new requirement/i }));

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

    expect(await screen.findByText(/created requirement/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /generate plan/i }));

    expect(await screen.findByText(/created requirement delivery plan/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm plan/i }));

    await waitFor(() => {
      expect(screen.getByText(/iteration plan confirmed/i)).toBeInTheDocument();
    });
  });

  it('creates a new agent from the agent page modal', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /open project/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^agents$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /new agent/i }));

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
  });

  it('creates a run from a confirmed plan and opens artifact detail from a completed run', async () => {
    render(<App />);

    fireEvent.click(await screen.findByRole('button', { name: /open project/i }));
    fireEvent.click(await screen.findByRole('button', { name: /^plans$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /open plan/i }));
    fireEvent.click(await screen.findByRole('button', { name: /confirm plan/i }));

    await screen.findByText(/iteration plan confirmed/i);
    fireEvent.click(screen.getByRole('button', { name: /^create run$/i }));
    const runDialog = await screen.findByRole('dialog', { name: /create orchestration run/i });
    fireEvent.click(within(runDialog).getByRole('button', { name: /^create run$/i }));

    expect(await screen.findByText(/run controls/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to runs/i }));
    fireEvent.click((await screen.findAllByRole('button', { name: /open run/i }))[1]);
    fireEvent.click(await screen.findByRole('button', { name: /view artifacts/i }));

    expect(await screen.findByText(/release preparation for iteration 1/i)).toBeInTheDocument();
    expect(await screen.findByText(/release checklist prepared for staging/i)).toBeInTheDocument();
  });
});

function parseBody(init?: RequestInit) {
  return init?.body ? JSON.parse(String(init.body)) : {};
}

function createResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data
  });
}
