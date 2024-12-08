"use client";

import { PageLayout } from "@/components/layout/page-layout";
import { PostList } from "@/components/post-list";
import { useState } from "react";
import LoginForm from "@/components/login-form";

export default function Home() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleAuthRequired = () => {
    setShowLoginModal(true);
  };

  return (
    <PageLayout onAuthRequired={handleAuthRequired}>
      <div className="flex justify-center mb-4">
        <div className="bg-[#2A4137] rounded-xl px-4 py-2.5 text-sm inline-block">
          <span className="text-[#98B0A8]">👉 여러분의 글에 AI가 직접 댓글을 달며 소통을 합니다.</span>
        </div>
      </div>
      <PostList />
      <LoginForm 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </PageLayout>
  );
}
