import { Injectable, NotFoundException } from '@nestjs/common';

import { AgentRole } from '../agents/agent.types';
import { OrchestrationRunsService } from '../orchestration-runs/orchestration-runs.service';
import { RunStage } from '../orchestration-runs/orchestration-run.types';
import { Artifact, ArtifactCategory, BuildRecord, TestReport } from './artifact.types';

@Injectable()
export class ArtifactsService {
  constructor(private readonly orchestrationRunsService: OrchestrationRunsService) {}

  list(runId?: string, iterationId?: string) {
    const artifacts = this.buildArtifacts();
    return artifacts.filter((artifact) => {
      if (runId && artifact.runId !== runId) {
        return false;
      }

      if (iterationId && artifact.iterationId !== iterationId) {
        return false;
      }

      return true;
    });
  }

  getById(id: string) {
    const artifact = this.buildArtifacts().find((item) => item.id === id);
    if (!artifact) {
      throw new NotFoundException('artifact not found');
    }

    return artifact;
  }

  listByRun(runId: string) {
    const run = this.orchestrationRunsService.getById(runId);
    return this.list(run.id);
  }

  listByIteration(iterationId: string) {
    const artifacts = this.list(undefined, iterationId);
    if (artifacts.length === 0) {
      throw new NotFoundException('artifacts not found for iteration');
    }

    return artifacts;
  }

  listTestReports(runId?: string, iterationId?: string) {
    const artifacts = this.list(runId, iterationId).filter((artifact) => artifact.category === 'test_report_doc');

    return artifacts.map((artifact, index) => ({
      id: `test_report_${index + 1}`,
      runId: artifact.runId,
      iterationId: artifact.iterationId,
      artifactId: artifact.id,
      status: 'passed',
      totalCases: 12,
      passedCases: 12,
      failedCases: 0,
      summary: `Regression validation passed for ${artifact.title}.`
    })) satisfies TestReport[];
  }

  listBuildRecords(runId?: string, iterationId?: string) {
    const artifacts = this.list(runId, iterationId).filter((artifact) => artifact.category === 'release_doc');

    return artifacts.map((artifact, index) => ({
      id: `build_record_${index + 1}`,
      runId: artifact.runId,
      iterationId: artifact.iterationId,
      artifactId: artifact.id,
      status: 'ready',
      environment: 'staging',
      commitReference: `${artifact.runId}-release`,
      summary: `Release checklist prepared for ${artifact.title}.`
    })) satisfies BuildRecord[];
  }

  private buildArtifacts() {
    const runs = this.orchestrationRunsService.list();
    const artifacts: Artifact[] = [];

    runs.forEach((run) => {
      run.stages
        .filter((stage) => stage.status === 'completed')
        .forEach((stage) => {
          const templates = artifactTemplatesByRole[stage.role];
          const baseTimestamp = stage.completedAt ?? run.updatedAt;

          templates.forEach((template, index) => {
            artifacts.push({
              id: `${stage.id}_artifact_${index + 1}`,
              runId: run.id,
              iterationId: run.iterationId,
              stageId: stage.id,
              agentId: stage.agentId,
              category: template.category,
              title: `${template.title} for ${run.iterationTitle}`,
              summary: `${stage.agentName} completed ${template.summary} during ${run.iterationTitle}.`,
              content: buildArtifactContent(run.iterationTitle, stage, template.category),
              createdAt: baseTimestamp,
              updatedAt: baseTimestamp
            });
          });
        });
    });

    return artifacts;
  }
}

const artifactTemplatesByRole: Record<
  AgentRole,
  Array<{ category: ArtifactCategory; title: string; summary: string }>
> = {
  product_manager: [
    {
      category: 'iteration_overview',
      title: 'Iteration overview',
      summary: 'iteration scoping and acceptance alignment'
    }
  ],
  designer: [
    {
      category: 'design_handoff',
      title: 'Design handoff',
      summary: 'design guidance handoff'
    }
  ],
  developer: [
    {
      category: 'development_doc',
      title: 'Development document',
      summary: 'implementation design documentation'
    },
    {
      category: 'api_doc',
      title: 'API document',
      summary: 'API contract delivery'
    }
  ],
  tester: [
    {
      category: 'test_cases',
      title: 'Test cases',
      summary: 'test case generation'
    },
    {
      category: 'test_report_doc',
      title: 'Test report',
      summary: 'test execution reporting'
    }
  ],
  release_manager: [
    {
      category: 'release_doc',
      title: 'Release preparation',
      summary: 'release readiness package'
    }
  ]
};

function buildArtifactContent(iterationTitle: string, stage: RunStage, category: ArtifactCategory) {
  return [
    `Artifact category: ${category}`,
    `Iteration: ${iterationTitle}`,
    `Stage: ${stage.title}`,
    `Agent: ${stage.agentName}`,
    `Summary: completed by ${stage.agentName} with structured handoff output.`
  ].join('\n');
}
