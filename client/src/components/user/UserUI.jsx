/**
 * UI kit halaman user (mahasiswa/dosen) — mengikuti art style dashboard:
 * bento card rounded-[28-32px], aksen ungu #9333EA, dark surface #131620.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/utils/helpers';

const TONES = {
  purple: 'bg-purple-500/10 text-purple-700 border-purple-500/20 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-700 border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  blue: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30',
  rose: 'bg-rose-500/10 text-rose-700 border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  slate: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-white/10',
};

export const ICON_TONES = {
  purple: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30',
  emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
  amber: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
  rose: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30',
};

const STATUS_MAP = {
  upcoming: ['Akan Datang', 'emerald'],
  ongoing: ['Berlangsung', 'blue'],
  completed: ['Selesai', 'slate'],
  cancelled: ['Dibatalkan', 'rose'],
  forming: ['Sedang Dibentuk', 'amber'],
  complete: ['Lengkap', 'emerald'],
  withdrawn: ['Batal', 'rose'],
  pending: ['Menunggu', 'amber'],
  approved: ['Disetujui', 'emerald'],
  rejected: ['Ditolak', 'rose'],
  waiting: ['Menunggu Tim', 'amber'],
  assigned: ['Sudah Ditempatkan', 'blue'],
};

export function Pill({ tone = 'slate', icon: Icon, children, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] font-bold whitespace-nowrap', TONES[tone], className)}>
      {Icon && <Icon size={13} strokeWidth={2.5} />}
      {children}
    </span>
  );
}

export function StatusPill({ status, label, className }) {
  const [text, tone] = STATUS_MAP[status] || [status || '-', 'slate'];
  return <Pill tone={tone} className={className}>{label || text}</Pill>;
}

export function PageHeader({ icon: Icon, eyebrow, title, subtitle, actions }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#9333EA] to-[#6C1B75] flex items-center justify-center text-white shadow-lg shadow-purple-900/30 shrink-0">
            <Icon size={26} strokeWidth={2.3} />
          </div>
        )}
        <div>
          {eyebrow && <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-purple-600 dark:text-purple-400 mb-1">{eyebrow}</p>}
          <h1 className="text-3xl md:text-[34px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-slate-500 dark:text-slate-400 font-medium mt-1.5 max-w-2xl">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Panel({ className, children, ...props }) {
  return (
    <div className={cn('bg-white dark:bg-[#131620]/90 backdrop-blur-xl rounded-[28px] p-6 md:p-8 shadow-sm dark:shadow-xl border border-slate-200/80 dark:border-white/10', className)} {...props}>
      {children}
    </div>
  );
}

export function PanelTitle({ icon: Icon, tone = 'purple', title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4 min-w-0">
        {Icon && <div className={cn('p-3 rounded-2xl border shrink-0', ICON_TONES[tone])}><Icon size={22} strokeWidth={2.5} /></div>}
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white tracking-tight truncate">{title}</h2>
          {subtitle && <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Avatar({ name, size = 'md', className }) {
  const sizes = { sm: 'w-8 h-8 text-[11px]', md: 'w-11 h-11 text-sm', lg: 'w-14 h-14 text-base' };
  return (
    <div className={cn('rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white font-bold shrink-0 border border-purple-400/30 shadow-sm', sizes[size], className)}>
      {getInitials(name)}
    </div>
  );
}

export function EmptyBlock({ icon: Icon, title, description, action }) {
  return (
    <div className="py-14 flex flex-col items-center text-center">
      {Icon && (
        <div className="w-20 h-20 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-[24px] flex items-center justify-center text-purple-500 dark:text-purple-400 mb-5">
          <Icon size={36} />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function FilterTabs({ value, onChange, items }) {
  return (
    <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-2xl overflow-x-auto custom-scrollbar max-w-full">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            onClick={() => onChange(it.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-bold whitespace-nowrap transition-all',
              active
                ? 'bg-white dark:bg-[#9333EA] text-purple-700 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            )}
          >
            {it.label}
            {it.count !== undefined && (
              <span className={cn('min-w-[22px] px-1.5 py-0.5 rounded-full text-[11px]', active ? 'bg-purple-100 text-purple-700 dark:bg-white/20 dark:text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400')}>
                {it.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SearchField({ value, onChange, placeholder = 'Cari...', className }) {
  return (
    <div className={cn('flex items-center gap-3 bg-white dark:bg-slate-900/90 px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm focus-within:ring-4 focus-within:ring-[#9333EA]/20 focus-within:border-[#9333EA]/50 transition-all', className)}>
      <Search size={18} className="text-slate-400 shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent border-none outline-none text-[14px] w-full text-slate-800 dark:text-white font-medium"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} className="text-slate-400 hover:text-slate-700 dark:hover:text-white"><X size={16} /></button>
      )}
    </div>
  );
}

export function SelectField({ value, onChange, children, className }) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full bg-white dark:bg-slate-900/90 pl-4 pr-10 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm text-[14px] font-semibold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-[#9333EA]/20 focus:border-[#9333EA]/50 transition-all cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

export function FieldLabel({ children, hint }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">{children}</label>
      {hint && <span className="text-[12px] font-medium text-slate-400">{hint}</span>}
    </div>
  );
}

export const inputClass =
  'w-full bg-slate-50 dark:bg-slate-900/80 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 text-[14px] font-medium text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-[#9333EA]/20 focus:border-[#9333EA]/50 transition-all';

export function PrimaryButton({ className, children, ...props }) {
  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#9333EA] to-[#6C1B75] text-white px-6 py-3.5 rounded-2xl font-bold text-[14px] shadow-lg shadow-purple-900/25 hover:shadow-purple-900/40 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ className, children, ...props }) {
  return (
    <button
      className={cn('inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 px-5 py-3.5 rounded-2xl font-bold text-[14px] hover:border-purple-500/40 hover:text-purple-700 dark:hover:text-purple-300 transition-all disabled:opacity-60', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function SkeletonBlocks({ count = 3, className = 'h-40' }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('rounded-[28px] bg-slate-200/70 dark:bg-white/5 animate-pulse', className)} />
      ))}
    </div>
  );
}

export function Dialog({ open, onClose, title, subtitle, children, footer, size = 'max-w-lg' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  // Portal ke body: parent halaman memakai animasi transform yang membuat
  // posisi `fixed` relatif ke parent, bukan ke viewport.
  return createPortal(
    <div ref={ref} onClick={(e) => e.target === ref.current && onClose()} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className={cn('w-full bg-white dark:bg-[#131620] border border-slate-200 dark:border-white/10 rounded-[28px] shadow-2xl max-h-[88vh] flex flex-col animate-scale-in', size)}>
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="px-6 pb-2 overflow-y-auto custom-scrollbar">{children}</div>
        {footer && <div className="flex justify-end gap-3 p-6 pt-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Ya, Lanjutkan', loading }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      size="max-w-md"
      footer={
        <>
          <GhostButton onClick={onClose} disabled={loading}>Batal</GhostButton>
          <button onClick={onConfirm} disabled={loading} className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3.5 rounded-2xl font-bold text-[14px] transition-all disabled:opacity-60">
            {loading ? 'Memproses...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4 items-start">
        <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0"><AlertTriangle size={22} /></div>
        <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed pt-1">{message}</p>
      </div>
    </Dialog>
  );
}
