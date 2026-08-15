[English](README.en.md) | 中文

# dsh-web-search-multi

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

## 支持的后端

| 后端 | 默认端点 | 默认模型 | 真实联网搜索 |
| --- | --- | --- | --- |
| Tavily | `https://api.tavily.com` | — | ✅ |
| Grok / xAI | `https://api.x.ai/v1` | `grok-4.6` | ✅（需要官方 xAI API） |
| OpenAI | `https://api.openai.com/v1` | `gpt-5.6` | ✅ |
| Gemini | `https://generativelanguage.googleapis.com/v1beta` | `gemini-3.6-flash` | ✅ |

> 注意：部分第三方代理可能接受请求，但不会真正执行服务端搜索。Grok 请使用官方 xAI API 才能获得真实搜索结果和引用来源。

## 安装

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

> 设置 → 插件 → 插件配置 → Web search

可以在 UI 中直接选择当前搜索后端，并配置对应的 API Key、Endpoint 和模型名。

## 开源协议

MIT
