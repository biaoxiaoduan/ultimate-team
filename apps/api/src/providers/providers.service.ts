import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { WorkspacesService } from '../workspaces/workspaces.service';
import { CreateProviderInput, ProviderConfig, UpdateProviderInput } from './provider.types';

@Injectable()
export class ProvidersService {
  private readonly providers: ProviderConfig[] = [];

  constructor(private readonly workspacesService: WorkspacesService) {}

  list() {
    return this.providers;
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

    const workspace = this.workspacesService.list().find((item) => item.id === input.workspaceId);
    if (!workspace) {
      throw new BadRequestException('workspaceId is invalid');
    }

    const provider: ProviderConfig = {
      id: `provider_${this.providers.length + 1}`,
      name: input.name.trim(),
      providerType: input.providerType,
      endpoint: input.endpoint?.trim() ?? '',
      model: input.model?.trim() ?? '',
      apiKeyMasked: maskApiKey(input.apiKey),
      isEnabled: input.isEnabled ?? true,
      workspaceId: workspace.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.providers.push(provider);
    return provider;
  }

  update(id: string, input: UpdateProviderInput) {
    const provider = this.providers.find((item) => item.id === id);
    if (!provider) {
      throw new NotFoundException('provider not found');
    }

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
    return provider;
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
