import {
  Form,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { isAuthed } from "./lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  return { authed: await isAuthed(request) };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-slate-900 text-slate-100">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { authed } = useLoaderData<typeof loader>();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800">
        <div className="w-full max-w-4xl mx-auto flex items-center gap-4 p-4">
          <Link to="/" className="text-lg font-bold text-sky-400">
            Cantonese <span className="text-emerald-400">Style</span> Translator
          </Link>
          {authed && (
            <nav className="flex items-center gap-4 text-sm ml-4">
              <Link to="/" className="text-sky-300 hover:text-sky-200">
                Translate
              </Link>
              <Link to="/manage" className="text-sky-300 hover:text-sky-200">
                Examples
              </Link>
              <Link to="/history" className="text-sky-300 hover:text-sky-200">
                History
              </Link>
              <Link to="/settings" className="text-sky-300 hover:text-sky-200">
                Settings
              </Link>
            </nav>
          )}
          {authed && (
            <Form method="post" action="/logout" className="ml-auto">
              <button className="text-slate-400 hover:text-slate-200 text-sm">
                Logout
              </button>
            </Form>
          )}
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1 className="text-2xl text-sky-400">{message}</h1>
      <p className="text-slate-300">{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto text-xs text-slate-400">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
