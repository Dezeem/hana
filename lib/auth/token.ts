import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "hana_session";
const DEV_SECRET = "hana-development-secret-do-not-use-in-production";

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error(
      "AUTH_SECRET is not set. Sessions cannot be signed safely in production — see .env.example.",
    );
  }
  return new TextEncoder().encode(secret || DEV_SECRET);
}

export async function signSession(subject = "admin"): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}
