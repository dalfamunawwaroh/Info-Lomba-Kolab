import { Link } from 'react-router-dom';
import { Calendar, Clock, UsersRound, Award, CheckCircle2, Lock, ArrowUpRight, UserCheck } from 'lucide-react';
import { StatusPill, Pill } from '@/components/user/UserUI';
import { COMPETITION_STATUS } from '@/utils/constants';
import { formatDate, isDeadlinePassed } from '@/utils/helpers';
import { differenceInCalendarDays, parseISO } from 'date-fns';

function daysLeft(deadline) {
  if (!deadline) return null;
  try {
    return differenceInCalendarDays(parseISO(deadline), new Date());
  } catch {
    return null;
  }
}

function CompetitionCard({ competition, basePath, onRegister, isRegistered }) {
  const title = competition.title || competition.name;
  const maxMembers = competition.max_team_members || competition.max_team_size;
  const deadlinePassed = isDeadlinePassed(competition.registration_deadline);
  const canRegister = competition.status === COMPETITION_STATUS.UPCOMING && !deadlinePassed && !isRegistered;
  const left = daysLeft(competition.registration_deadline);
  const urgent = canRegister && left !== null && left >= 0 && left <= 7;

  return (
    <div className="group bg-white dark:bg-[#131620]/90 rounded-[28px] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-xl overflow-hidden flex flex-col hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300">
      {/* Cover */}
      <Link to={`${basePath}/competitions/${competition.id}`} className="relative h-40 block overflow-hidden bg-gradient-to-br from-[#2E1065] to-[#6C1B75]">
        {competition.image_url && (
          <img
            src={competition.image_url}
            alt=""
            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
          {competition.category ? (
            <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-slate-950/70 backdrop-blur text-[11px] font-bold text-slate-800 dark:text-white truncate max-w-[60%]">{competition.category}</span>
          ) : <span />}
          <StatusPill status={competition.status} className="bg-white/90 dark:bg-slate-950/70 backdrop-blur" />
        </div>
        {competition.prize_pool && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
            <Award size={16} className="text-amber-300" />
            <span className="font-black text-[15px]">{competition.prize_pool}</span>
          </div>
        )}
      </Link>

      {/* Body */}
      <div className="p-6 flex-1 flex flex-col">
        <Link to={`${basePath}/competitions/${competition.id}`}>
          <h3 className="font-black text-[18px] leading-snug text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors line-clamp-2">{title}</h3>
        </Link>
        {competition.organizer && <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">{competition.organizer}</p>}

        <div className="grid grid-cols-2 gap-2 mt-5 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60">
            <Calendar size={15} className="text-purple-500 shrink-0" />
            <span className="truncate">{competition.event_date ? formatDate(competition.event_date, 'dd MMM yyyy') : '-'}</span>
          </div>
          <div className={`flex items-center gap-2 p-2.5 rounded-xl ${urgent ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300' : 'bg-slate-50 dark:bg-slate-900/60'}`}>
            <Clock size={15} className={urgent ? 'shrink-0' : 'text-amber-500 shrink-0'} />
            <span className="truncate">{urgent ? (left === 0 ? 'Tutup hari ini' : `${left} hari lagi`) : competition.registration_deadline ? formatDate(competition.registration_deadline, 'dd MMM yyyy') : '-'}</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 col-span-2">
            <UsersRound size={15} className="text-blue-500 shrink-0" />
            <span className="truncate">{competition._count?.teams || 0} tim terdaftar{maxMembers ? ` • maks ${maxMembers} orang/tim` : ''}</span>
          </div>
        </div>

        {competition.needs_advisor && (
          <Pill tone="blue" icon={UserCheck} className="mt-3 self-start">Wajib dosen pembimbing</Pill>
        )}

        <div className="mt-auto pt-5 flex gap-2">
          {isRegistered ? (
            <span className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-sm border border-emerald-500/20">
              <CheckCircle2 size={16} /> Sudah Terdaftar
            </span>
          ) : canRegister && onRegister ? (
            <button onClick={() => onRegister(competition)} className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#9333EA] to-[#6C1B75] text-white font-bold text-sm shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transition-all">
              Daftar Sekarang
            </button>
          ) : deadlinePassed && competition.status === COMPETITION_STATUS.UPCOMING ? (
            <span className="flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm">
              <Lock size={15} /> Pendaftaran Ditutup
            </span>
          ) : null}
          <Link to={`${basePath}/competitions/${competition.id}`} title="Lihat detail" className={`${(isRegistered || (canRegister && onRegister) || (deadlinePassed && competition.status === COMPETITION_STATUS.UPCOMING)) ? 'w-12' : 'flex-1 gap-2'} inline-flex items-center justify-center py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-purple-500 hover:text-white transition-all`}>
            {(isRegistered || (canRegister && onRegister) || (deadlinePassed && competition.status === COMPETITION_STATUS.UPCOMING)) ? <ArrowUpRight size={18} /> : <>Lihat Detail <ArrowUpRight size={16} /></>}
          </Link>
        </div>
      </div>
    </div>
  );
}

export { CompetitionCard };
