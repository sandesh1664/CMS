import type { DefaultSession } from "next-auth";

type StaffRole = "ADMIN" | "STAFF";

declare module "next-auth" {
  interface User {
    role: StaffRole;
  }

  interface Session {
    user: {
      id: string;
      role: StaffRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: StaffRole;
  }
}
