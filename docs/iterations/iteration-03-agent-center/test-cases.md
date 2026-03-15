# 迭代 3 测试用例

## 1. 测试范围

- 模板列表
- Agent 创建
- Agent 编辑
- Agent 启停
- Agent 删除
- Provider 绑定校验
- 前端 Agent Center 交互

## 2. 不测试范围

- Agent 真正执行任务
- 编排链路
- Provider 真实连通性校验

## 3. 功能测试用例

### 用例 1：查看模板列表

- 操作：调用模板接口
- 预期：返回 5 个内置模板

### 用例 2：创建 Agent

- 操作：创建绑定 Provider 的 Agent
- 预期：创建成功，返回实例信息

### 用例 3：编辑 Agent

- 操作：更新名称、提示词和任务类型
- 预期：更新成功

### 用例 4：停用 Agent

- 操作：将 `isEnabled` 改为 `false`
- 预期：实例状态更新成功

### 用例 5：删除 Agent

- 操作：删除实例
- 预期：实例从列表中消失

### 用例 6：Provider 不存在

- 操作：创建时传入非法 `providerId`
- 预期：返回错误

### 用例 7：前端 Agent 创建

- 操作：在页面中创建 Agent
- 预期：实例列表出现新 Agent

## 4. 异常流程用例

- 缺少 `name`
- 缺少 `templateId`
- 更新不存在的 Agent
- 删除不存在的 Agent

## 5. 边界条件用例

- `taskTypes` 为空
- `systemPrompt` 为空
- `isEnabled=false`

## 6. 回归范围

- 健康检查
- 工作区与 Provider 配置
- 需求和计划接口

## 7. 自动化测试覆盖目标

- 后端 Agent 主路径全部覆盖
- 前端至少覆盖模板展示、Agent 创建和 Agent 删除
