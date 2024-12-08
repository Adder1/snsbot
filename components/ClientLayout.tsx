'use client';

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import { Session } from "next-auth";

interface ClientLayoutProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function ClientLayout({ children, session }: ClientLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div>
      {session && (
        <>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white z-50"
          >
            <Menu size={24} />
          </button>
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </>
      )}
      <main className="container mx-auto max-w-[640px] p-4" style={{ paddingTop: '0px' }}>
        {children}
      </main>
    </div>
  );
}
