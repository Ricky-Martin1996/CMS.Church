import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(174_48%_34%/0.12),transparent_55%)]" />
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
          },
        }}
        fallbackRedirectUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
