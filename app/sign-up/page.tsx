"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message || "회원가입에 실패했어요");
      return;
    }

    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl text-black font-bold">회원가입</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-black font-medium">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-black rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-black font-medium">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-black rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-black font-medium">
              비밀번호 (8자 이상)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full text-black rounded border px-3 py-2"
            />
          </div>

          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded bg-black py-2 text-white disabled:opacity-50"
          >
            {isLoading ? "처리 중..." : "가입하기"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-black">
          이미 계정이 있어요?{" "}
          <a href="/sign-in" className="text-blue-600 underline">
            로그인
          </a>
        </p>
      </div>
    </div>
  );
}