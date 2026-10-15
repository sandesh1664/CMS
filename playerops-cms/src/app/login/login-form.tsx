"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        redirectTo: "/",
      });

      if (!result || result.error) {
        setError("Sign-in failed. Check your credentials or contact your administrator.");
        setPending(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          disabled={pending}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-400 disabled:opacity-60"
          placeholder="you@company.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          disabled={pending}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-400 disabled:opacity-60"
          placeholder="Enter your password"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in securely"}
      </button>
    </form>
  );
}
