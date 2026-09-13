"use client";
import { useState, useEffect, useCallback } from 'react';
import { Settings, CheckCircle, XCircle, Loader2, RefreshCw, Key, ExternalLink, Bot, Activity, Users, Plus, Trash2, LogIn } from 'lucide-react';

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
  const [accounts, setAccounts] = useState<any[]>([]);
  const [acctLoading, setAcctLoading] = useState(true);
  const [acctMsg, setAcctMsg] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAdding(true);
    setAcctMsg('');
    const fd = new FormData(e.currentTarget);
    const body = {
      appKey: fd.get('appKey'), appSecret: fd.get('appSecret'),
      accessToken: fd.get('accessToken'), accessSecret: fd.get('accessSecret')
    };

    try {
      const res = await fetch('/api/accounts/add', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAcctMsg(`✅ Added account: ${data.account.name}`);
      setShowAddModal(false);
      fetchAccounts();
    } catch (err: any) {
      setAcctMsg(`❌ ${err.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  // Read success/error from URL params on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('success')) setAcctMsg('✅ ' + p.get('success'));
    if (p.get('error')) setAcctMsg('❌ ' + p.get('error'));
  }, []);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/status');
      setStatus(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    setAcctLoading(true);
    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data.accounts ?? []);
    } finally {
      setAcctLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); fetchAccounts(); }, [fetchStatus, fetchAccounts]);

  const switchAccount = async (id: string) => {
    await fetch('/api/accounts/switch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchAccounts();
    window.dispatchEvent(new Event('account-switched'));
  };

  const removeAccount = async (id: string) => {
    await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
    fetchAccounts();
  };

  // Extract bot info from access_token result
  const botUsername = status?.access_token?.botUsername;
  const botName = status?.access_token?.botName;

  // Trigger railway rebuild hook

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

      {/* Connected Accounts */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm text-zinc-800">
            <Users className="w-4 h-4" />
            Connected X Accounts
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Account Key
          </button>
        </div>

        {acctMsg && (
          <p className={`text-xs px-3 py-2 rounded-lg ${acctMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {acctMsg}
          </p>
        )}

        {acctLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-6 text-zinc-400 text-sm">
            <Key className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No managed accounts found.</p>
            <p className="text-xs mt-1 text-zinc-400">The .env fallback credentials are still active.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc: any) => (
              <div key={acc._id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${acc.isActive ? 'border-green-200 bg-green-50' : 'border-zinc-100 bg-zinc-50'}`}>
                {acc.profileImageUrl
                  ? <img src={acc.profileImageUrl} alt="" className="w-9 h-9 rounded-full shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">{acc.name?.[0] ?? '?'}</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{acc.name}</p>
                  <p className="text-xs text-zinc-500">@{acc.username}</p>
                </div>
                {acc.isActive && (
                  <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
                )}
                {!acc.isActive && (
                  <button
                    onClick={() => switchAccount(acc._id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer font-medium"
                  >
                    Switch
                  </button>
                )}
                <button
                  onClick={() => removeAccount(acc._id)}
                  className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-zinc-400 hover:bg-zinc-50 rounded-full transition-colors cursor-pointer">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-zinc-900">Connect New Account</h3>
              <p className="text-sm text-zinc-500 mt-1">
                Enter your Developer Portal credentials to securely link a new X profile to the dashboard.
              </p>
            </div>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-widest pl-1">API Key (Consumer)</label>
                  <input type="text" name="appKey" required placeholder="API Key" className="w-full px-4 py-3 text-sm bg-zinc-50/50 border border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition-all placeholder:text-zinc-400 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-widest pl-1">API Secret</label>
                  <input type="text" name="appSecret" required placeholder="API Secret" className="w-full px-4 py-3 text-sm bg-zinc-50/50 border border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition-all placeholder:text-zinc-400 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-widest pl-1">Access Token (User User)</label>
                  <input type="text" name="accessToken" required placeholder="Access Token" className="w-full px-4 py-3 text-sm bg-zinc-50/50 border border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition-all placeholder:text-zinc-400 font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-700 uppercase tracking-widest pl-1">Access Secret</label>
                  <input type="text" name="accessSecret" required placeholder="Access Token Secret" className="w-full px-4 py-3 text-sm bg-zinc-50/50 border border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl outline-none transition-all placeholder:text-zinc-400 font-mono" />
                </div>
              </div>
              
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isAdding} 
                  className="w-full px-4 py-3.5 bg-zinc-900 text-white hover:bg-zinc-800 focus:ring-4 focus:ring-zinc-900/20 rounded-2xl text-sm font-semibold flex items-center justify-center transition-all cursor-pointer shadow-md shadow-zinc-900/10 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isAdding ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Connecting...</>
                  ) : 'Verify & Add Account'}
                </button>
              </div>
            </form>

            <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-xs shadow-sm">
              <Bot className="w-4 h-4 shrink-0" />
              <p>Your keys are securely encrypted and stored locally in your database.</p>
            </div>
          </div>
        </div>
      )}

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
