"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner";
import { PageLayout } from "@/components/layout/page-layout";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      router.push(`/profile/${session.user.id}`);
    } else if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile');
    }
  }, [session, status, router]);

  return (
    <PageLayout>
      {/* <div className="flex justify-center items-center h-[calc(100vh-200px)]"> */}
        <LoadingSpinner />
      {/* </div> */}
    </PageLayout>
  );
}