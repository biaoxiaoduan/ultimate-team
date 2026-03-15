import { FormEvent, useEffect, useState } from 'react';

import {
  defaultAgentInstances,
  defaultAgentTemplates,
  defaultPlans,
  defaultProviders,
  defaultRequirements,
  defaultRuns,
  defaultWorkspaces
} from './data';
import {
  AgentInstance,
  AgentTemplate,
  IterationPlan,
  OrchestrationRun,
  ProviderConfig,
  Requirement,
  RequirementVersion,
  RunStage,
  Workspace
} from './types';

const API_BASE_URL = 'http://localhost:3001';

type RequirementFormState = {
  title: string;
  summary: string;
  goal: string;
  constraints: string;
  acceptanceCriteria: string;
  content: string;
};

type AgentFormState = {
  templateId: string;
  name: string;
  providerId: string;
  systemPrompt: string;
  taskTypes: string;
  isEnabled: boolean;
};

const initialRequirementForm: RequirementFormState = {
  title: '',
  summary: '',
  goal: '',
  constraints: '',
  acceptanceCriteria: '',
  content: ''
};

const initialAgentForm: AgentFormState = {
  templateId: '',
  name: '',
  providerId: '',
  systemPrompt: '',
  taskTypes: '',
  isEnabled: true
};

