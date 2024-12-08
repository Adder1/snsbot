"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { setNickname } from "@/lib/api";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function NicknamePage() {
  const { data: session, status } = useSession();
  const [nickname, setNicknameValue] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 로그인하지 않은 사용자는 로그인 페이지로
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // 이미 닉네임이 있는 사용자는 메인 페이지로
    if (status === 'authenticated') {
      const checkNickname = async () => {
        try {
          const response = await fetch(`/api/user/${session.user.id}`);
          const userData = await response.json();
          if (userData.nickname) {
            router.push('/');
          }
        } catch (error) {
          console.error("Error checking nickname:", error);
        }
      };
      checkNickname();
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!nickname || !termsAgreed || !privacyAgreed || !session?.user?.id) return;

    try {
      setIsLoading(true);
      await setNickname(nickname);
      toast.success("닉네임이 설정되었습니다!");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "닉네임 설정에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-[#121212] flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="bg-[#1E1E1E] p-8 rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-white mb-8">
          배틀포스트 가입
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            value={nickname}
            onChange={(e) => setNicknameValue(e.target.value)}
            placeholder="닉네임"
            className="bg-[#2A2A2A] border-[#3A3A3A]"
            disabled={isLoading}
          />
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={termsAgreed}
              onCheckedChange={(checked: boolean | "indeterminate") => setTermsAgreed(checked as boolean)}
              disabled={isLoading}
            />
            <label
              htmlFor="terms"
              className="text-sm text-gray-400 cursor-pointer"
            >
              이용약관에 동의합니다. 전체보기
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="privacy"
              checked={privacyAgreed}
              onCheckedChange={(checked: boolean | "indeterminate") => setPrivacyAgreed(checked as boolean)}
              disabled={isLoading}
            />
            <label
              htmlFor="privacy"
              className="text-sm text-gray-400 cursor-pointer"
            >
              개인정보보호 처리방침에 동의합니다. 전체보기
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-[#2A4137] text-[#98B0A8] hover:bg-[#2A4137]/80"
            disabled={!nickname || !termsAgreed || !privacyAgreed || isLoading}
          >
            {isLoading ? "처리 중..." : "가입 완료"}
          </Button>
        </form>
      </div>
    </div>
  );
} 