import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { DEV_ADMIN_SESSION, DEV_SHOP_SESSION } from "@/lib/dev-session";

const nextAuth = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.shopId = (user as any).shopId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as UserRole;
        (session.user as any).shopId = token.shopId as string | null;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash || !user.isActive) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          shopId: user.shopId,
        };
      },
    }),
  ],
});

export const { handlers, signIn, signOut } = nextAuth;

const realAuth = nextAuth.auth;

async function getDevSession() {
  try {
    const headerList = await headers();
    const pathname = headerList.get("x-pathname") || headerList.get("referer") || "";
    if (pathname.includes("/admin")) return DEV_ADMIN_SESSION;
    return DEV_SHOP_SESSION;
  } catch {
    return DEV_SHOP_SESSION;
  }
}

export const auth = (async (...args: any[]) => {
  if (process.env.DEV_BYPASS === "true") {
    return getDevSession();
  }
  return (realAuth as any)(...args);
}) as typeof realAuth;
