import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import {
  CreateRequirementInput,
  CreateRequirementVersionInput,
  Requirement,
  RequirementVersion,
  UpdateRequirementInput
} from './requirement.types';

@Injectable()
export class RequirementsService {
  constructor(private readonly databaseService: DatabaseService) {}

  list() {
    return this.databaseService.connection
      .prepare(
        `
          SELECT
            id,
            project_id,
            title,
            summary,
            goal,
            constraints,
            acceptance_criteria,
            current_version_id,
            current_version_number,
            current_content,
            status,
            created_at,
            updated_at
          FROM requirements
          ORDER BY pk DESC
        `
      )
      .all()
      .map(mapRequirementRow);
  }

  getById(id: string) {
    const requirement = this.databaseService.connection
      .prepare(
        `
          SELECT
            id,
            project_id,
            title,
            summary,
            goal,
            constraints,
            acceptance_criteria,
            current_version_id,
            current_version_number,
            current_content,
            status,
            created_at,
            updated_at
          FROM requirements
          WHERE id = ?
        `
      )
      .get(id);
    if (!requirement) {
      throw new NotFoundException('requirement not found');
    }

    return mapRequirementRow(requirement);
  }

  create(input: CreateRequirementInput) {
    if (!input.title?.trim()) {
      throw new BadRequestException('title is required');
    }

    if (!input.content?.trim()) {
      throw new BadRequestException('content is required');
    }

    const now = new Date().toISOString();
    const requirementResult = this.databaseService.connection
      .prepare(
        `
          INSERT INTO requirements (
            project_id, title, summary, goal, constraints, acceptance_criteria, current_version_id,
            current_version_number, current_content, status, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, '', 0, '', ?, ?, ?)
        `
      )
      .run(
        input.projectId?.trim() || 'project_demo',
        input.title.trim(),
        input.summary?.trim() ?? '',
        input.goal?.trim() ?? '',
        input.constraints?.trim() ?? '',
        input.acceptanceCriteria?.trim() ?? '',
        'draft',
        now,
        now
      );
    const requirementId = `req_${requirementResult.lastInsertRowid}`;
    this.databaseService.connection
      .prepare('UPDATE requirements SET id = ? WHERE pk = ?')
      .run(requirementId, requirementResult.lastInsertRowid);

    const versionResult = this.databaseService.connection
      .prepare(
        `
          INSERT INTO requirement_versions (requirement_id, version, content, created_at)
          VALUES (?, ?, ?, ?)
        `
      )
      .run(requirementId, 1, input.content.trim(), now);
    const versionId = `req_ver_${versionResult.lastInsertRowid}`;
    this.databaseService.connection
      .prepare('UPDATE requirement_versions SET id = ? WHERE pk = ?')
      .run(versionId, versionResult.lastInsertRowid);

    this.databaseService.connection
      .prepare(
        `
          UPDATE requirements
          SET current_version_id = ?, current_version_number = ?, current_content = ?
          WHERE id = ?
        `
      )
      .run(versionId, 1, input.content.trim(), requirementId);

    return this.getById(requirementId);
  }

  update(id: string, input: UpdateRequirementInput) {
    const requirement = this.getById(id);

    if (input.title !== undefined) {
      if (!input.title.trim()) {
        throw new BadRequestException('title is required');
      }
      requirement.title = input.title.trim();
    }

    if (input.summary !== undefined) {
      requirement.summary = input.summary.trim();
    }

    if (input.goal !== undefined) {
      requirement.goal = input.goal.trim();
    }

    if (input.constraints !== undefined) {
      requirement.constraints = input.constraints.trim();
    }

    if (input.acceptanceCriteria !== undefined) {
      requirement.acceptanceCriteria = input.acceptanceCriteria.trim();
    }

    if (input.projectId !== undefined) {
      requirement.projectId = input.projectId.trim() || 'project_demo';
    }

    requirement.updatedAt = new Date().toISOString();
    this.databaseService.connection
      .prepare(
        `
          UPDATE requirements
          SET project_id = ?, title = ?, summary = ?, goal = ?, constraints = ?, acceptance_criteria = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(
        requirement.projectId,
        requirement.title,
        requirement.summary,
        requirement.goal,
        requirement.constraints,
        requirement.acceptanceCriteria,
        requirement.updatedAt,
        id
      );
    return this.getById(id);
  }

  listVersions(requirementId: string) {
    this.getById(requirementId);
    return this.databaseService.connection
      .prepare(
        `
          SELECT id, requirement_id, version, content, created_at
          FROM requirement_versions
          WHERE requirement_id = ?
          ORDER BY version ASC
        `
      )
      .all(requirementId)
      .map(mapRequirementVersionRow);
  }

  addVersion(requirementId: string, input: CreateRequirementVersionInput) {
    const requirement = this.getById(requirementId);

    if (!input.content?.trim()) {
      throw new BadRequestException('content is required');
    }

    const currentVersions = this.listVersions(requirementId);
    const nextVersionNumber = currentVersions.length + 1;
    const now = new Date().toISOString();
    const versionResult = this.databaseService.connection
      .prepare(
        `
          INSERT INTO requirement_versions (requirement_id, version, content, created_at)
          VALUES (?, ?, ?, ?)
        `
      )
      .run(requirementId, nextVersionNumber, input.content.trim(), now);
    const versionId = `req_ver_${versionResult.lastInsertRowid}`;
    this.databaseService.connection
      .prepare('UPDATE requirement_versions SET id = ? WHERE pk = ?')
      .run(versionId, versionResult.lastInsertRowid);

    this.databaseService.connection
      .prepare(
        `
          UPDATE requirements
          SET current_version_id = ?, current_version_number = ?, current_content = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(versionId, nextVersionNumber, input.content.trim(), now, requirement.id);

    return this.listVersions(requirementId).at(-1) as RequirementVersion;
  }

  markPlanned(requirementId: string) {
    this.getById(requirementId);
    const now = new Date().toISOString();
    this.databaseService.connection
      .prepare('UPDATE requirements SET status = ?, updated_at = ? WHERE id = ?')
      .run('planned', now, requirementId);
    return this.getById(requirementId);
  }
}

function mapRequirementRow(row: Record<string, unknown>): Requirement {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    summary: String(row.summary),
    goal: String(row.goal),
    constraints: String(row.constraints),
    acceptanceCriteria: String(row.acceptance_criteria),
    currentVersionId: String(row.current_version_id),
    currentVersionNumber: Number(row.current_version_number),
    currentContent: String(row.current_content),
    status: row.status as Requirement['status'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapRequirementVersionRow(row: Record<string, unknown>): RequirementVersion {
  return {
    id: String(row.id),
    requirementId: String(row.requirement_id),
    version: Number(row.version),
    content: String(row.content),
    createdAt: String(row.created_at)
  };
}
