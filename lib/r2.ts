// lib/r2.ts
import {
  S3Client,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";
import { env } from "./env";

// R2는 S3 호환이라 S3Client를 그대로 쓴다.
// 유일한 차이: region 개념이 없어서 "auto", endpoint를 R2 전용 주소로 지정.
export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

/** 주어진 키 목록을 R2에서 삭제 */
export async function deleteR2Objects(keys: string[]) {
  if (keys.length === 0) return; // 지울 게 없으면 그냥 끝
  await r2.send(
    new DeleteObjectsCommand({
      Bucket: env.R2_BUCKET_NAME,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    })
  );
}

/**
 * 마크다운 본문에서 우리 R2 공개 URL로 박힌 이미지들의 키를 뽑아낸다.
 * ![...](https://pub-xxx.r2.dev/projects/{id}/{uuid}.png) → projects/{id}/{uuid}.png
 * R2_PUBLIC_URL 접두사로 시작하는 것만 골라 외부 이미지 링크는 삭제 대상에서 제외한다.
 */
export function extractR2Keys(markdown: string): string[] {
  const publicBase = env.R2_PUBLIC_URL; // https://pub-xxx.r2.dev
  // 마크다운 이미지 문법 ![...](url) 에서 url 뽑기
  const urlPattern = /!\[[^\]]*\]\(([^)]+)\)/g;
  const keys: string[] = [];
  for (const match of markdown.matchAll(urlPattern)) {
    const url = match[1];
    // 우리 R2 공개 URL로 시작하는 것만 (외부 이미지 링크는 제외)
    if (url.startsWith(publicBase)) {
      const key = url.slice(publicBase.length + 1); // +1은 앞 슬래시 제거
      keys.push(key);
    }
  }
  return keys;
}

/** 접두사로 시작하는 모든 객체의 키를 나열 */
export async function listR2Keys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined = undefined;
  do {
    const res: ListObjectsV2CommandOutput = await r2.send(
      new ListObjectsV2Command({
        Bucket: env.R2_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: token,
      })
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}