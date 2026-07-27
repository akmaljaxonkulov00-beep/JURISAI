'use client';

import React from 'react';
import { Users, Wifi, WifiOff, User } from 'lucide-react';
import type { OnlineUser } from '@/hooks/useOnlineUsers';

interface OnlineUsersMonitorProps {
  count: number;
  users: OnlineUser[];
  connected: boolean;
}

export default function OnlineUsersMonitor({ count, users, connected }: OnlineUsersMonitorProps) {
  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 dark:from-zinc-900 dark:via-zinc-800 dark:to-indigo-950 border border-slate-700/50 shadow-xl overflow-hidden relative">
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-green-400" />
            <span className="text-sm font-semibold text-white">Onlayn foydalanuvchilar</span>
          </div>
          <div className="flex items-center gap-1.5">
            {connected ? (
              <Wifi size={12} className="text-green-400" />
            ) : (
              <WifiOff size={12} className="text-amber-400" />
            )}
            <span className={`text-[10px] ${connected ? 'text-green-400' : 'text-amber-400'}`}>
              {connected ? 'Real-time' : 'Ulanmoqda...'}
            </span>
          </div>
        </div>

        {/* User count — big animated number */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-5xl font-black text-white tabular-nums">
            {count}
          </span>
          <span className="text-sm text-slate-400 font-medium">
            foydalanuvchi
          </span>
        </div>

        {/* Progress bar showing approximate capacity */}
        <div className="w-full h-1.5 rounded-full bg-slate-700/50 mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000 ease-out"
            style={{ width: `${Math.min((count / 50) * 100, 100)}%` }}
          />
        </div>

        {/* Online users list */}
        {users.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
            {users.map((u) => (
              <div
                key={u.userId}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-slate-900 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {u.name}
                  </p>
                  {u.email && (
                    <p className="text-[10px] text-slate-400 truncate">
                      {u.email}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 flex-shrink-0">
                  {new Date(u.joinedAt).toLocaleTimeString('uz-UZ', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}

        {users.length === 0 && connected && (
          <div className="text-center py-4">
            <div className="animate-pulse flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs text-slate-400">Kuzatilmoqda...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
