# 迭代 3 接口文档

## 1. 接口列表

### Agent 模板

- `GET /agents/templates`

### Agent 实例

- `GET /agents/instances`
- `POST /agents/instances`
- `PATCH /agents/instances/:id`
- `DELETE /agents/instances/:id`

## 2. 接口定义

### `GET /agents/templates`

返回系统内置角色模板列表。

### `GET /agents/instances`

返回当前所有 Agent 实例。

### `POST /agents/instances`

创建 Agent 实例。

请求体：

```json
{
  "templateId": "template_product_manager",
  "name": "PM Agent Alpha",
  "providerId": "provider_1",
  "systemPrompt": "Act as product manager agent",
  "taskTypes": ["planning", "acceptance"],
  "isEnabled": true
}
```

### `PATCH /agents/instances/:id`

更新 Agent 实例。

可更新字段：

- `name`
- `providerId`
- `systemPrompt`
- `taskTypes`
- `isEnabled`

### `DELETE /agents/instances/:id`

删除 Agent 实例。

## 3. 错误处理

通用错误结构：

```json
{
  "message": "provider not found"
}
```

## 4. 访问约束

首版为单用户模式，默认当前登录用户拥有全部访问权限。
