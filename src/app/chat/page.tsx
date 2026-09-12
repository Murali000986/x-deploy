"use client";
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Loader2, Send } from 'lucide-react';

export default function ChatPage() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [myId, setMyId] = useState<string>('');
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const [dmWarning, setDmWarning] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchDMs(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedPartnerId, messages]);

  const fetchDMs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/x/dms');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch DMs');
      if (data._error) { setError(data._error); setLoading(false); return; }
      setMessages(data.data || []);
      setMyId(data._myId || '');
      if (data._warning) setDmWarning(data._warning);
      const userMap: Record<string, any> = {};
      if (data.includes?.users) {
        data.includes.users.forEach((u: any) => { userMap[u.id] = u; });
      }
      setUsers(userMap);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Extract the real partner from a message.
  // dm_conversation_id = "ID1-ID2" (sorted). Partner = whichever part != myId.
  const getPartnerId = (msg: any): string => {
    if (msg.sender_id && msg.sender_id !== myId) return msg.sender_id;
    const parts = (msg.dm_conversation_id ?? '').split('-');
    const other = parts.find((p: string) => p !== myId && p !== '');
    if (other) return other;
    if (msg.recipient_id && msg.recipient_id !== myId) return msg.recipient_id;
    return '';
  };

  const mergedByPartner: Record<string, { msgs: any[], partnerId: string }> = {};
  messages.forEach(msg => {
    const partnerId = getPartnerId(msg);
    if (!partnerId) return;
    if (!mergedByPartner[partnerId]) mergedByPartner[partnerId] = { msgs: [], partnerId };
    mergedByPartner[partnerId].msgs.push(msg);
  });

  Object.values(mergedByPartner).forEach(conv => {
    conv.msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  });

  const partnerIds = Object.keys(mergedByPartner);


  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedPartnerId) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Send by userId directly — no username lookup needed
        body: JSON.stringify({ userId: selectedPartnerId, text: replyText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      setReplyText('');
      await fetchDMs();
    } catch (err: any) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const Avatar = ({ user }: { user: any }) => (
    user?.profile_image_url
      ? <img src={user.profile_image_url} alt="" className="w-10 h-10 rounded-full shrink-0" />
      : <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-500 shrink-0">
          {user?.name?.[0]?.toUpperCase() ?? '?'}
        </div>
  );

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden animate-in">
      {/* Sidebar */}
      <div className="w-80 border-r border-zinc-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-zinc-200">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Messages
          </h2>
        </div>
        {dmWarning && (
          <div className="p-3 bg-amber-50 border-b border-amber-100 text-amber-700 text-xs leading-snug">
            {dmWarning}
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="p-4 text-center text-red-500 text-sm mt-10">{error}</div>
          ) : partnerIds.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm mt-10">No conversations found.</div>
          ) : (
            partnerIds.map(pid => {
              const { msgs, partnerId } = mergedByPartner[pid];
              const user = users[partnerId] || { name: 'Unknown', username: partnerId };
              const lastMsg = msgs[msgs.length - 1];
              return (
                <button
                  key={pid}
                  onClick={() => setSelectedPartnerId(pid)}
                  className={`w-full p-4 border-b border-zinc-100 flex items-center gap-3 hover:bg-zinc-50 transition-colors text-left ${selectedPartnerId === pid ? 'bg-green-50' : ''}`}
                >
                  <Avatar user={user} />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {lastMsg?.sender_id === myId ? '↗ ' : ''}{lastMsg?.text ?? ''}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-zinc-50 flex flex-col overflow-hidden">
        {selectedPartnerId ? (
          <>
            {(() => {
              const conv = mergedByPartner[selectedPartnerId];
              const partnerUser = conv ? users[conv.partnerId] : null;
              return (
                <div className="p-4 border-b border-zinc-200 bg-white flex items-center gap-3 shadow-sm shrink-0">
                  <Avatar user={partnerUser} />
                  <div>
                    <h3 className="font-bold">{partnerUser?.name || 'Unknown'}</h3>
                    <p className="text-sm text-zinc-500">@{partnerUser?.username || selectedPartnerId}</p>
                  </div>
                </div>
              );
            })()}

            <div className="flex-1 p-6 overflow-y-auto space-y-3">
              {(mergedByPartner[selectedPartnerId]?.msgs ?? []).map((msg: any) => {
                const isMine = msg.sender_id === myId;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl max-w-md shadow-sm text-sm ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-zinc-100 text-zinc-800 rounded-bl-sm'}`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? 'text-blue-200' : 'text-zinc-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {sendError && (
              <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-t border-red-100">{sendError}</div>
            )}
            <div className="p-4 bg-white border-t border-zinc-200 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  className="flex-1 bg-zinc-100 rounded-full px-6 py-3 outline-none focus:ring-2 focus:ring-green-500/30"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
            <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
