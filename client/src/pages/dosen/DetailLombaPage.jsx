import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar, Clock, Users, ExternalLink, ArrowLeft, MapPin, Trophy,
  DollarSign, BookOpen, Link as LinkIcon, Pencil, UserCheck, Building2,
  GraduationCap, Crown, Send, Lock,
} from 'lucide-react';
import competitionService from '@/services/competitionService';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { STATUS_LABELS, ADVISOR_STATUS_LABELS } from '@/utils/constants';
import { formatDate, isDeadlinePassed, getInitials } from '@/utils/helpers';

export default function DetailLombaDosenPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    competitionService.getCompetitionById(id)
      .then((res) => { if (mounted) setCompetition(res.data); })
      .catch(() => { if (mounted) setNotFound(true); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <LoadingSpinner className="py-16" />;
  if (notFound || !competition) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-slate-500 dark:text-slate-400 font-medium">Lomba tidak ditemukan</p>
        <Button variant="outline" onClick={() => navigate('/dosen/competitions')} className="rounded-full">
          <ArrowLeft size={16} className="mr-1.5" /> Kembali ke Info Lomba
        </Button>
      </div>
    );
  }

  const deadlinePassed = isDeadlinePassed(competition.registration_deadline);
  const teams = competition.teams || [];
  const teamsWithoutAdvisor = teams.filter((t) => t.advisor_status !== 'approved');

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
      >
        <ArrowLeft size={14} /> Kembali
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#3B0764] p-7 sm:p-10 text-white shadow-2xl">
        <div className="absolute -top-24 -right-16 w-80 h-80 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusBadge status={competition.status} labels={STATUS_LABELS} />
              {competition.category && <Badge variant="info">{competition.category}</Badge>}
              {competition.needs_advisor && (
                <Badge variant="warning">Perlu Dosen Pembimbing</Badge>
              )}
              {competition.is_owner && <Badge variant="success">Lomba Anda</Badge>}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">{competition.title}</h1>
            {competition.organizer && (
              <p className="text-purple-200/80 font-medium mt-2 flex items-center gap-1.5">
                <Building2 size={14} /> {competition.organizer}
              </p>
            )}
            <p className="text-purple-200/70 text-xs font-medium mt-3">
              Ditambahkan oleh: {competition.created_by_name || 'Admin Ko+Lab'}
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {competition.is_owner ? (
              <Button
                onClick={() => navigate(`/dosen/competitions/${id}/edit`)}
                className="rounded-full bg-white text-purple-950 hover:bg-purple-100 font-bold px-6"
              >
                <Pencil size={15} className="mr-1.5" /> Edit Lomba
              </Button>
            ) : (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 border border-white/20 backdrop-blur-md px-4 py-2.5 rounded-full text-white/70">
                <Lock size={13} /> Hanya pembuat lomba yang bisa edit
              </div>
            )}
            <Link
              to="/dosen/self-assign"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-white/10 border border-white/20 backdrop-blur-md hover:bg-white/20 px-4 py-2.5 rounded-full transition-colors"
            >
              <Send size={13} /> Ajukan Diri Jadi Pembimbing
            </Link>
          </div>
        </div>
      </div>

      {/* Poster + Ringkasan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {competition.image_url && (
          <div className="lg:col-span-1 rounded-[28px] overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131620]">
            <img
              src={competition.image_url}
              alt={competition.title}
              className="w-full h-48 lg:h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}

        <div className={competition.image_url ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="rounded-[28px] bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 p-6 shadow-sm h-full">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Informasi Penting</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2.5">
                <Calendar size={16} className="text-purple-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pelaksanaan</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{formatDate(competition.event_date) || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Deadline Pendaftaran</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    {formatDate(competition.registration_deadline) || '-'}
                    {deadlinePassed && <span className="ml-2 text-rose-500 text-xs font-bold">Ditutup</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Users size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tim Terdaftar</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    {competition._count?.teams || teams.length} tim • max {competition.max_team_members} anggota
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <UserCheck size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dosen Pembimbing</p>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">
                    {competition.needs_advisor ? `Maks ${competition.max_advisors || 1} per tim` : 'Tidak diperlukan'}
                  </p>
                </div>
              </div>
              {competition.location && (
                <div className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lokasi</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{competition.location}</p>
                  </div>
                </div>
              )}
              {competition.prize_pool && (
                <div className="flex items-start gap-2.5">
                  <Trophy size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hadiah</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{competition.prize_pool}</p>
                  </div>
                </div>
              )}
              {competition.registration_fee && (
                <div className="flex items-start gap-2.5">
                  <DollarSign size={16} className="text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Biaya</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{competition.registration_fee}</p>
                  </div>
                </div>
              )}
            </div>

            {(competition.registration_url || competition.guidebook_url) && (
              <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-slate-100 dark:border-white/5">
                {competition.registration_url && (
                  <a href={competition.registration_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors">
                    <ExternalLink size={13} /> Link Pendaftaran
                  </a>
                )}
                {competition.guidebook_url && (
                  <a href={competition.guidebook_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <LinkIcon size={13} /> Guidebook
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deskripsi */}
      {competition.description && (
        <div className="rounded-[28px] bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-3">Deskripsi Lomba</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">{competition.description}</p>
        </div>
      )}

      {/* Persyaratan */}
      {Array.isArray(competition.requirements) && competition.requirements.length > 0 && (
        <div className="rounded-[28px] bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 p-6 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-purple-500" /> Persyaratan
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {competition.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 flex items-center justify-center text-[11px] font-bold shrink-0">
                  {i + 1}
                </span>
                <span className="text-slate-600 dark:text-slate-300">{req}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tim Terdaftar */}
      <div className="rounded-[28px] bg-white dark:bg-[#131620]/90 border border-slate-200/80 dark:border-white/10 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={17} className="text-purple-500" /> Tim Terdaftar
              <span className="text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 px-2.5 py-0.5 rounded-full">
                {teams.length}
              </span>
            </h2>
            {competition.needs_advisor && teamsWithoutAdvisor.length > 0 && (
              <Link to="/dosen/self-assign" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline underline-offset-4">
                {teamsWithoutAdvisor.length} tim belum punya pembimbing →
              </Link>
            )}
          </div>

          {teams.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">Belum ada tim terdaftar</p>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => (
                <div key={team.id} className="rounded-2xl border border-slate-200/70 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                        {getInitials(team.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{team.name}</p>
                        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          Ketua: {team.leader?.name || team.leader_name || '-'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={team.status}
                      labels={{ forming: 'Sedang Dibentuk', complete: 'Lengkap', withdrawn: 'Batal' }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(team.members || []).map((m) => (
                      <span key={m.user_id} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {m.user_id === team.leader_id && <Crown size={10} className="text-amber-500" />}
                        {m.name}
                      </span>
                    ))}
                  </div>

                  {team.advisor_name ? (
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-amber-500" />
                      {team.advisor_name}
                      <StatusBadge status={team.advisor_status} labels={ADVISOR_STATUS_LABELS} className="ml-1 text-[10px]" />
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <GraduationCap size={13} /> Belum ada dosen pembimbing
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
