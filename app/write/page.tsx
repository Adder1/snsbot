"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Image from "next/image";
import { transformText } from "@/lib/gemini";
import { LoadingSpinner } from "@/components/loading-spinner";
import { PageLayout } from "@/components/layout/page-layout";

export default function WritePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [content, setContent] = useState("");
  const [style, setStyle] = useState("일반");
  const [isPrivate, setIsPrivate] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [blockAI, setBlockAI] = useState(false);
  const [transformCount, setTransformCount] = useState(0);
  const [isTransforming, setIsTransforming] = useState(false);

  // 인증 체크
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login?callbackUrl=/write');
    }
  }, [status, router]);

  const handleSubmit = async () => {
    if (!content) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    try {
      console.log("게시물 작성 시작");
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          style,
          isPrivate,
          allowComments,
          blockAI,
        }),
      });

      console.log("API 응답 상태:", response.status);

      if (!response.ok) {
        throw new Error("게시물 작성에 실패했습니다.");
      }

      const post = await response.json();
      console.log("생성된 게시물:", post.id);

      // AI 봇 댓글 생성 (AI 차단이 아닐 경우에만)
      if (!blockAI) {
        try {
          const aiResponse = await fetch("/api/comments/ai", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              postId: post.id,
              postContent: content,
              count: 2,
            }),
          });

          if (!aiResponse.ok) {
            console.error("AI 댓글 생성 실패:", await aiResponse.text());
          }
        } catch (error) {
          console.error("AI 댓글 생성 실패:", error);
        }
      }

      // 일일미션 완료 처리 추가
      try {
        const missionResponse = await fetch("/api/daily-mission/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            missionType: "post"
          }),
        });

        if (missionResponse.ok) {
          const result = await missionResponse.json();
          if (result.xpGained) {
            toast.success(`일일미션 완료! ${result.xpGained}XP를 획득했습니다!`);
          }
        }
      } catch (error) {
        console.error("일일미션 ��료 처리 실패:", error);
      }

      toast.success("게시물이 작성되었습니다!");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error:", error);
      toast.error("게시물 작성에 실패했습니다.");
    }
  };

  const handleTransform = async () => {
    if (!content) {
      toast.error("변환할 텍스트를 입력해주세요.");
      return;
    }

    if (transformCount >= 5) {
      toast.error("변환 횟수를 모두 사용했습니다.");
      return;
    }

    if (style === "일반") {
      toast.error("변환할 말투를 선택해주세요.");
      return;
    }

    try {
      setIsTransforming(true);
      const transformedText = await transformText(content, style);
      setContent(transformedText);
      setTransformCount(prev => prev + 1);
      toast.success("텍스트가 변환되었습니다!");
    } catch (error) {
      toast.error("변환에 실패했습니다.");
    } finally {
      setIsTransforming(false);
    }
  };

  if (status === 'loading') {
    return (
      <PageLayout>
        <LoadingSpinner />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt="Profile"
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 bg-[#4CAF50] rounded-full flex items-center justify-center text-white font-bold">
              {session?.user?.name?.[0] || '?'}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold">새로운 소식이 있나요?</h2>
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요 (최대 500자)"
          className="w-full h-40 bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg p-4 text-white resize-none focus:outline-none focus:border-[#4A4A4A]"
          maxLength={500}
        />

        <div className="flex justify-between items-center mt-2 text-sm text-zinc-400">
          <div className="flex items-center gap-4">
            <button className="hover:text-zinc-300">
              <ImageIcon className="w-5 h-5" />
            </button>
          </div>
          <span>{content.length} / 500</span>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="bg-[#2A2A2A] border border-[#3A3A3A] rounded px-3 py-2 text-white"
          >
            <option value="일반">말투 선택</option>
            <option value="진지">진지</option>
            <option value="친근">친근</option>
            <option value="유머러스">유머러스</option>
            <option value="분노조절 실패">분노조절 실패</option>
            <option value="짜증나게">짜증나게</option>
            <option value="기쁘게">기쁘게</option>
            <option value="슬프게">슬프게</option>
            <option value="냉소적으로">냉소적으로</option>
            <option value="열정적으로">열정적으로</option>
            <option value="공손하게">공손하게</option>
          </select>
          <Button
            onClick={handleTransform}
            disabled={isTransforming || transformCount >= 5 || style === "일반"}
            className="bg-[#2A4137] text-[#98B0A8] hover:bg-[#2A4137]/80"
          >
            {isTransforming ? "변환 중..." : "변환하기"}
          </Button>
          <span className="text-zinc-400">({transformCount}/5)</span>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <Checkbox
              checked={isPrivate}
              onCheckedChange={(checked) => setIsPrivate(checked as boolean)}
            />
            나만보기 (비밀글)
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <Checkbox
              checked={!allowComments}
              onCheckedChange={(checked) => setAllowComments(!checked as boolean)}
            />
            댓글 사용 안 함
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <Checkbox
              checked={blockAI}
              onCheckedChange={(checked) => setBlockAI(checked as boolean)}
            />
            AI 차단
          </label>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full mt-4 bg-[#2A4137] text-[#98B0A8] hover:bg-[#2A4137]/80"
        >
          게시하기
        </Button>
      </div>
    </PageLayout>
  );
} 