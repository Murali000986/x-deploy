"use client";
import { useEffect, useState } from 'react';

export default function BotIndicator() {
  const [botData, setBotData] = useState<any>(null);

  useEffect(() => {
    const fetchBot = () => {
      fetch('/api/me')
        .then(r => r.json())
        .then(data => {
          if (!data.error) setBotData(data);
        })
        .catch(() => {});
    };

    fetchBot();
    window.addEventListener('account-switched', fetchBot);
    return () => window.removeEventListener('account-switched', fetchBot);
  }, []);

  return (
    <div className="p-4 border-t border-zinc-200">
      <div className="flex items-center gap-3">
        {botData?.profile_image_url ? (
          <img src={botData.profile_image_url} alt="" className="w-8 h-8 rounded-full" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center">
            <span className="text-xs font-bold text-zinc-600">BOT</span>
          </div>
        )}
        <div className="text-sm overflow-hidden flex-1">
          <p className="font-medium truncate">{botData?.name || 'Bot Account'}</p>
          <p className="text-zinc-500 text-xs truncate">
            {botData?.username ? `@${botData.username}` : 'API Keys Missing'}
          </p>
        </div>
      </div>
    </div>
  );
}
