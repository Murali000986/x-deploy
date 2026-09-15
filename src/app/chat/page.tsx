"use client";
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Loader2, Send, Bot, Info, Clock, CheckCircle2 } from 'lucide-react';

export default function ChatPage() {
  const ObjectValues = Object.values;
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [myIds, setMyIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const [dmWarning, setDmWarning] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchDMs(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selectedPartnerId, messages]);

  const fetchDMs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/x/dms');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch DMs');
      if (data._error) { setError(data._error); setLoading(false); return; }
      setMessages(data.data || []);
      setMyIds(data._myIds || []);
      if (data._warning) setDmWarning(data._warning);
      const userMap: Record<string, any> = {};
      if (data.includes?.users) { data.includes.users.forEach((u: any) => { userMap[u.id] = u; }); }
      setUsers(userMap);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const getPartnerId = (msg: any): string => {
    if (msg.sender_id && !myIds.includes(msg.sender_id)) return msg.sender_id;
    const parts = (msg.dm_conversation_id ?? '').split('-');
    const other = parts.find((p: string) => !myIds.includes(p) && p !== '');
    if (other) return other;
    if (msg.recipient_id && !myIds.includes(msg.recipient_id)) return msg.recipient_id;
    return '';
  };

  const mergedByPartner: Record<string, { msgs: any[], partnerId: string }> = {};
  messages.forEach(msg => {
    const partnerId = getPartnerId(msg);
    if (!partnerId) return;
    if (!mergedByPartner[partnerId]) mergedByPartner[partnerId] = { msgs: [], partnerId };
    mergedByPartner[partnerId].msgs.push(msg);
  });

  ObjectValues(mergedByPartner).forEach(conv => {
    conv.msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  });

  // Sort partners by the timestamp of their most recent message
  const partnerIds = Object.keys(mergedByPartner).sort((a, b) => {
    const lastA = mergedByPartner[a].msgs[mergedByPartner[a].msgs.length - 1];
    const lastB = mergedByPartner[b].msgs[mergedByPartner[b].msgs.length - 1];
    return new Date(lastB.created_at).getTime() - new Date(lastA.created_at).getTime();
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedPartnerId) return;
    setSending(true);
    setSendError('');
    const conv = mergedByPartner[selectedPartnerId];
    const lastMsg = conv?.msgs[conv.msgs.length - 1];
    const botAccountId = lastMsg?.botAccountId;

    try {
      const res = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedPartnerId, text: replyText, botAccountId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      setReplyText('');
      await fetchDMs();
    } catch (err: any) { setSendError(err.message); } finally { setSending(false); }
  };

  const Avatar = ({ user, size = "md" }: { user: any, size?: "sm"|"md"|"lg" }) => {
    const s = size === "sm" ? "w-8 h-8 text-[10px]" : size === "md" ? "w-10 h-10 text-xs" : "w-12 h-12 text-sm";
    return user?.profile_image_url
      ? <img src={user.profile_image_url} alt="" className={`${s} rounded-full shrink-0 object-cover shadow-sm`} />
      : <div className={`${s} rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-500 shrink-0`}>
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center h-full text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
        <p className="text-sm font-medium tracking-wide">Syncing Universal Inbox...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden animate-in fade-in duration-300 h-full bg-white">
      {/* Sidebar - Chat List */}
      <div className="w-[340px] border-r border-zinc-100 flex flex-col shrink-0 bg-white">
        <div className="px-5 py-6 border-b border-zinc-100 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-zinc-800">Inbox</h2>
          <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Unified</span>
        </div>
        
        {dmWarning && (
          <div className="m-3 p-3 bg-amber-50 rounded-xl border border-amber-100 text-amber-700 text-xs leading-snug flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{dmWarning}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
          {error ? (
            <div className="p-6 text-center text-red-500 text-sm mt-4">{error}</div>
          ) : partnerIds.length === 0 ? (
            <div className="p-10 text-center text-zinc-400 text-sm flex flex-col items-center">
              <MessageCircle className="w-10 h-10 mb-3 opacity-20" />
              <p>No active conversations found across your connected profiles.</p>
            </div>
          ) : (
             partnerIds.map(pid => {
              const { msgs, partnerId } = mergedByPartner[pid];
              const user = users[partnerId] || { name: 'Unknown', username: partnerId };
              const lastMsg = msgs[msgs.length - 1];
              const isSelected = selectedPartnerId === pid;
              
              return (
                <button
                  key={pid}
                  onClick={() => setSelectedPartnerId(pid)}
                  className={`w-full p-4 border-b border-zinc-50 flex items-start gap-3 transition-all text-left group
                    ${isSelected ? 'bg-indigo-50/60 relative' : 'hover:bg-zinc-50'}`}
                >
                  {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full" />}
                  <Avatar user={user} size="md" />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`font-semibold text-sm truncate pr-2 ${isSelected ? 'text-indigo-950' : 'text-zinc-800'}`}>
                        {user.name}
                      </p>
                      <p className={`text-[10px] shrink-0 ${isSelected ? 'text-indigo-500 font-medium' : 'text-zinc-400'}`}>
                        {lastMsg ? formatTime(lastMsg.created_at) : ''}
                      </p>
                    </div>
                    <p className={`text-xs truncate ${isSelected ? 'text-indigo-700/80' : 'text-zinc-500'}`}>
                      {myIds.includes(lastMsg?.sender_id) ? 'You: ' : ''}{lastMsg?.text ?? ''}
                    </p>
                    {lastMsg?.botUsername && (
                      <div className="flex items-center gap-1 mt-1.5 opacity-60">
                        <Bot className="w-[10px] h-[10px]" />
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-zinc-500">via @{lastMsg.botUsername}</span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-zinc-50/50 flex flex-col overflow-hidden relative">
        {selectedPartnerId ? (
          <>
            {/* Chat Header */}
            {(() => {
              const conv = mergedByPartner[selectedPartnerId];
              const partnerUser = conv ? users[conv.partnerId] : null;
              const viaBot = conv?.msgs[conv.msgs.length - 1]?.botUsername;
              return (
                <div className="h-[73px] px-6 border-b border-zinc-100 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <div className="flex items-center gap-3">
                    <Avatar user={partnerUser} size="md" />
                    <div>
                      <h3 className="font-bold text-zinc-900">{partnerUser?.name || 'Unknown'}</h3>
                      <p className="text-xs text-zinc-500 font-medium">@{partnerUser?.username || selectedPartnerId}</p>
                    </div>
                  </div>
                  {viaBot && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full">
                      <Bot className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Routing: @{viaBot}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Messages Feed */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5 no-scrollbar">
              {(mergedByPartner[selectedPartnerId]?.msgs ?? []).map((msg: any, index: number, arr: any[]) => {
                const isMine = myIds.includes(msg.sender_id) || msg.is_mine;
                const prevMsg = arr[index - 1];
                const isCluster = prevMsg && (prevMsg.sender_id === msg.sender_id);
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${isCluster ? 'mt-1.5' : ''}`}>
                    {/* Only show bot routing badge on the first message of a cluster to reduce clutter */}
                    {!isMine && !isCluster && msg.botUsername && (
                      <div className="flex items-center gap-1.5 mb-1.5 px-1 ml-1 opacity-50">
                        <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-500">
                           Received via @{msg.botUsername}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-end gap-2 group max-w-[70%]">
                      {!isMine && (
                        <div className={`w-6 h-6 shrink-0 ${isCluster ? 'opacity-0' : 'opacity-100'}`}>
                           <Avatar user={users[selectedPartnerId]} size="sm" />
                        </div>
                      )}
                      
                      <div className={`
                        px-4 py-2.5 rounded-2xl text-[15px] shadow-sm leading-relaxed
                        ${isMine 
                          ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-br-sm' 
                          : 'bg-white border border-zinc-100 text-zinc-800 rounded-bl-sm'
                        }
                      `}>
                        <p>{msg.text}</p>
                      </div>

                      {/* Hover Timestamps */}
                      <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-zinc-400 mb-1 ${isMine ? 'pr-1 order-first' : 'pl-1'}`}>
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-zinc-100 shrink-0 relative z-20">
              {sendError && (
                <div className="absolute bottom-full left-0 right-0 p-3 bg-red-50 text-red-600 text-xs border-t border-red-100 flex items-center gap-2">
                   <Info className="w-4 h-4 shrink-0" />
                   {sendError}
                </div>
              )}
              
              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Message..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    className="flex-1 bg-zinc-100/70 border border-transparent focus:border-indigo-200 focus:bg-white rounded-full px-5 py-3.5 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-zinc-400 shadow-sm inset-shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="w-[50px] h-[50px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:scale-95 disabled:hover:bg-indigo-600 cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                  </button>
                </form>
                <div className="text-center mt-3">
                   <p className="text-[10px] text-zinc-400 font-medium">Replies are automatically routed through the bot that initially received the thread.</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 bg-zinc-50">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-zinc-100 flex items-center justify-center mb-6">
              <MessageCircle className="w-8 h-8 text-indigo-300" />
            </div>
            <h2 className="text-xl font-bold text-zinc-800 mb-2">Unified CRM Inbox</h2>
            <p className="max-w-xs text-center text-sm leading-relaxed">
              Select a conversation from the sidebar to engage with candidates across all your connected profiles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
