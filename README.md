[English](README.en.md) | 中文

# dsh-web-search-multi

![CI](https://github.com/fujunchao/dsh-web-search-multi/actions/workflows/ci.yml/badge.svg)

一个用于 **DeepSeek Harness (dsh)** 的多后端联网搜索插件。它接入 `ctx.web` 搜索能力，为内置的 `web_search` 工具提供可切换的搜索后端。

---

## 功能特性

- Tavily 搜索后端
- Grok / xAI 搜索后端（OpenAI Responses API）
- OpenAI 搜索后端（Responses API）
- Gemini 搜索后端（Google Search grounding）
- 可自定义 API Key、Endpoint、模型名
- 支持在 dsh Web UI 中配置（设置 → 插件 → 插件配置 → Web search）
- UI 只显示当前选中后端的配置项
- 兼容 DSH `0.1.0-rc.7` 与 `0.1.1-rc.2`：防止部分 OpenAI 兼容网关的空白流式帧把工具调用名称覆盖为空，避免 `unknown tool ""` 和后续 HTTP 422

## 支持的后端

| 后端 | 默认端点 | 默认模型 | 真实联网搜索 |
| --- | --- | --- | --- |
| Tavily | `https://api.tavily.com` | — | ✅ |
| Grok / xAI | `https://api.x.ai/v1` | `grok-4.6` | ✅（需要官方 xAI API） |
| OpenAI | `https://api.openai.com/v1` | `gpt-5.6` | ✅ |
| Gemini | `https://generativelanguage.googleapis.com/v1beta` | `gemini-3.6-flash` | ✅ |

> 注意：部分第三方代理可能接受请求，但不会真正执行服务端搜索。Grok 请使用官方 xAI API 才能获得真实搜索结果和引用来源。

## 安装

从 GitHub 安装固定版本：

```bash
dsh plugin --profile web add github:fujunchao/dsh-web-search-multi#v0.1.3
```

如果同时使用 headless profile：

```bash
dsh plugin --profile headless add github:fujunchao/dsh-web-search-multi#v0.1.3
```

本地开发目录也可以直接安装：

```bash
dsh plugin --profile web add file:/path/to/dsh-web-search-multi
```

然后在 profile patch（`~/.dsh/profiles/web/cordis.patch.yml`）中添加：

```yaml
- id: web
  config:
    searchProvider: multi

- id: web-search-deepseek
  disabled: true

- insert:
    - id: web-search-multi
      name: 'dsh-web-search-multi'
      config:
        provider: tavily
```

升级到当前版本时，重新执行对应 profile 的 GitHub 安装命令，然后重启 dsh。

## DSH 工具调用兼容修复

部分 OpenAI 兼容网关会在第一个有效的工具调用帧之后继续发送 `id: ""`、`name: null`。DSH `0.1.0-rc.7` 与 `0.1.1-rc.2` 都会把已经收到的工具调用标识覆盖为空，表现为：

```text
Error: unknown tool ""
Upstream request failed: [missing_required_parameter] Field required
```

从 `v0.1.1` 开始，本插件会在 LLM 流边界保留每个工具调用最后一个非空的 ID 和名称。修复对搜索以外的流式工具调用同样有效，但不会更改已有的合法标识。

## 配置

编辑 `~/.dsh/settings.yaml`：

```yaml
web-search-multi:
  provider: tavily # tavily | grok | openai | gemini

  tavilyApiKeyEnv: TAVILY_API_KEY
  tavilyBaseURL: https://api.tavily.com
  tavilyMaxResults: 8
  tavilySearchDepth: basic
  tavilyIncludeAnswer: true

  grokApiKeyEnv: XAI_API_KEY
  grokBaseURL: https://api.x.ai/v1
  grokModel: grok-4.6

  openaiApiKeyEnv: OPENAI_API_KEY
  openaiBaseURL: https://api.openai.com/v1
  openaiModel: gpt-5.6

  geminiApiKeyEnv: GEMINI_API_KEY
  geminiBaseURL: https://generativelanguage.googleapis.com/v1beta
  geminiModel: gemini-3.6-flash
```

在 `~/.dsh/.credentials.yaml` 中添加 API Key：

```yaml
TAVILY_API_KEY: tvly-...
XAI_API_KEY: xai-...
OPENAI_API_KEY: sk-...
GEMINI_API_KEY: AIza...
```

## Web UI 配置

安装并重启 dsh 后，打开：

> 设置 → 插件 → 插件配置 → 多后端 Web 搜索

可以在 UI 中直接选择当前搜索后端，并配置对应的 API Key、Endpoint 和模型名。

`v0.1.2` 起插件同时提供 Host 端 settings 命名空间和 `dsh.client` 浏览器配置卡片；旧版本只有 Host 端注册，因此搜索可以工作，但配置卡片不会出现在 UI 中。

## 开源协议

MIT
