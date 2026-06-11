import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "fallback-development-secret-only-1234567890",
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        console.log("[GitHub OAuth] Profile response:", profile);
        return {
          id: profile.id?.toString() ?? profile.login ?? "",
          name: profile.name ?? profile.login ?? "GitHub User",
          email: profile.email ?? null,
          image: profile.avatar_url ?? null,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      id: "dev-login",
      name: "Developer Login",
      credentials: {
        email: { label: "Email", type: "text" },
        name: { label: "Name", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        return {
          id: (credentials.email as string).replace(/[^a-zA-Z0-9]/g, "-"),
          name: (credentials.name as string) || "Dev User",
          email: credentials.email as string,
          image: `https://api.dicebear.com/7.x/bottts/svg?seed=${credentials.email}`,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Google login requires an existing account created via GitHub (same email)
      if (account?.provider === "google") {
        if (!user.email) return "/login?error=OAuthAccountNotLinked";

        try {
          const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            (process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}`
              : "http://localhost:3000");

          const res = await fetch(
            `${baseUrl}/api/check-user?email=${encodeURIComponent(user.email)}`,
            {
              headers: {
                "x-api-key": process.env.AUTH_SECRET || "fallback-development-secret-only-1234567890",
              },
            }
          );

          if (!res.ok) {
            // API error — redirect with a clear message instead of failing silently
            console.error(`[Auth] check-user API error: ${res.status}`);
            return "/login?error=ServerError";
          }

          const data = await res.json();
          if (!data.exists) {
            // No GitHub account with this email — block and explain
            return "/login?error=NoGitAccount";
          }
        } catch (err) {
          console.error("[Auth] Error checking existing user for Google login:", err);
          return "/login?error=ServerError";
        }
      }
      return true;
    },

    async jwt({ token, user, account, profile }) {
      if (user) {
        token.userId = user.id;
        token.provider = account?.provider ?? null;
        token.providerAccountId = account?.providerAccountId ?? null;
        if (account?.provider === "github" && profile) {
          token.githubCreatedAt = (profile as any).created_at ?? null;
          token.githubPublicRepos = (profile as any).public_repos ?? null;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.provider = token.provider as string | null;
        session.user.githubCreatedAt = token.githubCreatedAt as string | null;
        session.user.githubPublicRepos = token.githubPublicRepos as number | null;
      }
      return session;
    },
  },

  events: {
    // User upsert is handled by the POST /api/auth/[...nextauth] handler
    // to keep firebase-admin out of this shared module
  },

  pages: {
    signIn: "/login",
  },
});

// Augment NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string | null;
      githubCreatedAt?: string | null;
      githubPublicRepos?: number | null;
    };
  }
}
