// lib/env.ts
// 환경변수 단일 진입점. 부팅 시점(모듈 로드)에 Zod로 검증한다.
// 빠지거나 형식이 틀린 변수가 있으면 여기서 이름을 대며 즉시 터진다.
//
// 주의: 이 파일에는 import "server-only"를 붙이지 않는다.
// NEXT_PUBLIC_* 값을 쓰는 클라이언트 컴포넌트도 이 파일을 import 하기 때문.
// 대신 서버 시크릿 검증은 서버(typeof window === "undefined")에서만 실행한다.
import { z } from "zod";

// 서버 전용 — 브라우저 번들에 노출되면 안 되는 시크릿 포함
const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NAVER_MAP_CLIENT_SECRET: z.string().min(1),
  // better-auth가 런타임에 env에서 직접 읽는 값들 (코드엔 process.env 참조 없음)
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_PUBLIC_URL: z.string().url(),
});

// 클라이언트에도 노출되는 값 (NEXT_PUBLIC_ 접두사)
const clientSchema = z.object({
  NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

// Next.js는 process.env.NEXT_PUBLIC_* 를 "명시적 멤버 접근"으로 참조할 때만
// 클라이언트 번들에 인라인한다. 그래서 process.env를 통째로 넘기지 않고
// 키를 하나하나 나열한다.
const runtimeEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  NAVER_MAP_CLIENT_SECRET: process.env.NAVER_MAP_CLIENT_SECRET,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
  NEXT_PUBLIC_NAVER_MAP_CLIENT_ID: process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

const isServer = typeof window === "undefined";

// 서버에선 전체 검증, 브라우저에선 NEXT_PUBLIC_ 만 검증한다.
// (서버 시크릿은 브라우저 번들에 존재하지 않으므로 파싱하면 전부 실패한다.)
const schema = isServer ? serverSchema.merge(clientSchema) : clientSchema;

const parsed = schema.safeParse(runtimeEnv);

if (!parsed.success) {
  console.error(
    "❌ 환경변수 검증 실패:",
    z.flattenError(parsed.error).fieldErrors
  );
  throw new Error(
    "잘못되었거나 누락된 환경변수가 있어요. 위 로그의 변수 이름을 확인하세요."
  );
}

export const env = parsed.data as z.infer<typeof serverSchema> &
  z.infer<typeof clientSchema>;
