import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AUTH_ROUTES } from "@/server/errors";
import OnboardingForm from "@/components/auth/onboarding-form";

export const metadata = {
  title: "Create your church",
};

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect(AUTH_ROUTES.signIn);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(174_48%_34%/0.12),transparent_55%)]" />
      <OnboardingForm />
    </div>
  );
}
