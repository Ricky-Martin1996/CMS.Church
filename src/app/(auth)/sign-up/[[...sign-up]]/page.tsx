import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(174_48%_34%/0.12),transparent_55%)]" />
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
          },
        }}
        fallbackRedirectUrl="/onboarding"
        signInUrl="/sign-in"
      />
    </div>
  );
}
