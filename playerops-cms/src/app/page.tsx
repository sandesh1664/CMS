import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./dashboard-client";

async function AuthenticatedDashboard() {
  const session = await auth();
  const staffId = session?.user?.id;

  if (!staffId) {
    redirect("/login");
  }

  // Check current account status and role in PostgreSQL.
  // Do not trust the role cached in the browser or JWT alone.
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!staff || !staff.isActive) {
    redirect("/login?error=inactive");
  }

  return (
    <DashboardClient
      role={staff.role === "ADMIN" ? "Admin" : "Staff"}
      staffName={staff.name}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <p>Checking your staff access…</p>
        </main>
      }
    >
      <AuthenticatedDashboard />
    </Suspense>
  );
}
