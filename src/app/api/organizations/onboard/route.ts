import { z } from "zod";
import { bootstrapPersonalOrganization } from "@/server/auth/session";
import { ACTIVE_ORG_COOKIE } from "@/server/errors";
import { handleRouteError, jsonCreated } from "@/server/http";
import { cookies } from "next/headers";

const schema = z.object({
  churchName: z.string().min(2).max(120),
  slug: z.string().min(2).max(60).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const result = await bootstrapPersonalOrganization(body);

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_ORG_COOKIE, result.organization.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return jsonCreated({
      organization: result.organization,
      membership: result.membership,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
