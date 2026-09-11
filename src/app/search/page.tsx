"use client";
import { useState } from 'react';
import { Search, Loader2, MessageCircle, Clock, ChevronDown, ChevronUp, Heart, Repeat2, UserPlus, Check, ExternalLink } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  new:     { label: 'Add to Pipeline', color: 'bg-blue-600 hover:bg-blue-700 text-white',     icon: UserPlus },
  pending: { label: 'Pending',         color: 'bg-amber-500 hover:bg-amber-600 text-white',   icon: Clock },
  chat:    { label: 'Chatting',        color: 'bg-green-600 hover:bg-green-700 text-white',   icon: MessageCircle },
};

export default function SearchPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [candidateStatus, setCandidateStatus] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [showTweets, setShowTweets] = useState(false);
  const [tweets, setTweets] = useState<any[]>([]);
  const [tweetsLoading, setTweetsLoading] = useState(false);
  const [dmLoading, setDmLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setLoading(true);
    setError('');
    setResult(null);
    setCandidateStatus(null);
    setCandidateId(null);
    setShowTweets(false);
    setTweets([]);

    try {
      const clean = username.replace('@', '');
      const res = await fetch(`/api/x/user/${clean}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch user');
      setResult(data.data);

      // check if already in pipeline
      const allRes = await fetch('/api/candidates');
      const all = await allRes.json();
      const found = all.find((c: any) => c.username === data.data.username);
      if (found) {
        setCandidateStatus(found.status);
        setCandidateId(found.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPipeline = async () => {
    if (!result || candidateStatus !== null) return;
    setDmLoading(true);
    try {
      const addRes = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      const candidate = await addRes.json();
      setCandidateId(candidate.id);
      setCandidateStatus('new');
    } finally {
      setDmLoading(false);
    }
  };

  const handleSendDM = async () => {
    if (!result || !candidateId) return;
    setDmLoading(true);
    try {
      // send actual DM
      const dmRes = await fetch(`/api/x/dms/${result.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `Hi @${result.username}! I came across your profile and would love to connect.` })
      });
      const dmData = await dmRes.json();

      // update status to pending whether DM worked or not (track intent)
      const patchRes = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending' })
      });
      const updated = await patchRes.json();
      setCandidateStatus(updated.status);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDmLoading(false);
    }
  };

  const handleToggleTweets = async () => {
    if (showTweets) { setShowTweets(false); return; }
    setShowTweets(true);
    if (tweets.length > 0) return;
    setTweetsLoading(true);
    try {
      const res = await fetch(`/api/x/user/${result.username}/tweets`);
      const data = await res.json();
      setTweets(data.data || []);
    } catch {}
    finally { setTweetsLoading(false); }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold">Candidate Search</h1>

      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Enter @username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-70 cursor-pointer"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{error}</div>
      )}

      {result && (
        <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 flex gap-5">
            {result.profile_image_url ? (
              <img src={result.profile_image_url.replace('_normal', '')} alt={result.name} className="w-20 h-20 rounded-full border border-zinc-100 shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center text-2xl font-bold text-zinc-500 shrink-0">
                {result.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold">{result.name}</h2>
                  <a href={`https://x.com/${result.username}`} target="_blank" rel="noreferrer" className="text-zinc-500 text-sm flex items-center gap-1 hover:text-blue-500 transition-colors">
                    @{result.username} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Status Badge */}
                {candidateStatus && candidateStatus !== 'new' && (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
                    candidateStatus === 'pending' ? 'bg-amber-100 text-amber-700' :
                    candidateStatus === 'chat' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {candidateStatus === 'pending' && <Clock className="w-3 h-3" />}
                    {candidateStatus === 'chat' && <MessageCircle className="w-3 h-3" />}
                    {candidateStatus === 'pending' ? 'Pending' : 'Chatting'}
                  </span>
                )}
              </div>
              <p className="text-zinc-700 text-sm mt-2">{result.description || 'No bio available.'}</p>
              <div className="flex gap-4 text-sm text-zinc-500 mt-3">
                <span><strong className="text-zinc-900">{result.public_metrics?.followers_count?.toLocaleString() ?? '–'}</strong> Followers</span>
                <span><strong className="text-zinc-900">{result.public_metrics?.following_count?.toLocaleString() ?? '–'}</strong> Following</span>
                <span><strong className="text-zinc-900">{result.public_metrics?.tweet_count?.toLocaleString() ?? '–'}</strong> Tweets</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-5 flex gap-3 flex-wrap border-t border-zinc-100 pt-4">
            {candidateStatus === null && (
              <button
                onClick={handleAddToPipeline}
                disabled={dmLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 cursor-pointer"
              >
                {dmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Add to Pipeline
              </button>
            )}
            {candidateStatus === 'new' && (
              <button
                onClick={handleSendDM}
                disabled={dmLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-60 cursor-pointer"
              >
                {dmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                Send DM
              </button>
            )}
            {candidateStatus === 'pending' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-amber-100 text-amber-700">
                <Clock className="w-4 h-4" /> Pending reply
              </div>
            )}
            {candidateStatus === 'chat' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-green-100 text-green-700">
                <Check className="w-4 h-4" /> Active conversation
              </div>
            )}

            <button
              onClick={handleToggleTweets}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              {showTweets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showTweets ? 'Hide Posts' : 'View Posts'}
            </button>
          </div>

          {/* Recent Tweets */}
          {showTweets && (
            <div className="border-t border-zinc-100">
              {tweetsLoading ? (
                <div className="p-6 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-zinc-400" /></div>
              ) : tweets.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 text-sm">No recent tweets available.</div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {tweets.map((tweet: any) => (
                    <div key={tweet.id} className="p-5 hover:bg-zinc-50 transition-colors">
                      <p className="text-sm text-zinc-800 leading-relaxed">{tweet.text}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" /> {tweet.public_metrics?.like_count ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Repeat2 className="w-3 h-3" /> {tweet.public_metrics?.retweet_count ?? 0}
                        </span>
                        <span>{new Date(tweet.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
