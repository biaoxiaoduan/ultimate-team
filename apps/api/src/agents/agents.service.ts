import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { ProvidersService } from '../providers/providers.service';
import { AgentInstance, AgentTemplate, CreateAgentInput, UpdateAgentInput } from './agent.types';

@Injectable()
export class AgentsService {
  private readonly templates: AgentTemplate[] = [
    {
      id: 'template_product_manager',
      name: 'Product Manager',
      role: 'product_manager',
      description: 'Break down requirements into plans, scope, and acceptance rules.',
      defaultPrompt: 'Act as a product manager agent and produce structured planning outputs.',
      defaultTaskTypes: ['planning', 'requirement_breakdown', 'acceptance_definition']
    },
    {
      id: 'template_designer',
      name: 'Designer',
      role: 'designer',
      description: 'Produce interaction guidance and design handoff artifacts.',
      defaultPrompt: 'Act as a designer agent and create concise design handoff artifacts.',
      defaultTaskTypes: ['design_handoff', 'information_architecture', 'interaction_design']
    },
    {
      id: 'template_developer',
      name: 'Developer',
      role: 'developer',
      description: 'Translate approved scope into technical implementation work.',
      defaultPrompt: 'Act as a developer agent and prepare implementation-ready outputs.',
      defaultTaskTypes: ['implementation', 'api_design', 'code_changes']
    },
    {
      id: 'template_tester',
      name: 'Tester',
      role: 'tester',
      description: 'Define validation strategy and test coverage.',
      defaultPrompt: 'Act as a test agent and produce test plans, cases, and reports.',
      defaultTaskTypes: ['test_cases', 'validation', 'regression']
    },
    {
      id: 'template_release_manager',
      name: 'Release Manager',
      role: 'release_manager',
      description: 'Prepare release configuration and launch readiness checks.',
      defaultPrompt: 'Act as a release configuration agent and prepare release readiness outputs.',
      defaultTaskTypes: ['release_prep', 'environment_check', 'deployment_notes']
    }
  ];

  constructor(
    private readonly providersService: ProvidersService,
    private readonly databaseService: DatabaseService
  ) {}

  listTemplates() {
    return this.templates;
  }

  listInstances() {
    return this.databaseService.connection
      .prepare(
        `
          SELECT id, template_id, name, provider_id, system_prompt, task_types_json, is_enabled, created_at, updated_at
          FROM agent_instances
          ORDER BY pk ASC
        `
      )
      .all()
      .map(mapAgentRow);
  }

  findEnabledByRole(role: AgentTemplate['role']) {
    return this.listInstances().find((agent) => {
      if (!agent.isEnabled) {
        return false;
      }

      const template = this.templates.find((item) => item.id === agent.templateId);
      return template?.role === role;
    });
  }

  create(input: CreateAgentInput) {
    const template = this.templates.find((item) => item.id === input.templateId);
    if (!template) {
      throw new BadRequestException('templateId is invalid');
    }

    if (!input.name?.trim()) {
      throw new BadRequestException('name is required');
    }

    if (!input.providerId?.trim()) {
      throw new BadRequestException('providerId is required');
    }

    ensureProviderExists(this.providersService, input.providerId);

    const now = new Date().toISOString();
    const result = this.databaseService.connection
      .prepare(
        `
          INSERT INTO agent_instances (
            template_id, name, provider_id, system_prompt, task_types_json, is_enabled, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(
        template.id,
        input.name.trim(),
        input.providerId,
        input.systemPrompt?.trim() || template.defaultPrompt,
        JSON.stringify(normalizeTaskTypes(input.taskTypes, template.defaultTaskTypes)),
        input.isEnabled ?? true ? 1 : 0,
        now,
        now
      );
    const id = `agent_${result.lastInsertRowid}`;
    this.databaseService.connection
      .prepare('UPDATE agent_instances SET id = ? WHERE pk = ?')
      .run(id, result.lastInsertRowid);
    return this.getById(id);
  }

  update(id: string, input: UpdateAgentInput) {
    const agent = this.getById(id);

    if (input.templateId !== undefined) {
      const template = this.templates.find((item) => item.id === input.templateId);
      if (!template) {
        throw new BadRequestException('templateId is invalid');
      }
      agent.templateId = template.id;
    }

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new BadRequestException('name is required');
      }
      agent.name = input.name.trim();
    }

    if (input.providerId !== undefined) {
      ensureProviderExists(this.providersService, input.providerId);
      agent.providerId = input.providerId;
    }

    if (input.systemPrompt !== undefined) {
      agent.systemPrompt = input.systemPrompt.trim();
    }

    if (input.taskTypes !== undefined) {
      agent.taskTypes = normalizeTaskTypes(input.taskTypes, []);
    }

    if (input.isEnabled !== undefined) {
      agent.isEnabled = input.isEnabled;
    }

    agent.updatedAt = new Date().toISOString();
    this.databaseService.connection
      .prepare(
        `
          UPDATE agent_instances
          SET template_id = ?, name = ?, provider_id = ?, system_prompt = ?, task_types_json = ?, is_enabled = ?, updated_at = ?
          WHERE id = ?
        `
      )
      .run(
        agent.templateId,
        agent.name,
        agent.providerId,
        agent.systemPrompt,
        JSON.stringify(agent.taskTypes),
        agent.isEnabled ? 1 : 0,
        agent.updatedAt,
        id
      );
    return this.getById(id);
  }

  remove(id: string) {
    const removed = this.getById(id);
    this.databaseService.connection.prepare('DELETE FROM agent_instances WHERE id = ?').run(id);
    return removed;
  }

  private getById(id: string) {
    const agent = this.databaseService.connection
      .prepare(
        `
          SELECT id, template_id, name, provider_id, system_prompt, task_types_json, is_enabled, created_at, updated_at
          FROM agent_instances
          WHERE id = ?
        `
      )
      .get(id);
    if (!agent) {
      throw new NotFoundException('agent not found');
    }

    return mapAgentRow(agent);
  }
}

function normalizeTaskTypes(taskTypes: string[] | undefined, fallback: string[]) {
  if (!taskTypes || taskTypes.length === 0) {
    return [...fallback];
  }

  return taskTypes.map((item) => item.trim()).filter(Boolean);
}

function ensureProviderExists(providersService: ProvidersService, providerId: string) {
  try {
    providersService.getById(providerId);
  } catch {
    throw new BadRequestException('provider not found');
  }
}

function mapAgentRow(row: Record<string, unknown>): AgentInstance {
  return {
    id: String(row.id),
    templateId: String(row.template_id),
    name: String(row.name),
    providerId: String(row.provider_id),
    systemPrompt: String(row.system_prompt),
    taskTypes: JSON.parse(String(row.task_types_json)) as string[],
    isEnabled: Boolean(row.is_enabled),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}
