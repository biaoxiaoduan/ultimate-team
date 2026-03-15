# 迭代 5 测试报告

## 1. 测试日期

- 2026-03-15

## 2. 测试环境

- 本地开发环境
- Node.js + npm workspace
- `apps/api` 使用 Vitest 控制器测试
- `apps/web` 使用 Vitest + Testing Library 组件测试

## 3. 执行命令

- `npm run typecheck`
- `npm run test`
- `npm run build`

## 4. 通过情况

- 类型检查通过
- API 测试通过：`14` 个用例全部通过
- 前端测试通过：`4` 个用例全部通过
- 生产构建通过

## 5. 失败情况

- 首次前端测试出现查询歧义，原因是流程化页面里存在同名导航按钮与页面标题
- Run 创建弹窗首次存在状态初始化自旋，导致测试和页面进入卡住

## 6. 修复记录

- 调整 `apps/web/src/App.test.tsx`，使用更精确的角色与标题断言，避免流程化 UI 的重复文案造成假失败
- 调整 `apps/web/src/App.tsx` 中 Run 创建弹窗的初始化逻辑，仅在值真实变化时更新状态，消除循环渲染

## 7. 最终结论

- 本轮交付满足提交条件，可进入 Git 提交与后续合并流程
