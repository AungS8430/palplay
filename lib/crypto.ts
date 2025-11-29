// TypeScript
// `lib/crypto.ts`

import crypto from "crypto";

let KEY_CACHE: Buffer | undefined;

function getKey(): Buffer {
  if (KEY_CACHE) return KEY_CACHE;

  const KEY_B64 = process.env.TOKEN_ENCRYPTION_KEY;
  if (!KEY_B64) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is required");
  }
  const key = Buffer.from(KEY_B64, "base64");
  if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes");

  KEY_CACHE = key;
  return KEY_CACHE;
}

// AES-256-GCM: store iv(12) + tag(16) + ciphertext
export function encrypt(plaintext: string): string {
  const KEY = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decrypt(blobBase64: string): string {
  const KEY = getKey();
  const data = Buffer.from(blobBase64, "base64");
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const ct = data.slice(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(ct), decipher.final()]);
  return out.toString("utf8");
}

/**
 * Refresh Spotify access token using refresh token
 */
async function refreshSpotifyToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
} | null> {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID!;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error("Failed to refresh Spotify token:", response.status, await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error refreshing Spotify token:", error);
    return null;
  }
}

/**
 * Get decrypted access token for a user's provider
 * Automatically refreshes expired tokens if refresh token is available
 */
export async function getProviderAccessToken(
  userId: string,
  provider: string
): Promise<string | null> {
  const { prisma } = await import("@/lib/prisma");

  const token = await prisma.userProviderToken.findUnique({
    where: { userId_provider: { userId, provider } },
  });

  if (!token?.accessTokenEncrypted) {
    console.log(`No access token found for user ${userId} provider ${provider}`);
    return null;
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = new Date();
  const expiresAt = token.tokenExpiresAt;
  const isExpired = expiresAt && expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

  if (isExpired && token.refreshTokenEncrypted && provider === "spotify") {
    console.log(`Token expired for user ${userId}, refreshing...`);

    // Decrypt refresh token
    const refreshToken = decrypt(token.refreshTokenEncrypted);

    // Refresh the access token
    const refreshedData = await refreshSpotifyToken(refreshToken);

    if (refreshedData) {
      // Encrypt and store the new access token
      const newAccessTokenEncrypted = encrypt(refreshedData.access_token);
      const newExpiresAt = new Date(Date.now() + refreshedData.expires_in * 1000);

      await prisma.userProviderToken.update({
        where: { userId_provider: { userId, provider } },
        data: {
          accessTokenEncrypted: newAccessTokenEncrypted,
          tokenExpiresAt: newExpiresAt,
        },
      });

      console.log(`Token refreshed successfully for user ${userId}`);
      return refreshedData.access_token;
    } else {
      console.error(`Failed to refresh token for user ${userId}`);
      return null;
    }
  }

  return decrypt(token.accessTokenEncrypted);
}
