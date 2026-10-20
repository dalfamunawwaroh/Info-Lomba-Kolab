import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Label } from '@/components/common/Label';
import { Select } from '@/components/common/Select';
import { Button } from '@/components/common/Button';
import { validateRequired } from '@/utils/validators';
import { Plus, X, FileText, Link as LinkIcon, MapPin, Trophy, Users, CalendarDays, BookOpen, Tag, Building2, DollarSign, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = [
  'Software Development', 'Design & Experience', 'Business & Pitch',
  'Data Science & AI', 'Cybersecurity', 'Internet of Things',
  'Mobile Development', 'Game Development', 'General Innovation',
];

/* ─────────────────────────────────────────────────────
   Section — HOISTED OUTSIDE so it never re-mounts
   ───────────────────────────────────────────────────── */
const Section = ({ icon: Icon, title, accent, children }) => (
  <div className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${accent ?? 'border-border bg-card'}`}>
    <div className="flex items-center gap-2">
      {Icon && (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5" />
        </span>
      )}
      <span className="text-sm font-semibold text-foreground">{title}</span>
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const inputCls = 'rounded-xl';
const textareaCls = 'rounded-xl min-h-[100px]';

/* ─────────────────────────────────────────────────────
   CompetitionForm
   ───────────────────────────────────────────────────── */
function CompetitionForm({ initialData, onSubmit, loading, submitLabel = 'Simpan' }) {
  const [form, setForm] = useState({
    title: '', category: '', organizer: '', description: '',
    status: 'upcoming', event_date: '', registration_deadline: '',
    link: '', guidebook_url: '', registration_url: '', image_url: '',
    location: '', max_team_members: 3, needs_advisor: false,
    max_advisors: 1, prize_pool: '', registration_fee: 'Gratis',
    requirements: [], ...initialData,
  });
  const [errors, setErrors] = useState({});
  const [newReq, setNewReq] = useState('');

  useEffect(() => { if (initialData) setForm(p => ({ ...p, ...initialData })); }, [initialData]);

  /* generic setter — avoids spread wrapper that loses focus */
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    const t = validateRequired(form.title, 'Nama lomba');
    if (t) errs.title = t;
    if (form.max_team_members < 2 || form.max_team_members > 10) errs.max_team_members = 'Maks anggota tim: 2-10';
    if (form.needs_advisor && (form.max_advisors < 1 || form.max_advisors > 3)) errs.max_advisors = 'Maks dosen: 1-3';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const d = {
      ...form,
      max_team_members: parseInt(form.max_team_members) || 3,
      max_advisors: form.needs_advisor ? (parseInt(form.max_advisors) || 1) : 1,
    };
    onSubmit(d);
  };

  const addReq = () => {
    const v = newReq.trim();
    if (v && !form.requirements.includes(v)) {
      setForm(f => ({ ...f, requirements: [...f.requirements, v] }));
      setNewReq('');
    }
  };
  const removeReq = (i) => setForm(f => ({ ...f, requirements: f.requirements.filter((_, idx) => idx !== i) }));

  /* accent backgrounds per section */
  const A = {
    info:   'border-blue-200/50 bg-gradient-to-br from-blue-50/60 to-transparent',
    date:   'border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-transparent',
    loc:    'border-emerald-200/50 bg-gradient-to-br from-emerald-50/50 to-transparent',
    link:   'border-violet-200/50 bg-gradient-to-br from-violet-50/50 to-transparent',
    team:   'border-sky-200/50 bg-gradient-to-br from-sky-50/50 to-transparent',
    prize:  'border-rose-200/50 bg-gradient-to-br from-rose-50/50 to-transparent',
    req:    'border-orange-200/50 bg-gradient-to-br from-orange-50/50 to-transparent',
  };

  return (
    <Card className="rounded-[1.5rem] border-0 shadow-lg shadow-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5 text-lg">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
            <Trophy className="h-4.5 w-4.5" />
          </span>
          {initialData ? 'Edit Lomba' : 'Tambah Lomba Baru'}
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5">

          {/* 1 — Informasi Dasar */}
          <Section icon={Tag} title="Informasi Dasar" accent={A.info}>
            <div className="space-y-1.5">
              <Label>Nama Lomba <span className="text-destructive">*</span></Label>
              <Input className={inputCls} value={form.title} onChange={set('title')} placeholder="Contoh: National Hackathon Ko+Lab 2026" />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <Select className={inputCls} value={form.category} onChange={set('category')}>
                  <option value="">Pilih kategori</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select className={inputCls} value={form.status} onChange={set('status')}>
                  <option value="upcoming">Akan Datang</option>
                  <option value="ongoing">Berlangsung</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" /> Penyelenggara</Label>
              <Input className={inputCls} value={form.organizer} onChange={set('organizer')} placeholder="Nama institusi / penyelenggara" />
            </div>
            <div className="space-y-1.5">
              <Label>Deskripsi</Label>
              <textarea className={`flex w-full border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${textareaCls}`} value={form.description} onChange={set('description')} placeholder="Jelaskan tentang lomba ini..." rows={4} />
            </div>
          </Section>

          {/* 2 — Tanggal & Deadline */}
          <Section icon={CalendarDays} title="Tanggal & Deadline" accent={A.date}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tanggal Pelaksanaan</Label>
                <Input className={inputCls} type="date" value={form.event_date} onChange={set('event_date')} />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline Pendaftaran</Label>
                <Input className={inputCls} type="date" value={form.registration_deadline} onChange={set('registration_deadline')} />
              </div>
            </div>
          </Section>

          {/* 3 — Lokasi */}
          <Section icon={MapPin} title="Lokasi" accent={A.loc}>
            <div className="space-y-1.5">
              <Label>Lokasi Pelaksanaan</Label>
              <Input className={inputCls} value={form.location} onChange={set('location')} placeholder="Jakarta Convention Center / Online (Zoom)" />
            </div>
          </Section>

          {/* 4 — Link & Dokumentasi */}
          <Section icon={LinkIcon} title="Link & Dokumentasi" accent={A.link}>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><LinkIcon className="h-3.5 w-3.5" /> Link Informasi Lomba</Label>
              <Input className={inputCls} value={form.link} onChange={set('link')} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Link Guidebook</Label>
              <Input className={inputCls} value={form.guidebook_url} onChange={set('guidebook_url')} placeholder="https://drive.google.com/... atau URL guidebook" />
              <p className="text-xs text-muted-foreground">Masukkan link Google Drive, Dropbox, atau website resmi</p>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><LinkIcon className="h-3.5 w-3.5" /> Link Pendaftaran Eksternal</Label>
              <Input className={inputCls} value={form.registration_url} onChange={set('registration_url')} placeholder="https://pendaftaran.lomba.id/..." />
              <p className="text-xs text-muted-foreground">Kosongkan jika pendaftaran lewat sistem ini</p>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Thumbnail / Poster</Label>
              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500/40 hover:bg-purple-50/50 dark:hover:bg-purple-500/10 transition-all text-sm text-slate-500 dark:text-slate-400">
                  <ImageIcon className="h-4 w-4" />
                  {form.image_url && !form.image_url.startsWith('data:') ? 'Ganti Gambar' : 'Pilih File Gambar'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        setErrors(prev => ({ ...prev, image_url: 'Ukuran gambar maks 2 MB' }));
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => setForm(f => ({ ...f, image_url: reader.result }));
                      reader.readAsDataURL(file);
                      setErrors(prev => { const { image_url, ...rest } = prev; return rest; });
                    }}
                  />
                </label>
                {form.image_url && (
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                    title="Hapus gambar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {form.image_url && (
                <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 w-full max-w-xs">
                  <img src={form.image_url} alt="Preview" className="w-full h-24 object-cover" />
                </div>
              )}
              {errors.image_url && <p className="text-xs text-destructive">{errors.image_url}</p>}
              <p className="text-xs text-muted-foreground">Format: JPG, PNG, WebP. Ukuran maks 2 MB.</p>
            </div>
          </Section>

          {/* 5 — Pengaturan Tim & Pembimbing */}
          <Section icon={Users} title="Pengaturan Tim & Pembimbing" accent={A.team}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Max Anggota Per Tim <span className="text-destructive">*</span></Label>
                <Input className={inputCls} type="number" min={2} max={10} value={form.max_team_members} onChange={set('max_team_members')} />
                {errors.max_team_members && <p className="text-xs text-destructive">{errors.max_team_members}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Perlu Dosen Pembimbing?</Label>
                <Select className={inputCls} value={form.needs_advisor ? 'yes' : 'no'} onChange={e => setForm(f => ({ ...f, needs_advisor: e.target.value === 'yes' }))}>
                  <option value="no">Tidak</option>
                  <option value="yes">Ya</option>
                </Select>
              </div>
            </div>
            {form.needs_advisor && (
              <div className="space-y-1.5">
                <Label>Max Dosen Pembimbing Per Tim</Label>
                <Input className={inputCls} type="number" min={1} max={3} value={form.max_advisors} onChange={set('max_advisors')} />
                {errors.max_advisors && <p className="text-xs text-destructive">{errors.max_advisors}</p>}
              </div>
            )}
          </Section>

          {/* 6 — Hadiah & Biaya */}
          <Section icon={DollarSign} title="Hadiah & Biaya" accent={A.prize}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> Hadiah / Prize Pool</Label>
                <Input className={inputCls} value={form.prize_pool} onChange={set('prize_pool')} placeholder="Contoh: Rp 50.000.000" />
              </div>
              <div className="space-y-1.5">
                <Label>Biaya Pendaftaran</Label>
                <Input className={inputCls} value={form.registration_fee} onChange={set('registration_fee')} placeholder="Contoh: Gratis / Rp 50.000" />
              </div>
            </div>
          </Section>

          {/* 7 — Syarat & Ketentuan */}
          <Section icon={FileText} title="Syarat & Ketentuan" accent={A.req}>
            <div className="space-y-2">
              <Label>Requirements / Dokumen yang Diperlukan</Label>
              <div className="flex gap-2">
                <Input className={inputCls} value={newReq} onChange={e => setNewReq(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addReq(); } }} placeholder="Contoh: Proposal Inovasi" />
                <Button type="button" variant="outline" onClick={addReq} className="shrink-0 rounded-full px-4">
                  <Plus className="h-4 w-4 mr-1" />Tambah
                </Button>
              </div>
              {form.requirements.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {form.requirements.map((r, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 text-primary text-xs font-medium px-3 py-1.5 transition-colors hover:from-destructive/10 hover:to-destructive/5 hover:text-destructive">
                      {r}
                      <button type="button" onClick={() => removeReq(i)} className="ml-0.5"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Section>

        </CardContent>

        <CardFooter className="flex gap-3 justify-end pt-2">
          <Button type="submit" disabled={loading} className="rounded-full px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md shadow-primary/20">
            {loading ? 'Menyimpan...' : submitLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export { CompetitionForm };