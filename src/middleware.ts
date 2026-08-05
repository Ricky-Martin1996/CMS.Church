import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

const isAppRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/people(.*)",
  "/households(.*)",
  "/attendance(.*)",
  "/visitors(.*)",
  "/ministries(.*)",
  "/volunteers(.*)",
  "/schedule(.*)",
  "/events(.*)",
  "/communications(.*)",
  "/giving(.*)",
  "/groups(.*)",
  "/settings(.*)",
  "/onboarding(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  if (isAppRoute(request) || request.nextUrl.pathname.startsWith("/api/")) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
