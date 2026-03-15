# 开发文档

## 目标

本轮要解决当前后端所有核心数据仅存在内存中的问题。设计目标是：

- 本地单机可直接启动
- 不依赖额外数据库服务
- 重启后数据不丢
- 领域接口不发生大改

## 技术方案

- 数据库：SQLite
- 访问方式：Node.js 内置 `node:sqlite`
- 数据文件：`apps/api/data/ultimate-team.db`
- 启动策略：后端启动时自动执行建表和默认工作区初始化

## 设计说明

### 1. 为什么先用 SQLite

- 当前环境没有现成 PostgreSQL
- MVP 仍是单用户优先
- SQLite 能最快把“真实持久化”落地
- 后续仍可迁移到 PostgreSQL

### 2. 为什么不一次性完全范式化

当前计划、编排运行等对象存在明显的嵌套结构。为控制本轮复杂度：

- RequirementVersion 保持独立表
- IterationPlan 的 `iterations`
- OrchestrationRun 的 `stages` / `tasks` / `handoffs`

上述复杂字段先以 JSON 形式存储在数据库中，优先保证持久化和接口稳定。

### 3. 默认数据

- 如果数据库为空，自动创建默认工作区 `ws_1`
- AgentTemplate 继续保持内置静态模板，不单独落库

## 涉及模块

- `DatabaseModule`
- `DatabaseService`
- `WorkspacesService`
- `ProvidersService`
- `RequirementsService`
- `IterationPlansService`
- `AgentsService`
- `OrchestrationRunsService`

## 风险与后续

- `node:sqlite` 仍带实验性告警，但适合当前单机 MVP
- 后续若引入 PostgreSQL，需要补迁移脚本和仓储层抽象
- Artifact 后续可视情况独立落表
