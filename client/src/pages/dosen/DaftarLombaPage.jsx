import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy, Plus, Search, Pencil, Calendar, Clock, Users, MapPin,
  GraduationCap, ArrowUpRight, Building2,
} from 'lucide-react';
import competitionService from '@/services/competitionService';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { STATUS_LABELS } from '@/utils/constants';
import { formatDate, isDeadlinePassed } from '@/utils/helpers';

const TABS = [
  { key: 'all', label: 'Semua Lomba' },
  { key: 'mine', label: 'Lomba Saya' },
];

export default function DaftarLombaDosenPage() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (tab === 'mine') params.mine = 'true';
      const res = await competitionService.getCompetitions(params);
      setCompetitions(res.data || []);
    } catch (err) {
      console.error(err);
      setCompetitions([]);
    } finally {
      setLoading(false);
    }
  }, [tab, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const mineCount = competitions.filter((c) => c.is_owner).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Info Lomba</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tambah informasi lomba baru, atau kelola lomba yang Anda buat sendiri.
          </p>
        </div>
        <Button
          onClick={() => navigate('/dosen/competitions/add')}
          className="rounded-full px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/20"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Tambah Lomba
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t.key
                  ? 'bg-white dark:bg-white/10 text-purple-700 dark:text-purple-300 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
              {t.key === 'mine' && mineCount > 0 && (
                <span className="ml-1.5 text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded-full">{mineCount}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari nama lomba, penyelenggara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-44 rounded-xl"
          >
            <option value="">Semua Status</option>
            <option value="upcoming">Akan Datang</option>
            <option value="ongoing">Berlangsung</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : competitions.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={tab === 'mine' ? 'Belum ada lomba buatan Anda' : 'Tidak ada lomba'}
          description={
            tab === 'mine'
              ? 'Lomba yang Anda tambahkan akan muncul di sini dan bisa Anda edit sendiri.'
              : 'Belum ada lomba yang cocok dengan pencarian Anda.'
          }
          action={
            tab === 'mine' ? (
              <Button onClick={() => navigate('/dosen/competitions/add')} className="rounded-full">
                <Plus className="h-4 w-4 mr-1.5" /> Tambah Lomba
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 stagger-children">
          {competitions.map((comp) => {
            const deadlinePassed = isDeadlinePassed(comp.registration_deadline);
            return (
              <div
                key={comp.id}
                className="group relative flex flex-col rounded-[28px] bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Thumbnail */}
                <div className="relative h-36 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 overflow-hidden shrink-0">
                  {comp.image_url ? (
                    <img
                      src={comp.image_url}
                      alt={comp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-25">
                      <Trophy size={64} className="text-white" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <StatusBadge status={comp.status} labels={STATUS_LABELS} />
                    {comp.is_owner && (
                      <Badge variant="warning" className="backdrop-blur-sm">Lomba Anda</Badge>
                    )}
                  </div>
                  {comp.needs_advisor && (
                    <div className="absolute bottom-3 left-3">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-black/45 backdrop-blur-md text-white px-2.5 py-1 rounded-full">
                        <GraduationCap size={11} /> Butuh Pembimbing
                      </span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="flex-1 p-5 space-y-3">
                  <div>
                    <Link
                      to={`/dosen/competitions/${comp.id}`}
                      className="text-base font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      {comp.title}
                    </Link>
                    {comp.category && (
                      <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mt-1">{comp.category}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-1.5"><Calendar size={13} /> {formatDate(comp.event_date, 'dd MMM yyyy') || '-'}</p>
                    <p className="flex items-center gap-1.5">
                      <Clock size={13} /> Daftar s.d. {formatDate(comp.registration_deadline, 'dd MMM yyyy') || '-'}
                      {deadlinePassed && <span className="text-rose-500 font-bold">• Ditutup</span>}
                    </p>
                    <p className="flex items-center gap-1.5"><Users size={13} /> {comp._count?.teams || 0} tim • max {comp.max_team_members} anggota</p>
                    {comp.organizer && (
                      <p className="flex items-center gap-1.5 truncate"><Building2 size={13} /> {comp.organizer}</p>
                    )}
                    {comp.location && (
                      <p className="flex items-center gap-1.5 truncate"><MapPin size={13} /> {comp.location}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 flex gap-2">
                  <Link
                    to={`/dosen/competitions/${comp.id}`}
                    className="flex-1 inline-flex items-center justify-center h-9 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-transparent text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Detail <ArrowUpRight size={14} className="ml-1" />
                  </Link>
                  {comp.is_owner ? (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/dosen/competitions/${comp.id}/edit`)}
                      className="rounded-full px-4 bg-gradient-to-r from-purple-600 to-indigo-600"
                    >
                      <Pencil size={14} className="mr-1" /> Edit
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled
                      title="Hanya pembuat lomba yang dapat mengedit"
                      className="rounded-full px-4"
                    >
                      <Pencil size={14} className="mr-1" /> Edit
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
