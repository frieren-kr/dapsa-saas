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
        
        <h1 className="mb-4 text-2xl font-bold">대시보드</h1>
        <p>안녕하세요, {session.user.name}님</p>
        <p className="text-sm text-gray-600">이메일: {session.user.email}</p>
        <p className="mt-4 text-sm text-gray-500">
          이 페이지는 로그인한 사람만 볼 수 있어요.
        </p>
        <Link href="/" className="mt-4 block text-center text-sm text-blue-600 underline">
            메인으로 돌아가기
        </Link>
      </div>
    </div>
  );
}