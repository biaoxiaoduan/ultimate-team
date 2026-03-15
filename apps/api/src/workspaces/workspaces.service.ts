import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { CreateWorkspaceInput, Workspace } from './workspace.types';

@Injectable()
export class WorkspacesService {
  constructor(private readonly databaseService: DatabaseService) {}

  list() {
    return this.databaseService.connection
      .prepare(
        `
          SELECT id, name, root_path, description, is_default, created_at, updated_at
          FROM workspaces
          ORDER BY pk ASC
        `
      )
      .all()
      .map(mapWorkspaceRow);
  }

  getById(id: string) {
    const workspace = this.databaseService.connection
      .prepare(
        `
          SELECT id, name, root_path, description, is_default, created_at, updated_at
          FROM workspaces
          WHERE id = ?
        `
      )
      .get(id);

    if (!workspace) {
      throw new NotFoundException('workspace not found');
    }

    return mapWorkspaceRow(workspace);
  }

  create(input: CreateWorkspaceInput) {
    if (!input.name?.trim()) {
      throw new BadRequestException('name is required');
    }

    if (!input.rootPath?.trim()) {
      throw new BadRequestException('rootPath is required');
    }

    const isFirstWorkspace = this.list().length === 0;
    const now = new Date().toISOString();
    const result = this.databaseService.connection
      .prepare(
        `
          INSERT INTO workspaces (name, root_path, description, is_default, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        input.name.trim(),
        input.rootPath.trim(),
        input.description?.trim() ?? '',
        isFirstWorkspace ? 1 : 0,
        now,
        now
      );
    const id = `ws_${result.lastInsertRowid}`;
    this.databaseService.connection.prepare('UPDATE workspaces SET id = ? WHERE pk = ?').run(id, result.lastInsertRowid);

    return this.getById(id);
  }

  setDefault(id: string) {
    this.getById(id);
    const now = new Date().toISOString();
    this.databaseService.connection.prepare('UPDATE workspaces SET is_default = 0, updated_at = ?').run(now);
    this.databaseService.connection
      .prepare('UPDATE workspaces SET is_default = 1, updated_at = ? WHERE id = ?')
      .run(now, id);

    return this.getById(id);
  }
}

function mapWorkspaceRow(row: Record<string, unknown>): Workspace {
  return {
    id: String(row.id),
    name: String(row.name),
    rootPath: String(row.root_path),
    description: String(row.description),
    isDefault: Boolean(row.is_default),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
