"use server";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { createProjectSchema } from "@/lib/validations";

export async function createProject(formData: FormData) {
  // 1. 인증 확인
  const session = await requireAuth();

  // 2. 권한 확인 - ORGANIZER만 생성 가능
  if (session.user.role !== "ORGANIZER") {
    throw new Error("답사 준비기관만 프로젝트를 만들 수 있어요");
  }

  // 3. 입력값 파싱 및 검증
  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    startDate: (formData.get("startDate") as string) || undefined,
    endDate: (formData.get("endDate") as string) || undefined,
  };

  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    // 첫 번째 에러 메시지 반환
    throw new Error(parsed.error.issues[0].message);
  }

  const { title, description, startDate, endDate } = parsed.data;

  // 4. DB에 저장
  const project = await prisma.project.create({
    data: {
      title,
      description,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      organizerId: session.user.id,
      status: "DRAFT",
    },
  });

  // 5. 대시보드로 리다이렉트 (프로젝트 목록은 4-3에서 만들 예정)
  redirect(`/dashboard?created=${project.id}`);
}