import { WebError } from "@deepseek-ai/dsh-web";
import z from "@deepseek-ai/schemastery";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
import { launchEnvironmentOf } from "@deepseek-ai/dsh-launch-environment";
import { describeError, fetchWithRetry } from "./retry.js";

const name = "web-search-multi";
const inject = ["web", "llm"];

function nonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

/**
 * Preserve a tool call's last non-empty id and name across streamed
 * continuation frames. Some OpenAI-compatible gateways emit empty strings or
 * nulls after the first valid frame; DSH rc.7 otherwise lets those values
 * erase the identity and attempts to execute an unknown tool named "".
 */
async function* stabilizeToolCallIdentity(stream) {
  const identities = new Map();

  for await (const chunk of stream) {
    if (chunk?.type === "tool-call-delta") {
      const previous = identities.get(chunk.index) ?? {};
      const id = nonEmptyString(chunk.id) ? chunk.id : previous.id;
      const toolName = nonEmptyString(chunk.name) ? chunk.name : previous.name;

      if (id !== undefined || toolName !== undefined) {
        identities.set(chunk.index, { id, name: toolName });
      }

      const repaired = { ...chunk };
      if (id !== undefined) repaired.id = id;
      if (toolName !== undefined) repaired.name = toolName;
      else if ("name" in repaired) delete repaired.name;
      yield repaired;
      continue;
    }

    if (chunk?.type === "block-end" && chunk.block?.type === "tool-call") {
      const previous = identities.get(chunk.index) ?? {};
      const id = nonEmptyString(chunk.block.id) ? chunk.block.id : previous.id;
      const toolName = nonEmptyString(chunk.block.name) ? chunk.block.name : previous.name;
      const block = { ...chunk.block };
      if (id !== undefined) block.id = id;
      if (toolName !== undefined) block.name = toolName;
      identities.delete(chunk.index);
      yield { ...chunk, block };
      continue;
    }

    yield chunk;
  }
}

const DEFAULTS = {
  tavilyBaseURL: "https://api.tavily.com",
  tavilyApiKeyEnv: "TAVILY_API_KEY",
  tavilyMaxResults: 8,
  tavilySearchDepth: "basic",
  tavilyIncludeAnswer: true,
  grokBaseURL: "https://api.x.ai/v1",
  grokApiKeyEnv: "XAI_API_KEY",
  grokModel: "grok-4.6",
  openaiBaseURL: "https://api.openai.com/v1",
  openaiApiKeyEnv: "OPENAI_API_KEY",
  openaiModel: "gpt-5.6",
  geminiBaseURL: "https://generativelanguage.googleapis.com/v1beta",
  geminiApiKeyEnv: "GEMINI_API_KEY",
  geminiModel: "gemini-3.6-flash",
};

const Config = z.object({
  provider: z.string().default("tavily").volatile(),
  tavilyApiKey: z.string().role("secret").volatile(),
  tavilyApiKeyEnv: z.string().role("credential-ref").default(DEFAULTS.tavilyApiKeyEnv).volatile(),
  tavilyBaseURL: z.string().default(DEFAULTS.tavilyBaseURL).volatile(),
  tavilyMaxResults: z.number().step(1).min(1).default(DEFAULTS.tavilyMaxResults).volatile(),
  tavilySearchDepth: z.string().default(DEFAULTS.tavilySearchDepth).volatile(),
  tavilyIncludeAnswer: z.boolean().default(DEFAULTS.tavilyIncludeAnswer).volatile(),
  grokApiKey: z.string().role("secret").volatile(),
  grokApiKeyEnv: z.string().role("credential-ref").default(DEFAULTS.grokApiKeyEnv).volatile(),
  grokBaseURL: z.string().default(DEFAULTS.grokBaseURL).volatile(),
  grokModel: z.string().default(DEFAULTS.grokModel).volatile(),
  openaiApiKey: z.string().role("secret").volatile(),
  openaiApiKeyEnv: z.string().role("credential-ref").default(DEFAULTS.openaiApiKeyEnv).volatile(),
  openaiBaseURL: z.string().default(DEFAULTS.openaiBaseURL).volatile(),
  openaiModel: z.string().default(DEFAULTS.openaiModel).volatile(),
  geminiApiKey: z.string().role("secret").volatile(),
  geminiApiKeyEnv: z.string().role("credential-ref").default(DEFAULTS.geminiApiKeyEnv).volatile(),
  geminiBaseURL: z.string().default(DEFAULTS.geminiBaseURL).volatile(),
  geminiModel: z.string().default(DEFAULTS.geminiModel).volatile(),
});

