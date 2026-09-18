import assert from "node:assert/strict";
import test from "node:test";

import { MultiSearchProvider } from "../lib/index.js";

/** Minimal Response stand-in for the one fetch call searchGemini makes. */
function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    async json() {
      return body;
    },
  };
}

/**
 * Run searchGemini against a stubbed transport and return the parsed result.
 * The literal api key keeps the call off the credentials seam.
 */
async function searchGeminiWith(candidate) {
  const provider = new MultiSearchProvider(() => ({}));
  const original = globalThis.fetch;
  globalThis.fetch = async () => jsonResponse({ candidates: [candidate] });
  try {
    return await provider.searchGemini(
      { query: "北京 今天 天气" },
      { geminiApiKey: "test-key", geminiBaseURL: "https://example.invalid/v1beta", geminiModel: "gemini-test" },
      undefined,
    );
  } finally {
    globalThis.fetch = original;
  }
}

test("Gemini 思考片段不进入搜索结果正文", async () => {
  const result = await searchGeminiWith({
    content: {
      parts: [
        { thought: true, text: "**My Thought Process** 我需要先搜索天气。" },
        { text: "北京今天晴，气温 21–29°C。" },
        { thought: true, text: "补充推理：再确认一下日落时间。" },
      ],
    },
    groundingMetadata: {
      groundingChunks: [{ web: { uri: "https://example.com/weather", title: "天气" } }],
    },
  });

  assert.equal(result.content, "北京今天晴，气温 21–29°C。");
  assert.ok(!result.content.includes("Thought Process"), "思考内容不得出现在正文中");
  assert.ok(!result.content.includes("补充推理"), "后续思考片段也不得出现在正文中");
  assert.equal(result.sources.length, 1);
});

test("没有思考片段时保留完整正文", async () => {
  const result = await searchGeminiWith({
    content: { parts: [{ text: "第一段。" }, { text: "第二段。" }] },
    groundingMetadata: { groundingChunks: [] },
  });

  assert.equal(result.content, "第一段。第二段。");
});

test("全部为思考片段时不产生正文", async () => {
  const result = await searchGeminiWith({
    content: { parts: [{ thought: true, text: "只有推理，没有答案。" }] },
    groundingMetadata: { groundingChunks: [] },
  });

  assert.equal(result.content, undefined, "无正文时不应输出 content 字段");
  assert.deepEqual(result.sources, []);
});
