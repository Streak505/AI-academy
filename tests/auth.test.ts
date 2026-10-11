import { afterEach, describe, expect, it } from "vitest";
import { normalizeEmail, signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from "../src/lib/auth";

const originalSecrets = {
  access: process.env.JWT_SECRET,
  refresh: process.env.JWT_REFRESH_SECRET,
};

afterEach(() => {
  if (originalSecrets.access === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalSecrets.access;
  if (originalSecrets.refresh === undefined) delete process.env.JWT_REFRESH_SECRET;
  else process.env.JWT_REFRESH_SECRET = originalSecrets.refresh;
});

describe("authentication helpers", () => {
  it("normalizes email values consistently", () => {
    expect(normalizeEmail(" User@Example.com ")).toBe("user@example.com");
  });

  it("signs and verifies access tokens", async () => {
    process.env.JWT_SECRET = "test-secret-for-authentication-utilities";
    const token = await signAccessToken({ sub: "user_123", role: "STUDENT" });
    const payload = await verifyAccessToken(token);
    expect(payload).toMatchObject({ sub: "user_123", role: "STUDENT", type: "access" });
  });

  it("signs and verifies refresh tokens", async () => {
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-for-authentication-utilities";
    const token = await signRefreshToken({ sub: "user_123", role: "STUDENT" });
    const payload = await verifyRefreshToken(token);
    expect(payload).toMatchObject({ sub: "user_123", role: "STUDENT", type: "refresh" });
  });
});
