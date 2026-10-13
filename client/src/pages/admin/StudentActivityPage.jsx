import { useState, useMemo } from 'react';
import {
  Search, Calendar, FileText, CheckCircle2, Clock, Eye,
  FileUp, ShieldCheck, MessageSquare, ListTodo, Bell, Send,
  Sparkles, Quote, Users, X, UserPlus, Activity, Timer,
  GraduationCap, BarChart3
} from 'lucide-react';
import useUIStore from '@/store/uiStore';

// ============ Mock: kegiatan mahasiswa (Notion checklist, dokumen privat tim, similarity) ============
const MOCK_TEAMS = [
  {
    id: 'ACT-001',
    team_name: 'Tim CyberNova Tech',
    competition: 'National Hackathon Ko+Lab 2026',
    category: 'Software Development',
    leader: 'Rina Wijaya',
    advisor: 'Dr. Budi Santoso, M.T.',
    updated_at: '10 menit yang lalu',
    calendar_deadline: '2026-11-15',
    days_left: 34,
    checklist: {
      total: 8,
      completed: 6,
      items: [
        { task: 'Penyusunan Proposal Inovasi', done: true },
        { task: 'Wireframe & Design System Figma', done: true },
        { task: 'Setup Repo GitHub & Backend Architecture', done: true },
        { task: 'Uji Coba Similarity / Turnitin Naskah', done: true },
        { task: 'Perekaman Pitch Video 3 Menit', done: true },
        { task: 'Dokumen Final Berkas Administrasi', done: true },
        { task: 'Review Feedback Dosen Pembimbing', done: false },
        { task: 'Final Submission ke Portal Panitia', done: false },
      ],
    },
    latest_document: {
      filename: 'Proposal_CyberNova_SmartCity_v2.pdf',
      filesize: '4.8 MB',
      uploaded_by: 'Rina Wijaya',
      uploaded_at: '12 Okt 2026, 11:20 WIB',
      similarity_score: '9%',
      similarity_status: 'safe',
      dosen_review: {
        status: 'reviewed',
        feedback: 'Latar belakang masalah dan use-case AI sudah tajam. Perjelas arsitektur fallback API saat offline.',
        review_date: '12 Okt 2026, 13:45 WIB',
      },
    },
    team_members: ['Rina Wijaya (Ketua)', 'Ahmad Fauzi (AI Engineer)', 'Dewi Lestari (UI/UX)'],
  },
  {
    id: 'ACT-002',
    team_name: 'InnovateX Design',
    competition: 'Indonesian UI/UX Design Challenge 2026',
    category: 'Design & Experience',
    leader: 'Dewi Lestari',
    advisor: 'Prof. Siti Aminah, Ph.D.',
    updated_at: '2 jam yang lalu',
    calendar_deadline: '2026-10-30',
    days_left: 18,
    checklist: {
      total: 6,
      completed: 4,
      items: [
        { task: 'User Persona & Journey Map', done: true },
        { task: 'Competitive Audit & Moodboard', done: true },
        { task: 'High-Fidelity Interactive Prototype', done: true },
        { task: 'Case Study Document (PDF)', done: true },
        { task: 'Uji Aksesibilitas WCAG 2.1 & Similarity Check', done: false },
        { task: 'Konsultasi Pra-Deadline dengan Pembimbing', done: false },
      ],
    },
    latest_document: {
      filename: 'DesignSystem_CaseStudy_InnovateX.pdf',
      filesize: '12.4 MB',
      uploaded_by: 'Dewi Lestari',
      uploaded_at: '12 Okt 2026, 09:15 WIB',
      similarity_score: '14%',
      similarity_status: 'safe',
      dosen_review: {
        status: 'pending',
        feedback: 'Menunggu review dari dosen pembimbing.',
        review_date: null,
      },
    },
    team_members: ['Dewi Lestari (Ketua)', 'Bambang Kusuma (UX Researcher)'],
  },
  {
    id: 'ACT-003',
    team_name: 'AlphaGen BioAI',
    competition: 'AI Startup & Business Plan Competition',
    category: 'Business & Pitch',
    leader: 'Ahmad Fauzi',
    advisor: 'Dr. Budi Santoso, M.T.',
    updated_at: '5 jam yang lalu',
    calendar_deadline: '2026-12-05',
    days_left: 54,
    checklist: {
      total: 7,
      completed: 3,
      items: [
        { task: 'Executive Summary & Business Model Canvas', done: true },
        { task: 'Market Sizing TAM/SAM/SOM Calculation', done: true },
        { task: 'Draft Proposal Pitch Deck v1', done: true },
        { task: 'Uji Similarity / Deteksi Orisinalitas', done: false },
        { task: 'Proyeksi Finansial 3 Tahun', done: false },
        { task: 'Simulasi Tanya Jawab dengan Dosen', done: false },
        { task: 'Pengunggahan Final Berkas Pitching', done: false },
      ],
    },
    latest_document: {
      filename: 'PitchDeck_AlphaGen_MedicalAI_Draft.pdf',
      filesize: '8.1 MB',
      uploaded_by: 'Ahmad Fauzi',
      uploaded_at: '11 Okt 2026, 17:30 WIB',
      similarity_score: '28%',
      similarity_status: 'warning',
      dosen_review: {
        status: 'revision_required',
        feedback: 'Tingkat kesamaan teks di bab Kajian Pustaka 28% masih terlalu tinggi. Segera parafrase sebelum submisi resmi.',
        review_date: '12 Okt 2026, 08:30 WIB',
      },
    },
    team_members: ['Ahmad Fauzi (Ketua)', 'Citra Amelia (Business Analyst)', 'Faris Hakim (Financial Model)'],
  },
];

