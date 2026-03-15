# 迭代 2 接口文档

## 1. 接口列表

### 需求

- `GET /requirements`
- `POST /requirements`
- `PATCH /requirements/:id`
- `GET /requirements/:id/versions`
- `POST /requirements/:id/versions`

### 迭代计划

- `GET /iteration-plans`
- `GET /iteration-plans/:id`
- `POST /requirements/:id/generate-plan`
- `POST /iteration-plans/:id/confirm`

## 2. 接口定义

### `GET /requirements`

返回需求列表。

### `POST /requirements`

创建需求，并自动生成版本 `1`。

请求体：

```json
{
  "projectId": "project_demo",
  "title": "Agent 编排平台 MVP",
  "summary": "需要支持需求拆解和多角色 agent 协作",
  "goal": "从需求生成迭代计划",
  "constraints": "首版只做单用户",
  "acceptanceCriteria": "可以确认正式计划",
  "content": "详细需求正文"
}
```

### `PATCH /requirements/:id`

更新需求元数据，不创建版本。

### `GET /requirements/:id/versions`

返回某个需求的版本列表。

### `POST /requirements/:id/versions`

为需求追加新版本，并将其设为当前版本。

请求体：

```json
{
  "content": "更新后的需求正文"
}
```

### `GET /iteration-plans`

返回所有计划列表。

### `GET /iteration-plans/:id`

返回某个计划详情。

### `POST /requirements/:id/generate-plan`

基于需求当前版本生成计划草稿。

响应中包含：

- 计划基本信息
- 计划摘要
- 3 轮迭代
- 每轮角色工作包

### `POST /iteration-plans/:id/confirm`

将某个草稿计划确认成正式计划。

约束：

- 同一需求只能有一个 `confirmed` 计划
- 被确认的计划状态置为 `confirmed`

## 3. 错误处理

通用错误结构：

```json
{
  "message": "requirement not found"
}
```

## 4. 访问约束

首版为单用户模式，默认当前登录用户拥有全部访问权限。
