// app/projects/[id]/photo-actions.ts
"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";
import { z } from "zod";
import { r2 } from "@/lib/r2";
import { env } from "@/lib/env";
import { requireAuth } from "@/lib/session";
import { isProjectOrganizer } from "@/lib/permissions";

// "뭘 올릴 수 있냐" 화이트리스트 (타입 → 확장자)
const ALLOWED = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const schema = z.object({
  projectId: z.string().min(1),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export async function createUploadUrl(input: {
  projectId: string;
  contentType: string;
}): Promise<{ error: string } | { uploadUrl: string; publicUrl: string }> {
  // 1. 인증
  const session = await requireAuth();

  // 2. Zod 검증 — 허용된 이미지 타입만 통과
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "허용되지 않은 파일 형식이에요" };
  const { projectId, contentType } = parsed.data;

  // 3. 권한 — 업로드=편집이므로 organizer만 (기존 컨벤션 그대로)
  const isOwner = await isProjectOrganizer(session.user.id, projectId);
  if (!isOwner) return { error: "이 프로젝트에 사진을 올릴 권한이 없어요" };

  // 4. 키는 서버가 만든다 — 클라이언트 파일명 신뢰 안 함
  const key = `projects/${projectId}/${randomUUID()}.${ALLOWED[contentType]}`;

  // 5. presign — 이 key에, PUT을, 이 content-type으로, 5분만
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

  // 읽기용 최종 공개 주소 (마크다운에 박힐 값)
  const publicUrl = `${env.R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl };
}
