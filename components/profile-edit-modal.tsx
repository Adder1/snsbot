"use client";

import { useState } from "react";
import { User } from "@/lib/types";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@/lib/hooks/useMutation";

interface ProfileEditModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (updatedProfile: User) => void;
}

export function ProfileEditModal({ user, onClose, onUpdate }: ProfileEditModalProps) {
  const [nickname, setNickname] = useState(user.nickname || "");
  const [description, setDescription] = useState(user.description || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutate = useMutation();

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 입력 유효성 검사
      if (nickname && nickname.length > 10) {
        setError("닉네임은 10자 이내로 입력해주세요.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/user/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: nickname || null,
          description: description || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 서버에서 반환한 에러 코드에 따라 다른 메시지 표시
        switch (data.code) {
          case "NO_SESSION":
            setError("세션이 만료되었습니다. 다시 로그인해주세요.");
            break;
          case "INVALID_SESSION":
            setError("유효하지 않은 세션입니다. ��시 로그인해주세요.");
            break;
          case "EMPTY_USER_ID":
            setError("사용자 인증에 실패했습니다. 다시 로그인해주세요.");
            break;
          case "ID_MISMATCH":
            setError("프로필을 수정할 권한이 없습니다.");
            break;
          case "NICKNAME_TOO_LONG":
            setError("닉네임은 10자 이내로 입력해주세요.");
            break;
          default:
            setError(data.error || "프로필 수정에 실패했습니다.");
        }
        setIsLoading(false);
        return;
      }

      // 성공 시 부모 컴포넌트에 업데이트된 프로필 전달
      onUpdate(data);
      onClose();
    } catch (error) {
      console.error("Profile update error:", error);
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E1E1E] p-8 rounded-lg w-full max-w-md border border-[#FEFEFE]/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">프로필 수정</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-200"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              닉네임
            </label>
            <Input
              value={nickname}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setNickname(e.target.value);
                setError(null);
              }}
              className="bg-[#2A2A2A] border-[#3A3A3A]"
              placeholder="닉네임을 입력하세요"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              소개
            </label>
            <Textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setDescription(e.target.value);
                setError(null);
              }}
              className="bg-[#2A2A2A] border-[#3A3A3A]"
              placeholder="자기소개를 입력하세요"
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              onClick={onClose}
              className="bg-[#2A2A2A] hover:bg-[#323232]"
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="bg-[#2A4137] text-[#98B0A8] hover:bg-[#2A4137]/80"
              disabled={isLoading}
            >
              {isLoading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}