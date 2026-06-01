import { redirect } from "react-router";
import type { Route } from "./+types/logout";
import { destroySession } from "../lib/auth.server";

export async function action({ request }: Route.ActionArgs) {
  return destroySession(request);
}

export async function loader() {
  return redirect("/");
}
