# 迭代 3 开发文档

## 1. 背景与目标

平台已经有了需求和计划，但还没有“谁来执行”的对象模型。本轮要把 Agent 角色从概念变成系统里的真实配置对象。

## 2. 本轮模块范围

- `agents` 模块
- 内置 Agent 模板
- Agent 实例管理
- 前端 Agent Center

## 3. 用户流程

1. 用户进入 Agent Center。
2. 查看系统内置的 5 个角色模板。
3. 基于模板创建 Agent 实例。
4. 为 Agent 选择 Provider。
5. 配置系统提示词和任务类型。
6. 可对 Agent 执行编辑、停用、启用和删除。

## 4. 数据模型

### AgentTemplate

- `id`
- `name`
- `role`
- `description`
- `defaultPrompt`
- `defaultTaskTypes`

### AgentInstance

- `id`
- `templateId`
- `name`
- `providerId`
- `systemPrompt`
- `taskTypes`
- `isEnabled`
- `createdAt`
- `updatedAt`

## 5. 设计策略

### 内置模板

本轮先内置 5 个模板：

- 产品经理
- 设计师
- 开发
- 测试
- 发布配置

原因：

- 保证产品主线与方案一致
- 避免用户在 MVP 阶段从零定义角色

### 实例优先于模板

模板只提供默认值，真实运行和后续编排都依赖 Agent 实例，因此前端页面重点是 Agent 实例管理。

## 6. 技术实现方案

### 后端

- 新增 `agents` 模块
- 在 Service 内内置模板列表
- Agent 实例采用内存存储
- 创建和更新时校验 `providerId` 是否存在

### 前端

- 在现有页面中新增 Agent Center 区块
- 左侧显示模板卡片
- 右侧使用表单创建或编辑 Agent 实例
- 下方显示实例列表和快捷操作

## 7. 风险点

- 当前仍是内存存储，Agent 配置重启后丢失
- Provider 仅做存在性校验，不校验真实可用性
- 页面信息会继续增加，需要控制可读性

## 8. 回滚方案

如果 Agent 编辑态过于复杂，可退回到“创建 + 启停 + 删除”最小闭环，但优先保留编辑能力。
