import { createCookieSessionStorage, redirect } from "react-router";
import { requireEnv } from "./env.server";

const AUTH_KEY = "authed";

function storage() {
  return createCookieSessionStorage({
    cookie: {
      name: "__cst_session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [requireEnv("SESSION_SECRET")],
      // Secure only in production (Cloudflare is always HTTPS). In local dev
      // the server is plain http (incl. LAN IPs for mobile testing), where a
      // Secure cookie would be silently dropped and lock you out of login.
      secure: import.meta.env.PROD,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  });
}

export async function isAuthed(request: Request): Promise<boolean> {
  const session = await storage().getSession(request.headers.get("Cookie"));
  return session.get(AUTH_KEY) === true;
}

export async function requireAuth(request: Request): Promise<void> {
  if (!(await isAuthed(request))) {
    throw redirect("/login");
  }
}

export async function createAuthedSession(redirectTo: string): Promise<Response> {
  const s = storage();
  const session = await s.getSession();
  session.set(AUTH_KEY, true);
  return redirect(redirectTo, {
    headers: { "Set-Cookie": await s.commitSession(session) },
  });
}

export async function destroySession(request: Request): Promise<Response> {
  const s = storage();
  const session = await s.getSession(request.headers.get("Cookie"));
  return redirect("/login", {
    headers: { "Set-Cookie": await s.destroySession(session) },
  });
}

/** SHA-256 digest of a string, as raw bytes. */
async function sha256(value: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
}

/** Constant-time equality over two equal-length byte buffers. */
function timingSafeEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  const av = new Uint8Array(a);
  const bv = new Uint8Array(b);
  if (av.length !== bv.length) return false;
  let diff = 0;
  for (let i = 0; i < av.length; i++) diff |= av[i] ^ bv[i];
  return diff === 0;
}

/**
 * Compare a submitted password to APP_PASSWORD without leaking length or
 * content via timing. Both sides are hashed to a fixed-width digest first so
 * the byte-wise compare is always over equal-length buffers.
 */
export async function checkPassword(input: string): Promise<boolean> {
  if (!input) return false;
  const expected = requireEnv("APP_PASSWORD");
  const [inputHash, expectedHash] = await Promise.all([
    sha256(input),
    sha256(expected),
  ]);
  return timingSafeEqual(inputHash, expectedHash);
}
