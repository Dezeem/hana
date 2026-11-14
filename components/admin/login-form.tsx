"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/app/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn w-full" disabled={pending}>
      {pending ? "验证中…" : "进入后台"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="next" value={next} />

      <label className="block">
        <span className="meta mb-2 block">管理员密码 · Password</span>
        <input
          type="password"
          name="password"
          autoFocus
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="field text-lg tracking-[0.3em]"
        />
      </label>

      {state.error ? (
        <p className="border-l-2 border-movie pl-3 text-[13px] leading-relaxed text-movie">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
