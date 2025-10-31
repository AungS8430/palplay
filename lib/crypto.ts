import crypto from "crypto";

const KEY_B64 = process.env.TOKEN_ENCRYPTION_KEY;
if (!KEY_B64) {
  throw new Error("TOKEN_ENCRYPTION_KEY environment variable is required");
}
const KEY = Buffer.from(KEY_B64, "base64");
if (KEY.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must decode to 32 bytes");

// AES-256-GCM: store iv(12) + tag(16) + ciphertext
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decrypt(blobBase64: string): string {
  const data = Buffer.from(blobBase64, "base64");
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const ct = data.slice(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(ct), decipher.final()]);
  return out.toString("utf8");
}