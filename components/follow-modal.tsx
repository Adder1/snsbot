"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "./loading-spinner";

interface User {
  id: string;
  name: string | null;
  nickname: string | null;
  image: string | null;
}

interface FollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  users: User[];
  isLoading: boolean;
}

export function FollowModal({ isOpen, onClose, title, users, isLoading }: FollowModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1E1E1E] p-8 rounded-lg w-full max-w-md border border-[#FEFEFE]/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <X className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-[#2A4137] border-t-[#98B0A8] rounded-full animate-spin" />
              <span className="text-[#98B0A8]">로딩 중...</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {title === "팔로워" ? "팔로워가 없습니다." : "팔로우하는 사용자가 없습니다."}
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 hover:bg-[#2A2A2A] rounded-lg cursor-pointer"
                onClick={() => {
                  onClose();
                  router.push(`/profile/${user.id}`);
                }}
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.nickname || user.name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-600 rounded-full" />
                )}
                <div>
                  <div className="font-medium text-white">
                    {user.nickname || user.name}
                  </div>
                  {user.nickname && user.name && (
                    <div className="text-sm text-gray-400">{user.name}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 