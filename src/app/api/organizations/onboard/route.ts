import { z } from "zod";
import { bootstrapPersonalOrganization } from "@/server/auth/session";
import { ACTIVE_ORG_COOKIE } from "@/server/errors";
import { handleRouteError, jsonCreated } from "@/server/http";
import { assertSameOrigin } from "@/server/security/csrf";
import { assertRateLimit, RateLimits } from "@/server/security/rate-limit";
import { auth } from "@clerk/nextjs/server";

const schema = z.object({
  churchName: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .optional(),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const { userId } = await auth();
    assertRateLimit(
      `onboard:${userId ?? "anon"}`,
      RateLimits.onboard
    );

    const body = schema.parse(await req.json());
    const result = await bootstrapPersonalOrganization(body);

    // Set the active-org cookie on the response object. Using
    // `cookies()` from `next/headers` throws outside the Next.js
    // request async store and was surfacing as a generic 500 after
    // the organization row was already created.
    const response = jsonCreated({
      organization: result.organization,
      membership: result.membership,
    });
    response.cookies.set(ACTIVE_ORG_COOKIE, result.organization.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