const MULTI_SETTINGS_NAMESPACE = "web-search-multi";

/**
 * Multi-backend search provider for the DeepSeek Harness web capability seam.
 * Registered as `ctx.web` provider id `multi`.
 */
class MultiSearchProvider {
  constructor(resolveOptions) {
    this.resolveOptions = resolveOptions;
    this.id = "multi";
  }

  available() {
    const options = this.resolveOptions();
    return options.provider !== undefined && URL.canParse(options[`${options.provider}BaseURL`] ?? "");
  }

  async search(request, signal) {
    const options = this.resolveOptions();
    switch (options.provider) {
      case "tavily":
        return this.searchTavily(request, options, signal);
      case "grok":
        return this.searchResponses(request, options, "grok", signal);
      case "openai":
        return this.searchResponses(request, options, "openai", signal);
      case "gemini":
        return this.searchGemini(request, options, signal);
      default:
        throw new WebError(`Unknown web search provider "${options.provider}"`, "WEB_PROVIDER_ERROR");
    }
  }

  async searchTavily(request, options, signal) {
    const apiKey = await this.apiKey(options, "tavily", signal);
    const maxResults = request.maxResults ?? options.tavilyMaxResults ?? DEFAULTS.tavilyMaxResults;
    const endpoint = `${(options.tavilyBaseURL ?? DEFAULTS.tavilyBaseURL).replace(/\/+$/, "")}/search`;
    const body = {
      query: request.query,
      max_results: maxResults,
      search_depth: options.tavilySearchDepth ?? DEFAULTS.tavilySearchDepth,
      include_answer: options.tavilyIncludeAnswer ?? DEFAULTS.tavilyIncludeAnswer,
      include_raw_content: false,
      include_images: false,
    };

    const data = await this.postJson(endpoint, body, apiKey, signal, "Tavily");
    const sources = (data.results ?? []).map((item) => ({
      url: item.url,
      ...(item.title ? { title: item.title } : {}),
      ...(item.content ? { snippet: item.content } : {}),
      ...(item.published_date ? { publishedAt: item.published_date } : {}),
    }));

    return {
      ...(data.answer ? { content: data.answer } : {}),
      sources,
      truncated: false,
    };
  }

  async searchResponses(request, options, kind, signal) {
    const apiKey = await this.apiKey(options, kind, signal);
    const baseURL = (options[`${kind}BaseURL`] ?? DEFAULTS[`${kind}BaseURL`]).replace(/\/+$/, "");
    const model = options[`${kind}Model`] ?? DEFAULTS[`${kind}Model`];
    const endpoint = `${baseURL}/responses`;
    const body = {
      model,
      input: request.query,
      tools: [{ type: "web_search" }],
      include: ["web_search_call.action.sources"],
    };

    const data = await this.postJson(endpoint, body, apiKey, signal, "Responses");
    const parsed = this.parseResponsesOutput(data);
    return {
      ...(parsed.content ? { content: parsed.content } : {}),
      sources: parsed.sources,
      truncated: false,
    };
  }

