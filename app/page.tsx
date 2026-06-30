"use client";

import { authClient } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/";
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl text-black font-bold">답사 SaaS</h1>

        {session ? (
          <div>
            <p className="mb-2 text-black">
              <span className="font-medium">{session.user.name}</span>님, 환영해요
            </p>
            <p className="mb-4 text-sm text-gray-600">{session.user.email}</p>
            <a
             href="/dashboard"
              className="mb-2 block w-full rounded bg-black py-2 text-center text-white"
            >
              대시보드
            </a>
            <button
              onClick={handleSignOut}
              className="w-full rounded bg-gray-800 py-2 text-white"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <a href="/sign-in" className="block rounded bg-black py-2 text-center text-white">
              로그인
            </a>
            <a href="/sign-up" className="block rounded border py-2 text-center">
              회원가입
            </a>
          </div>
        )}
      </div>
    </div>
  );
}