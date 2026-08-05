export const ACTIVE_ORG_COOKIE = "churchos_org_id";

export const AUTH_ROUTES = {
  signIn: "/sign-in",
  signUp: "/sign-up",
  afterSignIn: "/dashboard",
  onboarding: "/onboarding",
} as const;

export class AppError extends Error {
  constructor(
    message: string,
    readonly code:
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "VALIDATION"
      | "CONFLICT"
      | "RATE_LIMITED",
    readonly status: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function unauthorized(message = "Authentication required") {
  return new AppError(message, "UNAUTHORIZED", 401);
}

export function forbidden(message = "Insufficient permissions") {
  return new AppError(message, "FORBIDDEN", 403);
}

export function notFound(message = "Resource not found") {
  return new AppError(message, "NOT_FOUND", 404);
}

export function conflict(message = "Resource already exists") {
  return new AppError(message, "CONFLICT", 409);
}

export function rateLimited(
  message = "Too many requests. Please try again shortly."
) {
  return new AppError(message, "RATE_LIMITED", 429);
}
