window.__ModuleLoader__.load({
  id: "dsh-web-search-multi",
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");

    const SETTINGS_NAMESPACE = "web-search-multi";
    const LOCALE_NAMESPACE = "web-search-multi.settings";
    const PROVIDERS = ["tavily", "grok", "openai", "gemini"];
    const DEFAULTS = {
      provider: "tavily",
      tavilyApiKeyEnv: "TAVILY_API_KEY",
      tavilyBaseURL: "https://api.tavily.com",
      tavilyMaxResults: 8,
      tavilySearchDepth: "basic",
      tavilyIncludeAnswer: true,
      grokApiKeyEnv: "XAI_API_KEY",
      grokBaseURL: "https://api.x.ai/v1",
      grokModel: "grok-4.6",
      openaiApiKeyEnv: "OPENAI_API_KEY",
      openaiBaseURL: "https://api.openai.com/v1",
      openaiModel: "gpt-5.6",
      geminiApiKeyEnv: "GEMINI_API_KEY",
      geminiBaseURL: "https://generativelanguage.googleapis.com/v1beta",
      geminiModel: "gemini-3.6-flash",
    };
    const SETTINGS_FIELDS = [
      { key: "provider", type: "string" },
      { key: "tavilyApiKeyEnv", type: "string" },
      { key: "tavilyBaseURL", type: "string" },
      { key: "tavilyMaxResults", type: "number" },
      { key: "tavilySearchDepth", type: "string" },
      { key: "tavilyIncludeAnswer", type: "boolean" },
      { key: "grokApiKeyEnv", type: "string" },
      { key: "grokBaseURL", type: "string" },
      { key: "grokModel", type: "string" },
      { key: "openaiApiKeyEnv", type: "string" },
      { key: "openaiBaseURL", type: "string" },
      { key: "openaiModel", type: "string" },
      { key: "geminiApiKeyEnv", type: "string" },
      { key: "geminiBaseURL", type: "string" },
      { key: "geminiModel", type: "string" },
    ];

    const zh = {
      title: "多后端 Web 搜索",
      description: "选择 Tavily、Grok、OpenAI 或 Gemini，并配置当前搜索后端。",
      expand: "展开设置",
      collapse: "收起设置",
      loading: "正在读取搜索配置…",
      unavailable: "当前部署没有提供此配置命名空间。",
      provider: "搜索后端",
      tavily: "Tavily",
      grok: "Grok / xAI",
      openai: "OpenAI",
      gemini: "Gemini",
      apiKeyEnv: "API Key 凭据名",
      apiKeyEnvHint: "对应 ~/.dsh/.credentials.yaml 中的键名，也可由启动环境提供。",
      apiKey: "API Key",
      apiKeyHint: "密钥只写入凭据服务，不会从网页回显；留空会保留现有密钥。",
      configured: "已配置",
      notConfigured: "未配置",
      checking: "检查中",
      baseURL: "API Endpoint",
      baseURLHint: "填写 API 根地址，不要附加具体搜索方法路径。",
      model: "模型",
      modelHint: "该后端执行联网搜索时使用的模型名。",
      maxResults: "最大结果数",
      maxResultsHint: "Tavily 单次搜索最多返回的结果数量。",
      searchDepth: "搜索深度",
      searchDepthHint: "basic 更快，advanced 搜索更深入。",
      includeAnswer: "包含 Tavily 汇总答案",
      overridden: "已覆盖",
      save: "保存",
      saving: "保存中…",
      discard: "放弃修改",
      saved: "搜索配置已保存。",
      saveFailed: "保存失败，请检查配置或服务日志。",
      invalidProvider: "请选择有效的搜索后端。",
      invalidCredential: "每个后端的 API Key 凭据名都不能为空。",
      invalidURL: "每个后端都必须填写有效的 API Endpoint。",
      invalidModel: "Grok、OpenAI 和 Gemini 的模型名不能为空。",
      invalidMaxResults: "Tavily 最大结果数必须是大于 0 的整数。",
      invalidSearchDepth: "Tavily 搜索深度不能为空。",
    };

    const en = {
      title: "Multi-backend Web search",
      description: "Select Tavily, Grok, OpenAI, or Gemini and configure the active search backend.",
      expand: "Expand settings",
      collapse: "Collapse settings",
      loading: "Loading search settings…",
      unavailable: "This deployment does not expose the settings namespace.",
      provider: "Search backend",
      tavily: "Tavily",
      grok: "Grok / xAI",
      openai: "OpenAI",
      gemini: "Gemini",
      apiKeyEnv: "API key credential name",
      apiKeyEnvHint: "The key in ~/.dsh/.credentials.yaml, or a value supplied by the launch environment.",
      apiKey: "API key",
      apiKeyHint: "The key is write-only and never returned to the browser; leave blank to keep the stored key.",
      configured: "Configured",
      notConfigured: "Not configured",
      checking: "Checking",
      baseURL: "API endpoint",
      baseURLHint: "Enter the API root URL without a concrete search method path.",
      model: "Model",
      modelHint: "Model used by this backend for web search.",
      maxResults: "Maximum results",
      maxResultsHint: "Maximum number of Tavily results per search.",
      searchDepth: "Search depth",
      searchDepthHint: "basic is faster; advanced searches more deeply.",
      includeAnswer: "Include Tavily answer summary",
      overridden: "Overridden",
      save: "Save",
      saving: "Saving…",
      discard: "Discard changes",
      saved: "Search settings saved.",
      saveFailed: "Save failed. Check the configuration or service logs.",
      invalidProvider: "Select a valid search backend.",
      invalidCredential: "Every backend must have an API key credential name.",
      invalidURL: "Every backend must have a valid API endpoint.",
      invalidModel: "Grok, OpenAI, and Gemini must have a model name.",
      invalidMaxResults: "Tavily maximum results must be a positive integer.",
      invalidSearchDepth: "Tavily search depth cannot be empty.",
    };

    const styles = `
.wsm-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}
.wsm-card:hover,.wsm-card[data-open=true]{border-color:var(--dsw-alias-label-dimmed)}
.wsm-card[data-open=true]{background:var(--dsw-alias-bg-layer-2)}
.wsm-header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:transparent;border:0;border-radius:12px;display:flex;align-items:center;gap:12px;padding:14px 16px}
.wsm-header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.wsm-head-text{display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}
.wsm-name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}
.wsm-description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}
.wsm-chevron{color:var(--dsw-alias-label-tertiary);font-size:16px;transition:transform .16s}
.wsm-card[data-open=true] .wsm-chevron{transform:rotate(180deg)}
.wsm-body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding:4px 0 8px}
.wsm-status{color:var(--dsw-alias-label-tertiary);margin:12px 0;font-size:12px;line-height:1.5}
.wsm-field{display:flex;flex-direction:column;gap:6px;padding:12px 0}
.wsm-field+.wsm-field{border-top:1px solid var(--dsw-alias-border-l2)}
.wsm-field-head{display:flex;align-items:center;gap:8px}
.wsm-label{min-width:0;flex:1;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}
.wsm-badge{white-space:nowrap;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);border-radius:999px;padding:1px 8px;font-size:11px;line-height:17px}
.wsm-input,.wsm-select{width:100%;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}
.wsm-input:focus-visible,.wsm-select:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.wsm-input:disabled,.wsm-select:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.wsm-secret-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center}
.wsm-secret-state{white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:12px}
.wsm-hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}
.wsm-check{display:flex;align-items:center;gap:9px;color:var(--dsw-alias-label-primary);font-size:13px}
.wsm-check input{width:16px;height:16px}
.wsm-footer{border-top:1px solid var(--dsw-alias-border-l2);display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:12px 0 4px}
.wsm-message{min-width:0;flex:1;margin:0;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}
.wsm-message[data-error=true]{color:var(--dsw-alias-label-error)}
.wsm-button{appearance:none;font:inherit;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);padding:5px 14px;font-size:13px;line-height:1.5}
.wsm-button-primary{border-color:transparent;background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-layer-3)}
.wsm-button:disabled{opacity:.4;cursor:default}
`;

    function installStyles() {
      if (typeof document === "undefined") return;
      const id = "dsh-web-search-multi/client";
      if (document.querySelector(`style[data-plugin-css=${JSON.stringify(id)}]`) !== null) return;
      const tag = document.createElement("style");
      tag.dataset.plugin = "dsh-web-search-multi";
      tag.dataset.pluginCss = id;
      tag.textContent = styles;
      document.head.appendChild(tag);
    }

    function normalizedConfig(value) {
      const source = value !== null && typeof value === "object" ? value : {};
      const provider = PROVIDERS.includes(source.provider) ? source.provider : DEFAULTS.provider;
      const normalized = { provider };
      for (const field of SETTINGS_FIELDS.slice(1)) {
        const fallback = DEFAULTS[field.key];
        const current = source[field.key] ?? fallback;
        normalized[field.key] = field.type === "boolean" ? current === true : String(current);
      }
      return normalized;
    }

    function userOverrides(snapshot, key) {
      return snapshot.user !== null
        && typeof snapshot.user === "object"
        && Object.hasOwn(snapshot.user, key);
    }

    function sameDraftValue(field, left, right) {
      if (field.type === "boolean") return left === right;
      return String(left) === String(right);
    }

    function draftValue(field, draft) {
      if (field.type === "boolean") return draft[field.key] === true;
      if (field.type === "number") return Number(draft[field.key]);
      return String(draft[field.key]).trim();
    }

    function canParseURL(value) {
      try {
        if (typeof URL.canParse === "function") return URL.canParse(value);
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }

    function validationFailure(draft, t) {
      if (!PROVIDERS.includes(draft.provider)) return t("invalidProvider");
      for (const provider of PROVIDERS) {
        if (String(draft[`${provider}ApiKeyEnv`]).trim() === "") return t("invalidCredential");
        if (!canParseURL(String(draft[`${provider}BaseURL`]).trim())) return t("invalidURL");
      }
      for (const provider of ["grok", "openai", "gemini"]) {
        if (String(draft[`${provider}Model`]).trim() === "") return t("invalidModel");
      }
      const maxResults = Number(draft.tavilyMaxResults);
      if (!Number.isInteger(maxResults) || maxResults < 1) return t("invalidMaxResults");
      if (String(draft.tavilySearchDepth).trim() === "") return t("invalidSearchDepth");
      return "";
    }

    function useScopeSnapshot(scope) {
      return React.useSyncExternalStore(
        (listener) => scope.subscribe(listener),
        () => scope.getSnapshot(),
        () => scope.getSnapshot(),
      );
    }

    function Field({ label, hint, overridden, t, children }) {
      return React.createElement(
        "div",
        { className: "wsm-field" },
        React.createElement(
          "div",
          { className: "wsm-field-head" },
          React.createElement("span", { className: "wsm-label" }, label),
          overridden ? React.createElement("span", { className: "wsm-badge" }, t("overridden")) : null,
        ),
        children,
        hint ? React.createElement("p", { className: "wsm-hint" }, hint) : null,
      );
    }

    function TextInput({ value, onChange, disabled, type = "text", inputMode }) {
      return React.createElement("input", {
        className: "wsm-input",
        type,
        value,
        disabled,
        autoComplete: type === "password" ? "off" : undefined,
        inputMode,
        onChange: (event) => onChange(event.target.value),
      });
    }

    function SearchSettingsCard({ view, scope, credentials, t }) {
      if (view === "summary") return t("description");
      const snapshot = useScopeSnapshot(scope);
      const baseline = normalizedConfig(snapshot.value);
      const [open, setOpen] = React.useState(false);
      const [draft, setDraft] = React.useState(() => normalizedConfig(scope.getSnapshot().value));
      const [secretDrafts, setSecretDrafts] = React.useState({ tavily: "", grok: "", openai: "", gemini: "" });
      const [touched, setTouched] = React.useState(false);
      const [saving, setSaving] = React.useState(false);
      const [message, setMessage] = React.useState("");
      const [failed, setFailed] = React.useState(false);
      const [credentialRefresh, setCredentialRefresh] = React.useState(0);
      const [credential, setCredential] = React.useState({ ref: "", configured: false, writable: true, checking: false });
      const savingRef = React.useRef(false);

      const edit = (key, value) => {
        setDraft((current) => ({ ...current, [key]: value }));
        setTouched(true);
        setMessage("");
        setFailed(false);
      };

      const editSecret = (provider, value) => {
        setSecretDrafts((current) => ({ ...current, [provider]: value }));
        setTouched(true);
        setMessage("");
        setFailed(false);
      };

      React.useEffect(() => {
        if (snapshot.status !== "ready" || touched || savingRef.current) return;
        setDraft(normalizedConfig(snapshot.value));
      }, [snapshot.status, snapshot.revision, touched]);

      const provider = PROVIDERS.includes(draft.provider) ? draft.provider : DEFAULTS.provider;
      const envKey = `${provider}ApiKeyEnv`;
      const baseURLKey = `${provider}BaseURL`;
      const modelKey = `${provider}Model`;
      const credentialRef = String(draft[envKey] ?? "").trim();

      React.useEffect(() => {
        let alive = true;
        if (credentialRef === "") {
          setCredential({ ref: "", configured: false, writable: true, checking: false });
          return () => {
            alive = false;
          };
        }
        setCredential((current) => ({ ...current, ref: credentialRef, checking: true }));
        const timer = window.setTimeout(async () => {
          try {
            const response = await credentials.describe([credentialRef]);
            if (!alive || !response.ok) return;
            const view = response.value[credentialRef];
            setCredential({
              ref: credentialRef,
              configured: view?.configured ?? false,
              writable: view?.writable ?? true,
              checking: false,
            });
          } catch {
            if (alive) setCredential({ ref: credentialRef, configured: false, writable: true, checking: false });
          }
        }, 180);
        return () => {
          alive = false;
          window.clearTimeout(timer);
        };
      }, [credentials, credentialRef, credentialRefresh]);

      const configDirty = snapshot.status === "ready" && SETTINGS_FIELDS.some((field) => !sameDraftValue(field, draft[field.key], baseline[field.key]));
      const secretDirty = PROVIDERS.some((entry) => secretDrafts[entry].trim() !== "");
      const dirty = configDirty || secretDirty;
      const invalid = validationFailure(draft, t);

      const discard = () => {
        setDraft(normalizedConfig(scope.getSnapshot().value));
        setSecretDrafts({ tavily: "", grok: "", openai: "", gemini: "" });
        setTouched(false);
        setMessage("");
        setFailed(false);
      };

      const save = async () => {
        if (saving || !dirty || invalid !== "" || snapshot.status !== "ready") return;
        setSaving(true);
        savingRef.current = true;
        setMessage("");
        setFailed(false);
        const changed = SETTINGS_FIELDS.filter((field) => !sameDraftValue(field, draft[field.key], baseline[field.key]));
        try {
          for (const field of changed) {
            if (!(await scope.set(field.key, draftValue(field, draft)))) {
              throw new Error("settings write was rejected");
            }
          }
          const accepted = normalizedConfig(scope.getSnapshot().value);
          for (const entry of PROVIDERS) {
            const key = secretDrafts[entry].trim();
            if (key === "") continue;
            const ref = String(draft[`${entry}ApiKeyEnv`]).trim();
            const response = await credentials.set(ref, key);
            if (!response.ok) throw new Error("credential write was rejected");
          }
          setDraft(accepted);
          setSecretDrafts({ tavily: "", grok: "", openai: "", gemini: "" });
          setTouched(false);
          setMessage(t("saved"));
          setCredentialRefresh((current) => current + 1);
        } catch {
          setMessage(t("saveFailed"));
          setFailed(true);
        } finally {
          savingRef.current = false;
          setSaving(false);
        }
      };

      const field = (key, labelKey, hintKey, input) => React.createElement(Field, {
        key,
        label: t(labelKey),
        hint: hintKey ? t(hintKey) : "",
        overridden: userOverrides(snapshot, key),
        t,
      }, input);

      const providerOptions = PROVIDERS.map((entry) => React.createElement("option", { key: entry, value: entry }, t(entry)));
      const depthOptions = ["basic", "advanced"];
      if (!depthOptions.includes(draft.tavilySearchDepth)) depthOptions.push(draft.tavilySearchDepth);

      const controls = [
        field("provider", "provider", "", React.createElement("select", {
          className: "wsm-select",
          value: provider,
          disabled: saving,
          onChange: (event) => edit("provider", event.target.value),
        }, providerOptions)),
        field(envKey, "apiKeyEnv", "apiKeyEnvHint", React.createElement(TextInput, {
          value: draft[envKey],
          disabled: saving,
          onChange: (value) => edit(envKey, value),
        })),
        React.createElement(Field, {
          key: `${provider}-api-key`,
          label: t("apiKey"),
          hint: t("apiKeyHint"),
          overridden: false,
          t,
        }, React.createElement(
          "div",
          { className: "wsm-secret-row" },
          React.createElement(TextInput, {
            type: "password",
            value: secretDrafts[provider],
            disabled: saving || !credential.writable,
            onChange: (value) => editSecret(provider, value),
          }),
          React.createElement(
            "span",
            { className: "wsm-secret-state" },
            credential.checking ? t("checking") : credential.configured ? t("configured") : t("notConfigured"),
          ),
        )),
        field(baseURLKey, "baseURL", "baseURLHint", React.createElement(TextInput, {
          value: draft[baseURLKey],
          disabled: saving,
          onChange: (value) => edit(baseURLKey, value),
        })),
      ];

      if (provider === "tavily") {
        controls.push(
          field("tavilyMaxResults", "maxResults", "maxResultsHint", React.createElement(TextInput, {
            value: draft.tavilyMaxResults,
            disabled: saving,
            inputMode: "numeric",
            onChange: (value) => edit("tavilyMaxResults", value),
          })),
          field("tavilySearchDepth", "searchDepth", "searchDepthHint", React.createElement("select", {
            className: "wsm-select",
            value: draft.tavilySearchDepth,
            disabled: saving,
            onChange: (event) => edit("tavilySearchDepth", event.target.value),
          }, depthOptions.map((entry) => React.createElement("option", { key: entry, value: entry }, entry)))),
          React.createElement(Field, {
            key: "tavilyIncludeAnswer",
            label: t("includeAnswer"),
            hint: "",
            overridden: userOverrides(snapshot, "tavilyIncludeAnswer"),
            t,
          }, React.createElement(
            "label",
            { className: "wsm-check" },
            React.createElement("input", {
              type: "checkbox",
              checked: draft.tavilyIncludeAnswer,
              disabled: saving,
              onChange: (event) => edit("tavilyIncludeAnswer", event.target.checked),
            }),
            t("includeAnswer"),
          )),
        );
      } else {
        controls.push(field(modelKey, "model", "modelHint", React.createElement(TextInput, {
          value: draft[modelKey],
          disabled: saving,
          onChange: (value) => edit(modelKey, value),
        })));
      }

      let body;
      if (snapshot.status === "loading") {
        body = React.createElement("p", { className: "wsm-status" }, t("loading"));
      } else if (snapshot.status !== "ready") {
        body = React.createElement("p", { className: "wsm-status" }, t("unavailable"));
      } else {
        body = React.createElement(
          React.Fragment,
          null,
          ...controls,
          React.createElement(
            "div",
            { className: "wsm-footer" },
            React.createElement("p", { className: "wsm-message", "data-error": failed || invalid !== "" }, invalid || message),
            React.createElement("button", {
              type: "button",
              className: "wsm-button",
              disabled: saving || !dirty,
              onClick: discard,
            }, t("discard")),
            React.createElement("button", {
              type: "button",
              className: "wsm-button wsm-button-primary",
              disabled: saving || !dirty || invalid !== "",
              onClick: save,
            }, t(saving ? "saving" : "save")),
          ),
        );
      }

      const title = t("title");
      return React.createElement(
        "li",
        { className: "wsm-card", "data-open": open },
        React.createElement(
          "button",
          {
            type: "button",
            className: "wsm-header",
            "aria-expanded": open,
            "aria-label": `${t(open ? "collapse" : "expand")}: ${title}`,
            onClick: () => setOpen((current) => !current),
          },
          React.createElement(
            "span",
            { className: "wsm-head-text" },
            React.createElement("span", { className: "wsm-name" }, title),
            React.createElement("span", { className: "wsm-description" }, t("description")),
          ),
          dirty ? React.createElement("span", { className: "wsm-badge" }, "●") : null,
          React.createElement("span", { className: "wsm-chevron", "aria-hidden": true }, "⌄"),
        ),
        open ? React.createElement("div", { className: "wsm-body" }, body) : null,
      );
    }

    const inject = ["slots", "locale", "remote", "remote.credentials", "configForms"];

    function apply(ctx) {
      installStyles();
      const t = ctx.locale.bind(LOCALE_NAMESPACE);
      ctx.effect(() => ctx.locale.register(LOCALE_NAMESPACE, { zh, en }), "web-search-multi: settings locale");
      const scope = ctx.configForms.get(SETTINGS_NAMESPACE);
      const credentials = ctx.remote.credentials;
      ctx.effect(() => ctx.configForms.whileServed([SETTINGS_NAMESPACE], () =>
        ctx.slots.inject("plugins.item", () => ctx.slots.register({
          name: "plugins.item",
          id: SETTINGS_NAMESPACE,
          order: 41,
          label: () => t("title"),
          locale: LOCALE_NAMESPACE,
          inject: () => ({ scope, credentials, t }),
        }, SearchSettingsCard))), "web-search-multi: settings card");
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
