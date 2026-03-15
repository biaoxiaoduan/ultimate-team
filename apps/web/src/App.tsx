import { FormEvent, useEffect, useState } from 'react';

import { defaultPlans, defaultProviders, defaultRequirements, defaultWorkspaces } from './data';
import { IterationPlan, ProviderConfig, Requirement, RequirementVersion, Workspace } from './types';

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

export function App() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(defaultWorkspaces);
  const [providers, setProviders] = useState<ProviderConfig[]>(defaultProviders);
  const [requirements, setRequirements] = useState<Requirement[]>(defaultRequirements);
  const [plans, setPlans] = useState<IterationPlan[]>(defaultPlans);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string>('');
  const [selectedVersions, setSelectedVersions] = useState<RequirementVersion[]>([]);
  const [revisionContent, setRevisionContent] = useState('');
  const [requirementForm, setRequirementForm] = useState(initialRequirementForm);
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

      setWorkspaces(workspaceData);
      setProviders(providerData);
      setRequirements(requirementData);
      setPlans(planData);

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
