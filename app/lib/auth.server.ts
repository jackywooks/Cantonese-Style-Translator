import { createCookieSessionStorage, redirect } from "react-router";
import { appEnv } from "./env.server";

const AUTH_KEY = "authed";

function storage() {
  return createCookieSessionStorage({
    cookie: {
      name: "__cst_session",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secrets: [appEnv.SESSION_SECRET],
      secure: true,
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

export function checkPassword(input: string): boolean {
  return Boolean(input) && input === appEnv.APP_PASSWORD;
}
