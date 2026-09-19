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
- DSH `0.1.0-rc.7` and `0.1.1-rc.2` compatibility: prevents blank continuation frames from erasing a streamed tool-call identity and causing `unknown tool ""` followed by HTTP 422

## Supported Backends

| Backend | Default Endpoint | Default Model | Real Web Search |
| --- | --- | --- | --- |
| Tavily | `https://api.tavily.com` | — | ✅ |
| Grok / xAI | `https://api.x.ai/v1` | `grok-4.6` | ✅ (official xAI API required) |
| OpenAI | `https://api.openai.com/v1` | `gpt-5.6` | ✅ |
| Gemini | `https://generativelanguage.googleapis.com/v1beta` | `gemini-3.6-flash` | ✅ |

> Note: Some third-party proxies may accept the request but do not actually execute server-side web search. For Grok, use the official xAI API to get real search results and citations.

## Installation

Install a pinned release from GitHub:

```bash
dsh plugin --profile web add github:fujunchao/dsh-web-search-multi#v0.1.5
```

If you also use the headless profile:

```bash
dsh plugin --profile headless add github:fujunchao/dsh-web-search-multi#v0.1.5
```

For local development, install directly from a checkout:

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

To upgrade, rerun the GitHub installation command for each profile and restart dsh.

## DSH Tool-Call Compatibility Fix

Some OpenAI-compatible gateways send `id: ""` and `name: null` continuation frames after the first valid tool-call frame. Both DSH `0.1.0-rc.7` and `0.1.1-rc.2` let those frames erase the identity, resulting in:

```text
Error: unknown tool ""
Upstream request failed: [missing_required_parameter] Field required
```

Starting with `v0.1.1`, this plugin preserves the last non-empty ID and name for each streamed tool call at the LLM boundary. The compatibility layer also protects non-search tool calls while the plugin is loaded, without changing valid identities.

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

> Settings → Plugins → Plugin configuration → Multi-backend Web search

You can select the active backend and configure its API key, endpoint, and model directly in the UI.

Starting with `v0.1.2`, the package ships both the Host settings namespace and a `dsh.client` browser card. Older versions only registered the Host half, so search worked but no configuration card appeared in the UI.

## License

MIT
