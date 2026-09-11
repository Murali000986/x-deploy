"use client";
import { useState, useEffect } from 'react';
import { Users, Loader2, MessageCircle, Clock, Trash2, Search } from 'lucide-react';
import Link from 'next/link';

const STATUSES = [
  { key: 'new',     label: 'In Pipeline', icon: Users,          color: 'blue'   },
  { key: 'pending', label: 'Pending',     icon: Clock,          color: 'amber'  },
  { key: 'chat',    label: 'Chatting',    icon: MessageCircle,  color: 'green'  },
];

const BADGE_STYLES: Record<string, string> = {
  new:     'bg-blue-50 border-blue-200',
  pending: 'bg-amber-50 border-amber-200',
  chat:    'bg-green-50 border-green-200',
};

const ICON_STYLES: Record<string, string> = {
  new:     'text-blue-500',
  pending: 'text-amber-500',
  chat:    'text-green-600',
};

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCandidates(); }, []);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/candidates');
      setCandidates(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/candidates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    fetchCandidates();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
    fetchCandidates();
  };

  if (loading) {
    return <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="p-8 animate-in fade-in duration-500 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Candidate Pipeline</h1>
          <p className="text-zinc-500 text-sm mt-1">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} tracked</p>
        </div>
        <Link
          href="/search"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <Search className="w-4 h-4" /> Find Candidates
        </Link>
      </div>

      {candidates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
          <Users className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">No candidates yet</p>
          <p className="text-sm mt-1 mb-6">Search for a candidate and add them to the pipeline</p>
          <Link href="/search" className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            Start Searching
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0 min-h-[500px]">
          {STATUSES.map(col => {
            const colCandidates = candidates.filter(c => c.status === col.key);
            const Icon = col.icon;
            return (
              <div key={col.key} className={`rounded-2xl border ${BADGE_STYLES[col.key]} p-4 flex flex-col min-h-0`}>
                <div className={`flex items-center gap-2 mb-4 font-semibold ${ICON_STYLES[col.key]} shrink-0`}>
                  <Icon className="w-4 h-4" />
                  {col.label}
                  <span className="ml-auto bg-white rounded-full px-2 py-0.5 text-xs text-zinc-600 font-medium shadow-sm">
                    {colCandidates.length}
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto pr-2 flex-1 pb-2">
                  {colCandidates.length === 0 && (
                    <div className="text-xs text-center text-zinc-400 py-6">No candidates here</div>
                  )}
                  {colCandidates.map((c: any) => (
                    <div key={c.id} className="bg-white rounded-xl p-4 border border-zinc-100 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        {c.profile_image_url ? (
                          <img src={c.profile_image_url} alt={c.name} className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-500">
                            {c.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{c.name}</p>
                          <p className="text-xs text-zinc-400 truncate">@{c.username}</p>
                        </div>
                      </div>

                      {c.description && (
                        <p className="text-xs text-zinc-500 line-clamp-2 mb-3">{c.description}</p>
                      )}

                      {/* Status transition buttons */}
                      <div className="flex gap-1.5 flex-wrap">
                        {col.key === 'new' && (
                          <button onClick={() => handleStatusChange(c.id, 'pending')}
                            className="text-xs px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors cursor-pointer">
                            Send DM
                          </button>
                        )}
                        {col.key === 'pending' && (
                          <button onClick={() => handleStatusChange(c.id, 'chat')}
                            className="text-xs px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors cursor-pointer">
                            Replied (Move to Chat)
                          </button>
                        )}
                        {col.key === 'chat' && (
                          <Link href="/chat"
                            className="text-xs px-2.5 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors">
                            Open Chat
                          </Link>
                        )}
                        <button onClick={() => handleDelete(c.id)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-100 hover:bg-red-200 hover:text-red-600 transition-colors ml-auto cursor-pointer">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>

                      <p className="text-[10px] text-zinc-300 mt-2">
                        Added {new Date(c.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
