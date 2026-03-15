# 迭代 2 开发文档

## 1. 背景与目标

本轮是产品主线的第一轮业务能力实现。平台需要证明自己不只是一个配置中心，而是真的可以把需求转化为结构化迭代计划。

目标闭环如下：

1. 用户录入需求
2. 平台保存需求当前版本
3. 用户修改需求并追加版本
4. 平台基于最新版本生成迭代计划草稿
5. 用户确认某个草稿为正式计划

## 2. 本轮模块范围

- `requirements` 模块
- `iteration-plans` 模块
- 前端需求中心页面
- 前端迭代计划页面

## 3. 用户流程

1. 用户进入需求中心。
2. 新建需求，填写标题、业务目标、约束、验收标准和正文。
3. 用户可对已有需求创建新版本。
4. 用户点击“生成迭代计划”。
5. 平台返回结构化草稿，包含多轮迭代和每轮工作包。
6. 用户确认草稿为正式计划。
7. 正式计划冻结为 `confirmed`，其他草稿保留历史记录。

## 4. 数据模型

### Requirement

- `id`
- `projectId`
- `title`
- `summary`
- `goal`
- `constraints`
- `acceptanceCriteria`
- `currentVersionId`
- `status`
- `createdAt`
- `updatedAt`

### RequirementVersion

- `id`
- `requirementId`
- `version`
- `content`
- `createdAt`

### IterationPlan

- `id`
- `requirementId`
- `sourceVersionId`
- `status`，枚举：`draft`、`confirmed`
- `title`
- `summary`
- `iterations`
- `createdAt`
- `updatedAt`

### Iteration

本轮作为计划中的嵌套对象处理，不单独落库到独立模块：

- `id`
- `title`
- `goal`
- `scope`
- `risks`
- `workPackages`

### WorkPackage

- `id`
- `role`
- `title`
- `description`

## 5. 计划生成策略

本轮不接真实 Agent，也不调 Provider。计划生成采用本地规则模拟，目标是先跑通产品链路。

生成逻辑：

1. 基于需求标题、目标、约束和验收标准生成计划摘要
2. 固定输出 3 轮计划：
   - Iteration 1: foundation
   - Iteration 2: feature delivery
   - Iteration 3: validation and release prep
3. 每轮自动生成 5 个角色工作包：
   - 产品经理
   - 设计师
   - 开发
   - 测试
   - 发布配置

这样做的原因：

- 能尽快验证核心流程
- 后续替换为真实产品经理 Agent 时接口不需要大改

## 6. 技术实现方案

### 后端

- 延续迭代 1 的内存存储方式
- 新增模块：
  - `requirements`
  - `iteration-plans`
- 生成逻辑放在 `IterationPlansService`
- 由 `RequirementsService` 管理需求和版本主数据

### 前端

- 将首页扩展为多区块工作台
- 新增需求创建表单
- 新增需求列表和版本查看
- 新增计划草稿生成操作
- 新增计划确认操作

## 7. 风险点

- 内存存储不具备持久化，重启后数据会丢失
- 计划生成逻辑是规则化模拟，不代表真实 Agent 能力
- 前端页面在一个页面中承载多个区块，信息密度较高

## 8. 回滚方案

如果计划生成逻辑过于复杂，可先只生成单个草稿摘要和一轮计划，再在后续迭代扩展。
