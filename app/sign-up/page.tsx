import { Suspense } from "react";
import SignUpForm from "./SignUpForm";

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <p className="text-gray-500">불러오는 중...</p>
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}