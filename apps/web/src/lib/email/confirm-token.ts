import "server-only";
import crypto from "node:crypto";

const TTL_DAYS = 14;

function secret(): string {
  return (
    process.env.CONFIRM_SECRET ||
    process.env.UNSUBSCRIBE_SECRET ||
    process.env.PAYLOAD_SECRET ||
    ""
  );
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

export function makeConfirmToken(email: string): string {
  if (!secret()) return "";
  const ts = Date.now().toString(36);
  const payload = `${email.toLowerCase()}:${ts}`;
  const sig = sign(payload);
  return Buffer.from(`${ts}.${sig}`, "utf8").toString("base64url");
}

export function verifyConfirmToken(email: string, token: string | null): boolean {
  if (!secret() || !token) return false;
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return false;
  }
  const [ts, sig] = decoded.split(".");
  if (!ts || !sig) return false;
  const tsNum = parseInt(ts, 36);
  if (!Number.isFinite(tsNum)) return false;
  if (Date.now() - tsNum > TTL_DAYS * 86400_000) return false;
  const expected = sign(`${email.toLowerCase()}:${ts}`);
  if (sig.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
