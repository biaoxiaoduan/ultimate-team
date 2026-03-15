# 迭代 5 接口文档

## 1. 新增接口

1. `GET /artifacts`
2. `GET /artifacts/:id`
3. `GET /artifacts/run/:runId`
4. `GET /artifacts/iteration/:iterationId`
5. `GET /test-reports`
6. `GET /build-records`

## 2. 接口说明

### `GET /artifacts`

返回所有可见 Artifact 列表。

支持查询参数：

- `runId`
- `iterationId`

### `GET /artifacts/:id`

返回某个 Artifact 的详情。

### `GET /artifacts/run/:runId`

返回某个 Run 关联的全部交付物。

### `GET /artifacts/iteration/:iterationId`

返回某轮迭代关联的全部交付物。

### `GET /test-reports`

返回测试阶段衍生的测试报告。

支持查询参数：

- `runId`
- `iterationId`

### `GET /build-records`

返回发布阶段衍生的发布准备记录。

支持查询参数：

- `runId`
- `iterationId`

## 3. 数据结构

### `Artifact`

```json
{
  "id": "artifact_1",
  "runId": "run_1",
  "iterationId": "iter_1",
  "stageId": "run_1_stage_3",
  "agentId": "agent_3",
  "category": "development_doc",
  "title": "Development design for Iteration 1",
  "summary": "Developer agent completed implementation handoff.",
  "content": "Detailed generated artifact content",
  "createdAt": "2026-03-15T12:00:00.000Z",
  "updatedAt": "2026-03-15T12:00:00.000Z"
}
```

### `TestReport`

```json
{
  "id": "test_report_1",
  "runId": "run_1",
  "iterationId": "iter_1",
  "artifactId": "artifact_5",
  "status": "passed",
  "totalCases": 12,
  "passedCases": 12,
  "failedCases": 0,
  "summary": "Core regression path passed."
}
```

### `BuildRecord`

```json
{
  "id": "build_record_1",
  "runId": "run_1",
  "iterationId": "iter_1",
  "artifactId": "artifact_6",
  "status": "ready",
  "environment": "staging",
  "commitReference": "run_1-release",
  "summary": "Release checklist prepared for staging."
}
```

## 4. 异常场景

- `404`: Artifact 不存在
- `404`: Run 不存在
- `404`: iteration 无对应产物

## 5. 前端交互关系

- 交付物中心页调用 `GET /artifacts`
- Run 详情页点击“查看交付物”后调用 `GET /artifacts/run/:runId`
- Artifact 详情页调用 `GET /artifacts/:id`
- 测试和发布摘要区分别调用 `GET /test-reports` 与 `GET /build-records`
