import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import { Search, Hash, MessageCircle, Home, Users, Settings } from 'lucide-react';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "X Dashboard Manager",
  description: "Manage X Candidate Flows",
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
          <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col">
            <div className="p-6">
              <h1 className="text-xl font-bold tracking-tight">X Dashboard</h1>
            </div>
            <nav className="flex-1 px-4 space-y-1">
              <Link href="/" className="flex items-center gap-3 px-3 py-2 text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors">
                <Home className="w-5 h-5" />
                <span className="font-medium">Overview</span>
              </Link>
              <Link href="/candidates" className="flex items-center gap-3 px-3 py-2 text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors">
                <Users className="w-5 h-5" />
                <span className="font-medium">Candidates</span>
              </Link>
              <Link href="/search" className="flex items-center gap-3 px-3 py-2 text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors">
                <Search className="w-5 h-5" />
                <span className="font-medium">Search</span>
              </Link>
              <Link href="/discovery" className="flex items-center gap-3 px-3 py-2 text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors">
                <Hash className="w-5 h-5" />
                <span className="font-medium">Discovery</span>
              </Link>
              <Link href="/chat" className="flex items-center gap-3 px-3 py-2 text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Chat</span>
              </Link>
              <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors">
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Link>
            </nav>
            <div className="p-4 border-t border-zinc-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-zinc-600">BOT</span>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Bot Account</p>
                  <p className="text-zinc-500 text-xs">Active</p>
                </div>
              </div>
            </div>
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
