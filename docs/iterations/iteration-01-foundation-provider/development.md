# 迭代 1 开发文档

## 1. 背景与目标

当前仓库只有产品和流程文档，没有任何可运行代码。本轮目标是建立后续所有迭代共享的工程底座，并优先落地 Provider 配置能力，因为后续 Agent 执行必须依赖 Provider 抽象。

## 2. 本轮模块范围

本轮实现以下模块：

- 根工作区与脚本管理
- `apps/api` 后端基础服务
- `apps/web` 前端基础应用
- 系统设置模块
- 工作区模块
- Provider 配置模块

## 3. 用户流程

1. 用户打开平台首页。
2. 查看系统状态和 API 健康状态。
3. 进入设置页面配置默认工作区。
4. 新增或编辑 Codex / Claude Code Provider 配置。
5. 查看已有 Provider 配置列表和状态。

## 4. 数据模型

### User

首版只保留最小结构：

- `id`
- `name`
- `email`
- `createdAt`
- `updatedAt`

### Workspace

- `id`
- `name`
- `rootPath`
- `description`
- `isDefault`
- `createdAt`
- `updatedAt`

### ProviderConfig

- `id`
- `name`
- `providerType`，枚举：`codex`、`claude_code`
- `endpoint`
- `model`
- `apiKeyMasked`
- `isEnabled`
- `workspaceId`
- `createdAt`
- `updatedAt`

## 5. 技术实现方案

### 后端

- 使用 NestJS 作为 API 框架
- 迭代 1 不接真实数据库，先使用内存存储服务保证接口跑通
- 模块划分：
  - `health`
  - `workspaces`
  - `providers`
  - `system`

选择内存存储的原因：

- 更快完成工程底座
- 避免在第一轮把时间耗在数据库集成细节
- 第二轮开始可以平滑切到 PostgreSQL

### 前端

- 使用 React + Vite + TypeScript
- 使用最小页面结构，不引入重型 UI 框架
- 页面包含：
  - Dashboard
  - Workspace Settings
  - Provider Settings

### 测试

- 后端：Vitest + Supertest
- 前端：Vitest + Testing Library
- 根目录统一执行 `test` 和 `typecheck`

## 6. 风险点

- 网络受限可能影响依赖安装
- 如果 NestJS 初始化过重，可能拖慢首轮推进
- 没有数据库会限制后续数据迁移设计

## 7. 回滚方案

如果本轮在 NestJS 上投入过高，可以退回到更轻量的 HTTP 服务骨架，但优先尝试保持 NestJS 方案。
