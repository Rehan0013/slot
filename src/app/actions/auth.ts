"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/session";

export async function loginUser(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username and password are required." };
  }

  try {
    await dbConnect();
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      return { error: "Invalid credentials." };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { error: "Invalid credentials." };
    }

    // Create session JWT
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const sessionToken = await encrypt({
      userId: user._id.toString(),
      username: user.username,
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      sameSite: "lax",
      path: "/",
    });

  } catch (err: any) {
    console.error("Login server action error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }

  redirect("/");
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
