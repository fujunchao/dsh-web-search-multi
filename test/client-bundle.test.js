import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);

test("声明并导出 DSH Web 客户端配置卡片", async () => {
  const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

  assert.equal(pkg.version, "0.1.2");
  assert.equal(pkg.exports["./client"].default, "./lib/client.js");
  assert.equal(pkg.dsh.client.platform, "web");
  assert.ok(pkg.dsh.client.inject.includes("@deepseek-ai/dsh-client-ui-settings-plugins"));
});

test("客户端 bundle 在 web-search-multi 命名空间注册配置卡片", async () => {
  const source = await readFile(new URL("lib/client.js", root), "utf8");
  let definition;
  vm.runInNewContext(source, {
    window: {
      __ModuleLoader__: {
        load(value) {
          definition = value;
        },
      },
    },
  });

  assert.equal(definition.id, "dsh-web-search-multi");
  const plugin = definition.factory((id) => {
    assert.equal(id, "react");
    return {};
  });
  assert.deepEqual(
    [...plugin.inject],
    ["slots", "locale", "connection", "remote", "settingsScope"],
  );

  let registered;
  const scope = {
    getSnapshot: () => ({ status: "loading" }),
    subscribe: () => () => {},
    set: async () => {},
    unset: async () => {},
  };
  const api = { credentials: {} };
  const ctx = {
    effect(callback) {
      callback();
    },
    locale: {
      bind: () => (key) => key,
      register: () => () => {},
    },
    settingsScope: {
      bind(spec) {
        assert.equal(spec.namespace, "web-search-multi");
        return scope;
      },
    },
    get(service) {
      assert.equal(service, "connection");
      return { api };
    },
    slots: {
      inject(name, callback) {
        assert.equal(name, "settings.plugin.item");
        callback();
      },
      register(options, component) {
        registered = { options, component };
        return () => {};
      },
    },
  };

  plugin.apply(ctx);
  assert.equal(registered.options.name, "settings.plugin.item");
  assert.equal(registered.options.key, "web-search-multi");
  assert.equal(typeof registered.options.inject, "function");
  assert.equal(typeof registered.component, "function");
  assert.equal(registered.options.inject().scope, scope);
  assert.equal(registered.options.inject().api, api);
});
