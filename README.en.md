English | [中文](README.md)

# dsh-web-search-multi

![CI](https://github.com/fujunchao/dsh-web-search-multi/actions/workflows/ci.yml/badge.svg)

A multi-backend web search provider plugin for **DeepSeek Harness (dsh)**. It plugs into the `ctx.web` search seam and powers the built-in `web_search` tool with pluggable search backends.

---

## Features

- Tavily search backend
- Grok / xAI search backend (OpenAI Responses API)
- OpenAI search backend (Responses API)
- Gemini search backend (Google Search grounding)
- Customizable API keys, endpoints, and model names
- Configurable from the dsh Web UI (Settings → Plugins → Plugin configuration → Web search)
- Only the selected backend's settings are shown in the UI

## Supported Backends

| Backend | Default Endpoint | Default Model | Real Web Search |
| --- | --- | --- | --- |
| Tavily | `https://api.tavily.com` | — | ✅ |
| Grok / xAI | `https://api.x.ai/v1` | `grok-4.6` | ✅ (official xAI API required) |
| OpenAI | `https://api.openai.com/v1` | `gpt-5.6` | ✅ |
| Gemini | `https://generativelanguage.googleapis.com/v1beta` | `gemini-3.6-flash` | ✅ |

> Note: Some third-party proxies may accept the request but do not actually execute server-side web search. For Grok, use the official xAI API to get real search results and citations.

## Installation

```bash
dsh plugin --profile web add file:/path/to/dsh-web-search-multi
```

Then add the provider to your profile patch (`~/.dsh/profiles/web/cordis.patch.yml`):

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

## Configuration

Edit `~/.dsh/settings.yaml`:

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

Add API keys to `~/.dsh/.credentials.yaml`:

```yaml
TAVILY_API_KEY: tvly-...
XAI_API_KEY: xai-...
OPENAI_API_KEY: sk-...
GEMINI_API_KEY: AIza...
```

## Web UI

After installation and a dsh restart, open:

> Settings → Plugins → Plugin configuration → Web search

You can select the active backend and configure its API key, endpoint, and model directly in the UI.

## License

MIT
