import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: "SNS Bot",
  description: "SNS Bot with AI",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "/";
  
  // 공개 페이지 목록
  const publicPages = ['/', '/login', '/register'];
  const isPublicPage = publicPages.some(page => pathname.startsWith(page));

  // 비로그인 상태에서 보호된 페이지 접근 시 리다이렉트
  if (!session && !isPublicPage) {
    redirect('/login');
  }

  return (
    <html lang="ko" className="dark">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
