/** Normalize Firebase service-account private key from env (handles Hostinger single-line values). */
export function parseFirebasePrivateKey(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;

  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  key = key.replace(/\\n/g, '\n').trim();

  if (!key.includes('BEGIN PRIVATE KEY')) {
    return undefined;
  }

  return key;
}

export function hasFirebaseCredentials(input: {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}): boolean {
  return !!(
    input.projectId?.trim() &&
    input.clientEmail?.trim() &&
    parseFirebasePrivateKey(input.privateKey)
  );
}
