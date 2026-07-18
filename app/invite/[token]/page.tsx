export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-4 text-xl font-bold text-gray-900">
          답사 초대장
        </h1>
        <p className="mb-2 text-sm text-gray-700">
          이 페이지는 아직 구현 중이에요. 다음 단계에서 초대 수락 흐름을
          만들 거예요.
        </p>
        <p className="mt-4 rounded bg-gray-100 p-2 text-xs text-gray-500">
          토큰: {token}
        </p>
      </div>
    </div>
  );
}