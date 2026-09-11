"use client";
import { useState } from 'react';
import { Hash, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DiscoveryPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword) return;
    
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const res = await fetch(`/api/x/search?q=${encodeURIComponent(keyword)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to search candidates');
      }

      setResults(data.includes?.users || []); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 animate-in">
      <h1 className="text-2xl font-bold">Candidate Discovery</h1>
      
      <form onSubmit={handleSearch} className="flex gap-4 max-w-3xl">
        <div className="relative flex-1">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input 
            type="text" 
            placeholder='e.g. "solidity developer"'
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-hidden transition-all"
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-70 cursor-pointer"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Discover'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((user: any) => (
            <div key={user.id} className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex gap-4 items-center">
                {user.profile_image_url ? (
                  <img src={user.profile_image_url.replace('_normal', '')} alt={user.name} className="w-16 h-16 rounded-full border border-zinc-100" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center text-xl font-bold text-zinc-500">
                    {user.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">{user.name}</h3>
                  <p className="text-zinc-500 text-sm">@{user.username}</p>
                </div>
              </div>
              <p className="text-zinc-700 text-sm flex-1">{user.description || 'No description provided.'}</p>
              <div className="pt-4 border-t border-zinc-100 mt-auto">
                 <Link href={`https://x.com/${user.username}`} target="_blank" className="flex items-center text-purple-600 text-sm font-medium hover:text-purple-700 transition-colors">
                    View on X <ArrowRight className="w-4 h-4 ml-1" />
                 </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
