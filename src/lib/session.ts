import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET
);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, SECRET_KEY, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return null;

  const parsed = await decrypt(session);
  if (!parsed) return null;

  const res = NextResponse.next();
  const encryptedSession = await encrypt({
    ...parsed,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
  });

  res.cookies.set({
    name: "session",
    value: encryptedSession,
    httpOnly: true,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
