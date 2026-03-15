# 测试用例

## 1. 基础数据库初始化

- 启动 API 服务
- 验证数据库文件被自动创建
- 验证默认工作区存在且为 `ws_1`

## 2. Workspace 持久化

- 创建工作区
- 重启 API
- 验证新工作区仍存在
- 切换默认工作区后重启，验证默认状态仍正确

## 3. Provider 持久化

- 创建 Provider
- 更新 Provider
- 重启 API
- 验证 Provider 配置仍存在

## 4. Requirement 与版本持久化

- 创建 Requirement
- 新增 RequirementVersion
- 重启 API
- 验证当前版本和版本列表仍正确

## 5. Plan 持久化

- 生成计划草稿
- 确认计划
- 重启 API
- 验证计划状态和迭代内容仍正确

## 6. Agent 持久化

- 创建 Agent
- 更新 Agent
- 重启 API
- 验证 Agent 仍存在且配置保持正确

## 7. Run 持久化

- 创建 Run
- 执行当前阶段
- 重启 API
- 验证 Run、Stage、Task、Handoff 状态仍可恢复
