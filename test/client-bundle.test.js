import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);

test("声明并导出 DSH Web 客户端配置卡片", async () => {
  const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

  assert.match(pkg.version, /^\d+\.\d+\.\d+(-[\w.]+)?$/);
  const changelog = await readFile(new URL("CHANGELOG.md", root), "utf8");
  assert.ok(changelog.includes(`## ${pkg.version} - `), "CHANGELOG.md 应包含当前版本的条目");
  assert.equal(pkg.exports["./client"].default, "./lib/client.js");
  assert.equal(pkg.dsh.client.platform, "web");
  assert.ok(pkg.dsh.client.inject.includes("@deepseek-ai/dsh-client-ui-plugin-manager"));
  assert.ok(!pkg.dsh.client.inject.includes("@deepseek-ai/dsh-client-runtime"));
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
    ["slots", "locale", "remote", "remote.credentials", "configForms"],
  );

  let registered;
  const scope = {
    getSnapshot: () => ({ status: "loading" }),
    subscribe: () => () => {},
    set: async () => {},
    unset: async () => {},
  };
  const credentials = { describe: async () => ({ ok: true, value: {} }) };
  const ctx = {
    effect(callback) {
      callback();
    },
    locale: {
      bind: () => (key) => key,
      register: () => () => {},
    },
    configForms: {
      get(ns) {
        assert.equal(ns, "web-search-multi");
        return scope;
      },
      whileServed(_names, mount) {
        mount();
        return () => {};
      },
    },
    remote: { credentials },
    slots: {
      inject(name, callback) {
        assert.equal(name, "plugins.item");
        callback();
      },
      register(options, component) {
        registered = { options, component };
        return () => {};
      },
    },
  };

  plugin.apply(ctx);
  assert.equal(registered.options.name, "plugins.item");
  assert.equal(registered.options.id, "web-search-multi");
  assert.equal(typeof registered.options.inject, "function");
  assert.equal(typeof registered.component, "function");
  assert.equal(registered.options.inject().scope, scope);
  // The credential namespace must come from `remote.credentials`: the
  // connection handle carries no `api` member.
  assert.equal(registered.options.inject().credentials, credentials);
});
