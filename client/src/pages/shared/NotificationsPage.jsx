import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, BellOff, Trophy, Users, Clock, GraduationCap,
  CheckCircle2, Calendar, ExternalLink, Inbox
} from 'lucide-react';
import notificationService from '@/services/notificationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate } from '@/utils/helpers';

const TYPE_CONFIG = {
  advisor_request: { icon: GraduationCap, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
  team: { icon: Users, color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10' },
  deadline: { icon: Clock, color: 'text-red-500 bg-red-50 dark:bg-red-500/10' },
  event: { icon: Calendar, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' },
  advisor: { icon: GraduationCap, color: 'text-green-500 bg-green-50 dark:bg-green-500/10' },
  default: { icon: Bell, color: 'text-slate-500 bg-slate-100 dark:bg-white/5' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const navigate = useNavigate();

  useEffect(() => {
    notificationService.getNotifications()
      .then((res) => {
        setNotifications(res.data?.notifications || []);
        setUnreadCount(res.data?.unread_count || 0);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const markAllRead = () => {
    notificationService.markAllRead().then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }).catch(() => {});
  };

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Notifikasi</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} notifikasi belum dibaca</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/5">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'unread', label: 'Belum Dibaca' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f.key
                    ? 'bg-white dark:bg-white/10 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {f.label}
                {f.key === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCircle2 size={14} className="mr-1" />
              Tandai Dibaca
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <EmptyState
              icon={filter === 'unread' ? CheckCircle2 : Inbox}
              title={filter === 'unread' ? 'Semua sudah dibaca' : 'Belum ada notifikasi'}
              description={filter === 'unread'
                ? 'Keren! Semua notifikasi sudah kamu baca.'
                : 'Notifikasi akan muncul di sini'}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
            const Icon = cfg.icon;
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer hover:border-purple-300 dark:hover:border-purple-500/30 ${
                  notif.read
                    ? 'bg-white dark:bg-[#131620]/90 border-slate-200/60 dark:border-white/5'
                    : 'bg-purple-50/50 dark:bg-purple-500/5 border-purple-200 dark:border-purple-500/20'
                }`}
                onClick={() => notif.link && navigate(notif.link)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm ${notif.read ? 'text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>
                      {notif.title}
                    </p>
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{notif.message}</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">{formatDate(notif.date)}</p>
                </div>
                {notif.link && (
                  <ExternalLink size={14} className="text-slate-400 shrink-0 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
