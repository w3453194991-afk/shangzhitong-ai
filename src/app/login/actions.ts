"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/session";
import { DEMO_PASSWORD } from "@/lib/constants";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const db = await getDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email);
  if (!user || password !== DEMO_PASSWORD) {
    redirect("/login?error=1");
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  redirect(user.role === "platform_admin" ? "/admin" : "/app");
}
