import { z } from "zod";

export const createProjectSchema = z.object({
  title: z
    .string()
    .min(1, "제목을 입력하세요")
    .max(100, "제목은 100자 이내로 입력하세요"),
  description: z
    .string()
    .max(1000, "설명은 1000자 이내로 입력하세요")
    .optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const createSiteSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1, "답사지 이름을 입력하세요").max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().max(200).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1, "제목을 입력하세요").max(100),
  description: z.string().max(1000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updateSiteSchema = z.object({
  siteId: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1, "이름을 입력하세요").max(100),
  description: z.string().max(10000, "해설은 10000자 이내로 작성하세요").optional(),
});