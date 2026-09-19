# 更新日志

## 0.1.5 - 2026-09-19

- 适配 DSH `0.1.5-rc.2`：五个 `@deepseek-ai/*` 依赖由 `^0.1.1-rc.2` 提升至 `^0.1.5-rc.2`。
- 迁移 settings 注册：`dsh-settings@0.1.5` 移除了模块级 `installSettingsSection`/`settingsNamespace` 导出，
  改为 settings 服务上的 `installSection` 方法；插件随之改用 `ctx.inject(["settings"], ...)` 注册，
  与官方 `dsh-web-search-deepseek` 的写法一致。
- 依赖去重的实际收益：插件与宿主不再各自持有 `WebError`/settings 服务的不同副本
  （旧范围内 pnpm 会为插件单独装一套 `0.1.1-rc.2` 嵌套依赖，两个 `WebError` 构造器 `instanceof` 互不识别）。

## 0.1.4 - 2026-09-18

- 修复设置卡片“凭据明明已配置却显示未配置、保存报‘保存失败，请检查配置或服务日志’”的问题。
- 根因：卡片从 `ctx.get("connection")` 解构 `api`，但 `ConnectionHandle` 并不提供该成员，`api` 恒为 `undefined`；`describe`/`set` 两次调用都抛 `TypeError`，分别被 catch 成“未配置”和“保存失败”。
- 改为经 `ctx.remote.credentials` 访问凭据域（`inject` 增加 `remote.credentials`），并按其真实契约调用：`describe(refs)` 返回 `{ ok, value: { [ref]: view } }`，`set(ref, value)` 返回 `{ ok }`。
- 修复 Gemini 后端把 `thought: true` 的思考片段拼进搜索结果正文的问题：现仅拼接非思考片段，正文由 4600+ 字推理降为真实答案摘要。
- 新增回归测试：凭据状态读取、密钥保存成功/被拒、Gemini 思考片段过滤，共 10 项测试。

## 0.1.3 - 2026-08-22

- 适配 DSH `0.1.1-rc.2`：依赖范围由 `^0.1.0-rc.7` 提升至 `^0.1.1-rc.2`。
- 旧范围按 semver 规则并不匹配 `0.1.1-rc.2`，继续沿用会在重装依赖时解析到旧版本或触发 peer 冲突。
- 插件代码与对外接口未变更；已在 DSH `0.1.1-rc.2` 上通过全部单元测试及端到端搜索验证。
- 文档更新：安装命令指向 `#v0.1.3`；实测上游在 `0.1.1-rc.2` 仍未修复空白延续帧覆盖工具调用标识的问题，故本插件的兼容修复对该版本依然必要。

## 0.1.2 - 2026-08-19

- 补齐 DSH `dsh.client` 浏览器端 bundle，在“设置 → 插件 → 插件配置”中注册 `web-search-multi` 配置卡片。
- UI 支持切换 Tavily、Grok、OpenAI、Gemini，并编辑 Endpoint、模型、凭据名及 Tavily 搜索参数。
- API Key 通过 Credentials 服务写入，浏览器不会读取或回显已保存的密钥。
- 修正 TypeScript 声明，使其与实际使用的扁平配置字段一致。

## 0.1.1 - 2026-08-19

- 兼容 DSH `0.1.0-rc.7` 的流式工具调用：保留最后一个非空的工具调用 ID 和名称。
- 修复部分 OpenAI 兼容网关触发的 `Error: unknown tool ""`。
- 避免空工具调用历史继续导致 `HTTP 422 missing_required_parameter`。
- 增加覆盖空白延续帧和多工具索引隔离的自动化测试。
- CI 改用 `npm ci`，并增加测试与打包检查。

## 0.1.0 - 2026-08-15

- 首次发布。
- 支持 Tavily、Grok/xAI、OpenAI 和 Gemini 搜索后端。
- 支持 DSH Web 设置界面和 Credentials 服务。
