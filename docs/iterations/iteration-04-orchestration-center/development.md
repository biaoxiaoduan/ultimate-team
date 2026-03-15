# 迭代 4 开发文档

## 1. 背景与目标

前两轮已经具备以下能力：

- 从需求生成并确认迭代计划
- 管理多个角色 Agent

当前缺口是系统还不能真正驱动一轮迭代执行。用户只能看到计划和 Agent 列表，不能让角色按顺序协同工作。

本轮目标是补上最小可用的编排中心，让用户可以基于确认计划创建一次运行实例，并通过固定状态机驱动阶段推进。

## 2. 用户流程

### 2.1 创建运行

1. 用户在编排中心选择一个已确认计划。
2. 用户选择该计划下的一轮迭代。
3. 系统校验五个角色是否存在可用 Agent。
4. 系统创建 `OrchestrationRun`，并预生成五个阶段。

### 2.2 推进阶段

1. 用户启动运行。
2. 当前阶段进入 `running`。
3. 用户点击执行当前阶段，系统生成阶段任务输出与交接件。
4. 阶段进入 `waiting_confirmation`。
5. 用户确认后，系统将该阶段标记为 `completed`，并激活下一阶段。

### 2.3 失败与恢复

1. 运行中的阶段可被标记为失败。
2. 失败阶段会阻断后续阶段。
3. 用户可对失败阶段执行重试。
4. 运行整体可暂停与继续。

## 3. 页面范围

本轮前端增加一个新的主视图区块 `Orchestration center`，包含：

- 创建运行表单
- 运行列表
- 当前运行摘要
- 阶段时间线
- 当前阶段操作区
- 交接件列表

页面仍保持单页应用，不拆独立路由。

## 4. 数据模型

### 4.1 `OrchestrationRun`

- `id`
- `planId`
- `requirementId`
- `iterationId`
- `iterationTitle`
- `status`: `draft | running | paused | failed | completed`
- `currentStageId`
- `startedAt`
- `completedAt`
- `lastError`
- `createdAt`
- `updatedAt`

### 4.2 `RunStage`

- `id`
- `runId`
- `role`
- `title`
- `agentId`
- `agentName`
- `status`: `pending | ready | running | waiting_confirmation | completed | failed`
- `sequence`
- `startedAt`
- `completedAt`
- `failureReason`

### 4.3 `AgentTask`

- `id`
- `runId`
- `stageId`
- `agentId`
- `taskType`
- `prompt`
- `inputSummary`
- `outputSummary`
- `status`: `pending | completed | failed`
- `createdAt`
- `updatedAt`

### 4.4 `Handoff`

- `id`
- `runId`
- `fromStageId`
- `toStageId`
- `fromRole`
- `toRole`
- `title`
- `summary`
- `status`: `pending | delivered`
- `createdAt`
- `deliveredAt`

## 5. 状态流转规则

### 5.1 运行状态

- 新建运行默认 `draft`
- 启动后变为 `running`
- 暂停后变为 `paused`
- 任一阶段失败时运行变为 `failed`
- 最后阶段完成后运行变为 `completed`

### 5.2 阶段状态

- 新建时首阶段为 `ready`，其余为 `pending`
- 启动执行时：`ready -> running`
- 执行成功后：`running -> waiting_confirmation`
- 人工确认后：`waiting_confirmation -> completed`
- 失败标记：`running | waiting_confirmation -> failed`
- 重试后：`failed -> ready`

### 5.3 人工确认规则

- 所有阶段都要求人工确认后才能进入下一阶段
- 未确认前不得自动推进
- 只有当前阶段可以被确认或标记失败

## 6. 关键实现方案

### 6.1 后端

- 新增 `orchestration-runs` 模块
- 服务层依赖 `IterationPlansService` 与 `AgentsService`
- 创建运行时根据计划 iteration 的 work package 角色查找可用 Agent
- 当前阶段执行时生成模拟 `AgentTask` 和 `Handoff`
- 所有数据先以内存存储，保持和前两轮一致

### 6.2 前端

- 在现有 `App.tsx` 中增加编排状态管理
- 读取 `/orchestration-runs`、`/iteration-plans`、`/agents/instances`
- 提供运行创建与阶段操作按钮
- 展示当前阶段、交接件与失败信息

## 7. 风险点

- 当前数据为内存存储，服务重启后运行记录会丢失
- 同一角色存在多个 Agent 时，当前版本默认选首个启用 Agent
- 阶段执行仍是模拟输出，不代表真实 Provider 调用质量

## 8. 回滚方案

如果本轮编排逻辑出现严重问题，可通过移除 `orchestration-runs` 模块并隐藏前端区块回退到仅计划和 Agent 管理状态，不影响前两轮核心数据结构。
