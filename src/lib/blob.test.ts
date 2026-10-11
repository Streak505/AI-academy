import assert from "node:assert/strict";
import test from "node:test";
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

test("storeIdFromToken parses read-write tokens without exposing the secret", () => {
  assert.equal(storeIdFromToken("vercel_blob_rw_store_AbC-123_secret_with_parts"), "store_AbC-123");
  assert.equal(storeIdFromToken("not-a-blob-token"), null);
});

test("Blob token resolvers bind private and public tokens to different stores", () => {
  withBlobEnvironment({
    BLOB_PRIVATE_STORE_ID: "store_private-123",
    BLOB_PRIVATE_READ_WRITE_TOKEN: "vercel_blob_rw_private-123_private_secret",
    BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_public-456_public_secret",
    BLOB_PUBLIC_READ_WRITE_TOKEN: "vercel_blob_rw_PRIVATE-123_wrong_store_secret",
  }, () => {
    assert.equal(getPrivateBlobToken(), "vercel_blob_rw_private-123_private_secret");
    assert.equal(getPublicBlobToken(), "vercel_blob_rw_public-456_public_secret");
    assert.deepEqual(getBlobStoreStatus(), {
      privateStoreId: "private-123",
      publicStoreId: "public-456",
      privateResolved: true,
      publicResolved: true,
      storesDifferent: true,
    });
  });
});

test("public token resolution fails if the private store cannot be identified", () => {
  withBlobEnvironment({
    BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_public-456_public_secret",
  }, () => {
    assert.throws(() => getPublicBlobToken(), /private store cannot be identified/);
    assert.throws(() => getPrivateBlobToken(), /no valid private token is configured/);
  });
});
