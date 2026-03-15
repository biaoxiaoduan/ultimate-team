# 迭代 4 接口文档

## 1. 接口列表

本轮新增接口：

1. `GET /orchestration-runs`
2. `GET /orchestration-runs/:id`
3. `POST /orchestration-runs`
4. `POST /orchestration-runs/:id/start`
5. `POST /orchestration-runs/:id/stages/:stageId/execute`
6. `POST /orchestration-runs/:id/stages/:stageId/confirm`
7. `POST /orchestration-runs/:id/stages/:stageId/fail`
8. `POST /orchestration-runs/:id/stages/:stageId/retry`
9. `POST /orchestration-runs/:id/pause`
10. `POST /orchestration-runs/:id/resume`

## 2. 数据约束

- 仅允许基于 `confirmed` 状态的计划创建运行
- 创建运行时必须传入计划内存在的 `iterationId`
- 计划中的每个角色必须能匹配到一个启用 Agent
- 只有当前阶段允许执行、确认、失败和重试操作

## 3. 创建运行

### `POST /orchestration-runs`

请求体：

```json
{
  "planId": "plan_1",
  "iterationId": "iter_1"
}
```

响应：

```json
{
  "id": "run_1",
  "planId": "plan_1",
  "requirementId": "req_1",
  "iterationId": "iter_1",
  "iterationTitle": "Iteration 1: foundation alignment",
  "status": "draft",
  "currentStageId": "run_1_stage_1",
  "stages": [],
  "tasks": [],
  "handoffs": []
}
```

异常场景：

- `400`: 计划未确认
- `400`: iteration 不存在
- `400`: 某个角色没有启用 Agent
- `404`: 计划不存在

## 4. 启动运行

### `POST /orchestration-runs/:id/start`

响应：

- 运行状态变为 `running`
- 当前阶段状态从 `ready` 进入 `running`

## 5. 执行当前阶段

### `POST /orchestration-runs/:id/stages/:stageId/execute`

请求体：无

响应结果包含：

- 更新后的 `run`
- 新生成的 `task`
- 如果存在下一阶段，则返回一条新的 `handoff`

执行后：

- 当前阶段状态变为 `waiting_confirmation`
- 当前任务状态为 `completed`

## 6. 确认当前阶段

### `POST /orchestration-runs/:id/stages/:stageId/confirm`

行为：

- 当前阶段变为 `completed`
- 若存在下一阶段，则下一阶段变为 `ready`
- 若不存在下一阶段，则运行变为 `completed`

## 7. 标记失败

### `POST /orchestration-runs/:id/stages/:stageId/fail`

请求体：

```json
{
  "reason": "Design handoff missing key fields"
}
```

行为：

- 阶段状态变为 `failed`
- 运行状态变为 `failed`
- 记录 `failureReason` 与 `lastError`

## 8. 重试阶段

### `POST /orchestration-runs/:id/stages/:stageId/retry`

行为：

- 失败阶段恢复为 `ready`
- 运行状态恢复为 `running`
- 清除阶段失败原因和运行错误

## 9. 暂停与继续

### `POST /orchestration-runs/:id/pause`

- 运行状态从 `running` 变为 `paused`

### `POST /orchestration-runs/:id/resume`

- 运行状态从 `paused | failed` 恢复为 `running`
- 如果当前阶段是 `ready`，用户可以继续执行
- 如果当前阶段是 `failed`，需先调用重试接口

## 10. 返回结构说明

### `OrchestrationRun`

```json
{
  "id": "run_1",
  "planId": "plan_1",
  "requirementId": "req_1",
  "iterationId": "iter_1",
  "iterationTitle": "Iteration 1: foundation alignment",
  "status": "running",
  "currentStageId": "run_1_stage_2",
  "lastError": null,
  "stages": [],
  "tasks": [],
  "handoffs": []
}
```

### `RunStage`

```json
{
  "id": "run_1_stage_1",
  "runId": "run_1",
  "role": "product_manager",
  "title": "Refine requirement and acceptance",
  "agentId": "agent_1",
  "agentName": "PM Agent Alpha",
  "status": "completed",
  "sequence": 1
}
```

### `Handoff`

```json
{
  "id": "handoff_1",
  "runId": "run_1",
  "fromStageId": "run_1_stage_1",
  "toStageId": "run_1_stage_2",
  "fromRole": "product_manager",
  "toRole": "designer",
  "title": "product_manager -> designer handoff",
  "summary": "Structured output passed to next role",
  "status": "delivered"
}
```
