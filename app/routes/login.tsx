import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/login";
import {
  checkPassword,
  createAuthedSession,
  isAuthed,
} from "../lib/auth.server";

export function meta() {
  return [{ title: "Login · Cantonese Style Translator" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  if (await isAuthed(request)) throw redirect("/");
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  if (await checkPassword(password)) {
    return createAuthedSession("/");
  }
  return { error: "Incorrect password." };
}

export default function Login() {
  const data = useActionData<typeof action>();
  const error = data && "error" in data ? data.error : null;
  return (
    <div className="flex items-center justify-center p-4 pt-20">
      <Form
        method="post"
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-bold text-sky-400">Sign in</h1>
        <input
          type="password"
          name="password"
          autoFocus
          required
          placeholder="Password"
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-slate-100"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-md">
          Enter
        </button>
      </Form>
    </div>
  );
}
