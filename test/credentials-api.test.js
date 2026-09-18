import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);

/**
 * Minimal React stand-in with real hook semantics: hook cells persist by
 * position across renders, and effects rerun only when their dependency list
 * changes (a card that setStates from an effect would otherwise loop forever).
 * The card only needs createElement, useState, useRef, useEffect and
 * useSyncExternalStore.
 */
function fakeReact() {
  const roots = [];
  let current = null;
  let scheduled = false;

  function flush() {
    for (const element of [...roots]) render(element);
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      flush();
    });
  }

  function render(element) {
    if (typeof element?.type !== "function") return;
    const host = (element.host ??= { hooks: [] });
    host.index = 0;
    current = host;
    let output;
    try {
      output = element.type({ ...element.props, children: element.children });
    } finally {
      current = null;
    }
    element.output = output;
    for (const hook of host.hooks) {
      if (hook?.kind !== "effect" || hook.pending === undefined) continue;
      const effect = hook.pending;
      hook.pending = undefined;
      if (typeof hook.cleanup === "function") hook.cleanup();
      const cleanup = effect();
      hook.cleanup = typeof cleanup === "function" ? cleanup : undefined;
    }
  }

  const cell = () => {
    const index = current.index++;
    return (current.hooks[index] ??= {});
  };

  return {
    roots,
    createElement(type, props, ...children) {
      return { type, props: props ?? {}, children: children.flat(2) };
    },
    useState(initial) {
      const hook = cell();
      if (hook.kind === undefined) {
        hook.kind = "state";
        hook.value = typeof initial === "function" ? initial() : initial;
      }
      return [hook.value, (next) => {
        const value = typeof next === "function" ? next(hook.value) : next;
        if (Object.is(value, hook.value)) return;
        hook.value = value;
        schedule();
      }];
    },
    useRef(initial) {
      const hook = cell();
      if (hook.kind === undefined) {
        hook.kind = "ref";
        hook.current = initial;
      }
      return hook;
    },
    useEffect(effect, deps) {
      const hook = cell();
      const changed = hook.kind !== "effect"
        || deps === undefined
        || hook.deps === undefined
        || deps.length !== hook.deps.length
        || deps.some((dep, index) => !Object.is(dep, hook.deps[index]));
      if (hook.kind !== "effect") {
        hook.kind = "effect";
        hook.cleanup = undefined;
      }
      if (changed) {
        hook.deps = deps === undefined ? undefined : [...deps];
        hook.pending = effect;
      }
    },
    useSyncExternalStore(_subscribe, getSnapshot) {
      const hook = cell();
      hook.kind ??= "store";
      return getSnapshot();
    },
    render(element) {
      roots.push(element);
      render(element);
    },
    /**
     * Let microtask reruns and the card's 180ms credential debounce land, then
     * flush one more render so assertions read the settled output.
     */
    async settle(ms = 260) {
      await new Promise((resolve) => setTimeout(resolve, ms));
      flush();
    },
  };
}

/** Depth-first search over rendered output. */
function find(node, predicate, seen = new Set()) {
  if (node === null || node === undefined || typeof node !== "object" || seen.has(node)) return undefined;
  seen.add(node);
  if (predicate(node)) return node;
  for (const child of [node.output, ...(Array.isArray(node.children) ? node.children.flat(2) : [node.children])]) {
    const hit = find(child, predicate, seen);
    if (hit !== undefined) return hit;
  }
  return undefined;
}

function hasText(node, text, seen = new Set()) {
  if (node === null || node === undefined) return false;
  if (typeof node === "string") return node === text;
  if (typeof node !== "object" || seen.has(node)) return false;
  seen.add(node);
  for (const child of [node.output, ...(Array.isArray(node.children) ? node.children.flat(2) : [node.children])]) {
    if (hasText(child, text, seen)) return true;
  }
  return false;
}

async function loadCard() {
  const source = await readFile(new URL("lib/client.js", root), "utf8");
  let definition;
  vm.runInNewContext(source, {
    window: {
      __ModuleLoader__: { load(value) { definition = value; } },
      setTimeout,
      clearTimeout,
    },
    // Browser globals the bundle legitimately reads. A fresh vm context has
    // none of them, and their absence would surface as card-level validation
    // failures (URL.canParse) rather than as a harness gap.
    URL,
    console,
  });
  const react = fakeReact();
  const plugin = definition.factory((id) => {
    assert.equal(id, "react");
    return react;
  });
  return { plugin, react };
}

function snapshot(value) {
  return {
    status: "ready",
    revision: 1,
    value,
    user: null,
    getSnapshot: () => ({ status: "ready", revision: 1, value, user: null }),
    subscribe: () => () => {},
    set: async () => {},
    unset: async () => {},
  };
}

