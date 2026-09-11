"use client";
import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Loader2, Send } from 'lucide-react';

export default function ChatPage() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<Record<string, any>>({});
  const [error, setError] = useState('');
  const [sendError, setSendError] = useState('');
  const [dmWarning, setDmWarning] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchDMs(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedUser, messages]);

  const fetchDMs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/x/dms');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch DMs');
      setMessages(data.data || []);
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUser) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch(`/api/x/dms/${selectedUser}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: replyText })
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

  const conversationPartners = Array.from(new Set(messages.map(m => m.sender_id)));
  const getMessagesWithUser = (uid: string) => messages.filter(m => m.sender_id === uid);

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
            ⚠️ DMs need <strong>Consumer Keys</strong> (API Key + Secret) from X Dev Portal.
          </div>
        )}
        <div className="flex-1 overflow-y-auto">
          {error ? (
            <div className="p-4 text-center text-red-500 text-sm mt-10">{error}</div>
          ) : conversationPartners.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 text-sm mt-10">No conversations found.</div>
          ) : (
            conversationPartners.map(senderId => {
              const user = users[senderId] || { name: 'Unknown', username: senderId };
              const lastMsg = messages.find(m => m.sender_id === senderId);
              return (
                <button
                  key={senderId}
                  onClick={() => setSelectedUser(senderId)}
                  className={`w-full p-4 border-b border-zinc-100 flex items-center gap-3 hover:bg-zinc-50 transition-colors text-left ${selectedUser === senderId ? 'bg-green-50' : ''}`}
                >
                  <Avatar user={user} />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-semibold text-sm truncate">{user.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{lastMsg?.text ?? ''}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-zinc-50 flex flex-col overflow-hidden">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-zinc-200 bg-white flex items-center gap-3 shadow-sm shrink-0">
              <Avatar user={users[selectedUser]} />
              <div>
                <h3 className="font-bold">{users[selectedUser]?.name || 'Unknown'}</h3>
                <p className="text-sm text-zinc-500">@{users[selectedUser]?.username || selectedUser}</p>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-3">
              {getMessagesWithUser(selectedUser).map((msg: any) => (
                <div key={msg.id} className="flex">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-sm max-w-md shadow-sm border border-zinc-100">
                    <p className="text-sm text-zinc-800">{msg.text}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">{new Date(msg.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
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
