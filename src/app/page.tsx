import { ArrowRight, Search, Hash, MessageCircle, CheckCircle, XCircle, AlertCircle, Users, List } from "lucide-react";
import Link from 'next/link';

const features = [
  {
    href: '/candidates',
    icon: <Users className="w-6 h-6" />,
    color: 'indigo',
    title: 'Candidate Pipeline',
    description: 'Track and manage candidates across pipeline stages.',
    label: 'Open Pipeline',
    tier: 'No API required',
  },
  {
    href: '/xlists',
    icon: <List className="w-6 h-6" />,
    color: 'teal',
    title: 'X Lists',
    description: 'View and manage imported X accounts with status tracking.',
    label: 'Open X Lists',
    tier: 'No API required',
  },
  {
    href: '/search',
    icon: <Search className="w-6 h-6" />,
    color: 'blue',
    title: 'Candidate Search',
    description: 'Lookup any candidate by their X username.',
    label: 'Open Search',
    tier: 'Basic',
  },
  {
    href: '/discovery',
    icon: <Hash className="w-6 h-6" />,
    color: 'purple',
    title: 'Candidate Discovery',
    description: 'Discover candidates by keyword in recent posts.',
    label: 'Open Discovery',
    tier: 'Basic',
  },
  {
    href: '/chat',
    icon: <MessageCircle className="w-6 h-6" />,
    color: 'green',
    title: 'Candidate Chat',
    description: 'Manage direct messages in one place.',
    label: 'Open Chat',
    tier: 'Basic + Consumer Keys',
  },
];

const colorMap: Record<string, { bg: string; text: string; hover: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-500', hover: 'text-indigo-500' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-500',   hover: 'text-teal-500'   },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-500',   hover: 'text-blue-500'   },
  purple: { bg: 'bg-purple-50', text: 'text-purple-500', hover: 'text-purple-500' },
  green:  { bg: 'bg-green-50',  text: 'text-green-500',  hover: 'text-green-500'  },
};


export default function Home() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to X Dashboard</h1>
        <p className="text-zinc-500">Manage candidate interactions without logging into X directly.</p>
      </div>

      {/* API Status Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h2 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          X API Tier Requirements
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2 text-amber-700">
            <XCircle className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
            <span><strong>User Search / Discovery</strong> — Requires X API Basic tier ($100/mo). Free tier returns 402.</span>
          </div>
          <div className="flex items-start gap-2 text-amber-700">
            <XCircle className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
            <span><strong>DMs (read/write)</strong> — Requires Basic tier + OAuth 1.0a Consumer Keys (API Key + Secret, not Client ID/Secret).</span>
          </div>
          <div className="flex items-start gap-2 text-amber-700">
            <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
            <span><strong>Post tweets</strong> — Works on Free tier with OAuth 1.0a Consumer Keys.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(f => {
          const c = colorMap[f.color];
          return (
            <Link key={f.href} href={f.href} className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-zinc-300">
              <div className={`w-12 h-12 ${c.bg} ${c.text} rounded-xl flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
              <p className="text-zinc-500 text-sm mb-1">{f.description}</p>
              <p className="text-xs text-zinc-400 mb-5">Requires: {f.tier}</p>
              <div className={`flex items-center ${c.hover} font-medium text-sm group-hover:translate-x-1 transition-transform`}>
                {f.label} <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
