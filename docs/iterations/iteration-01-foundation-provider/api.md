# 迭代 1 接口文档

## 1. 接口列表

### 健康检查

- `GET /health`

### 工作区

- `GET /workspaces`
- `POST /workspaces`
- `PATCH /workspaces/:id/default`

### Provider 配置

- `GET /providers`
- `POST /providers`
- `PATCH /providers/:id`

## 2. 接口定义

### `GET /health`

返回系统基础状态。

响应示例：

```json
{
  "status": "ok"
}
```

### `GET /workspaces`

返回工作区列表。

响应示例：

```json
[
  {
    "id": "ws_1",
    "name": "Local Workspace",
    "rootPath": "/tmp/project",
    "description": "default workspace",
    "isDefault": true
  }
]
```

### `POST /workspaces`

创建工作区。

请求体：

```json
{
  "name": "Main Workspace",
  "rootPath": "/Users/example/project",
  "description": "main workspace"
}
```

### `PATCH /workspaces/:id/default`

将某个工作区设为默认工作区。

### `GET /providers`

获取 Provider 配置列表。

### `POST /providers`

创建 Provider 配置。

请求体：

```json
{
  "name": "Primary Codex",
  "providerType": "codex",
  "endpoint": "https://api.example.com",
  "model": "gpt-5",
  "apiKey": "secret",
  "workspaceId": "ws_1",
  "isEnabled": true
}
```

### `PATCH /providers/:id`

更新 Provider 配置。

允许更新字段：

- `name`
- `endpoint`
- `model`
- `apiKey`
- `isEnabled`

## 3. 错误处理

通用错误结构：

```json
{
  "message": "validation failed"
}
```

## 4. 访问约束

首版为单用户模式，默认当前登录用户拥有全部访问权限。
