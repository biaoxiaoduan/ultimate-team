import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateProviderInput, ProviderConfig, UpdateProviderInput } from './provider.types';

@Injectable()
export class ProvidersService {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly databaseService: DatabaseService
  ) {}

  list() {
    return this.databaseService.connection
      .prepare(
        `
          SELECT id, name, provider_type, endpoint, model, api_key_masked, is_enabled, workspace_id, created_at, updated_at
          FROM providers
          ORDER BY pk ASC
        `
      )
      .all()
      .map(mapProviderRow);
  }

  getById(id: string) {
    const provider = this.databaseService.connection
      .prepare(
        `
          SELECT id, name, provider_type, endpoint, model, api_key_masked, is_enabled, workspace_id, created_at, updated_at
          FROM providers
          WHERE id = ?
        `
      )
      .get(id);

    if (!provider) {
      throw new NotFoundException('provider not found');
    }

    return mapProviderRow(provider);
  }

  create(input: CreateProviderInput) {
    if (!input.name?.trim()) {
      throw new BadRequestException('name is required');
    }

    if (!input.providerType) {
      throw new BadRequestException('providerType is required');
    }

    if (!input.workspaceId?.trim()) {
      throw new BadRequestException('workspaceId is required');
    }

    const workspace = this.workspacesService.getById(input.workspaceId);
    const now = new Date().toISOString();
    const result = this.databaseService.connection
      .prepare(
        `
          INSERT INTO providers (
            name, provider_type, endpoint, model, api_key_masked, is_enabled, workspace_id, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        input.name.trim(),
        input.providerType,
        input.endpoint?.trim() ?? '',
        input.model?.trim() ?? '',
        maskApiKey(input.apiKey),
        input.isEnabled ?? true ? 1 : 0,
        workspace.id,
        now,
        now
      );
    const id = `provider_${result.lastInsertRowid}`;
    this.databaseService.connection.prepare('UPDATE providers SET id = ? WHERE pk = ?').run(id, result.lastInsertRowid);
    return this.getById(id);
  }

  update(id: string, input: UpdateProviderInput) {
    const provider = this.getById(id);

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new BadRequestException('name is required');
      }
      provider.name = input.name.trim();
    }

    if (input.providerType !== undefined) {
      provider.providerType = input.providerType;
    }

    if (input.endpoint !== undefined) {
      provider.endpoint = input.endpoint.trim();
    }

    if (input.model !== undefined) {
      provider.model = input.model.trim();
    }

    if (input.apiKey !== undefined) {
      provider.apiKeyMasked = maskApiKey(input.apiKey);
    }

    if (input.isEnabled !== undefined) {
      provider.isEnabled = input.isEnabled;
    }

    provider.updatedAt = new Date().toISOString();
    this.databaseService.connection
      .prepare(
        `
          UPDATE providers
          SET name = ?, provider_type = ?, endpoint = ?, model = ?, api_key_masked = ?, is_enabled = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(
        provider.name,
        provider.providerType,
        provider.endpoint,
        provider.model,
        provider.apiKeyMasked,
        provider.isEnabled ? 1 : 0,
        provider.updatedAt,
        id
      );
    return this.getById(id);
  }
}

function maskApiKey(apiKey?: string) {
  if (!apiKey?.trim()) {
    return '';
  }

  const normalized = apiKey.trim();
  if (normalized.length <= 4) {
    return '****';
  }

  return `${normalized.slice(0, 2)}****${normalized.slice(-2)}`;
}

function mapProviderRow(row: Record<string, unknown>): ProviderConfig {
  return {
    id: String(row.id),
    name: String(row.name),
    providerType: row.provider_type as ProviderConfig['providerType'],
    endpoint: String(row.endpoint),
    model: String(row.model),
    apiKeyMasked: String(row.api_key_masked),
    isEnabled: Boolean(row.is_enabled),
    workspaceId: String(row.workspace_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
