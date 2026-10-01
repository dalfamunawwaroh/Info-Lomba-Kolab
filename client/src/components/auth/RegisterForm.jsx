import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, Building2, ArrowRight, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/Button';
import startupService from '@/services/startupService';
import { validateEmail, validatePassword, validateName } from '@/utils/validators';

function RegisterForm() {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirm: '', role: 'mahasiswa', startup_id: '',
  });
  const [startups, setStartups] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    startupService.getStartups().then((res) => setStartups(res.data || [])).catch(() => {});
  }, []);

  const passwordChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    match: form.password.length > 0 && form.password === form.password_confirm,
  };

  const validateStep1 = () => {
    const errs = {};
    const n = validateName(form.name);
    if (n) errs.name = n;
    const e = validateEmail(form.email);
    if (e) errs.email = e;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    const p = validatePassword(form.password);
    if (p) errs.password = p;
    if (form.password !== form.password_confirm) errs.password_confirm = 'Password tidak cocok';
    if (form.role === 'mahasiswa' && !form.startup_id) errs.startup_id = 'Mahasiswa wajib memilih startup';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validateStep2()) return;
    setLoading(true);
    try {
      const data = { ...form };
      if (form.role === 'dosen') delete data.startup_id;
      if (data.startup_id) data.startup_id = parseInt(data.startup_id);
      await register(data);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full h-12 pl-11 pr-4 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6C1B75]/20 focus:border-[#6C1B75] ${
      errors[field] ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
    }`;

  return (
    <div className="p-8 sm:p-10">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 bg-[#9333EA]/10 text-[#9333EA] text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <Sparkles size={12} /> Bergabung Sekarang
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Buat Akun Baru</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Daftar dan mulai perjalanan kompetisimu
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              step > s
                ? 'bg-emerald-500 text-white'
                : step === s
                  ? 'bg-gradient-to-br from-[#6C1B75] to-[#9333EA] text-white shadow-md shadow-[#6C1B75]/20'
                  : 'bg-gray-100 text-gray-400'
            }`}>
              {step > s ? <CheckCircle2 size={14} /> : s}
            </div>
            <span className={`text-xs font-medium ${step >= s ? 'text-foreground' : 'text-gray-400'}`}>
              {s === 1 ? 'Data Diri' : 'Keamanan'}
            </span>
            {s < 2 && <div className={`w-10 h-0.5 rounded-full transition-colors ${step > 1 ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {apiError && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm animate-fade-in">
          {apiError}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); step === 1 ? nextStep() : handleSubmit(e); }} className="space-y-4">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Nama Lengkap</label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#6C1B75] transition-colors" />
                <input
                  type="text" placeholder="Nama lengkap kamu"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass('name')}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 animate-fade-in">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#6C1B75] transition-colors" />
                <input
                  type="email" placeholder="nama@email.com"
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 animate-fade-in">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Daftar Sebagai</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'mahasiswa', icon: GraduationCap, label: 'Mahasiswa', desc: 'Cari lomba & bentuk tim' },
                  { value: 'dosen', icon: User, label: 'Dosen', desc: 'Buat lomba & bimbing tim' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value, startup_id: '' })}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 group ${
                      form.role === r.value
                        ? 'border-[#6C1B75] bg-[#6C1B75]/5 shadow-sm shadow-[#6C1B75]/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <r.icon className={`h-5 w-5 mb-2 ${form.role === r.value ? 'text-[#6C1B75]' : 'text-gray-400'}`} />
                    <p className="text-sm font-semibold">{r.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                    {form.role === r.value && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 size={16} className="text-[#6C1B75]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {form.role === 'mahasiswa' && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-sm font-semibold text-foreground">Startup</label>
                <div className="relative group">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#6C1B75] transition-colors" />
                  <select
                    value={form.startup_id}
                    onChange={(e) => setForm({ ...form, startup_id: e.target.value })}
                    className={`w-full h-12 pl-11 pr-4 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6C1B75]/20 focus:border-[#6C1B75] appearance-none ${errors.startup_id ? 'border-red-300' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'}`}
                  >
                    <option value="">-- Pilih Startup --</option>
                    {startups.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                {errors.startup_id && <p className="text-xs text-red-500 animate-fade-in">{errors.startup_id}</p>}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#6C1B75] to-[#9333EA] hover:from-[#5a1663] hover:to-[#7C2D8C] transition-all duration-300 hover:shadow-lg hover:shadow-[#6C1B75]/25 active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                Lanjutkan
                <ArrowRight size={16} />
              </span>
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-slide-in-right">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#6C1B75] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Buat password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass('password')}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6C1B75] transition-colors p-0.5">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Konfirmasi Password</label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#6C1B75] transition-colors" />
                <input
                  type="password" placeholder="Ulangi password"
                  value={form.password_confirm}
                  onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                  className={inputClass('password_confirm')}
                />
              </div>
              {errors.password_confirm && <p className="text-xs text-red-500 animate-fade-in">{errors.password_confirm}</p>}
            </div>

            {/* Password strength */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground mb-2">Kekuatan Password</p>
              <PasswordCheck label="Minimal 8 karakter" ok={passwordChecks.length} />
              <PasswordCheck label="1 huruf besar" ok={passwordChecks.upper} />
              <PasswordCheck label="1 angka" ok={passwordChecks.number} />
              <PasswordCheck label="Password cocok" ok={passwordChecks.match} />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl border-gray-200 hover:border-gray-300 hover:bg-gray-50">
                <ArrowLeft size={16} className="mr-1.5" /> Kembali
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#6C1B75] to-[#9333EA] hover:from-[#5a1663] hover:to-[#7C2D8C] transition-all duration-300 hover:shadow-lg hover:shadow-[#6C1B75]/25 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mendaftar...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Buat Akun
                    <ArrowRight size={16} />
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-muted-foreground">atau</span></div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-[#6C1B75] font-semibold hover:text-[#9333EA] transition-colors">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}

function PasswordCheck({ label, ok }) {
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${ok ? 'bg-emerald-100' : 'bg-gray-100'}`}>
        <CheckCircle2 size={12} className={`transition-colors duration-200 ${ok ? 'text-emerald-600' : 'text-gray-300'}`} />
      </div>
      <span className={`transition-colors duration-200 ${ok ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
}

export { RegisterForm };