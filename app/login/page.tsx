"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import googleLogo from "@/app/google.png";
import { useEffect } from "react";
import { PageLayout } from "@/components/layout/page-layout";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    if (session?.user?.id) {
      if (!session.user.hasNickname) {
        router.push('/nickname');
      } else {
        router.push(callbackUrl);
      }
    }
  }, [status, session, router, callbackUrl]);

  const handleGoogleSignIn = async () => {
    try {
      await signIn("google", {
        callbackUrl: callbackUrl,
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <PageLayout showCategory={false} showBottomNav={true} centerContent={true}>
      <div className="bg-[#1E1E1E] p-8 rounded-lg w-full max-w-md border border-[#FEFEFE]/10">
        <h1 className="text-2xl font-bold text-white text-center mb-8">로그인</h1>
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg"
        >
          <Image src={googleLogo} alt="google logo" width={200} height={200} />
        </button>
      </div>
    </PageLayout>
  );
} 