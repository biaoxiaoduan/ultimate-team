# 接口文档

本轮未新增外部 API 资源，重点是把已有接口切换到真实数据库持久化。

## 配置

- 环境变量：`ULTIMATE_TEAM_DB_PATH`
- 默认值：`apps/api/data/ultimate-team.db`

## 持久化生效的接口

### Workspaces

- `GET /workspaces`
- `POST /workspaces`
- `PATCH /workspaces/:id/default`

### Providers

- `GET /providers`
- `POST /providers`
- `PATCH /providers/:id`

### Requirements

- `GET /requirements`
- `GET /requirements/:id`
- `POST /requirements`
- `PATCH /requirements/:id`
- `GET /requirements/:id/versions`
- `POST /requirements/:id/versions`

### Iteration Plans

- `GET /iteration-plans`
- `GET /iteration-plans/:id`
- `POST /iteration-plans/generate/:requirementId`
- `PATCH /iteration-plans/:id/confirm`

### Agents

- `GET /agents/templates`
- `GET /agents/instances`
- `POST /agents/instances`
- `PATCH /agents/instances/:id`
- `DELETE /agents/instances/:id`

### Orchestration Runs

- `GET /runs`
- `GET /runs/:id`
- `POST /runs`
- `PATCH /runs/:id/start`
- `PATCH /runs/:id/pause`
- `PATCH /runs/:id/resume`
- `PATCH /runs/:id/stages/:stageId/execute`
- `PATCH /runs/:id/stages/:stageId/confirm`
- `PATCH /runs/:id/stages/:stageId/fail`
- `PATCH /runs/:id/stages/:stageId/retry`

## 数据兼容性说明

- 接口响应结构保持不变
- `Artifact` 相关接口仍由已持久化的 Run 数据动态派生
