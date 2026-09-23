import assert from "node:assert/strict";
import test from "node:test";
import http from "node:http";

import { RETRY_DELAYS_MS, describeError, fetchWithRetry } from "../lib/retry.js";

// Local server that destroys the first `resetCount` sockets, then serves JSON.
// Each served response reports how many connection attempts were seen.
function startResetServer(resetCount) {
  let attempts = 0;
  const server = http.createServer((req, res) => {
    attempts += 1;
    if (attempts <= resetCount) {
      res.socket.destroy();
      return;
    }
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, attempts }));
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({
        server,
        url: "http://127.0.0.1:" + server.address().port + "/",
        attempts: () => attempts,
      });
    });
  });
}

const ORIGINAL_DELAYS = [...RETRY_DELAYS_MS];

function setDelays(...values) {
  RETRY_DELAYS_MS.length = 0;
  RETRY_DELAYS_MS.push(...values);
}

test("fetchWithRetry retries past transient connection resets", async () => {
  setDelays(10, 10, 10);
  try {
    const handle = await startResetServer(2);
    try {
      const response = await fetchWithRetry(handle.url, { method: "POST", body: "ping" });
      assert.equal(response.status, 200);
      const data = await response.json();
      assert.equal(data.attempts, 3);
    } finally {
      await new Promise((resolve) => handle.server.close(resolve));
    }
  } finally {
    setDelays(...ORIGINAL_DELAYS);
  }
});

test("fetchWithRetry rethrows the last network error after exhausting retries", async () => {
  setDelays(10, 10, 10);
  try {
    const handle = await startResetServer(Number.POSITIVE_INFINITY);
    try {
      await assert.rejects(
        fetchWithRetry(handle.url, { method: "POST", body: "ping" }),
        (error) => {
          assert.ok(error instanceof TypeError, "raw fetch error should pass through");
          const detail = error.cause?.code ?? error.cause?.message ?? "";
          assert.match(detail, /ECONNRESET|EPIPE|hang up|UND_ERR_SOCKET/);
          return true;
        },
      );
      assert.equal(handle.attempts(), 4);
    } finally {
      await new Promise((resolve) => handle.server.close(resolve));
    }
  } finally {
    setDelays(...ORIGINAL_DELAYS);
  }
});

test("aborting during backoff rejects promptly", async () => {
  setDelays(5000);
  try {
    const handle = await startResetServer(Number.POSITIVE_INFINITY);
    try {
      const controller = new AbortController();
      const started = Date.now();
      const pending = fetchWithRetry(handle.url, { method: "POST", body: "ping" }, controller.signal);
      setTimeout(() => controller.abort(), 30);
      await assert.rejects(pending);
      const elapsed = Date.now() - started;
      assert.ok(elapsed < 2000, "abort should not wait out the backoff delay, took " + elapsed + "ms");
    } finally {
      await new Promise((resolve) => handle.server.close(resolve));
    }
  } finally {
    setDelays(...ORIGINAL_DELAYS);
  }
});

test("describeError surfaces the underlying cause", () => {
  const withCode = new TypeError("fetch failed");
  withCode.cause = Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" });
  assert.match(describeError(withCode), /\[ECONNRESET\]/);

  const withMessage = new TypeError("fetch failed");
  withMessage.cause = new Error("unexpected eof while reading");
  assert.match(describeError(withMessage), /\(unexpected eof while reading\)/);

  assert.equal(describeError(new Error("plain")), "Error: plain");
});
