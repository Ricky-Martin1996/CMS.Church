import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/server/errors";

export default async function HomePage() {
  const { userId } = await auth();
  redirect(userId ? AUTH_ROUTES.afterSignIn : AUTH_ROUTES.signIn);
}
