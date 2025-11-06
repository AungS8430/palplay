import NextAuth, { type NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "playlist-modify-public playlist-modify-private user-read-private user-read-email",
        },
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope:
            "openid profile email https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly",
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      console.log("Session callback triggered");
      console.log("User from database:", user);

      if (user) {
        session.userId = user.id;
        if (session.user) {
          (session.user as any).id = user.id;
        }
      }

      console.log("Session after callback:", session);
      return session;
    }
  },
  events: {
    // runs after successful sign-in
    async signIn({ user, account }) {
      if (!user || !account) return;
      try {
        const provider = account.provider;
        const userId = (user as any).id as string;
        const accessToken = account.access_token as string | undefined;
        const refreshToken = (account as any).refresh_token as string | undefined;
        const expiresAt = account.expires_at ? new Date(account.expires_at * 1000) : undefined;

        const encryptedRefresh = refreshToken ? encrypt(refreshToken) : null;
        const encryptedAccess = accessToken ? encrypt(accessToken) : null;

        // Upsert encrypted tokens into user_provider_tokens
        await prisma.userProviderToken.upsert({
          where: { userId_provider: { userId, provider } },
          update: {
            refreshTokenEncrypted: encryptedRefresh,
            accessTokenEncrypted: encryptedAccess,
            tokenExpiresAt: expiresAt || undefined,
          },
          create: {
            userId,
            provider,
            refreshTokenEncrypted: encryptedRefresh,
            accessTokenEncrypted: encryptedAccess,
            tokenExpiresAt: expiresAt || undefined,
          },
        });

        // Clear plaintext tokens from Account table for safety
        await prisma.account.updateMany({
          where: {
            provider,
            providerAccountId: account.providerAccountId,
          },
          data: {
            refresh_token: null,
            access_token: null,
          },
        });
      } catch (err) {
        console.error("signIn event: failed to persist encrypted provider tokens", {
          userId: (user as any).id,
          provider: account.provider,
          error: (err as Error).message,
        });
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };