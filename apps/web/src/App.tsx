import { FormEvent, ReactNode, useEffect, useState } from 'react';

import {
  defaultAgentInstances,
  defaultAgentTemplates,
  defaultArtifacts,
  defaultBuildRecords,
  defaultPlans,
  defaultProviders,
  defaultRequirements,
  defaultRuns,
  defaultTestReports,
  defaultWorkspaces
} from './data';
import {
  AgentInstance,
  AgentTemplate,
  Artifact,
  BuildRecord,
  IterationPlan,
  OrchestrationRun,
  ProviderConfig,
  Requirement,
  RequirementVersion,
  RunStage,
  TestReport,
  Workspace
} from './types';

const API_BASE_URL = 'http://localhost:3001';
const DEMO_PROJECT = {
  id: 'project_demo',
  name: 'Ultimate Team Demo',
  description: 'Single-user AI orchestration workflow for the MVP delivery loop.'
};

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

type RunFormState = {
  planId: string;
  iterationId: string;
};

type Route =
  | { page: 'dashboard' }
  | { page: 'settings' }
  | { page: 'project_overview' }
  | { page: 'requirements' }
  | { page: 'requirement_detail'; requirementId: string }
  | { page: 'plans' }
  | { page: 'plan_detail'; planId: string }
  | { page: 'agents' }
  | { page: 'runs' }
  | { page: 'run_detail'; runId: string }
  | { page: 'artifacts' }
  | { page: 'artifact_detail'; artifactId: string };

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

