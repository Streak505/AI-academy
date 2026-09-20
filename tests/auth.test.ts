import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEmail, signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from "../src/lib/auth";

test("normalizes email values consistently", () => {
  assert.equal(normalizeEmail(" User@Example.com "), "user@example.com");
});

test("signs and verifies access tokens", async () => {
  process.env.JWT_SECRET = "test-secret-for-authentication-utilities";
  const token = await signAccessToken({ sub: "user_123", role: "STUDENT" });
  const payload = await verifyAccessToken(token);
  assert.equal(payload?.sub, "user_123");
  assert.equal(payload?.role, "STUDENT");
  assert.equal(payload?.type, "access");
});

test("signs and verifies refresh tokens", async () => {
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-for-authentication-utilities";
  const token = await signRefreshToken({ sub: "user_123", role: "STUDENT" });
  const payload = await verifyRefreshToken(token);
  assert.equal(payload?.sub, "user_123");
  assert.equal(payload?.role, "STUDENT");
  assert.equal(payload?.type, "refresh");
});
