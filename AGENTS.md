# Villa Party Booking — 项目规范

## 分支策略

- 日常开发在 `xy` 分支
- 只有用户明确要求时才合并到 `main`
- 提交默认推送到 `xy` 分支

## 开发原则

- 增量可逆优先于大范围重构
- 保持既有约定，除非任务明确要求重新设计
- 遵循项目现有编码规范和代码风格
- 保持现有代码风格一致性

## Agents

项目在 `agents/` 目录下定义了 6 个专业 Agent，供 `/buddy` 全流程交付时按阶段调用：

| Agent | 文件 | 职责 |
|-------|------|------|
| 需求分析师 | `agents/requirement-analyst.md` | 提取目标、范围、约束，输出需求摘要 |
| 架构师 | `agents/architect.md` | 设计技术方案，评估风险，输出设计文档 |
| 开发工程师 | `agents/coder.md` | 按设计方案编码，遵循项目风格 |
| 审查员 | `agents/reviewer.md` | 代码质量审查，输出审查报告 |
| 测试工程师 | `agents/tester.md` | 编译检查、测试验证，输出测试报告 |
| 发布工程师 | `agents/deployer.md` | 构建打包、部署清单、回滚方案 |

使用方式：在执行对应阶段前，先读取对应 agent 文件获取详细指令，然后按其规范执行。

## 记忆管理

每次对话开始时读取记忆索引，按需保存和更新记忆。

- 记忆存储路径：`/Users/yuan/.Codex/projects/-Users-yuan-villa-party-booking/memory/`
- 记忆索引文件：`/Users/yuan/.Codex/projects/-Users-yuan-villa-party-booking/memory/MEMORY.md`
