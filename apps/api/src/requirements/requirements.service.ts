import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import {
  CreateRequirementInput,
  CreateRequirementVersionInput,
  Requirement,
  RequirementVersion,
  UpdateRequirementInput
} from './requirement.types';

@Injectable()
export class RequirementsService {
  private readonly requirements: Requirement[] = [];
  private readonly versions: RequirementVersion[] = [];

  list() {
    return this.requirements;
  }

  getById(id: string) {
    const requirement = this.requirements.find((item) => item.id === id);
    if (!requirement) {
      throw new NotFoundException('requirement not found');
    }

    return requirement;
  }

  create(input: CreateRequirementInput) {
    if (!input.title?.trim()) {
      throw new BadRequestException('title is required');
    }

    if (!input.content?.trim()) {
      throw new BadRequestException('content is required');
    }

    const requirementId = `req_${this.requirements.length + 1}`;
    const versionId = `req_ver_${this.versions.length + 1}`;
    const now = new Date().toISOString();

    const version: RequirementVersion = {
      id: versionId,
      requirementId,
      version: 1,
      content: input.content.trim(),
      createdAt: now
    };

    const requirement: Requirement = {
      id: requirementId,
      projectId: input.projectId?.trim() || 'project_demo',
      title: input.title.trim(),
      summary: input.summary?.trim() ?? '',
      goal: input.goal?.trim() ?? '',
      constraints: input.constraints?.trim() ?? '',
      acceptanceCriteria: input.acceptanceCriteria?.trim() ?? '',
      currentVersionId: versionId,
      currentVersionNumber: 1,
      currentContent: version.content,
      status: 'draft',
      createdAt: now,
      updatedAt: now
    };

    this.versions.push(version);
    this.requirements.push(requirement);
    return requirement;
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
    return requirement;
  }

  listVersions(requirementId: string) {
    this.getById(requirementId);
    return this.versions
      .filter((version) => version.requirementId === requirementId)
      .sort((left, right) => left.version - right.version);
  }

  addVersion(requirementId: string, input: CreateRequirementVersionInput) {
    const requirement = this.getById(requirementId);

    if (!input.content?.trim()) {
      throw new BadRequestException('content is required');
    }

    const currentVersions = this.listVersions(requirementId);
    const nextVersionNumber = currentVersions.length + 1;
    const version: RequirementVersion = {
      id: `req_ver_${this.versions.length + 1}`,
      requirementId,
      version: nextVersionNumber,
      content: input.content.trim(),
      createdAt: new Date().toISOString()
    };

    this.versions.push(version);
    requirement.currentVersionId = version.id;
    requirement.currentVersionNumber = version.version;
    requirement.currentContent = version.content;
    requirement.updatedAt = new Date().toISOString();

    return version;
  }

  markPlanned(requirementId: string) {
    const requirement = this.getById(requirementId);
    requirement.status = 'planned';
    requirement.updatedAt = new Date().toISOString();
    return requirement;
  }
}