// ============ Mock: kegiatan dosen (review, pembimbingan, monitoring) ============
const ACTIVITY_META = {
  review: { label: 'Review Dokumen', icon: MessageSquare, chip: 'bg-purple-100 text-[#6C1B75] dark:bg-purple-500/15 dark:text-purple-300', dot: 'bg-[#9333EA]' },
  similarity: { label: 'Uji Similarity', icon: ShieldCheck, chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300', dot: 'bg-indigo-500' },
  assign: { label: 'Pembimbingan', icon: UserPlus, chip: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300', dot: 'bg-blue-500' },
  approve: { label: 'Persetujuan Tim', icon: CheckCircle2, chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300', dot: 'bg-emerald-500' },
  meeting: { label: 'Konsultasi', icon: Users, chip: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300', dot: 'bg-amber-500' },
  reminder: { label: 'Reminder', icon: Bell, chip: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', dot: 'bg-rose-500' },
};

const MOCK_DOSEN = [
  {
    id: 'DSN-001',
    name: 'Dr. Budi Santoso, M.T.',
    specialty: 'AI & Software Engineering',
    teams: ['Tim CyberNova Tech', 'AlphaGen BioAI'],
    reviews_given: 8,
    avg_response: '2.5 jam',
    badge: 'Sangat Responsif',
    feed: [
      { type: 'review', text: 'Memberikan feedback pada Proposal_CyberNova_SmartCity_v2.pdf', time: '12 Okt, 13:45 WIB' },
      { type: 'review', text: 'Meminta revisi PitchDeck_AlphaGen — similarity 28% terlalu tinggi', time: '12 Okt, 08:30 WIB' },
      { type: 'assign', text: 'Menerima ajukan diri sebagai pembimbing Tim AlphaGen BioAI', time: '2 hari lalu' },
      { type: 'meeting', text: 'Sesi konsultasi pra-deadline dengan Tim CyberNova Tech', time: '3 hari lalu' },
    ],
  },
  {
    id: 'DSN-002',
    name: 'Prof. Siti Aminah, Ph.D.',
    specialty: 'UI/UX & Design Research',
    teams: ['InnovateX Design'],
    reviews_given: 5,
    avg_response: '6 jam',
    badge: 'Responsif',
    feed: [
      { type: 'review', text: 'Mulai review DesignSystem_CaseStudy_InnovateX.pdf', time: '1 jam lalu' },
      { type: 'approve', text: 'Menyetujui perubahan anggota tim InnovateX Design', time: '1 hari lalu' },
      { type: 'meeting', text: 'Workshop design thinking untuk tim bimbingan', time: '4 hari lalu' },
    ],
  },
  {
    id: 'DSN-003',
    name: 'Dr. Andika Pratama, S.T., M.T.',
    specialty: 'Robotics & Embedded System',
    teams: ['Sigma Robotics'],
    reviews_given: 3,
    avg_response: '12 jam',
    badge: 'Perlu Diperhatikan',
    feed: [
      { type: 'reminder', text: 'Mengirim reminder deadline Kontes Robot Indonesia (H-7)', time: '30 menit lalu' },
      { type: 'similarity', text: 'Menjalankan uji similarity Laporan_Kemajuan_Sigma_Minggu3.pdf (11%)', time: '5 jam lalu' },
      { type: 'assign', text: 'Ditugaskan sebagai pembimbing Sigma Robotics oleh admin', time: '1 minggu lalu' },
    ],
  },
];

// ============ Config ============
const REVIEW_META = {
  reviewed: { label: 'Sudah Direview', pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  pending: { label: 'Menunggu Feedback', pill: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  revision_required: { label: 'Revisi Diminta', pill: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
};

const MHS_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu Feedback' },
  { value: 'reviewed', label: 'Sudah Direview' },
  { value: 'revision_required', label: 'Revisi Diminta' },
];

const DSN_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'review', label: 'Review Dokumen' },
  { value: 'bimbingan', label: 'Pembimbingan' },
  { value: 'reminder', label: 'Reminder & Konsultasi' },
];

// ============ Building blocks ============

function ProgressRing({ percent }) {
  const r = 22, c = 2 * Math.PI * r;
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" className="stroke-purple-100 dark:stroke-white/10" />
        <circle
          cx="28" cy="28" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * percent) / 100}
          className="stroke-[#9333EA] transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-[#6C1B75] dark:text-purple-300">{percent}%</span>
    </div>
  );
}

function DeadlinePill({ daysLeft, deadline }) {
  const tone = daysLeft <= 7
    ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
    : daysLeft <= 21
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tone}`}>
      <Calendar size={13} /> {deadline} • sisa {daysLeft} hari
    </span>
  );
}

function KpiCard({ title, value, desc, icon: Icon, tint }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl p-5 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-60 blur-2xl ${tint.blob}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className={`text-3xl font-extrabold mt-2 tracking-tight ${tint.text}`}>{value}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{desc}</p>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tint.chip}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function TeamCard({ team, onDetail }) {
  const progressPercent = Math.round((team.checklist.completed / team.checklist.total) * 100);
  const review = team.latest_document.dosen_review;
  const reviewMeta = REVIEW_META[review.status];
  const doc = team.latest_document;

  return (
    <div className="group bg-white dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-[#6C1B75] via-[#9333EA] to-[#C084FC]" />

      <div className="p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9333EA] to-[#6C1B75] text-white flex items-center justify-center text-xl font-extrabold shadow-lg shadow-purple-500/25">
              {team.team_name.replace('Tim ', '').charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{team.team_name}</h2>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${reviewMeta.pill}`}>{reviewMeta.label}</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {team.competition} · Ketua <strong className="text-slate-700 dark:text-slate-200">{team.leader}</strong>
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <DeadlinePill daysLeft={team.days_left} deadline={team.calendar_deadline} />
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
                  <GraduationCap size={12} /> {team.advisor}
                </span>
                <span className="text-[11px] text-slate-400">{team.updated_at}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onDetail}
            className="px-5 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#9333EA] to-[#6C1B75] text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Eye size={14} /> Buka Ruang Kerja
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-3xl bg-slate-50/80 dark:bg-white/5 p-5">
            <div className="flex items-center gap-3 mb-4">
              <ProgressRing percent={progressPercent} />
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <ListTodo size={15} className="text-[#9333EA]" /> Checklist Perlengkapan
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{team.checklist.completed} dari {team.checklist.total} tugas selesai</p>
              </div>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {team.checklist.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs">
                  {item.done ? (
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                  )}
                  <span className={item.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300 font-medium'}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-50/80 dark:bg-white/5 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <FileUp size={15} className="text-blue-500" /> Dokumen Terbaru
              </h4>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                doc.similarity_status === 'safe'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
              }`}>
                <ShieldCheck size={12} /> Similarity {doc.similarity_score}
              </span>
            </div>

            <div className="flex items-center gap-3 bg-white dark:bg-white/5 rounded-2xl px-4 py-3 border border-slate-100 dark:border-white/10">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-500 dark:bg-rose-500/15 flex items-center justify-center shrink-0">
                <FileText size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{doc.filename}</p>
                <p className="text-[11px] text-slate-400 truncate">{doc.filesize} · {doc.uploaded_by} · {doc.uploaded_at}</p>
              </div>
              <span className="text-[10px] font-bold text-[#6C1B75] dark:text-purple-300 bg-purple-100 dark:bg-purple-500/15 px-2 py-1 rounded-full shrink-0">Privat Tim</span>
            </div>

            <div className="flex-1 rounded-2xl bg-gradient-to-br from-purple-50 to-white dark:from-purple-500/10 dark:to-transparent border border-purple-100 dark:border-purple-500/20 p-4 relative">
              <Quote size={18} className="absolute top-3 right-3 text-purple-200 dark:text-purple-500/40" />
              <p className="text-[11px] font-bold text-[#6C1B75] dark:text-purple-300 uppercase tracking-wider mb-1">Feedback Dosen</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">"{review.feedback}"</p>
              {review.review_date && <p className="text-[10px] text-slate-400 mt-2">{review.review_date}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DosenCard({ dosen }) {
  return (
    <div className="group bg-white dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-[#9333EA] to-[#C084FC]" />

      <div className="p-7 space-y-6">
        {/* identity */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-[#6C1B75] text-white flex items-center justify-center text-xl font-extrabold shadow-lg shadow-blue-500/25">
              {dosen.name.replace(/Dr\.|Prof\.|,.*$/g, '').trim().charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">{dosen.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{dosen.specialty}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-[#6C1B75] dark:bg-purple-500/15 dark:text-purple-300">
                  <Users size={12} /> {dosen.teams.length} tim dibimbing
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  <MessageSquare size={12} /> {dosen.reviews_given} review
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  <Timer size={12} /> respon ~{dosen.avg_response}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  dosen.badge === 'Sangat Responsif'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : dosen.badge === 'Responsif'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                }`}>
                  {dosen.badge}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* activity feed timeline */}
        <div className="rounded-3xl bg-slate-50/80 dark:bg-white/5 p-5">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 mb-4">
            <Activity size={15} className="text-[#9333EA]" /> Aktivitas Terbaru
          </h4>
          <div className="space-y-4">
            {dosen.feed.map((act, i) => {
              const meta = ACTIVITY_META[act.type];
              return (
                <div key={i} className="relative flex items-start gap-3">
                  {i < dosen.feed.length - 1 && (
                    <div className="absolute left-[15px] top-9 bottom-[-16px] w-0.5 bg-slate-200 dark:bg-white/10" />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.chip}`}>
                    <meta.icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{act.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.chip}`}>{meta.label}</span>
                      <span className="text-[10px] text-slate-400">{act.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* teams mentored */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tim Bimbingan:</span>
          {dosen.teams.map((t) => (
            <span key={t} className="px-3 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r from-purple-50 to-white dark:from-purple-500/10 dark:to-transparent border border-purple-100 dark:border-purple-500/20 text-[#6C1B75] dark:text-purple-300">
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkspaceModal({ team, onClose }) {
  const progressPercent = Math.round((team.checklist.completed / team.checklist.total) * 100);
  const doc = team.latest_document;
  const review = doc.dosen_review;
  const reviewMeta = REVIEW_META[review.status];
  const simNum = parseInt(doc.similarity_score);
  const simSafe = doc.similarity_status === 'safe';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-md" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#13151C] w-full max-w-3xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] max-h-[92vh] overflow-hidden flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Hero Header ── */}
        <div className="relative overflow-hidden shrink-0">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#6C1B75] via-[#9333EA] to-[#A855F7]" />
          <div className="absolute -top-20 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-3rem] left-[-2rem] w-48 h-48 bg-purple-900/30 rounded-full blur-3xl" />
          {/* Dots pattern overlay */}
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          <div className="relative z-10 px-8 pt-7 pb-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-5">
              {/* Team Avatar */}
              <div className="w-16 h-16 rounded-[1.25rem] bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-2xl font-black text-white shadow-lg shrink-0">
                {team.team_name.replace('Tim ', '').charAt(0)}
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[11px] font-bold text-white/90 mb-2">
                  <Sparkles size={12} /> {team.category}
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight leading-tight">
                  {team.team_name}
                </h3>
                <p className="text-white/65 text-sm mt-1 font-medium">{team.competition}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md text-white/80 hover:bg-white/30 hover:text-white flex items-center justify-center transition-all duration-200 shrink-0 mt-1"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick stats strip */}
          <div className="relative z-10 px-8 pb-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-white/90">
              <Calendar size={13} /> Deadline: {team.calendar_deadline}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full backdrop-blur-sm text-xs font-bold ${
              team.days_left <= 7 ? 'bg-rose-400/30 text-rose-100' : team.days_left <= 21 ? 'bg-amber-400/30 text-amber-100' : 'bg-emerald-400/30 text-emerald-100'
            }`}>
              <Clock size={13} /> Sisa {team.days_left} hari
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-xs font-semibold text-white/90">
              <GraduationCap size={13} /> {team.advisor}
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm ${reviewMeta.pill}`}>
              {reviewMeta.label}
            </span>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-8 py-7 space-y-7 custom-scrollbar">

          {/* 1) Team Members */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/15 text-[#9333EA] flex items-center justify-center">
                <Users size={16} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">Anggota Tim & Hak Akses Berkas</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {team.team_members.map((m, i) => {
                const [name, roleRaw] = m.split(' (');
                const role = roleRaw ? roleRaw.replace(')', '') : '';
                const isLeader = role.toLowerCase().includes('ketua');
                return (
                  <div key={i} className={`relative flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 ${
                    isLeader
                      ? 'bg-gradient-to-br from-purple-50 to-white dark:from-purple-500/10 dark:to-white/5 border-purple-200 dark:border-purple-500/25 shadow-sm'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 hover:border-purple-200 dark:hover:border-purple-500/25'
                  }`}>
                    {isLeader && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-sm">
                        <span className="text-[10px]">👑</span>
                      </div>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                      isLeader
                        ? 'bg-gradient-to-br from-[#9333EA] to-[#6C1B75] text-white shadow-md shadow-purple-500/20'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {name.trim().split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{name.trim()}</p>
                      {role && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{role}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-start gap-2 px-1">
              <div className="w-4 h-4 rounded-md bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px]">🔒</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                Dokumen plottingan hanya dapat diakses & diunduh oleh anggota tim ini dan Dosen Pembimbing (<strong className="text-slate-500 dark:text-slate-400">{team.advisor}</strong>).
              </p>
            </div>
          </div>

          {/* 2) Notion-Style Checklist */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ListTodo size={16} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">Perlengkapan Lomba</h4>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400">{team.checklist.completed}/{team.checklist.total} selesai</span>
                <ProgressRing percent={progressPercent} />
              </div>
            </div>

            {/* Progress bar full width */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 mb-4 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#9333EA] to-[#C084FC] transition-all duration-700" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 overflow-hidden">
              {team.checklist.items.map((item, i) => (
                <div key={i} className={`flex items-center gap-4 px-5 py-3 text-sm transition-colors ${
                  i < team.checklist.items.length - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''
                } ${item.done ? 'bg-transparent' : 'bg-white dark:bg-white/[0.02]'}`}>
                  {/* Step Number */}
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    item.done
                      ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  }`}>
                    {item.done ? <CheckCircle2 size={15} /> : i + 1}
                  </div>

                  {/* Task name */}
                  <span className={`flex-1 text-xs ${
                    item.done
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-700 dark:text-slate-200 font-semibold'
                  }`}>
                    {item.task}
                  </span>

                  {/* Status pill */}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                    item.done
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300'
                  }`}>
                    {item.done ? '✓ Selesai' : 'Dalam Pengerjaan'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3) Dokumen & Similarity Audit */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-500/15 text-rose-500 flex items-center justify-center">
                <FileText size={16} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">Dokumen & Uji Similarity</h4>
            </div>

            <div className={`rounded-2xl border p-5 space-y-4 ${
              simSafe
                ? 'bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-500/5 dark:to-white/[0.02] border-emerald-200/70 dark:border-emerald-500/20'
                : 'bg-gradient-to-br from-rose-50/80 to-white dark:from-rose-500/5 dark:to-white/[0.02] border-rose-200/70 dark:border-rose-500/20'
            }`}>

              {/* File info row */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  simSafe
                    ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-100 dark:bg-rose-500/15 text-rose-500'
                }`}>
                  <FileUp size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{doc.filename}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{doc.filesize} · Diunggah oleh {doc.uploaded_by} · {doc.uploaded_at}</p>
                </div>
                <span className="text-[10px] font-bold text-[#6C1B75] dark:text-purple-300 bg-purple-100 dark:bg-purple-500/15 px-2.5 py-1 rounded-full shrink-0 border border-purple-200 dark:border-purple-500/25">
                  🔒 Privat Tim
                </span>
              </div>

              {/* Similarity gauge */}
              <div className="bg-white/80 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/10">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className={simSafe ? 'text-emerald-500' : 'text-rose-500'} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Hasil Audit Similarity</span>
                  </div>
                  <span className={`text-lg font-black ${simSafe ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {doc.similarity_score}
                  </span>
                </div>
                {/* Visual bar gauge */}
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      simSafe
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        : 'bg-gradient-to-r from-rose-400 to-rose-500'
                    }`}
                    style={{ width: `${simNum}%` }}
                  />
                  {/* 20% threshold marker */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400/50" style={{ left: '20%' }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-400">0%</span>
                  <span className="text-[10px] text-slate-400 font-semibold" style={{ marginLeft: 'calc(20% - 20px)' }}>Batas 20%</span>
                  <span className="text-[10px] text-slate-400 ml-auto">100%</span>
                </div>
                <p className={`text-xs font-semibold mt-3 ${simSafe ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {simSafe ? '✅ Aman & memenuhi syarat orisinalitas' : '⚠️ Melebihi batas — perlu revisi parafrase segera'}
                </p>
              </div>
            </div>
          </div>

          {/* 4) Dosen Review / Feedback */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-500/15 text-[#9333EA] flex items-center justify-center">
                <MessageSquare size={16} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">Feedback Dosen Pembimbing</h4>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/50 dark:from-purple-500/10 dark:via-white/[0.02] dark:to-indigo-500/5 border border-purple-200/60 dark:border-purple-500/20 p-5 relative overflow-hidden">
              <Quote size={48} className="absolute -top-1 -right-1 text-purple-200/40 dark:text-purple-500/10 rotate-12" />

              <div className="flex items-start gap-4 relative z-10">
                {/* Advisor avatar */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#9333EA] to-[#6C1B75] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-lg shadow-purple-500/20">
                  {team.advisor.replace(/Dr\.|Prof\.|,.*$/g, '').trim().split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-[#6C1B75] dark:text-purple-300">{team.advisor}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${reviewMeta.pill}`}>{reviewMeta.label}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed mt-2">
                    "{review.feedback}"
                  </p>
                  {review.review_date && (
                    <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5">
                      <Clock size={11} /> {review.review_date}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-8 py-5 border-t border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] flex items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Terakhir diupdate <strong className="text-slate-500 dark:text-slate-400">{team.updated_at}</strong>
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full text-xs font-bold bg-gradient-to-r from-[#9333EA] to-[#6C1B75] text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:brightness-110 transition-all"
          >
            Tutup Ruang Kerja
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Page ============

export default function StudentActivityPage() {
  const [tab, setTab] = useState('mahasiswa');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [detailTarget, setDetailTarget] = useState(null);

  const filteredTeams = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return MOCK_TEAMS.filter((t) => {
      const matchSearch =
        t.team_name.toLowerCase().includes(q) ||
        t.leader.toLowerCase().includes(q) ||
        t.competition.toLowerCase().includes(q) ||
        t.advisor.toLowerCase().includes(q);
      const matchFilter = filter === 'all' || t.latest_document.dosen_review.status === filter;
      return matchSearch && matchFilter;
    });
  }, [searchTerm, filter]);

  const filteredDosen = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const matchType = (type) =>
      filter === 'all' ||
      (filter === 'review' && (type === 'review' || type === 'similarity')) ||
      (filter === 'bimbingan' && (type === 'assign' || type === 'approve')) ||
      (filter === 'reminder' && (type === 'reminder' || type === 'meeting'));
    return MOCK_DOSEN
      .filter((d) => d.name.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q) || d.teams.some((t) => t.toLowerCase().includes(q)))
      .map((d) => ({ ...d, feed: d.feed.filter((a) => matchType(a.type)) }))
      .filter((d) => d.feed.length > 0);
  }, [searchTerm, filter]);

  const needReview = MOCK_TEAMS.filter((t) => t.latest_document.dosen_review.status === 'pending').length;
  const reviewed = MOCK_TEAMS.filter((t) => t.latest_document.dosen_review.status === 'reviewed').length;
  const flagged = MOCK_TEAMS.filter((t) => t.latest_document.similarity_status === 'warning').length;
  const totalReviews = MOCK_DOSEN.reduce((n, d) => n + d.reviews_given, 0);

  const kpis = tab === 'mahasiswa'
    ? [
      { title: 'Tim Aktif Berprogres', value: `${MOCK_TEAMS.length} Tim`, desc: 'Ruang kerja tim aktif', icon: Users, tint: { blob: 'bg-purple-300', text: 'text-[#6C1B75] dark:text-purple-300', chip: 'bg-purple-100 text-[#6C1B75] dark:bg-purple-500/15 dark:text-purple-300' } },
      { title: 'Feedback Dosen Selesai', value: `${reviewed} Dokumen`, desc: 'Sudah diperiksa & diberi masukan', icon: CheckCircle2, tint: { blob: 'bg-emerald-300', text: 'text-emerald-600 dark:text-emerald-300', chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' } },
      { title: 'Menunggu Feedback', value: `${needReview} Berkas`, desc: 'Perlu respon dosen pembimbing', icon: Clock, tint: { blob: 'bg-amber-300', text: 'text-amber-600 dark:text-amber-300', chip: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' } },
      { title: 'Peringatan Similarity', value: `${flagged} Naskah`, desc: 'Kemiripan teks > 20%', icon: ShieldCheck, tint: { blob: 'bg-rose-300', text: 'text-rose-600 dark:text-rose-300', chip: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' } },
    ]
    : [
      { title: 'Dosen Aktif', value: `${MOCK_DOSEN.length} Orang`, desc: 'Memiliki tim bimbingan', icon: GraduationCap, tint: { blob: 'bg-purple-300', text: 'text-[#6C1B75] dark:text-purple-300', chip: 'bg-purple-100 text-[#6C1B75] dark:bg-purple-500/15 dark:text-purple-300' } },
      { title: 'Review Diberikan', value: `${totalReviews} Review`, desc: 'Feedback & pemeriksaan dokumen', icon: MessageSquare, tint: { blob: 'bg-emerald-300', text: 'text-emerald-600 dark:text-emerald-300', chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' } },
      { title: 'Tim Dibimbing', value: `${MOCK_DOSEN.reduce((n, d) => n + d.teams.length, 0)} Tim`, desc: 'Tersebar di 3 bidang', icon: Users, tint: { blob: 'bg-blue-300', text: 'text-blue-600 dark:text-blue-300', chip: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' } },
      { title: 'Rata-rata Respon', value: '6.8 Jam', desc: 'Waktu feedback dosen', icon: Timer, tint: { blob: 'bg-amber-300', text: 'text-amber-600 dark:text-amber-300', chip: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' } },
    ];

  const filters = tab === 'mahasiswa' ? MHS_FILTERS : DSN_FILTERS;

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#6C1B75] via-[#9333EA] to-[#C084FC] p-8 md:p-10 text-white shadow-xl shadow-purple-500/20">
        <div className="absolute -top-16 -right-10 w-72 h-72 bg-white/15 rounded-full blur-3xl" />
        <div className="absolute bottom-[-4rem] left-1/3 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold">
              <BarChart3 size={14} /> Monitoring Aktivitas Real-time
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4">
              Kegiatan Mahasiswa & Dosen
            </h1>
            <p className="mt-2 text-white/80 max-w-xl text-sm leading-relaxed">
              Pantau progres tim, dokumen privat, uji similarity, hingga aktivitas review dan pembimbingan dosen — semua dalam satu tempat.
            </p>
          </div>

          {/* tab switcher */}
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-white/15 backdrop-blur-md">
            {[
              { key: 'mahasiswa', label: 'Kegiatan Mahasiswa', icon: Users },
              { key: 'dosen', label: 'Kegiatan Dosen', icon: GraduationCap },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setFilter('all'); }}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                  tab === t.key ? 'bg-white text-[#6C1B75] shadow-lg' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((k) => <KpiCard key={k.title} {...k} />)}
      </div>

      {/* Search + filter pills */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={tab === 'mahasiswa' ? 'Cari tim, ketua, dosen, atau lomba...' : 'Cari nama dosen, bidang, atau tim bimbingan...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-full py-3.5 text-sm shadow-sm focus:ring-2 focus:ring-purple-500/30 focus:border-purple-300 outline-none text-slate-900 dark:text-white"
            style={{ paddingLeft: '3.25rem' }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
                filter === f.value
                  ? 'bg-gradient-to-r from-[#9333EA] to-[#6C1B75] text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-white/10 hover:border-purple-300 hover:text-[#6C1B75]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {tab === 'mahasiswa' ? (
        filteredTeams.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-100 dark:bg-purple-500/15 text-[#6C1B75] dark:text-purple-300 flex items-center justify-center">
              <Search size={26} />
            </div>
            <p className="mt-4 font-bold text-slate-700 dark:text-slate-200">Tidak ada tim yang cocok</p>
            <p className="text-sm text-slate-400 mt-1">Coba ubah kata kunci atau filter status.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredTeams.map((team) => (
              <TeamCard key={team.id} team={team} onDetail={() => setDetailTarget(team)} />
            ))}
          </div>
        )
      ) : filteredDosen.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-purple-100 dark:bg-purple-500/15 text-[#6C1B75] dark:text-purple-300 flex items-center justify-center">
            <Search size={26} />
          </div>
          <p className="mt-4 font-bold text-slate-700 dark:text-slate-200">Tidak ada aktivitas dosen yang cocok</p>
          <p className="text-sm text-slate-400 mt-1">Coba ubah kata kunci atau filter kategori.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredDosen.map((dosen) => (
            <DosenCard key={dosen.id} dosen={dosen} />
          ))}
        </div>
      )}

      {detailTarget && <WorkspaceModal team={detailTarget} onClose={() => setDetailTarget(null)} />}
    </div>
  );
}
