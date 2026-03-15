# 迭代 5 开发文档

## 1. 背景与目标

当前系统已经能完成：

- 需求录入与计划确认
- Agent 创建和配置
- 基于确认计划创建 Run，并推进阶段

但仍有两个明显缺口：

1. 用户无法在系统中查看完整的交付物闭环。
2. 前端仍是单页平铺结构，不符合新的流程型产品设计。

因此本轮目标是同时补齐交付物中心和页面流程架构。

## 2. 用户流程

### 2.1 全局流程

1. 用户进入工作台。
2. 点击项目卡片进入项目概览。
3. 从项目概览进入需求中心、计划工坊、Agent 中心、Run 中心或交付物中心。
4. 在各页面完成对应阶段任务，并通过页面内“下一步”入口继续。

### 2.2 交付物流程

1. 用户在 Run 详情页推进阶段。
2. 某阶段完成后，系统生成或暴露对应 Artifact。
3. 当测试阶段完成后，系统可查看 TestReport。
4. 当发布阶段完成后，系统可查看 BuildRecord。
5. 用户点击“查看交付物”进入交付物中心或某个 Artifact 详情页。

## 3. 页面范围

本轮前端拆成以下页面：

- `/` 工作台
- `/project/overview`
- `/project/requirements`
- `/project/requirements/:id`
- `/project/plans/:id`
- `/project/agents`
- `/project/runs`
- `/project/runs/:id`
- `/project/artifacts`
- `/project/artifacts/:id`

使用弹窗的动作：

- 新建需求
- 新建 Agent
- 新建 Run
- 阶段失败原因录入

## 4. 数据模型

### 4.1 `Artifact`

- `id`
- `runId`
- `iterationId`
- `stageId`
- `agentId`
- `category`
- `title`
- `summary`
- `content`
- `createdAt`
- `updatedAt`

### 4.2 `TestReport`

- `id`
- `runId`
- `iterationId`
- `artifactId`
- `status`
- `totalCases`
- `passedCases`
- `failedCases`
- `summary`

### 4.3 `BuildRecord`

- `id`
- `runId`
- `iterationId`
- `artifactId`
- `status`
- `environment`
- `commitReference`
- `summary`

## 5. 关键实现方案

### 5.1 后端

- 新增 `artifacts` 模块
- 服务层依赖 `OrchestrationRunsService`
- 基于已完成阶段动态生成 Artifact 列表
- 对测试阶段动态生成 `TestReport`
- 对发布阶段动态生成 `BuildRecord`
- 保持与前几轮一致，先使用内存推导而非数据库落库

### 5.2 前端

- 引入轻量级路径状态管理，不额外依赖路由库
- 使用页面组件拆分 `App.tsx`
- 增加全局导航和项目内二级导航
- 通过页面跳转代替大部分内联区块切换
- 使用弹窗承载轻量创建与失败录入

## 6. 风险点

- 当前路由为轻量实现，复杂嵌套路由后续可能仍需专业路由库
- 交付物目前是推导生成，不是持久化数据
- 页面重构会影响现有前端测试，需要同步重写

## 7. 回滚方案

若流程型改造引起严重问题，可保留后端 Artifact 接口不动，仅回退前端页面导航到单页版本；但默认不建议这么做，因为会再次偏离产品方案。
