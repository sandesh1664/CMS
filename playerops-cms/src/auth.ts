import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },

  providers: [
    Credentials({
      name: "Staff login",
      credentials: {
        email: {
          label: "Work email",
          type: "email",
          placeholder: "staff@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const staff = await prisma.staff.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            isActive: true,
          },
        });

        if (!staff || !staff.isActive || !staff.passwordHash) {
          return null;
        }

        const passwordMatches = await compare(
          parsed.data.password,
          staff.passwordHash,
        );

        if (!passwordMatches) return null;

        return {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id =
          typeof token.id === "string"
            ? token.id
            : typeof token.sub === "string"
              ? token.sub
              : "";

        session.user.role =
          token.role === "ADMIN" ? "ADMIN" : "STAFF";
      }
      return session;
    },
  },
});
