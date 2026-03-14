# 迭代 1 测试报告

## 测试日期

- 2026-03-15

## 测试环境

- 本地开发环境
- Node.js v25.1.0
- npm 11.6.2

## 执行命令

- `npm install`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## 通过情况

- 根工作区依赖安装成功
- API `typecheck` 通过
- API `vitest` 通过，4 个测试全部通过
- Web `vitest` 通过，2 个测试全部通过
- 根工作区 `build` 通过
- Web 生产构建通过

## 失败情况

- 初始 API 测试使用 `supertest` 端口绑定方式，受当前环境限制失败，后改为控制器级测试并通过
- 初始 Web 构建脚本会把 `.js` 产物写回 `src/`，已修改为 `tsc --noEmit` 后解决

## 修复记录

- 调整 Web `tsconfig` 为 `moduleResolution=bundler`
- 去除 Web 构建脚本中的源码目录产物输出
- 调整 API 测试策略，避免依赖端口监听
- 清理误生成的前端 `.js` 文件

## 最终结论

- 迭代 1 目标已达到可提交状态
- 当前已具备前后端工程底座、工作区配置能力、Provider 配置能力和基础自动化测试
- 真实数据库持久化和真实 Provider 执行留待后续迭代实现
