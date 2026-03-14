import { useState } from 'react';

import { defaultProviders, defaultWorkspaces } from './data';
import { ProviderConfig, Workspace } from './types';

export function App() {
  const [workspaces] = useState<Workspace[]>(defaultWorkspaces);
  const [providers, setProviders] = useState<ProviderConfig[]>(defaultProviders);

  const defaultWorkspace = workspaces.find((workspace) => workspace.isDefault);

  function toggleProvider(id: string) {
    setProviders((current) =>
      current.map((provider) =>
        provider.id === id ? { ...provider, isEnabled: !provider.isEnabled } : provider
      )
    );
  }

  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">Iteration 01</p>
        <h1>ultimate-team orchestration foundation</h1>
        <p className="hero-copy">
          Single-operator control plane for provider configuration, workspace setup, and agent
          execution groundwork.
        </p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>Workspace settings</h2>
          <p className="panel-subtitle">Default execution workspace for upcoming agent runs.</p>
          {defaultWorkspace ? (
            <dl className="metadata-list">
              <div>
                <dt>Name</dt>
                <dd>{defaultWorkspace.name}</dd>
              </div>
              <div>
                <dt>Root path</dt>
                <dd>{defaultWorkspace.rootPath}</dd>
              </div>
              <div>
                <dt>Description</dt>
                <dd>{defaultWorkspace.description}</dd>
              </div>
            </dl>
          ) : (
            <p>No default workspace configured.</p>
          )}
        </article>

        <article className="panel">
          <h2>Provider settings</h2>
          <p className="panel-subtitle">Current adapters available for future agent execution.</p>
          <ul className="provider-list">
            {providers.map((provider) => (
              <li key={provider.id} className="provider-card">
                <div>
                  <strong>{provider.name}</strong>
                  <p>
                    {provider.providerType} · {provider.model || 'No model configured'}
                  </p>
                </div>
                <button type="button" onClick={() => toggleProvider(provider.id)}>
                  {provider.isEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
