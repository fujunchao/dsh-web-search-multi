# 更新日志

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
