import { Suspense } from "react";
import LoginForm from "./login-form";

function LoginFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
      <p className="text-sm text-slate-400">Loading secure sign-in…</p>
    </main>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
            PlayerOps
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Staff sign in
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in using your authorized staff account.
          </p>
        </div>

        {params.error === "invalid" && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"
          >
            Sign-in failed. Check your credentials or contact your administrator.
          </p>
        )}

        <LoginForm />

        <p className="mt-6 text-center text-xs text-slate-500">
          Access is restricted to authorized staff. Public registration is disabled.
        </p>
      </section>
    </main>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}
