"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import googleLogo from "@/app/google.png";
import { X } from "lucide-react";

interface LoginFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginForm({ isOpen, onClose }: LoginFormProps) {
  const handleGoogleSignIn = () => {
    signIn("google");
  };

  return (
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1E1E1E] p-8 rounded-lg w-full max-w-md border border-[#FEFEFE]/10">
          <div className="flex justify-between items-center mb-4">
            <h1 className="w-full flex items-center justify-center text-xl font-bold text-white">로그인</h1>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center"
            >
              <Image src={googleLogo} alt="google logo"/>
            </button>
          </div>
        </div>
      </div>
    )
  );
} 