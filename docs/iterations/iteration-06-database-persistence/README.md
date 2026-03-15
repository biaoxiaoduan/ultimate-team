# 迭代 6：数据库接入与核心模型持久化

## 本轮目标

把当前后端从内存态数据切换为真实数据库持久化，保证 API 进程重启后核心业务数据仍可恢复。

## 本轮范围

- 接入 SQLite 文件数据库
- 增加启动迁移和默认数据初始化
- 持久化 Workspace、Provider、Requirement、RequirementVersion、IterationPlan、AgentInstance、OrchestrationRun
- 保持现有接口基本不变
- 增加持久化回归测试

## 本轮不包含

- PostgreSQL 生产化部署
- Artifact / TestReport / BuildRecord 独立表设计
- 多用户并发优化
