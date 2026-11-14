"use server";

import { redirect } from "next/navigation";
import { checkPassword, endSession, startSession } from "@/lib/auth/session";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!password) {
    return { error: "请输入密码。" };
  }

  if (!checkPassword(password)) {
    console.warn(`[auth] failed login at ${new Date().toISOString()}`);
    return { error: "密码不对。再试一次，或者检查 .env 里的 ADMIN_PASSWORD。" };
  }

  await startSession();
  redirect(next.startsWith("/") ? next : "/admin");
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/");
}