export function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(defaultWorkspaces);
  const [providers, setProviders] = useState<ProviderConfig[]>(defaultProviders);
  const [requirements, setRequirements] = useState<Requirement[]>(defaultRequirements);
  const [plans, setPlans] = useState<IterationPlan[]>(defaultPlans);
  const [agentTemplates, setAgentTemplates] = useState<AgentTemplate[]>(defaultAgentTemplates);
  const [agentInstances, setAgentInstances] = useState<AgentInstance[]>(defaultAgentInstances);
  const [runs, setRuns] = useState<OrchestrationRun[]>(defaultRuns);
  const [selectedRequirementId, setSelectedRequirementId] = useState('');
  const [selectedVersions, setSelectedVersions] = useState<RequirementVersion[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedIterationId, setSelectedIterationId] = useState('');
  const [selectedRunId, setSelectedRunId] = useState('');
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [revisionContent, setRevisionContent] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [requirementForm, setRequirementForm] = useState(initialRequirementForm);
  const [agentForm, setAgentForm] = useState<AgentFormState>(initialAgentForm);
  const [statusMessage, setStatusMessage] = useState('Loading orchestration context...');

  useEffect(() => {
    void refreshAll();
  }, []);

  useEffect(() => {
    if (!selectedRequirementId) {
      setSelectedVersions([]);
      return;
    }

    void loadRequirementVersions(selectedRequirementId);
  }, [selectedRequirementId]);

  useEffect(() => {
    setSelectedRequirementId((current) => {
      if (requirements.some((item) => item.id === current)) {
        return current;
      }

      return requirements[0]?.id ?? '';
    });
  }, [requirements]);

  useEffect(() => {
    const confirmedPlans = plans.filter((plan) => plan.status === 'confirmed');
    setSelectedPlanId((current) => {
      if (confirmedPlans.some((plan) => plan.id === current)) {
        return current;
      }

      return confirmedPlans[0]?.id ?? '';
    });
  }, [plans]);

  useEffect(() => {
    const plan = plans.find((item) => item.id === selectedPlanId);
    setSelectedIterationId((current) => {
      if (plan?.iterations.some((item) => item.id === current)) {
        return current;
      }

      return plan?.iterations[0]?.id ?? '';
    });
  }, [plans, selectedPlanId]);

  useEffect(() => {
    setSelectedRunId((current) => {
      if (runs.some((run) => run.id === current)) {
        return current;
      }

      return runs[0]?.id ?? '';
    });
  }, [runs]);

  const defaultWorkspace = workspaces.find((workspace) => workspace.isDefault);
  const confirmedPlans = plans.filter((plan) => plan.status === 'confirmed');
  const selectedPlan = confirmedPlans.find((plan) => plan.id === selectedPlanId);
  const selectedRun = runs.find((run) => run.id === selectedRunId);
  const currentStage = getCurrentStage(selectedRun);

  async function refreshAll() {
    try {
      const [
        workspaceData,
        providerData,
        requirementData,
        planData,
        templateData,
        instanceData,
        runData
      ] = await Promise.all([
        fetchJson<Workspace[]>('/workspaces'),
        fetchJson<ProviderConfig[]>('/providers'),
        fetchJson<Requirement[]>('/requirements'),
        fetchJson<IterationPlan[]>('/iteration-plans'),
        fetchJson<AgentTemplate[]>('/agents/templates'),
        fetchJson<AgentInstance[]>('/agents/instances'),
        fetchJson<OrchestrationRun[]>('/orchestration-runs')
      ]);

      setWorkspaces(workspaceData);
      setProviders(providerData);
      setRequirements(requirementData);
      setPlans(planData);
      setAgentTemplates(templateData);
      setAgentInstances(instanceData);
      setRuns(runData);
      setStatusMessage('Connected to local API.');
    } catch {
      setStatusMessage('API unavailable. Showing local fallback data.');
    }
  }

  async function loadRequirementVersions(requirementId: string) {
    try {
      const versions = await fetchJson<RequirementVersion[]>(`/requirements/${requirementId}/versions`);
      setSelectedVersions(versions);
    } catch {
      setSelectedVersions([]);
    }
  }

  async function handleToggleProvider(provider: ProviderConfig) {
    await fetchJson<ProviderConfig>(`/providers/${provider.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        isEnabled: !provider.isEnabled
      })
    });

    await refreshAll();
    setStatusMessage(provider.isEnabled ? 'Provider disabled.' : 'Provider enabled.');
  }

  async function handleCreateRequirement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await fetchJson<Requirement>('/requirements', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 'project_demo',
        ...requirementForm
      })
    });

    setRequirementForm(initialRequirementForm);
    await refreshAll();
    setStatusMessage('Requirement created.');
  }

  async function handleAddVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedRequirementId || !revisionContent.trim()) {
      return;
    }

    await fetchJson<RequirementVersion>(`/requirements/${selectedRequirementId}/versions`, {
      method: 'POST',
      body: JSON.stringify({
        content: revisionContent
      })
    });

    setRevisionContent('');
    await refreshAll();
    await loadRequirementVersions(selectedRequirementId);
    setStatusMessage('Requirement version added.');
  }

  async function handleGeneratePlan(requirementId: string) {
    await fetchJson<IterationPlan>(`/requirements/${requirementId}/generate-plan`, {
      method: 'POST'
    });

    await refreshAll();
    setStatusMessage('Iteration plan draft generated.');
  }

  async function handleConfirmPlan(planId: string) {
    await fetchJson<IterationPlan>(`/iteration-plans/${planId}/confirm`, {
      method: 'POST'
    });

    await refreshAll();
    setStatusMessage('Iteration plan confirmed.');
  }

  async function handleCreateOrUpdateAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload = {
      templateId: agentForm.templateId,
      name: agentForm.name,
      providerId: agentForm.providerId,
      systemPrompt: agentForm.systemPrompt,
      taskTypes: agentForm.taskTypes
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      isEnabled: agentForm.isEnabled
    };

    if (editingAgentId) {
      await fetchJson<AgentInstance>(`/agents/instances/${editingAgentId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      setStatusMessage('Agent updated.');
    } else {
      await fetchJson<AgentInstance>('/agents/instances', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setStatusMessage('Agent created.');
    }

    setEditingAgentId(null);
    setAgentForm(initialAgentForm);
    await refreshAll();
  }

  function startEditAgent(agent: AgentInstance) {
    setEditingAgentId(agent.id);
    setAgentForm({
      templateId: agent.templateId,
      name: agent.name,
      providerId: agent.providerId,
      systemPrompt: agent.systemPrompt,
      taskTypes: agent.taskTypes.join(', '),
      isEnabled: agent.isEnabled
    });
  }

  async function handleDeleteAgent(agentId: string) {
    await fetchJson(`/agents/instances/${agentId}`, {
      method: 'DELETE'
    });

    if (editingAgentId === agentId) {
      setEditingAgentId(null);
      setAgentForm(initialAgentForm);
    }

    await refreshAll();
    setStatusMessage('Agent deleted.');
  }

  async function handleToggleAgent(agent: AgentInstance) {
    await fetchJson<AgentInstance>(`/agents/instances/${agent.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        isEnabled: !agent.isEnabled
      })
    });

    await refreshAll();
    setStatusMessage(agent.isEnabled ? 'Agent disabled.' : 'Agent enabled.');
  }

  async function handleCreateRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPlanId || !selectedIterationId) {
      return;
    }

    const run = await fetchJson<OrchestrationRun>('/orchestration-runs', {
      method: 'POST',
      body: JSON.stringify({
        planId: selectedPlanId,
        iterationId: selectedIterationId
      })
    });

    setSelectedRunId(run.id);
    await refreshAll();
    setStatusMessage('Orchestration run created.');
  }

  async function handleStartRun(runId: string) {
    await fetchJson<OrchestrationRun>(`/orchestration-runs/${runId}/start`, {
      method: 'POST'
    });

    await refreshAll();
    setStatusMessage('Run started.');
  }

  async function handlePauseRun(runId: string) {
    await fetchJson<OrchestrationRun>(`/orchestration-runs/${runId}/pause`, {
      method: 'POST'
    });

    await refreshAll();
    setStatusMessage('Run paused.');
  }

  async function handleResumeRun(runId: string) {
    await fetchJson<OrchestrationRun>(`/orchestration-runs/${runId}/resume`, {
      method: 'POST'
    });

    await refreshAll();
    setStatusMessage('Run resumed.');
  }

  async function handleExecuteStage(run: OrchestrationRun, stage: RunStage) {
    await fetchJson<OrchestrationRun>(`/orchestration-runs/${run.id}/stages/${stage.id}/execute`, {
      method: 'POST'
    });

    await refreshAll();
    setStatusMessage('Current stage executed.');
  }

  async function handleConfirmStage(run: OrchestrationRun, stage: RunStage) {
    await fetchJson<OrchestrationRun>(`/orchestration-runs/${run.id}/stages/${stage.id}/confirm`, {
      method: 'POST'
    });

    await refreshAll();
    setStatusMessage('Current stage confirmed.');
  }

  async function handleFailStage(run: OrchestrationRun, stage: RunStage) {
    await fetchJson<OrchestrationRun>(`/orchestration-runs/${run.id}/stages/${stage.id}/fail`, {
      method: 'POST',
      body: JSON.stringify({
        reason: failureReason.trim() || 'Manual review blocked this stage.'
      })
    });

    setFailureReason('');
    await refreshAll();
    setStatusMessage('Current stage marked as failed.');
  }

  async function handleRetryStage(run: OrchestrationRun, stage: RunStage) {
    await fetchJson<OrchestrationRun>(`/orchestration-runs/${run.id}/stages/${stage.id}/retry`, {
      method: 'POST'
    });

    await refreshAll();
    setStatusMessage('Failed stage retried.');
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Iteration 04</p>
        <h1>agent orchestration execution center</h1>
        <p className="hero-copy">
          Turn confirmed plans into orchestrated execution runs, coordinate role agents, and track
          every stage handoff with manual control over failures and approvals.
        </p>
        <p className="status-banner">{statusMessage}</p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>Workspace settings</h2>
          <p className="panel-subtitle">Current single-user execution workspace.</p>
          <dl className="metadata-list">
            <div>
              <dt>Name</dt>
              <dd>{defaultWorkspace?.name ?? 'Unavailable'}</dd>
            </div>
            <div>
              <dt>Path</dt>
              <dd>{defaultWorkspace?.rootPath ?? 'Unavailable'}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{defaultWorkspace?.description ?? 'Unavailable'}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <h2>Provider settings</h2>
          <p className="panel-subtitle">Toggle available execution providers.</p>
          <ul className="provider-list">
            {providers.map((provider) => (
              <li key={provider.id} className="provider-card">
                <div>
                  <strong>{provider.name}</strong>
                  <p>
                    {provider.providerType} · {provider.model}
                  </p>
                </div>
                <button type="button" onClick={() => void handleToggleProvider(provider)}>
                  {provider.isEnabled ? 'Disable' : 'Enable'}
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h2>Delivery overview</h2>
          <p className="panel-subtitle">High-level orchestration readiness across the current MVP.</p>
          <dl className="metadata-list">
            <div>
              <dt>Requirements</dt>
              <dd>{requirements.length}</dd>
            </div>
            <div>
              <dt>Confirmed plans</dt>
              <dd>{confirmedPlans.length}</dd>
            </div>
            <div>
              <dt>Enabled agents</dt>
              <dd>{agentInstances.filter((agent) => agent.isEnabled).length}</dd>
            </div>
            <div>
              <dt>Runs</dt>
              <dd>{runs.length}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <h2>Requirements center</h2>
              <p className="panel-subtitle">Capture requirements, revisions, and plan generation requests.</p>
            </div>
          </div>

          <form className="stack-form" onSubmit={handleCreateRequirement}>
            <label>
              Requirement title
              <input
                value={requirementForm.title}
                onChange={(event) =>
                  setRequirementForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </label>
            <label>
              Requirement summary
              <textarea
                value={requirementForm.summary}
                onChange={(event) =>
                  setRequirementForm((current) => ({ ...current, summary: event.target.value }))
                }
              />
            </label>
            <label>
              Goal
              <input
                value={requirementForm.goal}
                onChange={(event) =>
                  setRequirementForm((current) => ({ ...current, goal: event.target.value }))
                }
              />
            </label>
            <label>
              Constraints
              <input
                value={requirementForm.constraints}
                onChange={(event) =>
                  setRequirementForm((current) => ({ ...current, constraints: event.target.value }))
                }
              />
            </label>
            <label>
              Acceptance criteria
              <input
                value={requirementForm.acceptanceCriteria}
                onChange={(event) =>
                  setRequirementForm((current) => ({
                    ...current,
                    acceptanceCriteria: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Requirement content
              <textarea
                value={requirementForm.content}
                onChange={(event) =>
                  setRequirementForm((current) => ({ ...current, content: event.target.value }))
                }
              />
            </label>
            <button type="submit">Create requirement</button>
          </form>

          <div className="card-stack">
            {requirements.map((requirement) => (
              <article key={requirement.id} className="record-card">
                <div className="record-header">
                  <div>
                    <strong>{requirement.title}</strong>
                    <p>{requirement.summary || requirement.currentContent}</p>
                  </div>
                  <div className="action-row">
                    <span className="pill">{requirement.status}</span>
                    <button type="button" onClick={() => void handleGeneratePlan(requirement.id)}>
                      Generate plan
                    </button>
                  </div>
                </div>
                <div className="pill-row">
                  <span className="pill">v{requirement.currentVersionNumber}</span>
                  <span className="pill">{requirement.goal || 'Goal pending'}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Revisions and plans</h2>
          <p className="panel-subtitle">Switch requirement versions and confirm delivery plans.</p>

          <form className="stack-form" onSubmit={handleAddVersion}>
            <label>
              Requirement
              <select
                value={selectedRequirementId}
                onChange={(event) => setSelectedRequirementId(event.target.value)}
              >
                <option value="">Select requirement</option>
                {requirements.map((requirement) => (
                  <option key={requirement.id} value={requirement.id}>
                    {requirement.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              New revision content
              <textarea
                value={revisionContent}
                onChange={(event) => setRevisionContent(event.target.value)}
              />
            </label>
            <button type="submit">Add version</button>
          </form>

          <div className="record-card">
            <strong>Version history</strong>
            <ol className="version-list">
              {selectedVersions.map((version) => (
                <li key={version.id}>
                  <p>
                    Version {version.version}: {version.content}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="card-stack">
            {plans.map((plan) => (
              <article key={plan.id} className="record-card">
                <div className="record-header">
                  <div>
                    <strong>{plan.title}</strong>
                    <p>{plan.summary}</p>
                  </div>
                  <div className="action-row">
                    <span className="pill">{plan.status}</span>
                    {plan.status !== 'confirmed' ? (
                      <button type="button" onClick={() => void handleConfirmPlan(plan.id)}>
                        Confirm plan
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="iteration-grid">
                  {plan.iterations.map((iteration) => (
                    <div key={iteration.id} className="iteration-card">
                      <h3>{iteration.title}</h3>
                      <p>{iteration.goal}</p>
                      <ul>
                        {iteration.workPackages.map((item) => (
                          <li key={item.id}>
                            {formatRoleLabel(item.role)}: {item.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <h2>Agent center</h2>
          <p className="panel-subtitle">Manage role templates and executable agent instances.</p>

          <div className="card-stack">
            {agentTemplates.map((template) => (
              <article key={template.id} className="record-card">
                <div className="record-header">
                  <div>
                    <strong>{template.name}</strong>
                    <p>{template.description}</p>
                  </div>
                  <span className="pill">{formatRoleLabel(template.role)}</span>
                </div>
              </article>
            ))}
          </div>

          <form className="stack-form" onSubmit={handleCreateOrUpdateAgent}>
            <label>
              Template
              <select
                value={agentForm.templateId}
                onChange={(event) =>
                  setAgentForm((current) => ({ ...current, templateId: event.target.value }))
                }
              >
                <option value="">Select template</option>
                {agentTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Agent name
              <input
                value={agentForm.name}
                onChange={(event) =>
                  setAgentForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </label>
            <label>
              Provider
              <select
                value={agentForm.providerId}
                onChange={(event) =>
                  setAgentForm((current) => ({ ...current, providerId: event.target.value }))
                }
              >
                <option value="">Select provider</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              System prompt
              <textarea
                value={agentForm.systemPrompt}
                onChange={(event) =>
                  setAgentForm((current) => ({ ...current, systemPrompt: event.target.value }))
                }
              />
            </label>
            <label>
              Task types
              <input
                value={agentForm.taskTypes}
                onChange={(event) =>
                  setAgentForm((current) => ({ ...current, taskTypes: event.target.value }))
                }
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={agentForm.isEnabled}
                onChange={(event) =>
                  setAgentForm((current) => ({ ...current, isEnabled: event.target.checked }))
                }
              />
              Enabled
            </label>
            <div className="action-row">
              <button type="submit">{editingAgentId ? 'Update agent' : 'Create agent'}</button>
              {editingAgentId ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    setEditingAgentId(null);
                    setAgentForm(initialAgentForm);
                  }}
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>

          <div className="card-stack">
            {agentInstances.map((agent) => (
              <article key={agent.id} className="record-card">
                <div className="record-header">
                  <div>
                    <strong>{agent.name}</strong>
                    <p>{agent.systemPrompt}</p>
                  </div>
                  <div className="pill-row">
                    <span className="pill">{agent.isEnabled ? 'enabled' : 'disabled'}</span>
                    <span className="pill">{agent.providerId}</span>
                  </div>
                </div>
                <div className="pill-row">
                  {agent.taskTypes.map((taskType) => (
                    <span key={taskType} className="pill">
                      {taskType}
                    </span>
                  ))}
                </div>
                <div className="action-row">
                  <button type="button" onClick={() => startEditAgent(agent)}>
                    Edit
                  </button>
                  <button type="button" className="ghost-button" onClick={() => void handleToggleAgent(agent)}>
                    {agent.isEnabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    aria-label={`Delete ${agent.name}`}
                    onClick={() => void handleDeleteAgent(agent.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Orchestration center</h2>
          <p className="panel-subtitle">Create runs from confirmed plans and manually drive stage flow.</p>

          <form className="stack-form" onSubmit={handleCreateRun}>
            <label>
              Confirmed plan
              <select value={selectedPlanId} onChange={(event) => setSelectedPlanId(event.target.value)}>
                <option value="">Select plan</option>
                {confirmedPlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Iteration
              <select
                value={selectedIterationId}
                onChange={(event) => setSelectedIterationId(event.target.value)}
              >
                <option value="">Select iteration</option>
                {selectedPlan?.iterations.map((iteration) => (
                  <option key={iteration.id} value={iteration.id}>
                    {iteration.title}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Create run</button>
          </form>

          <div className="card-stack">
            {runs.map((run) => (
              <article key={run.id} className="record-card">
                <div className="record-header">
                  <div>
                    <strong>{run.iterationTitle}</strong>
                    <p>
                      {run.id} · {run.status}
                    </p>
                  </div>
                  <div className="action-row">
                    <button type="button" className="ghost-button" onClick={() => setSelectedRunId(run.id)}>
                      View run
                    </button>
                    {run.status === 'draft' ? (
                      <button type="button" onClick={() => void handleStartRun(run.id)}>
                        Start run
                      </button>
                    ) : null}
                    {run.status === 'running' ? (
                      <button type="button" className="ghost-button" onClick={() => void handlePauseRun(run.id)}>
                        Pause
                      </button>
                    ) : null}
                    {run.status === 'paused' || run.status === 'failed' ? (
                      <button type="button" onClick={() => void handleResumeRun(run.id)}>
                        Resume
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="pill-row">
                  <span className="pill">tasks {run.tasks.length}</span>
                  <span className="pill">handoffs {run.handoffs.length}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="record-card orchestration-detail">
            <div className="section-heading">
              <div>
                <strong>{selectedRun?.iterationTitle ?? 'Select a run'}</strong>
                <p className="panel-subtitle">
                  {selectedRun
                    ? `Status: ${selectedRun.status}${selectedRun.lastError ? ` · ${selectedRun.lastError}` : ''}`
                    : 'Run details appear here after selection.'}
                </p>
              </div>
              {selectedRun ? <span className="pill">{selectedRun.id}</span> : null}
            </div>

            {selectedRun ? (
              <>
                <div className="stage-list">
                  {selectedRun.stages.map((stage) => (
                    <div key={stage.id} className={`stage-card stage-${stage.status}`}>
                      <div className="record-header">
                        <div>
                          <strong>{formatRoleLabel(stage.role)}</strong>
                          <p>{stage.title}</p>
                        </div>
                        <span className="pill">{stage.status}</span>
                      </div>
                      <p className="stage-agent">Agent: {stage.agentName}</p>
                      {stage.failureReason ? <p className="stage-error">{stage.failureReason}</p> : null}
                    </div>
                  ))}
                </div>

                {currentStage ? (
                  <div className="stage-actions">
                    <h3>Current stage controls</h3>
                    <p>
                      {formatRoleLabel(currentStage.role)} · {currentStage.status}
                    </p>
                    <label>
                      Fail reason
                      <input
                        value={failureReason}
                        onChange={(event) => setFailureReason(event.target.value)}
                        placeholder="Record the issue blocking this stage"
                      />
                    </label>
                    <div className="action-row">
                      {selectedRun.status === 'running' &&
                      (currentStage.status === 'ready' || currentStage.status === 'running') ? (
                        <button type="button" onClick={() => void handleExecuteStage(selectedRun, currentStage)}>
                          Execute stage
                        </button>
                      ) : null}
                      {selectedRun.status === 'running' && currentStage.status === 'waiting_confirmation' ? (
                        <button type="button" onClick={() => void handleConfirmStage(selectedRun, currentStage)}>
                          Confirm stage
                        </button>
                      ) : null}
                      {selectedRun.status === 'running' &&
                      (currentStage.status === 'ready' ||
                        currentStage.status === 'running' ||
                        currentStage.status === 'waiting_confirmation') ? (
                        <button type="button" className="danger-button" onClick={() => void handleFailStage(selectedRun, currentStage)}>
                          Fail stage
                        </button>
                      ) : null}
                      {currentStage.status === 'failed' ? (
                        <button type="button" onClick={() => void handleRetryStage(selectedRun, currentStage)}>
                          Retry stage
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="record-grid">
                  <div>
                    <h3>Generated tasks</h3>
                    <div className="card-stack compact-stack">
                      {selectedRun.tasks.map((task) => (
                        <div key={task.id} className="record-card compact-card">
                          <strong>{task.taskType}</strong>
                          <p>{task.outputSummary}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3>Handoffs</h3>
                    <div className="card-stack compact-stack">
                      {selectedRun.handoffs.map((handoff) => (
                        <div key={handoff.id} className="record-card compact-card">
                          <strong>{handoff.title}</strong>
                          <p>{handoff.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  );
}

function getCurrentStage(run: OrchestrationRun | undefined) {
  if (!run?.currentStageId) {
    return undefined;
  }

  return run.stages.find((stage) => stage.id === run.currentStageId);
}

function formatRoleLabel(role: string) {
  return role.replaceAll('_', ' ');
}

async function fetchJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...init
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }

  return (await response.json()) as T;
}
