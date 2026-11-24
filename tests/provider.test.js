import test from "node:test";
import assert from "node:assert/strict";

process.env.API_KEY = "x".repeat(32);
const { chat } = await import("../src/lib/api-handler.js");

function mockRes() {
  return {
    code: 200, body: null, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; }
  };
}
const req = (body, ip = "1.1.1.1") => ({
  headers: { authorization: `Bearer ${process.env.API_KEY}` },
  ip, body
});

test("only gemini and claude providers are accepted", async () => {
  for (const provider of ["monte", "balanced", "other"]) {
    const res = mockRes();
    await chat(req({ prompt: "hi", provider }, "2.2.2.2"), res);
    assert.equal(res.code, 400);
  }
});

test("claude provider calls only the Claude endpoint", async () => {
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response(JSON.stringify({ response: "ok" }), { status: 200 });
  };
  try {
    const res = mockRes();
    await chat(req({ prompt: "hi", provider: "claude" }, "3.3.3.3"), res);
    assert.equal(res.code, 200);
    assert.equal(res.body.provider, "claude");
    assert.equal(calls.length, 1);
    assert.match(calls[0], /omegatech\.app\/api\/ai\/Claude/);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("rejects missing or wrong token", async () => {
  const res = mockRes();
  await chat({ headers: {}, ip: "4.4.4.4", body: { prompt: "hi" } }, res);
  assert.equal(res.code, 401);
});
