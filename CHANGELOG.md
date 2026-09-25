## 0.2.0 - 2026-09-25

- 适配 DSH `0.1.7-rc.2` 的破坏性设置系统变更（DSH 移除了 `installSection` 与 `settingsScope` 服务）。
- 宿主半边：`Config` 全部字段标记 `.volatile()`，`apply` 改为通过 `config.<field>.get()` 活视图读取，
  删除 `ctx.inject(["settings"], ...)` + `installSection` 注册；设置表单由框架按 profile entry 自动生成，
  用户改动持久化到 profile 的 cordis.patch.yml。
- 客户端半边：设置卡片由 `settingsScope.bind()` 改为 `ctx.configForms.get("web-search-multi")`，
  注册 slot 从 `settings.plugin.item` 迁移到 `plugins.item`（由插件管理页渲染），
  并按新契约补充 `id`/`order`/`label` 与 `view === "summary"` 摘要渲染；卡片仅在宿主服务该命名空间时挂载（`configForms.whileServed`）。
- 保存链路适配 `scope.set` 的布尔返回语义；`remote.credentials`（describe/set）wire API 不变。
- 依赖：五个 `@deepseek-ai/*` 依赖提升至 `^0.1.7-rc.2`；`dsh.client.inject` 列表移除已停发的
  `dsh-client-runtime` 与旧卡片宿主 `dsh-client-ui-settings-plugins`，加入渲染方 `dsh-client-ui-plugin-manager`。

## 0.1.6 - 2026-09-23

- 搜索请求增加网络层退避重试：fetch 抛出的瞬时网络错误（ECONNRESET、UND_ERR_SOCKET、超时、DNS 抖动等）按 500ms/1500ms/4500ms 退避重试，共 4 次尝试；HTTP 4xx/5xx 属 API 层错误，不重试。
- 背景：出口直连 Tavily 等海外 API 存在阵发性连接重置，单次尝试失败即导致整次搜索报错；实测故障窗口约数秒，退避覆盖后可自愈。
- 错误信息透出底层原因：网络错误文案由 `TypeError: fetch failed` 改为附带 `error.cause` 的错误码或消息（如 `[ECONNRESET]`），便于定位链路问题。
- 重试逻辑独立为零依赖的 `lib/retry.js`，由 postJson（Tavily/Grok/OpenAI 共用）与 Gemini 的内联请求共用；退避等待期间响应 abort 信号，用户取消不必多等。
- 新增 `test/retry.test.js`：重试后成功、重试耗尽透传原始错误、退避期间中止、错误描述格式，共 4 项测试。

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
