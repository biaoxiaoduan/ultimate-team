# 迭代 1 测试用例

## 1. 测试范围

- 后端健康检查接口
- 工作区创建与默认切换
- Provider 创建与更新
- 前端基础页面渲染
- 前端 Provider 列表展示

## 2. 不测试范围

- 真实 Provider 联调
- 真实数据库持久化
- 多用户登录

## 3. 功能测试用例

### 用例 1：健康检查

- 前置条件：API 已启动
- 操作：调用 `GET /health`
- 预期：返回 `200` 和 `status=ok`

### 用例 2：创建工作区

- 前置条件：API 已启动
- 操作：调用 `POST /workspaces`
- 预期：返回新工作区，字段正确

### 用例 3：设置默认工作区

- 前置条件：至少存在两个工作区
- 操作：调用 `PATCH /workspaces/:id/default`
- 预期：目标工作区 `isDefault=true`，其他工作区 `isDefault=false`

### 用例 4：创建 Provider

- 前置条件：存在工作区
- 操作：调用 `POST /providers`
- 预期：返回 Provider 配置，`apiKey` 不明文回显

### 用例 5：更新 Provider

- 前置条件：存在 Provider
- 操作：调用 `PATCH /providers/:id`
- 预期：字段更新成功

### 用例 6：前端首页渲染

- 前置条件：前端测试环境可运行
- 操作：渲染应用
- 预期：能看到平台标题和基础导航

### 用例 7：前端 Provider 列表展示

- 前置条件：mock API 返回 Provider 列表
- 操作：渲染 Provider 页面
- 预期：正确显示 Provider 名称和类型

## 4. 异常流程用例

- 创建工作区缺少 `name`
- 创建 Provider 缺少 `providerType`
- 设置默认工作区时使用不存在的 `id`

## 5. 边界条件用例

- 工作区描述为空
- Provider `model` 为空
- Provider `isEnabled=false`

## 6. 回归范围

- 根工作区脚本执行
- API 基础启动
- Web 基础渲染

## 7. 自动化测试覆盖目标

- 后端核心接口全部有自动化测试
- 前端至少覆盖应用渲染和 Provider 列表展示