const initialRunForm: RunFormState = {
  planId: '',
  iterationId: ''
};

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(defaultWorkspaces);
  const [providers, setProviders] = useState<ProviderConfig[]>(defaultProviders);
  const [requirements, setRequirements] = useState<Requirement[]>(defaultRequirements);
  const [plans, setPlans] = useState<IterationPlan[]>(defaultPlans);
  const [agentTemplates, setAgentTemplates] = useState<AgentTemplate[]>(defaultAgentTemplates);
  const [agentInstances, setAgentInstances] = useState<AgentInstance[]>(defaultAgentInstances);
  const [runs, setRuns] = useState<OrchestrationRun[]>(defaultRuns);
  const [artifacts, setArtifacts] = useState<Artifact[]>(defaultArtifacts);
  const [testReports, setTestReports] = useState<TestReport[]>(defaultTestReports);
  const [buildRecords, setBuildRecords] = useState<BuildRecord[]>(defaultBuildRecords);
  const [requirementVersions, setRequirementVersions] = useState<RequirementVersion[]>([]);
  const [revisionContent, setRevisionContent] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [requirementForm, setRequirementForm] = useState(initialRequirementForm);
  const [agentForm, setAgentForm] = useState(initialAgentForm);
  const [runForm, setRunForm] = useState(initialRunForm);
  const [statusMessage, setStatusMessage] = useState('Loading workspace and project context...');

  const route = parseRoute(pathname);
  const confirmedPlans = plans.filter((plan) => plan.status === 'confirmed');
  const selectedRequirement =
    route.page === 'requirement_detail'
      ? requirements.find((item) => item.id === route.requirementId)
      : undefined;
  const selectedPlan =
    route.page === 'plan_detail' ? plans.find((item) => item.id === route.planId) : undefined;
  const selectedRun =
    route.page === 'run_detail' ? runs.find((item) => item.id === route.runId) : undefined;
  const selectedArtifact =
    route.page === 'artifact_detail'
      ? artifacts.find((item) => item.id === route.artifactId)
      : undefined;
  const currentStage = selectedRun ? getCurrentStage(selectedRun) : undefined;
  const defaultWorkspace = workspaces.find((workspace) => workspace.isDefault);
  const projectArtifacts =
    route.page === 'run_detail' && selectedRun
      ? artifacts.filter((artifact) => artifact.runId === selectedRun.id)
      : artifacts;

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    void refreshAll();

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (route.page === 'requirement_detail') {
      void loadRequirementVersions(route.requirementId);
    } else {
      setRequirementVersions([]);
      setRevisionContent('');
    }
  }, [route.page, route.page === 'requirement_detail' ? route.requirementId : '']);

  useEffect(() => {
    if (!showRunModal) {
      return;
    }

    setRunForm((current) => {
      const planId = current.planId || confirmedPlans[0]?.id || '';
      const plan = confirmedPlans.find((item) => item.id === planId);
      const iterationId = plan?.iterations.find((item) => item.id === current.iterationId)?.id
        ? current.iterationId
        : plan?.iterations[0]?.id || '';

      if (current.planId === planId && current.iterationId === iterationId) {
        return current;
      }

      return {
        planId,
        iterationId
      };
    });
  }, [showRunModal, confirmedPlans]);

  async function refreshAll() {
    try {
      const [
        workspaceData,
        providerData,
        requirementData,
        planData,
        templateData,
        instanceData,
        runData,
        artifactData,
        testReportData,
        buildRecordData
      ] = await Promise.all([
        fetchJson<Workspace[]>('/workspaces'),
        fetchJson<ProviderConfig[]>('/providers'),
        fetchJson<Requirement[]>('/requirements'),
        fetchJson<IterationPlan[]>('/iteration-plans'),
        fetchJson<AgentTemplate[]>('/agents/templates'),
        fetchJson<AgentInstance[]>('/agents/instances'),
        fetchJson<OrchestrationRun[]>('/orchestration-runs'),
        fetchJson<Artifact[]>('/artifacts'),
        fetchJson<TestReport[]>('/test-reports'),
        fetchJson<BuildRecord[]>('/build-records')
      ]);

      setWorkspaces(workspaceData);
      setProviders(providerData);
      setRequirements(requirementData);
      setPlans(planData);
      setAgentTemplates(templateData);
      setAgentInstances(instanceData);
      setRuns(runData);
      setArtifacts(artifactData);
      setTestReports(testReportData);
      setBuildRecords(buildRecordData);
      setStatusMessage('Connected to local API.');
    } catch {
      setStatusMessage('API unavailable. Showing local fallback data.');
    }
  }

  async function loadRequirementVersions(requirementId: string) {
    try {
      const versions = await fetchJson<RequirementVersion[]>(`/requirements/${requirementId}/versions`);
      setRequirementVersions(versions);
    } catch {
      setRequirementVersions([]);
    }
  }

  function navigate(nextPath: string) {
    if (window.location.pathname === nextPath) {
      return;
    }

    window.history.pushState({}, '', nextPath);
    setPathname(nextPath);
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

    const requirement = await fetchJson<Requirement>('/requirements', {
      method: 'POST',
      body: JSON.stringify({
        projectId: DEMO_PROJECT.id,
        ...requirementForm
      })
    });

    setRequirementForm(initialRequirementForm);
    setShowRequirementModal(false);
    await refreshAll();
    navigate(`/project/requirements/${requirement.id}`);
    setStatusMessage('Requirement created.');
  }

  async function handleAddVersion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedRequirement || !revisionContent.trim()) {
      return;
    }

    await fetchJson<RequirementVersion>(`/requirements/${selectedRequirement.id}/versions`, {
      method: 'POST',
      body: JSON.stringify({
        content: revisionContent
      })
    });

    setRevisionContent('');
    await refreshAll();
    await loadRequirementVersions(selectedRequirement.id);
    setStatusMessage('Requirement version added.');
  }

  async function handleGeneratePlan(requirementId: string) {
    const plan = await fetchJson<IterationPlan>(`/requirements/${requirementId}/generate-plan`, {
      method: 'POST'
    });

    await refreshAll();
    navigate(`/project/plans/${plan.id}`);
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
    setShowAgentModal(false);
    await refreshAll();
    navigate('/project/agents');
  }

  function startCreateAgent() {
    setEditingAgentId(null);
    setAgentForm(initialAgentForm);
    setShowAgentModal(true);
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
    setShowAgentModal(true);
  }

  async function handleDeleteAgent(agentId: string) {
    await fetchJson(`/agents/instances/${agentId}`, {
      method: 'DELETE'
    });

    if (editingAgentId === agentId) {
      setEditingAgentId(null);
      setAgentForm(initialAgentForm);
      setShowAgentModal(false);
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

    const run = await fetchJson<OrchestrationRun>('/orchestration-runs', {
      method: 'POST',
      body: JSON.stringify(runForm)
    });

    setRunForm(initialRunForm);
    setShowRunModal(false);
    await refreshAll();
    navigate(`/project/runs/${run.id}`);
    setStatusMessage('Run created.');
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
    setShowFailModal(false);
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

  function openRunModal(planId?: string, iterationId?: string) {
    setRunForm({
      planId: planId || confirmedPlans[0]?.id || '',
      iterationId:
        iterationId ||
        confirmedPlans.find((item) => item.id === (planId || confirmedPlans[0]?.id))?.iterations[0]?.id ||
        ''
    });
    setShowRunModal(true);
  }

  const activeProjectPage = renderProjectPage({
    route,
    navigate,
    requirements,
    selectedRequirement,
    requirementVersions,
    revisionContent,
    setRevisionContent,
    plans,
    selectedPlan,
    confirmedPlans,
    agentInstances,
    agentTemplates,
    providers,
    runs,
    selectedRun,
    currentStage,
    artifacts,
    selectedArtifact,
    projectArtifacts,
    testReports,
    buildRecords,
    openRequirementModal: () => setShowRequirementModal(true),
    openAgentModal: startCreateAgent,
    openRunModal,
    editAgent: startEditAgent,
    toggleAgent: handleToggleAgent,
    deleteAgent: handleDeleteAgent,
    toggleProvider: handleToggleProvider,
    generatePlan: handleGeneratePlan,
    confirmPlan: handleConfirmPlan,
    addVersion: handleAddVersion,
    startRun: handleStartRun,
    pauseRun: handlePauseRun,
    resumeRun: handleResumeRun,
    executeStage: handleExecuteStage,
    confirmStage: handleConfirmStage,
    retryStage: handleRetryStage,
    openFailModal: () => setShowFailModal(true)
  });

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Ultimate Team</p>
          <h1>AI agent orchestration workspace</h1>
          <p className="hero-copy">
            A guided single-user delivery flow from requirement intake to multi-agent execution and
            artifact review.
          </p>
        </div>
        <div className="topbar-actions">
          <button type="button" className={getNavClass(route.page === 'dashboard')} onClick={() => navigate('/')}>
            Workspace
          </button>
          <button
            type="button"
            className={getNavClass(route.page !== 'dashboard' && route.page !== 'settings')}
            onClick={() => navigate('/project/overview')}
          >
            Project
          </button>
          <button
            type="button"
            className={getNavClass(route.page === 'settings')}
            onClick={() => navigate('/settings')}
          >
            Settings
          </button>
        </div>
      </header>

      <p className="status-banner">{statusMessage}</p>

      {route.page === 'dashboard' ? (
        <section className="page-shell">
          <PageHeader
            title="Workspace dashboard"
            description="Start from a single project card, then follow the guided delivery flow inside the project."
            actions={
              <button type="button" onClick={() => navigate('/project/overview')}>
                Open project
              </button>
            }
          />

          <div className="stats-grid">
            <StatCard label="Requirements" value={requirements.length} />
            <StatCard label="Confirmed plans" value={confirmedPlans.length} />
            <StatCard label="Runs" value={runs.length} />
            <StatCard label="Artifacts" value={artifacts.length} />
          </div>

          <article className="hero-card">
            <div>
              <h2>{DEMO_PROJECT.name}</h2>
              <p>{DEMO_PROJECT.description}</p>
            </div>
            <div className="action-row">
              <button type="button" onClick={() => navigate('/project/overview')}>
                Go to overview
              </button>
              <button type="button" className="ghost-button" onClick={() => navigate('/project/runs')}>
                Review runs
              </button>
            </div>
          </article>
        </section>
      ) : null}

      {route.page === 'settings' ? (
        <section className="page-shell">
          <PageHeader
            title="System settings"
            description="Provider access and workspace defaults stay in a dedicated settings page, not in the middle of the delivery flow."
          />

          <div className="split-grid">
            <section className="panel">
              <h2>Workspace</h2>
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
            </section>

            <section className="panel">
              <h2>Provider settings</h2>
              <div className="card-stack">
                {providers.map((provider) => (
                  <article key={provider.id} className="record-card">
                    <div className="record-header">
                      <div>
                        <strong>{provider.name}</strong>
                        <p>
                          {provider.providerType} · {provider.model}
                        </p>
                      </div>
                      <span className="pill">{provider.isEnabled ? 'enabled' : 'disabled'}</span>
                    </div>
                    <div className="action-row">
                      <button type="button" onClick={() => void handleToggleProvider(provider)}>
                        {provider.isEnabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
      ) : null}

      {route.page !== 'dashboard' && route.page !== 'settings' ? (
        <section className="project-shell">
          <aside className="project-nav">
            <h2>{DEMO_PROJECT.name}</h2>
            <button type="button" className={getProjectNavClass(route, 'project_overview')} onClick={() => navigate('/project/overview')}>
              Overview
            </button>
            <button type="button" className={getProjectNavClass(route, 'requirements')} onClick={() => navigate('/project/requirements')}>
              Requirements
            </button>
            <button type="button" className={getProjectNavClass(route, 'plans')} onClick={() => navigate('/project/plans')}>
              Plans
            </button>
            <button type="button" className={getProjectNavClass(route, 'agents')} onClick={() => navigate('/project/agents')}>
              Agents
            </button>
            <button type="button" className={getProjectNavClass(route, 'runs')} onClick={() => navigate('/project/runs')}>
              Runs
            </button>
            <button type="button" className={getProjectNavClass(route, 'artifacts')} onClick={() => navigate('/project/artifacts')}>
              Artifacts
            </button>
          </aside>

          <section className="page-shell">{activeProjectPage}</section>
        </section>
      ) : null}

      {showRequirementModal ? (
        <ModalFrame title="Create requirement" onClose={() => setShowRequirementModal(false)}>
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
            <div className="action-row">
              <button type="submit">Create requirement</button>
              <button type="button" className="ghost-button" onClick={() => setShowRequirementModal(false)}>
                Cancel
              </button>
            </div>
          </form>
        </ModalFrame>
      ) : null}

      {showAgentModal ? (
        <ModalFrame title={editingAgentId ? 'Edit agent' : 'Create agent'} onClose={() => setShowAgentModal(false)}>
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
                onChange={(event) => setAgentForm((current) => ({ ...current, name: event.target.value }))}
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
              <button type="button" className="ghost-button" onClick={() => setShowAgentModal(false)}>
                Cancel
              </button>
            </div>
          </form>
        </ModalFrame>
      ) : null}

      {showRunModal ? (
        <ModalFrame title="Create orchestration run" onClose={() => setShowRunModal(false)}>
          <form className="stack-form" onSubmit={handleCreateRun}>
            <label>
              Confirmed plan
              <select
                value={runForm.planId}
                onChange={(event) =>
                  setRunForm({
                    planId: event.target.value,
                    iterationId:
                      confirmedPlans.find((item) => item.id === event.target.value)?.iterations[0]?.id || ''
                  })
                }
              >
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
                value={runForm.iterationId}
                onChange={(event) =>
                  setRunForm((current) => ({ ...current, iterationId: event.target.value }))
                }
              >
                <option value="">Select iteration</option>
                {confirmedPlans
                  .find((plan) => plan.id === runForm.planId)
                  ?.iterations.map((iteration) => (
                    <option key={iteration.id} value={iteration.id}>
                      {iteration.title}
                    </option>
                  ))}
              </select>
            </label>
            <div className="action-row">
              <button type="submit">Create run</button>
              <button type="button" className="ghost-button" onClick={() => setShowRunModal(false)}>
                Cancel
              </button>
            </div>
          </form>
        </ModalFrame>
      ) : null}

      {showFailModal && selectedRun && currentStage ? (
        <ModalFrame title="Fail current stage" onClose={() => setShowFailModal(false)}>
          <div className="stack-form">
            <label>
              Fail reason
              <textarea value={failureReason} onChange={(event) => setFailureReason(event.target.value)} />
            </label>
            <div className="action-row">
              <button type="button" className="danger-button" onClick={() => void handleFailStage(selectedRun, currentStage)}>
                Confirm failure
              </button>
              <button type="button" className="ghost-button" onClick={() => setShowFailModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </ModalFrame>
      ) : null}
    </main>
  );
}

function renderProjectPage(props: {
  route: Route;
  navigate: (path: string) => void;
  requirements: Requirement[];
  selectedRequirement?: Requirement;
  requirementVersions: RequirementVersion[];
  revisionContent: string;
  setRevisionContent: (value: string) => void;
  plans: IterationPlan[];
  selectedPlan?: IterationPlan;
  confirmedPlans: IterationPlan[];
  agentInstances: AgentInstance[];
  agentTemplates: AgentTemplate[];
  providers: ProviderConfig[];
  runs: OrchestrationRun[];
  selectedRun?: OrchestrationRun;
  currentStage?: RunStage;
  artifacts: Artifact[];
  selectedArtifact?: Artifact;
  projectArtifacts: Artifact[];
  testReports: TestReport[];
  buildRecords: BuildRecord[];
  openRequirementModal: () => void;
  openAgentModal: () => void;
  openRunModal: (planId?: string, iterationId?: string) => void;
  editAgent: (agent: AgentInstance) => void;
  toggleAgent: (agent: AgentInstance) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  toggleProvider: (provider: ProviderConfig) => Promise<void>;
  generatePlan: (requirementId: string) => Promise<void>;
  confirmPlan: (planId: string) => Promise<void>;
  addVersion: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  startRun: (runId: string) => Promise<void>;
  pauseRun: (runId: string) => Promise<void>;
  resumeRun: (runId: string) => Promise<void>;
  executeStage: (run: OrchestrationRun, stage: RunStage) => Promise<void>;
  confirmStage: (run: OrchestrationRun, stage: RunStage) => Promise<void>;
  retryStage: (run: OrchestrationRun, stage: RunStage) => Promise<void>;
  openFailModal: () => void;
}) {
  const {
    route,
    navigate,
    requirements,
    selectedRequirement,
    requirementVersions,
    revisionContent,
    setRevisionContent,
    plans,
    selectedPlan,
    confirmedPlans,
    agentInstances,
    agentTemplates,
    providers,
    runs,
    selectedRun,
    currentStage,
    artifacts,
    selectedArtifact,
    projectArtifacts,
    testReports,
    buildRecords,
    openRequirementModal,
    openAgentModal,
    openRunModal,
    editAgent,
    toggleAgent,
    deleteAgent,
    toggleProvider,
    generatePlan,
    confirmPlan,
    addVersion,
    startRun,
    pauseRun,
    resumeRun,
    executeStage,
    confirmStage,
    retryStage,
    openFailModal
  } = props;

  if (route.page === 'project_overview') {
    return (
      <>
        <PageHeader
          title="Project overview"
          description="Follow the delivery sequence from requirements to runs and artifacts."
        />
        <div className="stats-grid">
          <StatCard label="Requirements" value={requirements.length} />
          <StatCard label="Plans" value={plans.length} />
          <StatCard label="Enabled agents" value={agentInstances.filter((agent) => agent.isEnabled).length} />
          <StatCard label="Artifacts" value={artifacts.length} />
        </div>

        <div className="split-grid">
          <section className="panel">
            <h2>Next steps</h2>
            <div className="card-stack">
              <ActionCard
                title="Create or refine requirements"
                description="Capture the requirement first, then generate a plan draft."
                actionLabel="Open requirements"
                onAction={() => navigate('/project/requirements')}
              />
              <ActionCard
                title="Review confirmed plans"
                description="Only confirmed plans can create execution runs."
                actionLabel="Open plans"
                onAction={() => navigate('/project/plans')}
              />
              <ActionCard
                title="Prepare agents"
                description="Providers and enabled agents must be ready before execution."
                actionLabel="Open agents"
                onAction={() => navigate('/project/agents')}
              />
            </div>
          </section>

          <section className="panel">
            <h2>Execution snapshot</h2>
            <div className="card-stack">
              {runs.slice(0, 3).map((run) => (
                <article key={run.id} className="record-card">
                  <div className="record-header">
                    <div>
                      <strong>{run.iterationTitle}</strong>
                      <p>{run.id}</p>
                    </div>
                    <span className="pill">{run.status}</span>
                  </div>
                  <div className="action-row">
                    <button type="button" onClick={() => navigate(`/project/runs/${run.id}`)}>
                      Open run
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </>
    );
  }

  if (route.page === 'requirements') {
    return (
      <>
        <PageHeader
          title="Requirements"
          description="Requirements live in their own list page, then open into a detail page for versioning and planning."
          actions={
            <button type="button" onClick={openRequirementModal}>
              New requirement
            </button>
          }
        />
        <div className="card-stack">
          {requirements.map((requirement) => (
            <article key={requirement.id} className="record-card">
              <div className="record-header">
                <div>
                  <strong>{requirement.title}</strong>
                  <p>{requirement.summary || requirement.currentContent}</p>
                </div>
                <span className="pill">{requirement.status}</span>
              </div>
              <div className="pill-row">
                <span className="pill">v{requirement.currentVersionNumber}</span>
                <span className="pill">{requirement.goal || 'Goal pending'}</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={() => navigate(`/project/requirements/${requirement.id}`)}>
                  Open detail
                </button>
                <button type="button" className="ghost-button" onClick={() => void generatePlan(requirement.id)}>
                  Generate plan
                </button>
              </div>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (route.page === 'requirement_detail') {
    return (
      <>
        <PageHeader
          title={selectedRequirement?.title ?? 'Requirement not found'}
          description="Use the detail page to revise the requirement, inspect version history, and move into planning."
          actions={
            selectedRequirement ? (
              <button type="button" onClick={() => void generatePlan(selectedRequirement.id)}>
                Generate plan
              </button>
            ) : null
          }
        />

        {selectedRequirement ? (
          <div className="split-grid">
            <section className="panel">
              <h2>Requirement summary</h2>
              <dl className="metadata-list">
                <div>
                  <dt>Goal</dt>
                  <dd>{selectedRequirement.goal || 'Not provided'}</dd>
                </div>
                <div>
                  <dt>Constraints</dt>
                  <dd>{selectedRequirement.constraints || 'Not provided'}</dd>
                </div>
                <div>
                  <dt>Acceptance</dt>
                  <dd>{selectedRequirement.acceptanceCriteria || 'Not provided'}</dd>
                </div>
                <div>
                  <dt>Current content</dt>
                  <dd>{selectedRequirement.currentContent}</dd>
                </div>
              </dl>
            </section>

            <section className="panel">
              <h2>Version history</h2>
              <ol className="version-list">
                {requirementVersions.map((version) => (
                  <li key={version.id}>
                    <p>
                      Version {version.version}: {version.content}
                    </p>
                  </li>
                ))}
              </ol>
              <form className="stack-form" onSubmit={addVersion}>
                <label>
                  New revision content
                  <textarea value={revisionContent} onChange={(event) => setRevisionContent(event.target.value)} />
                </label>
                <div className="action-row">
                  <button type="submit">Add version</button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      navigate(
                        plans.find((plan) => plan.requirementId === selectedRequirement.id)
                          ? `/project/plans/${plans.find((plan) => plan.requirementId === selectedRequirement.id)!.id}`
                          : '/project/plans'
                      )
                    }
                  >
                    View plans
                  </button>
                </div>
              </form>
            </section>
          </div>
        ) : (
          <EmptyState title="Requirement not found" description="Go back to the requirement list and select a valid item." />
        )}
      </>
    );
  }

  if (route.page === 'plans') {
    return (
      <>
        <PageHeader
          title="Plan workbench"
          description="Review generated plan drafts, confirm the right one, then move to agent setup or run creation."
        />
        <div className="card-stack">
          {plans.map((plan) => (
            <article key={plan.id} className="record-card">
              <div className="record-header">
                <div>
                  <strong>{plan.title}</strong>
                  <p>{plan.summary}</p>
                </div>
                <span className="pill">{plan.status}</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={() => navigate(`/project/plans/${plan.id}`)}>
                  Open plan
                </button>
                {plan.status === 'draft' ? (
                  <button type="button" className="ghost-button" onClick={() => void confirmPlan(plan.id)}>
                    Confirm plan
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (route.page === 'plan_detail') {
    return (
      <>
        <PageHeader
          title={selectedPlan?.title ?? 'Plan not found'}
          description="Plan review lives on its own page so scope, work packages, and next actions stay focused."
          actions={
            selectedPlan ? (
              <div className="action-row">
                {selectedPlan.status === 'draft' ? (
                  <button type="button" onClick={() => void confirmPlan(selectedPlan.id)}>
                    Confirm plan
                  </button>
                ) : (
                  <button type="button" onClick={() => openRunModal(selectedPlan.id, selectedPlan.iterations[0]?.id)}>
                    Create run
                  </button>
                )}
              </div>
            ) : null
          }
        />

        {selectedPlan ? (
          <>
            <article className="panel">
              <div className="record-header">
                <div>
                  <h2>Plan summary</h2>
                  <p>{selectedPlan.summary}</p>
                </div>
                <span className="pill">{selectedPlan.status}</span>
              </div>
              <div className="action-row">
                <button type="button" className="ghost-button" onClick={() => navigate('/project/agents')}>
                  Go to agent center
                </button>
                {selectedPlan.status === 'confirmed' ? (
                  <button type="button" onClick={() => navigate('/project/runs')}>
                    Go to runs
                  </button>
                ) : null}
              </div>
            </article>

            <div className="iteration-grid">
              {selectedPlan.iterations.map((iteration) => (
                <article key={iteration.id} className="iteration-card">
                  <h3>{iteration.title}</h3>
                  <p>{iteration.goal}</p>
                  <ul>
                    {iteration.workPackages.map((item) => (
                      <li key={item.id}>
                        {formatRoleLabel(item.role)}: {item.title}
                      </li>
                    ))}
                  </ul>
                  {selectedPlan.status === 'confirmed' ? (
                    <div className="action-row">
                      <button type="button" onClick={() => openRunModal(selectedPlan.id, iteration.id)}>
                        Create run for this iteration
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState title="Plan not found" description="Select a valid plan from the workbench list." />
        )}
      </>
    );
  }

  if (route.page === 'agents') {
    return (
      <>
        <PageHeader
          title="Agent center"
          description="Agents now live on a dedicated page, separate from planning and execution."
          actions={
            <button type="button" onClick={openAgentModal}>
              New agent
            </button>
          }
        />

        <div className="split-grid">
          <section className="panel">
            <h2>Templates</h2>
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
          </section>

          <section className="panel">
            <h2>Instances</h2>
            <div className="card-stack">
              {agentInstances.map((agent) => (
                <article key={agent.id} className="record-card">
                  <div className="record-header">
                    <div>
                      <strong>{agent.name}</strong>
                      <p>{agent.systemPrompt}</p>
                    </div>
                    <span className="pill">{agent.isEnabled ? 'enabled' : 'disabled'}</span>
                  </div>
                  <div className="pill-row">
                    {agent.taskTypes.map((taskType) => (
                      <span key={taskType} className="pill">
                        {taskType}
                      </span>
                    ))}
                  </div>
                  <div className="action-row">
                    <button type="button" onClick={() => editAgent(agent)}>
                      Edit
                    </button>
                    <button type="button" className="ghost-button" onClick={() => void toggleAgent(agent)}>
                      {agent.isEnabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      className="danger-button"
                      aria-label={`Delete ${agent.name}`}
                      onClick={() => void deleteAgent(agent.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="panel">
          <h2>Provider quick actions</h2>
          <div className="card-stack">
            {providers.map((provider) => (
              <article key={provider.id} className="record-card">
                <div className="record-header">
                  <div>
                    <strong>{provider.name}</strong>
                    <p>
                      {provider.providerType} · {provider.model}
                    </p>
                  </div>
                  <span className="pill">{provider.isEnabled ? 'enabled' : 'disabled'}</span>
                </div>
                <div className="action-row">
                  <button type="button" onClick={() => void toggleProvider(provider)}>
                    {provider.isEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </>
    );
  }

  if (route.page === 'runs') {
    return (
      <>
        <PageHeader
          title="Run center"
          description="Runs start from a list page, then open into a dedicated detail page for stage-by-stage control."
          actions={
            <button type="button" onClick={() => openRunModal()}>
              New run
            </button>
          }
        />
        <div className="card-stack">
          {runs.map((run) => (
            <article key={run.id} className="record-card">
              <div className="record-header">
                <div>
                  <strong>{run.iterationTitle}</strong>
                  <p>
                    {run.id} · tasks {run.tasks.length} · artifacts{' '}
                    {artifacts.filter((artifact) => artifact.runId === run.id).length}
                  </p>
                </div>
                <span className="pill">{run.status}</span>
              </div>
              <div className="action-row">
                <button type="button" onClick={() => navigate(`/project/runs/${run.id}`)}>
                  Open run
                </button>
                {run.status === 'draft' ? (
                  <button type="button" className="ghost-button" onClick={() => void startRun(run.id)}>
                    Start run
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </>
    );
  }

  if (route.page === 'run_detail') {
    return (
      <>
        <PageHeader
          title={selectedRun?.iterationTitle ?? 'Run not found'}
          description="Run detail is the execution surface for the current stage, handoffs, and artifact outcomes."
          actions={
            selectedRun ? (
              <div className="action-row">
                <button type="button" className="ghost-button" onClick={() => navigate('/project/runs')}>
                  Back to runs
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(projectArtifacts[0] ? `/project/artifacts/${projectArtifacts[0].id}` : '/project/artifacts')
                  }
                >
                  View artifacts
                </button>
              </div>
            ) : null
          }
        />

        {selectedRun ? (
          <>
            <article className="panel">
              <div className="record-header">
                <div>
                  <h2>Run controls</h2>
                  <p>
                    Status: {selectedRun.status}
                    {selectedRun.lastError ? ` · ${selectedRun.lastError}` : ''}
                  </p>
                </div>
                <span className="pill">{selectedRun.id}</span>
              </div>
              <div className="action-row">
                {selectedRun.status === 'draft' ? (
                  <button type="button" onClick={() => void startRun(selectedRun.id)}>
                    Start run
                  </button>
                ) : null}
                {selectedRun.status === 'running' ? (
                  <button type="button" className="ghost-button" onClick={() => void pauseRun(selectedRun.id)}>
                    Pause
                  </button>
                ) : null}
                {selectedRun.status === 'paused' || selectedRun.status === 'failed' ? (
                  <button type="button" onClick={() => void resumeRun(selectedRun.id)}>
                    Resume
                  </button>
                ) : null}
              </div>
            </article>

            <div className="split-grid">
              <section className="panel">
                <h2>Stage timeline</h2>
                <div className="stage-list">
                  {selectedRun.stages.map((stage) => (
                    <article key={stage.id} className={`stage-card stage-${stage.status}`}>
                      <div className="record-header">
                        <div>
                          <strong>{formatRoleLabel(stage.role)}</strong>
                          <p>{stage.title}</p>
                        </div>
                        <span className="pill">{stage.status}</span>
                      </div>
                      <p className="stage-agent">Agent: {stage.agentName}</p>
                      {stage.failureReason ? <p className="stage-error">{stage.failureReason}</p> : null}
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel">
                <h2>Current stage</h2>
                {currentStage ? (
                  <>
                    <p>
                      {formatRoleLabel(currentStage.role)} · {currentStage.status}
                    </p>
                    <div className="action-row">
                      {selectedRun.status === 'running' &&
                      (currentStage.status === 'ready' || currentStage.status === 'running') ? (
                        <button type="button" onClick={() => void executeStage(selectedRun, currentStage)}>
                          Execute stage
                        </button>
                      ) : null}
                      {selectedRun.status === 'running' && currentStage.status === 'waiting_confirmation' ? (
                        <button type="button" onClick={() => void confirmStage(selectedRun, currentStage)}>
                          Confirm stage
                        </button>
                      ) : null}
                      {selectedRun.status === 'running' &&
                      (currentStage.status === 'ready' ||
                        currentStage.status === 'running' ||
                        currentStage.status === 'waiting_confirmation') ? (
                        <button type="button" className="danger-button" onClick={openFailModal}>
                          Fail stage
                        </button>
                      ) : null}
                      {currentStage.status === 'failed' ? (
                        <button type="button" onClick={() => void retryStage(selectedRun, currentStage)}>
                          Retry stage
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <p>No active stage.</p>
                )}

                <div className="record-grid">
                  <div>
                    <h3>Tasks</h3>
                    <div className="card-stack compact-stack">
                      {selectedRun.tasks.map((task) => (
                        <article key={task.id} className="record-card compact-card">
                          <strong>{task.taskType}</strong>
                          <p>{task.outputSummary}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3>Handoffs</h3>
                    <div className="card-stack compact-stack">
                      {selectedRun.handoffs.map((handoff) => (
                        <article key={handoff.id} className="record-card compact-card">
                          <strong>{handoff.title}</strong>
                          <p>{handoff.summary}</p>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <section className="panel">
              <div className="record-header">
                <div>
                  <h2>Artifacts generated for this run</h2>
                  <p>Each completed stage contributes structured delivery artifacts.</p>
                </div>
                <span className="pill">{projectArtifacts.length}</span>
              </div>
              <div className="card-stack">
                {projectArtifacts.map((artifact) => (
                  <article key={artifact.id} className="record-card">
                    <div className="record-header">
                      <div>
                        <strong>{artifact.title}</strong>
                        <p>{artifact.summary}</p>
                      </div>
                      <span className="pill">{artifact.category}</span>
                    </div>
                    <div className="action-row">
                      <button type="button" onClick={() => navigate(`/project/artifacts/${artifact.id}`)}>
                        Open artifact
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <EmptyState title="Run not found" description="Select a run from the run center." />
        )}
      </>
    );
  }

  if (route.page === 'artifacts') {
    return (
      <>
        <PageHeader
          title="Artifact center"
          description="Review structured delivery outputs, test summaries, and release readiness in a dedicated artifact workspace."
        />

        <div className="stats-grid">
          <StatCard label="Artifacts" value={artifacts.length} />
          <StatCard label="Test reports" value={testReports.length} />
          <StatCard label="Build records" value={buildRecords.length} />
          <StatCard label="Completed runs" value={runs.filter((run) => run.status === 'completed').length} />
        </div>

        <div className="split-grid">
          <section className="panel">
            <h2>Artifacts</h2>
            <div className="card-stack">
              {artifacts.map((artifact) => (
                <article key={artifact.id} className="record-card">
                  <div className="record-header">
                    <div>
                      <strong>{artifact.title}</strong>
                      <p>{artifact.summary}</p>
                    </div>
                    <span className="pill">{artifact.category}</span>
                  </div>
                  <div className="action-row">
                    <button type="button" onClick={() => navigate(`/project/artifacts/${artifact.id}`)}>
                      Open artifact
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Validation summary</h2>
            <div className="card-stack">
              {testReports.map((report) => (
                <article key={report.id} className="record-card">
                  <div className="record-header">
                    <div>
                      <strong>{report.id}</strong>
                      <p>{report.summary}</p>
                    </div>
                    <span className="pill">{report.status}</span>
                  </div>
                </article>
              ))}
              {buildRecords.map((record) => (
                <article key={record.id} className="record-card">
                  <div className="record-header">
                    <div>
                      <strong>{record.id}</strong>
                      <p>{record.summary}</p>
                    </div>
                    <span className="pill">{record.status}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </>
    );
  }

  if (route.page === 'artifact_detail') {
    const relatedTestReport = testReports.find((report) => report.artifactId === selectedArtifact?.id);
    const relatedBuildRecord = buildRecords.find((record) => record.artifactId === selectedArtifact?.id);

    return (
      <>
        <PageHeader
          title={selectedArtifact?.title ?? 'Artifact not found'}
          description="Artifact detail is where final output, validation summary, and related release state are reviewed."
          actions={
            <button type="button" className="ghost-button" onClick={() => navigate('/project/artifacts')}>
              Back to artifacts
            </button>
          }
        />

        {selectedArtifact ? (
          <div className="split-grid">
            <section className="panel">
              <h2>Artifact content</h2>
              <div className="record-card artifact-content">
                <div className="pill-row">
                  <span className="pill">{selectedArtifact.category}</span>
                  <span className="pill">{selectedArtifact.runId}</span>
                </div>
                <p>{selectedArtifact.summary}</p>
                <pre>{selectedArtifact.content}</pre>
              </div>
            </section>

            <section className="panel">
              <h2>Related verification</h2>
              <div className="card-stack">
                {relatedTestReport ? (
                  <article className="record-card">
                    <strong>Test report</strong>
                    <p>{relatedTestReport.summary}</p>
                    <p>
                      {relatedTestReport.passedCases}/{relatedTestReport.totalCases} passed
                    </p>
                  </article>
                ) : null}
                {relatedBuildRecord ? (
                  <article className="record-card">
                    <strong>Build record</strong>
                    <p>{relatedBuildRecord.summary}</p>
                    <p>
                      {relatedBuildRecord.environment} · {relatedBuildRecord.commitReference}
                    </p>
                  </article>
                ) : null}
                {!relatedTestReport && !relatedBuildRecord ? (
                  <EmptyState title="No linked reports" description="This artifact currently has no dedicated validation summary." />
                ) : null}
              </div>
            </section>
          </div>
        ) : (
          <EmptyState title="Artifact not found" description="Open a valid artifact from the artifact center." />
        )}
      </>
    );
  }

  return <EmptyState title="Page not implemented" description="This route is not part of the current MVP flow." />;
}

function PageHeader(props: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h2>{props.title}</h2>
        <p className="panel-subtitle">{props.description}</p>
      </div>
      {props.actions ? <div className="action-row">{props.actions}</div> : null}
    </div>
  );
}

function StatCard(props: { label: string; value: number }) {
  return (
    <article className="stat-card">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </article>
  );
}

function ActionCard(props: { title: string; description: string; actionLabel: string; onAction: () => void }) {
  return (
    <article className="record-card">
      <strong>{props.title}</strong>
      <p>{props.description}</p>
      <div className="action-row">
        <button type="button" onClick={props.onAction}>
          {props.actionLabel}
        </button>
      </div>
    </article>
  );
}

function EmptyState(props: { title: string; description: string }) {
  return (
    <article className="panel empty-state">
      <h2>{props.title}</h2>
      <p>{props.description}</p>
    </article>
  );
}

function ModalFrame(props: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-label={props.title}>
      <div className="modal-panel">
        <div className="record-header">
          <h2>{props.title}</h2>
          <button type="button" className="ghost-button" onClick={props.onClose}>
            Close
          </button>
        </div>
        {props.children}
      </div>
    </div>
  );
}

function parseRoute(pathname: string): Route {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return { page: 'dashboard' };
  }

  if (segments[0] === 'settings') {
    return { page: 'settings' };
  }

  if (segments[0] !== 'project') {
    return { page: 'dashboard' };
  }

  if (segments[1] === 'overview' || segments.length === 1) {
    return { page: 'project_overview' };
  }

  if (segments[1] === 'requirements' && segments[2]) {
    return { page: 'requirement_detail', requirementId: segments[2] };
  }

  if (segments[1] === 'requirements') {
    return { page: 'requirements' };
  }

  if (segments[1] === 'plans' && segments[2]) {
    return { page: 'plan_detail', planId: segments[2] };
  }

  if (segments[1] === 'plans') {
    return { page: 'plans' };
  }

  if (segments[1] === 'agents') {
    return { page: 'agents' };
  }

  if (segments[1] === 'runs' && segments[2]) {
    return { page: 'run_detail', runId: segments[2] };
  }

  if (segments[1] === 'runs') {
    return { page: 'runs' };
  }

  if (segments[1] === 'artifacts' && segments[2]) {
    return { page: 'artifact_detail', artifactId: segments[2] };
  }

  if (segments[1] === 'artifacts') {
    return { page: 'artifacts' };
  }

  return { page: 'dashboard' };
}

function getCurrentStage(run: OrchestrationRun) {
  if (!run.currentStageId) {
    return undefined;
  }

  return run.stages.find((stage) => stage.id === run.currentStageId);
}

function getNavClass(active: boolean) {
  return active ? 'nav-button nav-button-active' : 'nav-button';
}

function getProjectNavClass(route: Route, group: 'project_overview' | 'requirements' | 'plans' | 'agents' | 'runs' | 'artifacts') {
  const normalized =
    route.page === 'requirement_detail'
      ? 'requirements'
      : route.page === 'plan_detail'
        ? 'plans'
        : route.page === 'run_detail'
          ? 'runs'
          : route.page === 'artifact_detail'
            ? 'artifacts'
            : route.page;

  return normalized === group ? 'project-nav-button project-nav-button-active' : 'project-nav-button';
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