  async searchGemini(request, options, signal) {
    const apiKey = await this.apiKey(options, "gemini", signal);
    const baseURL = (options.geminiBaseURL ?? DEFAULTS.geminiBaseURL).replace(/\/+$/, "");
    const model = options.geminiModel ?? DEFAULTS.geminiModel;
    const endpoint = `${baseURL}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
      contents: [{ role: "user", parts: [{ text: request.query }] }],
      tools: [{ google_search: {} }],
    };

    let data;
    try {
      const response = await fetchWithRetry(
        endpoint,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        signal,
      );
      if (!response.ok) {
        let message = `Gemini API error (HTTP ${response.status})`;
        try {
          const parsed = await response.json();
          const detail = parsed.error?.message ?? parsed.message;
          if (detail) message = detail;
        } catch {}
        throw new WebError(message, "WEB_PROVIDER_ERROR");
      }
      data = await response.json();
    } catch (error) {
      if (signal?.aborted === true || isAbortError(error)) throw abortError(signal, error);
      if (error instanceof WebError) throw error;
      throw new WebError(`Gemini search request failed: ${describeError(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
    }

    const candidate = data.candidates?.[0];
    let content = "";
    for (const part of candidate?.content?.parts ?? []) {
      // Gemini 3 returns its internal reasoning as `thought: true` parts. They are
      // not the answer: leaking them into `content` makes the search result read
      // as the model's deliberation instead of a summary of the sources.
      if (part.thought === true) continue;
      if (part.text) content += part.text;
    }
    const sources = (candidate?.groundingMetadata?.groundingChunks ?? [])
      .filter((chunk) => chunk.web?.uri)
      .map((chunk) => ({
        url: chunk.web.uri,
        ...(chunk.web.title ? { title: chunk.web.title } : {}),
      }));

    return {
      ...(content ? { content } : {}),
      sources,
      truncated: false,
    };
  }

  parseResponsesOutput(data) {
    const output = data.output ?? [];
    let content = "";
    const seen = new Set();
    const sources = [];

    const pushSource = (source) => {
      if (!source?.url || seen.has(source.url)) return;
      seen.add(source.url);
      sources.push(source);
    };

    for (const item of output) {
      if (item.type === "message") {
        for (const block of item.content ?? []) {
          if (block.type === "output_text") {
            if (block.text) content += block.text;
            for (const annotation of block.annotations ?? []) {
              if (annotation.type === "url_citation" && annotation.url) {
                pushSource({
                  url: annotation.url,
                  ...(annotation.title ? { title: annotation.title } : {}),
                });
              }
            }
          }
        }
      }
      if (item.type === "web_search_call" && item.action?.sources) {
        for (const source of item.action.sources) {
          if (typeof source === "string") {
            pushSource({ url: source });
          } else if (source?.url) {
            pushSource({
              url: source.url,
              ...(source.title ? { title: source.title } : {}),
              ...(source.description ? { snippet: source.description } : {}),
            });
          }
        }
      }
    }

    return { content, sources };
  }

  async postJson(endpoint, body, apiKey, signal, label) {
    let response;
    try {
      response = await fetchWithRetry(
        endpoint,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
        signal,
      );
    } catch (error) {
      if (signal?.aborted === true || isAbortError(error)) throw abortError(signal, error);
      throw new WebError(`${label} search request failed: ${describeError(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
    }

    if (!response.ok) {
      let message = `${label} API error (HTTP ${response.status})`;
      try {
        const parsed = await response.json();
        const detail =
          typeof parsed.detail === "string"
            ? parsed.detail
            : parsed.detail?.error ?? parsed.error?.message ?? parsed.message;
        if (detail) message = detail;
      } catch {}
      throw new WebError(message, "WEB_PROVIDER_ERROR");
    }

    try {
      return await response.json();
    } catch (error) {
      throw new WebError(`${label} returned an unprocessable response body: ${describeError(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
    }
  }

  async apiKey(options, kind, signal) {
    const literal = options[`${kind}ApiKey`];
    if (signal?.aborted) throw abortError(signal);
    if (literal !== undefined && literal.length > 0) return literal;

    const envRef = options[`${kind}ApiKeyEnv`] ?? DEFAULTS[`${kind}ApiKeyEnv`];
    let resolved;
    try {
      resolved = await abortable(options[`${kind}ResolveApiKey`]?.() ?? Promise.resolve(undefined), signal);
    } catch (error) {
      if (signal?.aborted === true || isAbortError(error)) throw abortError(signal, error);
      throw new WebError(`Search credential resolution failed: ${String(error)}`, "WEB_PROVIDER_ERROR", { cause: error });
    }

    if (resolved !== undefined && resolved.length > 0) return resolved;
    throw new WebError(
      `Search has no API key for "${envRef}"; store it through the credentials service, export it in the launching environment, or set a literal "${kind}ApiKey" in the web-search-multi config`,
      "WEB_PROVIDER_CREDENTIAL_MISSING",
    );
  }
}

function resolveKeyResolver(ctx, envRef) {
  const ref = credentialRef(envRef);
  return async () => {
    const credentials = ctx.get("credentials");
    if (credentials !== undefined) return (await credentials.resolve(ref))?.value;
    const ambient = launchEnvironmentOf(ctx).get(ref);
    return ambient !== undefined && ambient.value.length > 0 ? ambient.value : undefined;
  };
}

function resolveOptions(ctx, config) {
  const options = {
    provider: config.provider ?? "tavily",
    tavilyApiKey: config.tavilyApiKey,
    tavilyApiKeyEnv: config.tavilyApiKeyEnv ?? DEFAULTS.tavilyApiKeyEnv,
    tavilyBaseURL: config.tavilyBaseURL ?? DEFAULTS.tavilyBaseURL,
    tavilyMaxResults: config.tavilyMaxResults ?? DEFAULTS.tavilyMaxResults,
    tavilySearchDepth: config.tavilySearchDepth ?? DEFAULTS.tavilySearchDepth,
    tavilyIncludeAnswer: config.tavilyIncludeAnswer ?? DEFAULTS.tavilyIncludeAnswer,
    grokApiKey: config.grokApiKey,
    grokApiKeyEnv: config.grokApiKeyEnv ?? DEFAULTS.grokApiKeyEnv,
    grokBaseURL: config.grokBaseURL ?? DEFAULTS.grokBaseURL,
    grokModel: config.grokModel ?? DEFAULTS.grokModel,
    openaiApiKey: config.openaiApiKey,
    openaiApiKeyEnv: config.openaiApiKeyEnv ?? DEFAULTS.openaiApiKeyEnv,
    openaiBaseURL: config.openaiBaseURL ?? DEFAULTS.openaiBaseURL,
    openaiModel: config.openaiModel ?? DEFAULTS.openaiModel,
    geminiApiKey: config.geminiApiKey,
    geminiApiKeyEnv: config.geminiApiKeyEnv ?? DEFAULTS.geminiApiKeyEnv,
    geminiBaseURL: config.geminiBaseURL ?? DEFAULTS.geminiBaseURL,
    geminiModel: config.geminiModel ?? DEFAULTS.geminiModel,
  };
  for (const kind of ["tavily", "grok", "openai", "gemini"]) {
    const envRef = options[`${kind}ApiKeyEnv`];
    options[`${kind}ResolveApiKey`] = resolveKeyResolver(ctx, envRef);
  }
  return options;
}

function apply(ctx, config) {
  ctx.on("llm/stream", (_options, next) => stabilizeToolCallIdentity(next()));

  ctx.web.registerSearchProvider(new MultiSearchProvider(() => resolveOptions(ctx, {
    provider: config.provider.get(),
    tavilyApiKey: config.tavilyApiKey.get(),
    tavilyApiKeyEnv: config.tavilyApiKeyEnv.get(),
    tavilyBaseURL: config.tavilyBaseURL.get(),
    tavilyMaxResults: config.tavilyMaxResults.get(),
    tavilySearchDepth: config.tavilySearchDepth.get(),
    tavilyIncludeAnswer: config.tavilyIncludeAnswer.get(),
    grokApiKey: config.grokApiKey.get(),
    grokApiKeyEnv: config.grokApiKeyEnv.get(),
    grokBaseURL: config.grokBaseURL.get(),
    grokModel: config.grokModel.get(),
    openaiApiKey: config.openaiApiKey.get(),
    openaiApiKeyEnv: config.openaiApiKeyEnv.get(),
    openaiBaseURL: config.openaiBaseURL.get(),
    openaiModel: config.openaiModel.get(),
    geminiApiKey: config.geminiApiKey.get(),
    geminiApiKeyEnv: config.geminiApiKeyEnv.get(),
    geminiBaseURL: config.geminiBaseURL.get(),
    geminiModel: config.geminiModel.get(),
  })));
}

function abortable(operation, signal) {
  if (signal === undefined) return operation;
  if (signal.aborted) return Promise.reject(abortError(signal));
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(abortError(signal));
    signal.addEventListener("abort", onAbort, { once: true });
    Promise.resolve(operation).then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

function isAbortError(error) {
  return error instanceof DOMException && error.name === "AbortError";
}

function abortError(signal, cause) {
  return new WebError("Web search aborted", "WEB_PROVIDER_ABORTED", { cause });
}

export {
  Config,
  DEFAULTS,
  MULTI_SETTINGS_NAMESPACE,
  MultiSearchProvider,
  apply,
  inject,
  name,
  stabilizeToolCallIdentity,
};
