"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { isProjectOrganizer } from "@/lib/permissions";
import { createSiteSchema } from "@/lib/validations";

export async function createSite(input: {
  projectId: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
}) {
  // 1. 인증
  const session = await requireAuth();

  // 2. Zod 검증
  const parsed = createSiteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // 3. 권한 검사 - 이 프로젝트의 organizer만 답사지 추가 가능
  const isOwner = await isProjectOrganizer(session.user.id, input.projectId);
  if (!isOwner) {
    return { error: "이 프로젝트의 답사지를 추가할 권한이 없어요" };
  }

  // 4. 현재 답사지 개수 확인 (orderIndex 자동 할당용)
  const count = await prisma.site.count({
    where: { projectId: input.projectId },
  });

  // 5. DB에 저장
  const site = await prisma.site.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      latitude: input.latitude,
      longitude: input.longitude,
      address: input.address || null,
      orderIndex: count, // 마지막 순서로 추가
    },
  });

  // 6. 캐시 무효화 - 프로젝트 페이지 다시 렌더링되게
  revalidatePath(`/projects/${input.projectId}`);

  return { success: true, siteId: site.id };
}
export async function deleteSite(input: { siteId: string; projectId: string }) {
  const session = await requireAuth();

  // 권한 - organizer만 삭제 가능
  const isOwner = await isProjectOrganizer(session.user.id, input.projectId);
  if (!isOwner) {
    return { error: "삭제 권한이 없어요" };
  }

  // 삭제 대상 답사지가 진짜 이 프로젝트 소속인지 확인 (파라미터 조작 방어)
  const site = await prisma.site.findUnique({
    where: { id: input.siteId },
  });
  if (!site || site.projectId !== input.projectId) {
    return { error: "답사지를 찾을 수 없어요" };
  }

  await prisma.site.delete({
    where: { id: input.siteId },
  });

  // 삭제된 자리 이후 답사지들의 orderIndex 앞당기기
  await prisma.site.updateMany({
    where: {
      projectId: input.projectId,
      orderIndex: { gt: site.orderIndex },
    },
    data: {
      orderIndex: { decrement: 1 },
    },
  });

  revalidatePath(`/projects/${input.projectId}`);
  return { success: true };
}


export async function reorderSite(input: {
  siteId: string;
  projectId: string;
  direction: "up" | "down";
}) {
  const session = await requireAuth();

  const isOwner = await isProjectOrganizer(session.user.id, input.projectId);
  if (!isOwner) {
    return { error: "권한이 없어요" };
  }

  // 이동 대상 답사지 조회
  const current = await prisma.site.findUnique({
    where: { id: input.siteId },
  });
  if (!current || current.projectId !== input.projectId) {
    return { error: "답사지를 찾을 수 없어요" };
  }

  // 위로 = orderIndex - 1인 답사지와 자리 바꿈
  // 아래로 = orderIndex + 1인 답사지와 자리 바꿈
  const targetIndex =
    input.direction === "up"
      ? current.orderIndex - 1
      : current.orderIndex + 1;

  const neighbor = await prisma.site.findFirst({
    where: {
      projectId: input.projectId,
      orderIndex: targetIndex,
    },
  });
  if (!neighbor) {
    return { error: "더 이동할 수 없어요" }; // 맨 위/아래
  }

  // 두 답사지의 orderIndex를 서로 바꿈 (트랜잭션)
  await prisma.$transaction([
    prisma.site.update({
      where: { id: current.id },
      data: { orderIndex: targetIndex },
    }),
    prisma.site.update({
      where: { id: neighbor.id },
      data: { orderIndex: current.orderIndex },
    }),
  ]);

  revalidatePath(`/projects/${input.projectId}`);
  return { success: true };
}

import { updateSiteSchema } from "@/lib/validations";

export async function updateSite(input: {
  siteId: string;
  projectId: string;
  name: string;
  description?: string;
}) {
  const session = await requireAuth();

  const parsed = updateSiteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const isOwner = await isProjectOrganizer(session.user.id, input.projectId);
  if (!isOwner) {
    return { error: "수정 권한이 없어요" };
  }

  // IDOR 방어 - 이 답사지가 진짜 이 프로젝트 소속인지 확인
  const site = await prisma.site.findUnique({
    where: { id: input.siteId },
  });
  if (!site || site.projectId !== input.projectId) {
    return { error: "답사지를 찾을 수 없어요" };
  }

  await prisma.site.update({
    where: { id: input.siteId },
    data: {
      name: input.name,
      description: input.description || null,
    },
  });

  revalidatePath(`/projects/${input.projectId}`);
  revalidatePath(`/projects/${input.projectId}/sites/${input.siteId}`);
  return { success: true };
}