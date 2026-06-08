import {
  type RouteConfig,
  index,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/translate.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("manage", "routes/manage.tsx"),
  route("settings", "routes/settings.tsx"),
  route("history", "routes/history.tsx"),
  route("history/:id", "routes/history.$id.tsx"),
  route("api/sentences/:id", "routes/api.sentences.$id.tsx"),
  route("api/examples", "routes/api.examples.tsx"),
] satisfies RouteConfig;
