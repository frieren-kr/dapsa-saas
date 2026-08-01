import prisma from "@/lib/prisma";

export async function getDeletionImpact(userId: string) {
  // 이 사용자가 조직자인 프로젝트들
  const ownedProjects = await prisma.project.findMany({
    where: { organizerId: userId },
    select: {
      id: true,
      title: true,
      _count: {
        select: { members: true, sites: true },
      },
    },
  });

  // 참여자로 참가 중인 프로젝트 수
  const joinedCount = await prisma.projectMember.count({
    where: { userId },
  });

  // 영향받는 총 참여자 수 (내 프로젝트들의 멤버 합)
  const affectedMembers = ownedProjects.reduce(
    (sum, p) => sum + p._count.members,
    0
  );

  return {
    ownedProjects,
    ownedProjectCount: ownedProjects.length,
    joinedCount,
    affectedMembers,
  };
}