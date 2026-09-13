import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { Search, Hash, MessageCircle, Home, Users, Settings } from 'lucide-react';
import BotIndicator from '@/components/BotIndicator';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SocialCRM Dashboard",
  description: "Manage your candidate outreach pipeline",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-50 text-zinc-900`}>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="w-60 bg-white border-r border-zinc-100 flex flex-col shadow-sm">
            <div className="px-5 py-5 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                  <span className="text-white font-black text-sm">S</span>
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight leading-none">SocialCRM</h1>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Candidate Manager</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              <Link href="/" className="flex items-center gap-3 px-3 py-2.5 text-zinc-600 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors text-sm">
                <Home className="w-4 h-4" />
                <span className="font-medium">Overview</span>
              </Link>
              <Link href="/candidates" className="flex items-center gap-3 px-3 py-2.5 text-zinc-600 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors text-sm">
                <Users className="w-4 h-4" />
                <span className="font-medium">Candidates</span>
              </Link>
              <Link href="/search" className="flex items-center gap-3 px-3 py-2.5 text-zinc-600 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors text-sm">
                <Search className="w-4 h-4" />
                <span className="font-medium">Search</span>
              </Link>
              <Link href="/discovery" className="flex items-center gap-3 px-3 py-2.5 text-zinc-600 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors text-sm">
                <Hash className="w-4 h-4" />
                <span className="font-medium">Discovery</span>
              </Link>
              <Link href="/chat" className="flex items-center gap-3 px-3 py-2.5 text-zinc-600 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors text-sm">
                <MessageCircle className="w-4 h-4" />
                <span className="font-medium">Chat</span>
              </Link>
              <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 text-zinc-600 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors text-sm">
                <Settings className="w-4 h-4" />
                <span className="font-medium">Settings</span>
              </Link>
            </nav>
            <BotIndicator />
          </aside>
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
