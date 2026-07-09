"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Ticket } from "lucide-react";
import { login, register } from "@/lib/api";
import ToastContainer, { ToastMessage } from "@/components/Toast";

const inputStyles =
  "w-full rounded-xl border border-[#E2E4F0] bg-[#F8F8FD] p-3 text-sm text-[#1E1B4B] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/30 focus:border-[#4F46E5]";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loading, setLoading] = useState(false);

  function showToast(type: ToastMessage["type"], message: string) {
    const id = Date.now();

    setToasts((current) => [...current, { id, type, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3500);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        await register({ email, full_name: fullName, password });
        showToast("success", "Account created successfully. Please sign in.");
        setMode("login");
        setFullName("");
        setPassword("");
        return;
      }

      await login(email, password);
      router.push("/");
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode((current) => (current === "login" ? "signup" : "login"));
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gradient-to-br from-[#F1EFFD] via-[#F8F6FD] to-[#EBE9FA] p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(79,70,229,0.12)]"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#EEF0FE] flex items-center justify-center">
          <Ticket size={28} className="text-[#4F46E5]" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-[#1E1B4B]">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {mode === "login"
              ? "Sign in to manage and track support tickets"
              : "Sign up to start tracking support tickets"}
          </p>
        </div>

        {mode === "signup" && (
          <input
            type="text"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name"
            className={inputStyles}
            required
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className={inputStyles}
          required
        />

        <div>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className={inputStyles}
            required
          />
          {mode === "signup" && (
            <p className="mt-2 text-xs text-[#9CA3AF]">
              At least 8 characters with an uppercase letter, lowercase
              letter, number, and special character.
            </p>
          )}
        </div>

        <button
          disabled={loading}
          className="flex w-full items-center justify-center rounded-xl bg-[#4F46E5] p-3 text-sm font-medium text-white transition-colors hover:bg-[#4338CA] disabled:opacity-60"
        >
          {loading ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : mode === "login" ? (
            "Sign in"
          ) : (
            "Sign up"
          )}
        </button>

        <button
          type="button"
          onClick={switchMode}
          disabled={loading}
          className="w-full rounded-xl border border-[#C7CBF5] p-3 text-sm font-medium text-[#4F46E5] hover:bg-[#EEF0FE] transition-colors"
        >
          {mode === "login" ? "Sign up" : "Back to sign in"}
        </button>
      </form>

      <ToastContainer
        toasts={toasts}
        onDismiss={(id) =>
          setToasts((current) =>
            current.filter((toast) => toast.id !== id),
          )
        }
      />
    </main>
  );
}
