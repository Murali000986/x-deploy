import { ArrowRight, Search, Hash, MessageCircle, CheckCircle, XCircle, AlertCircle, Users, List } from "lucide-react";
import Link from 'next/link';

const features = [
  {
    href: '/candidates',
    icon: <Users className="w-6 h-6" />,
    color: 'indigo',
    title: 'Candidate Pipeline',
    description: 'Track and manage candidates across all pipeline stages.',
    label: 'Open Pipeline',
    tier: 'No API required',
  },
  {
    href: '/xlists',
    icon: <List className="w-6 h-6" />,
    color: 'teal',
    title: 'Account Lists',
    description: 'View and manage imported accounts with status tracking.',
    label: 'Open Lists',
    tier: 'No API required',
  },
  {
    href: '/search',
    icon: <Search className="w-6 h-6" />,
    color: 'blue',
    title: 'Candidate Search',
    description: 'Look up any candidate by their social username.',
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
    title: 'Unified Chat',
    description: 'Manage all direct messages across all accounts.',
    label: 'Open Chat',
    tier: 'Basic + Consumer Keys',
  },
];

const colorMap: Record<string, { bg: string; text: string; hover: string; border: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'text-indigo-600', border: 'group-hover:border-indigo-200' },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   hover: 'text-teal-600',   border: 'group-hover:border-teal-200'   },
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   hover: 'text-blue-600',   border: 'group-hover:border-blue-200'   },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hover: 'text-purple-600', border: 'group-hover:border-purple-200' },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  hover: 'text-green-600',  border: 'group-hover:border-green-200'  },
};

export default function Home() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200">
        <p className="text-indigo-200 text-xs font-semibold tracking-widest uppercase mb-3">SocialCRM Dashboard</p>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Candidate Outreach, Simplified</h1>
        <p className="text-indigo-200 max-w-lg">Manage all your candidate interactions, DMs, and pipeline stages — without switching accounts or tabs.</p>
      </div>

      {/* API Status Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h2 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          API Tier Requirements
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2 text-amber-700">
            <XCircle className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
            <span><strong>User Search / Discovery</strong> — Requires API Basic tier ($100/mo). Free tier returns 402.</span>
          </div>
          <div className="flex items-start gap-2 text-amber-700">
            <XCircle className="w-4 h-4 mt-0.5 text-red-500 shrink-0" />
            <span><strong>DMs (read/write)</strong> — Requires Basic tier + OAuth 1.0a Consumer Keys.</span>
          </div>
          <div className="flex items-start gap-2 text-amber-700">
            <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
            <span><strong>Post tweets</strong> — Works on Free tier with OAuth 1.0a Consumer Keys.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(f => {
          const c = colorMap[f.color];
          return (
            <Link key={f.href} href={f.href} className={`group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all ${c.border}`}>
              <div className={`w-11 h-11 ${c.bg} ${c.text} rounded-xl flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-base mb-1">{f.title}</h3>
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
