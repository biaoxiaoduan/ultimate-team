import { FormEvent, useEffect, useState } from 'react';

import {
  defaultAgentInstances,
  defaultAgentTemplates,
  defaultPlans,
  defaultProviders,
  defaultRequirements,
  defaultWorkspaces
} from './data';
import {
  AgentInstance,
  AgentTemplate,
  IterationPlan,
  ProviderConfig,
  Requirement,
  RequirementVersion,
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

const initialRequirementForm: RequirementFormState = {
  title: '',
  summary: '',
  goal: '',
  constraints: '',
  acceptanceCriteria: '',
  content: ''
};

type AgentFormState = {
  templateId: string;
  name: string;
  providerId: string;
  systemPrompt: string;
  taskTypes: string;
  isEnabled: boolean;
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
  const [selectedRequirementId, setSelectedRequirementId] = useState<string>('');
  const [selectedVersions, setSelectedVersions] = useState<RequirementVersion[]>([]);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [revisionContent, setRevisionContent] = useState('');
  const [requirementForm, setRequirementForm] = useState(initialRequirementForm);
  const [agentForm, setAgentForm] = useState<AgentFormState>(initialAgentForm);
  const [statusMessage, setStatusMessage] = useState('Loading workspace and planning context...');

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

  async function refreshAll() {
    try {
      const [workspaceData, providerData, requirementData, planData] = await Promise.all([
        fetchJson<Workspace[]>('/workspaces'),
        fetchJson<ProviderConfig[]>('/providers'),
        fetchJson<Requirement[]>('/requirements'),
        fetchJson<IterationPlan[]>('/iteration-plans')
      ]);
      const [templateData, instanceData] = await Promise.all([
        fetchJson<AgentTemplate[]>('/agents/templates'),
        fetchJson<AgentInstance[]>('/agents/instances')
      ]);

      setWorkspaces(workspaceData);
      setProviders(providerData);
      setRequirements(requirementData);
      setPlans(planData);
      setAgentTemplates(templateData);
      setAgentInstances(instanceData);

      if (requirementData.length > 0) {
        setSelectedRequirementId((current) => current || requirementData[0].id);
      }

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
    await fetchJson<AgentInstance>(`/agents/instances/${agentId}`, {
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

  const defaultWorkspace = workspaces.find((workspace) => workspace.isDefault);

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Iteration 02</p>
        <h1>requirements to iteration planning</h1>
        <p className="hero-copy">
          Capture requirements, manage revisions, and turn the latest requirement version into a
          structured delivery plan.
        </p>
        <p className="status-banner">{statusMessage}</p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>Workspace and providers</h2>
          <p className="panel-subtitle">Iteration 1 foundation remains visible as planning context.</p>
          {defaultWorkspace ? (
            <dl className="metadata-list">
              <div>
                <dt>Default workspace</dt>
                <dd>{defaultWorkspace.name}</dd>
              </div>
              <div>
                <dt>Root path</dt>
                <dd>{defaultWorkspace.rootPath}</dd>
              </div>
              <div>
                <dt>Providers</dt>
                <dd>{providers.length}</dd>
              </div>
            </dl>
          ) : (
            <p>No workspace available.</p>
          )}
        </article>

        <article className="panel">
          <h2>Create requirement</h2>
          <p className="panel-subtitle">This is the input that later feeds the product manager agent.</p>
          <form className="stack-form" onSubmit={handleCreateRequirement}>
            <input
              aria-label="Requirement title"
              placeholder="Requirement title"
              value={requirementForm.title}
              onChange={(event) => setRequirementForm((current) => ({ ...current, title: event.target.value }))}
            />
            <textarea
              aria-label="Requirement summary"
              placeholder="Requirement summary"
              value={requirementForm.summary}
              onChange={(event) =>
                setRequirementForm((current) => ({ ...current, summary: event.target.value }))
              }
            />
            <textarea
              aria-label="Requirement goal"
              placeholder="Requirement goal"
              value={requirementForm.goal}
              onChange={(event) => setRequirementForm((current) => ({ ...current, goal: event.target.value }))}
            />
            <textarea
              aria-label="Requirement constraints"
              placeholder="Requirement constraints"
              value={requirementForm.constraints}
              onChange={(event) =>
                setRequirementForm((current) => ({ ...current, constraints: event.target.value }))
              }
            />
            <textarea
              aria-label="Acceptance criteria"
              placeholder="Acceptance criteria"
              value={requirementForm.acceptanceCriteria}
              onChange={(event) =>
                setRequirementForm((current) => ({
                  ...current,
                  acceptanceCriteria: event.target.value
                }))
              }
            />
            <textarea
              aria-label="Requirement content"
              placeholder="Requirement content"
              value={requirementForm.content}
              onChange={(event) =>
                setRequirementForm((current) => ({ ...current, content: event.target.value }))
              }
            />
            <button type="submit">Create requirement</button>
          </form>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="section-heading">
            <div>
              <h2>Requirements</h2>
              <p className="panel-subtitle">Current requirements and their latest versions.</p>
            </div>
          </div>
          <div className="card-stack">
            {requirements.length === 0 ? (
              <p>No requirements yet.</p>
            ) : (
              requirements.map((requirement) => (
                <article key={requirement.id} className="record-card">
                  <div className="record-header">
                    <div>
                      <strong>{requirement.title}</strong>
                      <p>
                        Version {requirement.currentVersionNumber} · {requirement.status}
                      </p>
                    </div>
                    <button type="button" onClick={() => void handleGeneratePlan(requirement.id)}>
                      Generate plan
                    </button>
                  </div>
                  <p>{requirement.summary || requirement.currentContent}</p>
                  <div className="pill-row">
                    <span className="pill">Goal: {requirement.goal || 'not set'}</span>
                    <span className="pill">Constraints: {requirement.constraints || 'none'}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="panel">
          <h2>Requirement revisions</h2>
          <p className="panel-subtitle">Append a new requirement version before regenerating a plan.</p>
          <div className="stack-form">
            <select
              aria-label="Requirement selection"
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
            <form className="stack-form" onSubmit={handleAddVersion}>
              <textarea
                aria-label="New version content"
                placeholder="New version content"
                value={revisionContent}
                onChange={(event) => setRevisionContent(event.target.value)}
              />
              <button type="submit">Add version</button>
            </form>
          </div>
          <ul className="version-list">
            {selectedVersions.map((version) => (
              <li key={version.id}>
                <strong>v{version.version}</strong>
                <p>{version.content}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel">
        <h2>Iteration plans</h2>
        <p className="panel-subtitle">Draft plans can be reviewed and confirmed into a frozen plan.</p>
        <div className="card-stack">
          {plans.length === 0 ? (
            <p>No plans generated yet.</p>
          ) : (
            plans.map((plan) => (
              <article key={plan.id} className="record-card">
                <div className="record-header">
                  <div>
                    <strong>{plan.title}</strong>
                    <p>
                      {plan.status} · {plan.iterations.length} iterations
                    </p>
                  </div>
                  <button type="button" onClick={() => void handleConfirmPlan(plan.id)}>
                    {plan.status === 'confirmed' ? 'Confirmed' : 'Confirm plan'}
                  </button>
                </div>
                <p>{plan.summary}</p>
                <div className="iteration-grid">
                  {plan.iterations.map((iteration) => (
                    <section key={iteration.id} className="iteration-card">
                      <h3>{iteration.title}</h3>
                      <p>{iteration.goal}</p>
                      <ul>
                        {iteration.workPackages.map((workPackage) => (
                          <li key={workPackage.id}>
                            <strong>{workPackage.role}</strong>: {workPackage.title}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="content-grid">
        <article className="panel">
          <h2>Agent templates</h2>
          <p className="panel-subtitle">Built-in roles that define the default behavior for sub-agents.</p>
          <div className="card-stack">
            {agentTemplates.map((template) => (
              <article key={template.id} className="record-card">
                <div className="record-header">
                  <div>
                    <strong>{template.name}</strong>
                    <p>{template.role}</p>
                  </div>
                </div>
                <p>{template.description}</p>
                <div className="pill-row">
                  {template.defaultTaskTypes.map((taskType) => (
                    <span key={taskType} className="pill">
                      {taskType}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>{editingAgentId ? 'Edit agent' : 'Create agent'}</h2>
          <p className="panel-subtitle">Bind a role template to a configured provider.</p>
          <form className="stack-form" onSubmit={handleCreateOrUpdateAgent}>
            <select
              aria-label="Agent template"
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
            <input
              aria-label="Agent name"
              placeholder="Agent name"
              value={agentForm.name}
              onChange={(event) => setAgentForm((current) => ({ ...current, name: event.target.value }))}
            />
            <select
              aria-label="Agent provider"
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
            <textarea
              aria-label="Agent system prompt"
              placeholder="Agent system prompt"
              value={agentForm.systemPrompt}
              onChange={(event) =>
                setAgentForm((current) => ({ ...current, systemPrompt: event.target.value }))
              }
            />
            <input
              aria-label="Agent task types"
              placeholder="Comma separated task types"
              value={agentForm.taskTypes}
              onChange={(event) =>
                setAgentForm((current) => ({ ...current, taskTypes: event.target.value }))
              }
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={agentForm.isEnabled}
                onChange={(event) =>
                  setAgentForm((current) => ({ ...current, isEnabled: event.target.checked }))
                }
              />
              <span>Enabled</span>
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
        </article>
      </section>

      <section className="panel">
        <h2>Agent instances</h2>
        <p className="panel-subtitle">The concrete agents that later participate in orchestration runs.</p>
        <div className="card-stack">
          {agentInstances.length === 0 ? (
            <p>No agents created yet.</p>
          ) : (
            agentInstances.map((agent) => (
              <article key={agent.id} className="record-card">
                <div className="record-header">
                  <div>
                    <strong>{agent.name}</strong>
                    <p>
                      {agent.templateId} · {agent.isEnabled ? 'enabled' : 'disabled'}
                    </p>
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
                      onClick={() => void handleDeleteAgent(agent.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p>{agent.systemPrompt || 'No prompt configured.'}</p>
                <div className="pill-row">
                  <span className="pill">Provider: {agent.providerId}</span>
                  {agent.taskTypes.map((taskType) => (
                    <span key={taskType} className="pill">
                      {taskType}
                    </span>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
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
