import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import NaverMap from "@/components/NaverMap";
import Link from "next/link";

export default async function MapTestPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-4xl px-4">
        <Link
          href="/dashboard"
          className="mb-4 inline-block text-sm text-gray-600 hover:underline"
        >
          ← 대시보드
        </Link>

        <div className="rounded-lg bg-white p-6 shadow">
          <h1 className="mb-4 text-xl font-bold text-gray-900">
            네이버 지도 SDK 테스트
          </h1>
          <p className="mb-4 text-sm text-gray-600">
            지도가 뜨고 서울시청 위치에 마커가 보이면 SDK 인증 성공입니다.
            빈 화면이거나 인증 실패 메시지가 뜨면 Client ID 또는 웹 서비스 URL
            등록을 확인하세요.
          </p>
          <NaverMap />
        </div>
      </div>
    </div>
  );
}