import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

test("Node runtime supports required APIs", () => {
  assert.equal(typeof fetch, "function");
  assert.equal(typeof crypto.randomUUID, "function");
});
