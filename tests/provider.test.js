import test from "node:test";
import assert from "node:assert/strict";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

test("email validation accepts ordinary valid addresses", () => {
  for (const email of ["user@example.com", "first.last+tag@example.co.uk", "a@b.io"]) {
    assert.equal(EMAIL_RE.test(email), true, email);
  }
});

test("email validation rejects malformed addresses", () => {
  for (const email of ["plain-text", "user@", "@example.com", "user@example", "two@@example.com", "a b@example.com"]) {
    assert.equal(EMAIL_RE.test(email), false, email);
  }
});
