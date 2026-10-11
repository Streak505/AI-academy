import { afterEach, describe, expect, it } from "vitest";
import { getBlobStoreStatus, getPrivateBlobToken, getPublicBlobToken, storeIdFromToken } from "@/lib/blob";

const blobVariables = [
  "BLOB_PRIVATE_STORE_ID",
  "BLOB_PRIVATE_READ_WRITE_TOKEN",
  "BLOB_PRIVATE",
  "BLOB_READ_WRITE_TOKEN",
  "BLOB_PUBLIC_READ_WRITE_TOKEN",
] as const;

function withBlobEnvironment(values: Partial<Record<(typeof blobVariables)[number], string>>, run: () => void) {
  const previous = new Map(blobVariables.map((name) => [name, process.env[name]]));
  for (const name of blobVariables) {
    delete process.env[name];
    const value = values[name];
    if (value !== undefined) process.env[name] = value;
  }
  try {
    run();
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

describe("Blob token selection", () => {
  const previous = new Map(blobVariables.map((name) => [name, process.env[name]]));
  afterEach(() => {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it("parses read-write tokens without exposing the secret", () => {
    expect(storeIdFromToken("vercel_blob_rw_store_AbC-123_secret_with_parts")).toBe("store_AbC-123");
    expect(storeIdFromToken("not-a-blob-token")).toBeNull();
  });

  it("binds private and public tokens to different stores", () => {
    withBlobEnvironment({
      BLOB_PRIVATE_STORE_ID: "store_private-123",
      BLOB_PRIVATE_READ_WRITE_TOKEN: "vercel_blob_rw_private-123_private_secret",
      BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_public-456_public_secret",
      BLOB_PUBLIC_READ_WRITE_TOKEN: "vercel_blob_rw_PRIVATE-123_wrong_store_secret",
    }, () => {
      expect(getPrivateBlobToken()).toBe("vercel_blob_rw_private-123_private_secret");
      expect(getPublicBlobToken()).toBe("vercel_blob_rw_public-456_public_secret");
      expect(getBlobStoreStatus()).toEqual({
        privateStoreId: "private-123",
        publicStoreId: "public-456",
        privateResolved: true,
        publicResolved: true,
        storesDifferent: true,
      });
    });
  });

  it("fails if the private store cannot be identified", () => {
    withBlobEnvironment({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_public-456_public_secret" }, () => {
      expect(() => getPublicBlobToken()).toThrow(/private store cannot be identified/);
      expect(() => getPrivateBlobToken()).toThrow(/no valid private token is configured/);
    });
  });
});
