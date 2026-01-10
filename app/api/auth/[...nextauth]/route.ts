import NextAuth, { type NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

// Wrap the adapter to intercept linkAccount
const adapter = PrismaAdapter(prisma);
const customAdapter = {
  ...adapter,
  async linkAccount(account: any) {
    console.log("=== linkAccount called ===");
    console.log("Provider:", account.provider);
    console.log("User ID:", account.userId);
    console.log("Access Token present?", !!account.access_token);
    console.log("Refresh Token present?", !!account.refresh_token);

    // Call the original linkAccount first
    const result = await adapter.linkAccount!(account);

    // Now store encrypted tokens
    try {
      const provider = account.provider;
      const userId = account.userId;
      const accessToken = account.access_token;
      const refreshToken = account.refresh_token;
      const expiresAt = account.expires_at ? new Date(account.expires_at * 1000) : undefined;

      const encryptedRefresh = refreshToken ? encrypt(refreshToken) : null;
      const encryptedAccess = accessToken ? encrypt(accessToken) : null;

      if (encryptedAccess || encryptedRefresh) {
        console.log("Storing encrypted tokens for", provider);
        const tokenResult = await prisma.userProviderToken.upsert({
          where: { userId_provider: { userId, provider } },
          update: {
            ...(encryptedAccess && { accessTokenEncrypted: encryptedAccess }),
            ...(encryptedRefresh && { refreshTokenEncrypted: encryptedRefresh }),
            ...(expiresAt && { tokenExpiresAt: expiresAt }),
          },
          create: {
            userId,
            provider,
            refreshTokenEncrypted: encryptedRefresh,
            accessTokenEncrypted: encryptedAccess,
            tokenExpiresAt: expiresAt || undefined,
          },
        });
        console.log("Token storage SUCCESS! ID:", tokenResult.id);

        // Clear plaintext tokens
        if (result && result.id && typeof result.id == "string") {
          await prisma.account.update({
            where: { id: result.id },
            data: {
              refresh_token: null,
              access_token: null,
            },
          });
          console.log("Cleared plaintext tokens from account");

        }
      }
    } catch (err) {
      console.error("linkAccount: failed to store encrypted tokens", err);
    }

    return result;
  },
};

export const authOptions: NextAuthOptions = {
  adapter: customAdapter as any,
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "user-read-private user-read-email " +
            "playlist-modify-public playlist-modify-private " +
            "user-library-read user-library-modify " +
            "user-top-read user-read-recently-played",
          show_dialog: true,
        },
      },
    }),
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   authorization: {
    //     params: {
    //       access_type: "offline",
    //       prompt: "consent",
    //       scope:
    //         "openid profile email https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly",
    //     },
    //   },
    // }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return true;

      console.log("=== signIn callback ===");
      console.log("Provider:", account.provider);
      console.log("User ID:", user.id);
      console.log("Access Token:", account.access_token ? `${account.access_token.substring(0, 20)}...` : "MISSING");
      console.log("Refresh Token:", account.refresh_token ? `${account.refresh_token.substring(0, 20)}...` : "MISSING");
      console.log("Expires At:", account.expires_at);
      console.log("Full account object keys:", Object.keys(account));

      try {
        const provider = account.provider;
        const userId = user.id;

        // Check if user exists in database
        const existingUser = await prisma.user.findUnique({
          where: { id: userId }
        });
        console.log("User exists in DB?", !!existingUser);

        if (!existingUser) {
          console.log("USER NOT FOUND IN DB YET - callback may be running too early");
          // Don't return false, just skip token storage for now
          // The adapter will create the user after this callback
        }
        const accessToken = account.access_token;
        const refreshToken = account.refresh_token;
        const expiresAt = account.expires_at ? new Date(account.expires_at * 1000) : undefined;

        const encryptedRefresh = refreshToken ? encrypt(refreshToken) : null;
        const encryptedAccess = accessToken ? encrypt(accessToken) : null;

        // Prepare update data - only include fields that have values
        const updateData: any = {};
        if (encryptedAccess) updateData.accessTokenEncrypted = encryptedAccess;
        if (encryptedRefresh) updateData.refreshTokenEncrypted = encryptedRefresh;
        if (expiresAt) updateData.tokenExpiresAt = expiresAt;

        console.log("Update data keys:", Object.keys(updateData));
        console.log("Has encrypted access?", !!encryptedAccess);
        console.log("Has encrypted refresh?", !!encryptedRefresh);

        // Only upsert if we have tokens to store
        if (Object.keys(updateData).length > 0) {
          console.log("Attempting upsert with userId:", userId, "provider:", provider);
          const result = await prisma.userProviderToken.upsert({
            where: { userId_provider: { userId, provider } },
            update: updateData,
            create: {
              userId,
              provider,
              refreshTokenEncrypted: encryptedRefresh,
              accessTokenEncrypted: encryptedAccess,
              tokenExpiresAt: expiresAt || undefined,
            },
          });
          console.log("Upsert SUCCESS! Result ID:", result.id);
        } else {
          console.log("Skipping upsert - no tokens to store");
        }

        // Clear plaintext tokens from Account table for safety
        console.log("Clearing plaintext tokens from Account table...");
        const clearResult = await prisma.account.updateMany({
          where: {
            provider,
            providerAccountId: account.providerAccountId,
          },
          data: {
            refresh_token: null,
            access_token: null,
          },
        });
        console.log("Cleared plaintext tokens from", clearResult.count, "account(s)");
      } catch (err) {
        console.error("signIn callback: failed to persist encrypted provider tokens", {
          userId: user.id,
          provider: account.provider,
          error: (err as Error).message,
          stack: (err as Error).stack,
        });
      }

      return true;
    },
    async session({ session, user }) {
      if (user) {
        session.userId = user.id;
        if (session.user) {
          (session.user as any).id = user.id;
        }
      }

      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };