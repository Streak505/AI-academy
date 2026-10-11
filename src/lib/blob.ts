const tokenVariables = [
  "BLOB_PRIVATE_READ_WRITE_TOKEN",
  "BLOB_PRIVATE",
  "BLOB_READ_WRITE_TOKEN",
  "BLOB_PUBLIC_READ_WRITE_TOKEN",
] as const;

type BlobTokenVariable = (typeof tokenVariables)[number];

type BlobTokenCandidate = {
  name: BlobTokenVariable;
  token: string;
  storeId: string;
};

export type BlobStoreStatus = {
  privateStoreId: string | null;
  publicStoreId: string | null;
  privateResolved: boolean;
  publicResolved: boolean;
  storesDifferent: boolean;
};

function normalizeStoreId(storeId: string) {
  return storeId.replace(/^store_/i, "").toLowerCase();
}

export function storeIdFromToken(token: string): string | null {
  const match = /^vercel_blob_rw_(store_[a-z0-9-]+|[a-z0-9-]+)_(.+)$/i.exec(token.trim());
  return match?.[1] ?? null;
}

function getCandidates(env: NodeJS.ProcessEnv): BlobTokenCandidate[] {
  return tokenVariables.flatMap((name) => {
    const token = env[name]?.trim();
    if (!token) return [];
    const storeId = storeIdFromToken(token);
    return storeId ? [{ name, token, storeId: normalizeStoreId(storeId) }] : [];
  });
}

function resolvePrivateStoreId(env: NodeJS.ProcessEnv, candidates: BlobTokenCandidate[]) {
  const configuredStoreId = env.BLOB_PRIVATE_STORE_ID?.trim();
  if (configuredStoreId) return normalizeStoreId(configuredStoreId);
  const fallback = candidates.find(({ name }) =>
    name === "BLOB_PRIVATE_READ_WRITE_TOKEN" || name === "BLOB_PRIVATE"
  );
  return fallback?.storeId ?? null;
}

function findPrivateCandidate(candidates: BlobTokenCandidate[], privateStoreId: string | null) {
  if (privateStoreId) return candidates.find((candidate) => candidate.storeId === privateStoreId);
  return candidates.find(({ name }) =>
    name === "BLOB_PRIVATE_READ_WRITE_TOKEN" || name === "BLOB_PRIVATE"
  );
}

function findPublicCandidate(candidates: BlobTokenCandidate[], privateStoreId: string | null) {
  if (!privateStoreId) return undefined;
  const preference: BlobTokenVariable[] = [
    "BLOB_PUBLIC_READ_WRITE_TOKEN",
    "BLOB_READ_WRITE_TOKEN",
    "BLOB_PRIVATE_READ_WRITE_TOKEN",
    "BLOB_PRIVATE",
  ];
  return preference
    .map((name) => candidates.find((candidate) => candidate.name === name && candidate.storeId !== privateStoreId))
    .find((candidate) => candidate !== undefined);
}

function resolveBlobTokens(env: NodeJS.ProcessEnv) {
  const candidates = getCandidates(env);
  const privateStoreId = resolvePrivateStoreId(env, candidates);
  const privateCandidate = findPrivateCandidate(candidates, privateStoreId);
  const publicCandidate = findPublicCandidate(candidates, privateStoreId);
  return { privateStoreId, privateCandidate, publicCandidate };
}

export function getPrivateBlobToken() {
  const { privateStoreId, privateCandidate } = resolveBlobTokens(process.env);
  if (!privateCandidate) {
    const reason = privateStoreId
      ? "no configured token matches BLOB_PRIVATE_STORE_ID"
      : "no valid private token is configured";
    throw new Error(`Private Vercel Blob token unavailable: ${reason}. Configure BLOB_PRIVATE_READ_WRITE_TOKEN or BLOB_PRIVATE, and set BLOB_PRIVATE_STORE_ID when selecting among stores.`);
  }
  return privateCandidate.token;
}

export function getPublicBlobToken() {
  const { privateStoreId, publicCandidate } = resolveBlobTokens(process.env);
  if (!privateStoreId) {
    throw new Error("Public Vercel Blob token unavailable: the private store cannot be identified. Configure BLOB_PRIVATE_STORE_ID or a valid BLOB_PRIVATE_READ_WRITE_TOKEN/BLOB_PRIVATE token.");
  }
  if (!publicCandidate) {
    throw new Error("Public Vercel Blob token unavailable: configure BLOB_PUBLIC_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN for a store different from the private store.");
  }
  return publicCandidate.token;
}

export function getBlobStoreStatus(): BlobStoreStatus {
  const { privateStoreId, privateCandidate, publicCandidate } = resolveBlobTokens(process.env);
  return {
    privateStoreId,
    publicStoreId: publicCandidate?.storeId ?? null,
    privateResolved: Boolean(privateCandidate),
    publicResolved: Boolean(publicCandidate),
    storesDifferent: Boolean(privateStoreId && publicCandidate && privateStoreId !== publicCandidate.storeId),
  };
}
