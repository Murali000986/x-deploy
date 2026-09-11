"use client";
import { useState, useEffect } from 'react';
import { Settings, CheckCircle, XCircle, Loader2, RefreshCw, Key, ExternalLink, Bot, Activity } from 'lucide-react';

const CREDENTIAL_LABELS: Record<string, { label: string; description: string; tested?: boolean }> = {
  bearer_token:  { label: 'Bearer Token',  description: 'Read-only access — user lookup, tweet search', tested: true },
  api_key:       { label: 'API Key',        description: 'OAuth 1.0a Consumer Key' },
  api_secret:    { label: 'API Secret',     description: 'OAuth 1.0a Consumer Secret' },
  access_token:  { label: 'Access Token',   description: 'Bot account identity — also tests DM access', tested: true },
  access_secret: { label: 'Access Secret',  description: 'OAuth 1.0a user access token secret' },
};

function RateLimitBar({ rateLimit }: { rateLimit: any }) {
  if (!rateLimit?.limit || !rateLimit?.remaining) return null;
  const total = parseInt(rateLimit.limit);
  const remaining = parseInt(rateLimit.remaining);
  const used = total - remaining;
  const pct = Math.round((used / total) * 100);
  const resetDate = rateLimit.reset ? new Date(parseInt(rateLimit.reset) * 1000).toLocaleTimeString() : null;

  return (
    <div className="mt-3 space-y-1">
      <div className="flex justify-between text-[11px] text-zinc-500">
        <span>Rate limit: <strong className="text-zinc-700">{remaining}</strong> / {total} remaining</span>
        {resetDate && <span>Resets at {resetDate}</span>}
      </div>
      <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-400' : pct > 50 ? 'bg-amber-400' : 'bg-green-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-zinc-400">{used} used of {total} in current 15-min window</p>
    </div>
  );
}

export default function SettingsPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/status');
      setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  // Extract bot info from access_token result
  const botUsername = status?.access_token?.botUsername;
  const botName = status?.access_token?.botName;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Settings
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Live X API credential status and usage</p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Re-test
        </button>
      </div>

      {/* Bot Identity Card */}
      {!loading && botUsername && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-0.5">Active Bot Account</p>
            <p className="font-bold text-blue-900">{botName}</p>
            <p className="text-sm text-blue-600">@{botUsername}</p>
          </div>
          <a
            href={`https://x.com/${botUsername}`}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-blue-500 hover:text-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Credential Cards */}
      {loading && !status ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      ) : status ? (
        <div className="space-y-3">
          {Object.entries(CREDENTIAL_LABELS).map(([key, meta]) => {
            const cred = status[key];
            const isSet = cred?.set;
            const isTested = meta.tested;
            const isOk = cred?.ok;
            const message = cred?.message;
            const masked = cred?.masked;

            return (
              <div key={key} className={`bg-white rounded-2xl border p-5 shadow-sm ${
                isTested ? (isOk ? 'border-green-200' : 'border-red-200') : 'border-zinc-200'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 rounded-xl p-2 ${
                    isTested ? (isOk ? 'bg-green-50' : 'bg-red-50') : (isSet ? 'bg-zinc-100' : 'bg-zinc-50')
                  }`}>
                    <Key className={`w-5 h-5 ${isTested ? (isOk ? 'text-green-600' : 'text-red-500') : 'text-zinc-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{meta.label}</span>
                      {isTested && (
                        isOk
                          ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" /> Connected</span>
                          : <span className="flex items-center gap-1 text-red-500 text-xs font-medium bg-red-50 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" /> Failed</span>
                      )}
                      {!isTested && isSet && <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">Set ✓</span>}
                      {!isSet && <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded-full">Missing</span>}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{meta.description}</p>
                    {masked && (
                      <code className="text-xs text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded mt-1 inline-block font-mono">{masked}</code>
                    )}
                    {isTested && !isOk && message && (
                      <p className="text-xs text-red-500 mt-1">{message}</p>
                    )}
                    {/* Rate limit bar */}
                    {isTested && isOk && cred?.rateLimit && (
                      <RateLimitBar rateLimit={cred.rateLimit} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Credits & Billing Links */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 font-medium text-sm text-zinc-700">
          <Activity className="w-4 h-4" />
          API Credits & Usage
        </div>
        <p className="text-xs text-zinc-500">
          X does not expose billing credits via the API. Check these pages directly on the X Developer Portal:
        </p>
        <div className="flex flex-col gap-2">
          <a
            href="https://developer.x.com/en/portal/projects-and-apps"
            target="_blank" rel="noreferrer"
            className="flex items-center justify-between px-4 py-3 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:shadow-sm transition-all text-sm"
          >
            <span className="font-medium">Credits & Billing</span>
            <span className="flex items-center gap-1 text-blue-500 text-xs">console.x.com <ExternalLink className="w-3 h-3" /></span>
          </a>
          <a
            href="https://developer.x.com/en/portal/projects-and-apps"
            target="_blank" rel="noreferrer"
            className="flex items-center justify-between px-4 py-3 bg-white border border-zinc-200 rounded-xl hover:border-zinc-300 hover:shadow-sm transition-all text-sm"
          >
            <span className="font-medium">Usage Dashboard</span>
            <span className="flex items-center gap-1 text-blue-500 text-xs">developer.x.com <ExternalLink className="w-3 h-3" /></span>
          </a>
        </div>
      </div>

      {/* Env file hint */}
      <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-5">
        <p className="text-sm font-medium text-zinc-600 mb-2">Update credentials</p>
        <code className="text-xs bg-white border border-zinc-200 rounded-lg px-3 py-2 block font-mono text-zinc-700">
          x-dashbord-manger/.env.local
        </code>
        <p className="text-xs text-zinc-400 mt-2">Restart the dev server after editing for changes to apply.</p>
      </div>
    </div>
  );
}
