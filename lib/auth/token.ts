import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "hana_session";
const DEV_SECRET = "hana-development-secret-do-not-use-in-production";

function key() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || DEV_SECRET);
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