function mountSettingsCard(plugin, react, { remote, snap }) {
  let registered;
  const scope = snap ?? snapshot({});
  const ctx = {
    effect(callback) { callback(); },
    locale: { bind: () => (key) => key, register: () => () => {} },
    settingsScope: { bind: () => scope },
    remote,
    slots: {
      inject(name, callback) { callback(); },
      register(options, component) { registered = { options, component }; return () => {}; },
    },
  };
  plugin.apply(ctx);
  const injected = registered.options.inject();
  assert.ok(!("api" in injected), "card must not receive a connection api handle");
  assert.ok(typeof injected.credentials === "object", "card must receive the remote credentials namespace");
  const element = react.createElement(registered.component, injected);
  react.render(element);
  return { scope, element, react };
}

/** Expand the card so its body (status badge, inputs, footer) renders. */
function expand(react) {
  const header = find(react.roots[0], (node) => node.props?.className === "wsm-header");
  assert.ok(header, "卡片应渲染表头");
  header.props.onClick();
  return header;
}

test("配置卡片通过 ctx.remote.credentials.describe(refs) 查询凭据状态", async () => {
  const { plugin, react } = await loadCard();
  const calls = [];
  const remote = {
    credentials: {
      describe: async (refs) => {
        calls.push(["describe", refs]);
        return { ok: true, value: { TAVILY_API_KEY: { configured: true, writable: true } } };
      },
      set: async () => ({ ok: true }),
    },
  };
  mountSettingsCard(plugin, react, {
    remote,
    snap: snapshot({ tavilyApiKeyEnv: "TAVILY_API_KEY" }),
  });

  await react.settle();
  expand(react);
  await react.settle();

  // The refs array is created inside the vm realm, so compare its contents
  // rather than its prototype identity.
  assert.equal(calls.length, 1, "describe 应被调用一次");
  assert.equal(calls[0][0], "describe");
  assert.deepEqual([...calls[0][1]], ["TAVILY_API_KEY"], "describe 必须以位置参数收到 ref 数组");
  assert.ok(hasText(react.roots[0], "configured"), "文件中已存在的凭据必须显示为已配置");
});

test("保存密钥走 ctx.remote.credentials.set(ref, value)，成功后显示已保存", async () => {
  const { plugin, react } = await loadCard();
  const sets = [];
  const remote = {
    credentials: {
      describe: async () => ({ ok: true, value: { TAVILY_API_KEY: { configured: false, writable: true } } }),
      set: async (ref, value) => {
        sets.push([ref, value]);
        return { ok: true };
      },
    },
  };
  mountSettingsCard(plugin, react, {
    remote,
    snap: snapshot({ tavilyApiKeyEnv: "TAVILY_API_KEY" }),
  });
  await react.settle();

  expand(react);
  await react.settle();

  const apiKeyInput = find(react.roots[0], (node) => node.props?.type === "password");
  assert.ok(apiKeyInput, "展开后应渲染 API Key 输入框");
  apiKeyInput.props.onChange("tvly-new-key");
  await react.settle();

  const save = find(react.roots[0], (node) => typeof node.props?.className === "string" && node.props.className.includes("wsm-button-primary"));
  assert.ok(save, "有未保存修改时应渲染保存按钮");
  await save.props.onClick();
  await react.settle();

  assert.deepEqual(sets, [["TAVILY_API_KEY", "tvly-new-key"]], "set 必须以位置参数收到 (ref, value)");
  assert.ok(hasText(react.roots[0], "saved"), "保存成功后应显示已保存提示");
});

test("凭据写入被拒绝时显示保存失败", async () => {
  const { plugin, react } = await loadCard();
  const remote = {
    credentials: {
      describe: async () => ({ ok: true, value: { TAVILY_API_KEY: { configured: false, writable: true } } }),
      set: async () => ({ ok: false, error: { code: "credential/rejected", message: "nope" } }),
    },
  };
  mountSettingsCard(plugin, react, {
    remote,
    snap: snapshot({ tavilyApiKeyEnv: "TAVILY_API_KEY" }),
  });
  await react.settle();

  expand(react);
  await react.settle();

  const apiKeyInput = find(react.roots[0], (node) => node.props?.type === "password");
  apiKeyInput.props.onChange("tvly-new-key");
  await react.settle();

  const save = find(react.roots[0], (node) => typeof node.props?.className === "string" && node.props.className.includes("wsm-button-primary"));
  await save.props.onClick();
  await react.settle();

  assert.ok(hasText(react.roots[0], "saveFailed"), "写入被拒绝时应显示保存失败");
});
