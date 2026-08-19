import assert from "node:assert/strict";
import test from "node:test";

import { stabilizeToolCallIdentity } from "../lib/index.js";

async function* brokenDeepSeekStream() {
  yield { type: "block-start", index: 1, blockType: "tool-call" };
  yield {
    type: "tool-call-delta",
    index: 1,
    id: "chatcmpl-tool-search-1",
    name: "web_search",
    argumentsDelta: "",
  };
  yield {
    type: "tool-call-delta",
    index: 1,
    id: "",
    name: null,
    argumentsDelta: "",
  };
  yield {
    type: "tool-call-delta",
    index: 1,
    id: "",
    name: null,
    argumentsDelta: '{"query":"example.com"}',
  };
  yield {
    type: "block-end",
    index: 1,
    block: {
      type: "tool-call",
      id: "",
      name: "",
      arguments: '{"query":"example.com"}',
    },
  };
  yield { type: "finish", reason: { kind: "tool-calls" } };
}

test("保留 DeepSeek 后续空帧之前的工具调用标识", async () => {
  const chunks = [];
  for await (const chunk of stabilizeToolCallIdentity(brokenDeepSeekStream())) {
    chunks.push(chunk);
  }

  const deltas = chunks.filter((chunk) => chunk.type === "tool-call-delta");
  assert.equal(deltas.length, 3);
  for (const delta of deltas) {
    assert.equal(delta.id, "chatcmpl-tool-search-1");
    assert.equal(delta.name, "web_search");
  }

  const end = chunks.find((chunk) => chunk.type === "block-end");
  assert.equal(end.block.id, "chatcmpl-tool-search-1");
  assert.equal(end.block.name, "web_search");
});

test("不同工具调用索引之间不会串用标识", async () => {
  async function* stream() {
    yield { type: "tool-call-delta", index: 0, id: "call-a", name: "web_search", argumentsDelta: "" };
    yield { type: "tool-call-delta", index: 1, id: "call-b", name: "bash", argumentsDelta: "" };
    yield { type: "tool-call-delta", index: 0, id: "", name: null, argumentsDelta: "{}" };
    yield { type: "tool-call-delta", index: 1, id: "", name: null, argumentsDelta: "{}" };
  }

  const chunks = [];
  for await (const chunk of stabilizeToolCallIdentity(stream())) chunks.push(chunk);

  assert.deepEqual(
    chunks.map(({ index, id, name }) => ({ index, id, name })),
    [
      { index: 0, id: "call-a", name: "web_search" },
      { index: 1, id: "call-b", name: "bash" },
      { index: 0, id: "call-a", name: "web_search" },
      { index: 1, id: "call-b", name: "bash" },
    ],
  );
});
