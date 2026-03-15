import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

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

  private readonly agents: AgentInstance[] = [];

  constructor(private readonly providersService: ProvidersService) {}

  listTemplates() {
    return this.templates;
  }

  listInstances() {
    return this.agents;
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
    const agent: AgentInstance = {
      id: `agent_${this.agents.length + 1}`,
      templateId: template.id,
      name: input.name.trim(),
      providerId: input.providerId,
      systemPrompt: input.systemPrompt?.trim() || template.defaultPrompt,
      taskTypes: normalizeTaskTypes(input.taskTypes, template.defaultTaskTypes),
      isEnabled: input.isEnabled ?? true,
      createdAt: now,
      updatedAt: now
    };

    this.agents.push(agent);
    return agent;
  }

  update(id: string, input: UpdateAgentInput) {
    const agent = this.agents.find((item) => item.id === id);
    if (!agent) {
      throw new NotFoundException('agent not found');
    }

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
    return agent;
  }

  remove(id: string) {
    const index = this.agents.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException('agent not found');
    }

    const [removed] = this.agents.splice(index, 1);
    return removed;
  }
}

function normalizeTaskTypes(taskTypes: string[] | undefined, fallback: string[]) {
  if (!taskTypes || taskTypes.length === 0) {
    return [...fallback];
  }

  return taskTypes.map((item) => item.trim()).filter(Boolean);
}

function ensureProviderExists(providersService: ProvidersService, providerId: string) {
  const provider = providersService.list().find((item) => item.id === providerId);
  if (!provider) {
    throw new BadRequestException('provider not found');
  }
}
