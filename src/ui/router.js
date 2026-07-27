import { selectRole } from "../domain/roles.js";

export const ROUTES = Object.freeze([
  "/",
  "/student",
  "/teacher",
  "/parent",
]);

const ROUTE_DESCRIPTORS = new Map([
  ["/", { id: "entrance", path: "/", role: null }],
  ["/student", { id: "student", path: "/student", role: "student" }],
  ["/teacher", { id: "teacher", path: "/teacher", role: "teacher" }],
  ["/parent", { id: "parent", path: "/parent", role: "parent" }],
]);

export function resolveRoute(candidate) {
  const route = ROUTE_DESCRIPTORS.get(candidate);
  if (!route) {
    return {
      id: "entrance",
      path: "/",
      role: null,
      matched: false,
    };
  }

  return { ...route, matched: true };
}

export function selectRoleInterface(role) {
  const selection = selectRole(role);

  return {
    ...selection,
    route: `/${role}`,
  };
}
