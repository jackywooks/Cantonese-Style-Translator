/** Mask a secret to a short hint, e.g. "sk-abcd1234" → "••••1234". Never
 *  exposes more than the last 4 characters. Returns null for empty input. */
export function maskSecret(secret: string | null | undefined): string | null {
  if (!secret) return null;
  const tail = secret.slice(-4);
  return `••••${tail}`;
}
