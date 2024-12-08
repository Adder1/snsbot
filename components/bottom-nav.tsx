"use client";

import { useSession, signIn } from "next-auth/react";
import { Home, PenSquare, Palette, User } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface BottomNavProps {
  onWriteClick: () => void;
  onDrawClick: () => void;
}

export function BottomNav({ onWriteClick, onDrawClick }: BottomNavProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleAction = (action: string) => {
    switch (action) {
      case "write":
        if (!session) {
          router.push("/login?callbackUrl=/write");
        } else {
          router.push("/write");
        }
        break;
      case "draw":
        if (!session) {
          router.push("/login?callbackUrl=/draw");
        } else {
          router.push("/draw");
        }
        break;
      case "login":
        signIn("google", { callbackUrl: '/' });
        break;
      case "profile":
        if (session?.user?.id) {
          router.push("/profile");
        }
        break;
      case "home":
        router.push("/");
        break;
    }
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[900px] bg-[#1E1E1E] border-t border-[#2C2D2E] z-50">
      <div className="grid grid-cols-4 h-[52px]">
        <button 
          onClick={() => handleAction("home")}
          className="flex flex-col items-center justify-center text-[11px] text-zinc-400 hover:text-white transition-colors"
        >
          <Home className="w-[18px] h-[18px] mb-1" strokeWidth={1.5} />
          <span>홈</span>
        </button>
        <button 
          onClick={() => handleAction("write")}
          className="flex flex-col items-center justify-center text-[11px] text-zinc-400 hover:text-white transition-colors"
        >
          <PenSquare className="w-[18px] h-[18px] mb-1" strokeWidth={1.5} />
          <span>글쓰기</span>
        </button>
        <button 
          onClick={() => handleAction("draw")}
          className="flex flex-col items-center justify-center text-[11px] text-zinc-400 hover:text-white transition-colors"
        >
          <Palette className="w-[18px] h-[18px] mb-1" strokeWidth={1.5} />
          <span>그림 그리기</span>
        </button>
        {session?.user?.id ? (
          <button 
            onClick={() => handleAction("profile")}
            className="flex flex-col items-center justify-center hover:opacity-80 transition-opacity"
          >
            <Image
              src={session.user?.image || ""}
              alt="Profile"
              width={24}
              height={24}
              className="rounded-full mb-1"
            />
            <span className="text-[11px] text-zinc-400">나</span>
          </button>
        ) : (
          <button 
            onClick={() => handleAction("login")}
            className="flex flex-col items-center justify-center text-[11px] text-zinc-400 hover:text-white transition-colors"
          >
            <User className="w-[18px] h-[18px] mb-1" strokeWidth={1.5} />
            <span>로그인</span>
          </button>
        )}
      </div>
    </nav>
  );
} 