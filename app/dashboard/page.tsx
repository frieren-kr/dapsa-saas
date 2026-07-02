import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">대시보드</h1>
      <p className="text-gray-900">안녕하세요, {session.user.name}님</p>
      <p className="text-sm text-gray-600">이메일: {session.user.email}</p>
      <p className="mt-2 text-sm text-gray-500">
        역할: {session.user.role}
      </p>

      {session.user.role === "ORGANIZER" && (
        <Link
          href="/projects/new"
          className="mt-4 block rounded bg-black py-2 text-center text-white"
        >
          새 프로젝트 만들기
        </Link>
      )}

      <Link
        href="/"
        className="mt-4 block text-center text-sm text-blue-600 underline"
      >
        메인으로 돌아가기
      </Link>
    </div>
  </div>
);
}