import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { CreateWorkspaceInput, Workspace } from './workspace.types';

@Injectable()
export class WorkspacesService {
  private readonly workspaces: Workspace[] = [
    {
      id: 'ws_1',
      name: 'Local Workspace',
      rootPath: '/Users/duanyanbiao/Develop/ultimate-team',
      description: 'Default local workspace',
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  list() {
    return this.workspaces;
  }

  create(input: CreateWorkspaceInput) {
    if (!input.name?.trim()) {
      throw new BadRequestException('name is required');
    }

    if (!input.rootPath?.trim()) {
      throw new BadRequestException('rootPath is required');
    }

    const workspace: Workspace = {
      id: `ws_${this.workspaces.length + 1}`,
      name: input.name.trim(),
      rootPath: input.rootPath.trim(),
      description: input.description?.trim() ?? '',
      isDefault: this.workspaces.length === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workspaces.push(workspace);
    return workspace;
  }

  setDefault(id: string) {
    const target = this.workspaces.find((workspace) => workspace.id === id);
    if (!target) {
      throw new NotFoundException('workspace not found');
    }

    this.workspaces.forEach((workspace) => {
      workspace.isDefault = workspace.id === id;
      workspace.updatedAt = new Date().toISOString();
    });

    return target;
  }
}
