import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, User, GraduationCap, Building2, ArrowRight, ArrowLeft, CheckCircle2, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/common/Button';
import startupService from '@/services/startupService';
import { validateEmail, validatePassword, validateName } from '@/utils/validators';

const DEFAULT_STARTUPS = [
  { id: 1, name: 'JagoAI' },
  { id: 2, name: 'Kroombox' },
  { id: 3, name: 'Uni Inside' },
  { id: 4, name: 'JagoFarm' },
  { id: 5, name: 'Ngolab' },
  { id: 6, name: 'Sorgummi' },
];

function RegisterForm() {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirm: '', role: 'mahasiswa', startup_id: '',
  });
  const [startups, setStartups] = useState(DEFAULT_STARTUPS);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isStartupDropdownOpen, setIsStartupDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsStartupDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    startupService.getStartups()
      .then((res) => {
        const fetched = res?.data || res;
        if (Array.isArray(fetched) && fetched.length > 0) {
          setStartups(fetched);
        }
      })
      .catch(() => {});
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
    `w-full h-11 sm:h-11.5 pl-10 pr-3.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#6C1B75]/10 focus:border-[#6C1B75] focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] ${
      errors[field] ? 'border-red-300 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 text-slate-800'
    }`;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-3.5">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Buat Akun Baru</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Daftar dan mulai perjalanan kompetisimu di Ko+Lab
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-3.5">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              step > s
                ? 'bg-emerald-500 text-white shadow-sm'
                : step === s
                  ? 'bg-gradient-to-br from-[#6C1B75] to-[#9333EA] text-white shadow-sm ring-4 ring-purple-500/10'
                  : 'bg-white/50 border border-slate-200/50 text-slate-400'
            }`}>
              {step > s ? <CheckCircle2 size={13} /> : s}
            </div>
            <span className={`text-xs font-bold ${step >= s ? 'text-slate-700' : 'text-slate-400'}`}>
              {s === 1 ? 'Data Diri' : 'Keamanan'}
            </span>
            {s < 2 && <div className={`w-10 sm:w-14 h-[2.5px] rounded-full transition-colors ${step > 1 ? 'bg-emerald-500' : 'bg-slate-200/60'}`} />}
          </div>
        ))}
      </div>

      {apiError && (
        <div className="mb-3 p-3 rounded-xl bg-red-50/80 border border-red-100 text-red-700 text-xs sm:text-sm animate-fade-in flex items-start gap-2 shadow-sm backdrop-blur-sm">
          <span className="shrink-0 text-red-500">&#9888;</span>
          <span className="font-medium">{apiError}</span>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); step === 1 ? nextStep() : handleSubmit(e); }} className="space-y-3 sm:space-y-3.5">
        {step === 1 && (
          <div className="space-y-3 sm:space-y-3.5 animate-fade-in">
            {/* Side by side inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-0.5">Nama Lengkap</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#6C1B75] transition-colors" />
                  <input
                    type="text" placeholder="Nama lengkap kamu"
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputClass('name')}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-500 animate-fade-in ml-0.5 font-medium">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-0.5">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#6C1B75] transition-colors" />
                  <input
                    type="email" placeholder="nama@email.com"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass('email')}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 animate-fade-in ml-0.5 font-medium">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 ml-0.5">Daftar Sebagai</label>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  { value: 'mahasiswa', icon: GraduationCap, label: 'Mahasiswa', desc: 'Cari lomba & tim' },
                  { value: 'dosen', icon: User, label: 'Dosen', desc: 'Buat & bimbing tim' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value, startup_id: '' })}
                    className={`relative p-3 rounded-xl sm:rounded-2xl border-2 text-left transition-all duration-300 group bg-white/50 backdrop-blur-sm ${
                      form.role === r.value
                        ? 'border-[#6C1B75] bg-purple-50/60 shadow-sm shadow-[#6C1B75]/10 ring-4 ring-purple-500/10'
                        : 'border-slate-200/60 hover:border-purple-300/60 hover:bg-white/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <r.icon className={`h-4 w-4 transition-colors ${form.role === r.value ? 'text-[#6C1B75]' : 'text-slate-400 group-hover:text-purple-400'}`} />
                      <p className={`text-xs sm:text-sm font-bold transition-colors ${form.role === r.value ? 'text-slate-900' : 'text-slate-700'}`}>{r.label}</p>
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 leading-snug">{r.desc}</p>
                    {form.role === r.value && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 size={16} className="text-[#6C1B75] animate-bounce-in" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {form.role === 'mahasiswa' && (
              <div className="space-y-1 animate-fade-in relative z-20" ref={dropdownRef}>
                <label className="text-xs font-bold text-slate-700 ml-0.5">Startup</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsStartupDropdownOpen(!isStartupDropdownOpen)}
                    className={`w-full h-11 sm:h-11.5 pl-10 pr-4 rounded-xl sm:rounded-2xl border text-left flex items-center justify-between transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#6C1B75]/10 focus:border-[#6C1B75] ${
                      errors.startup_id ? 'border-red-300 bg-red-50/50' : 'border-slate-200/60 bg-white/50 hover:bg-white/80'
                    }`}
                  >
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-[#6C1B75] transition-colors" />
                    <span className={`text-xs sm:text-sm font-medium ${form.startup_id ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                      {form.startup_id
                        ? startups.find((s) => String(s.id) === String(form.startup_id))?.name || '-- Pilih Startup --'
                        : '-- Pilih Startup --'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isStartupDropdownOpen ? 'rotate-180 text-[#6C1B75]' : ''}`} />
                  </button>

                  {/* Floating Dropdown Menu - ALWAYS POP DOWNWARDS */}
                  {isStartupDropdownOpen && (
                    <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-2xl rounded-xl sm:rounded-2xl py-1.5 max-h-52 overflow-y-auto animate-in fade-in-50 zoom-in-95">
                      <div
                        onClick={() => {
                          setForm({ ...form, startup_id: '' });
                          setIsStartupDropdownOpen(false);
                        }}
                        className="px-3.5 py-2 text-xs sm:text-sm text-slate-400 hover:bg-slate-100 cursor-pointer font-medium"
                      >
                        -- Pilih Startup --
                      </div>
                      {startups.map((s) => {
                        const isSelected = String(form.startup_id) === String(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              setForm({ ...form, startup_id: s.id });
                              setIsStartupDropdownOpen(false);
                            }}
                            className={`px-3.5 py-2.5 text-xs sm:text-sm font-bold flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-purple-50 text-[#6C1B75]'
                                : 'text-slate-700 hover:bg-purple-50/80 hover:text-[#6C1B75]'
                            }`}
                          >
                            <span>{s.name}</span>
                            {isSelected && <CheckCircle2 size={16} className="text-[#6C1B75]" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {errors.startup_id && <p className="text-xs text-red-500 animate-fade-in ml-0.5 font-medium">{errors.startup_id}</p>}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 sm:h-11.5 mt-1.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#6C1B75] to-[#9333EA] hover:from-[#5a1663] hover:to-[#7C2D8C] transition-all duration-300 hover:shadow-xl hover:shadow-[#6C1B75]/25 active:scale-[0.98]"
            >
              <span className="flex items-center gap-2 justify-center">
                Lanjutkan
                <ArrowRight size={16} />
              </span>
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 sm:space-y-3.5 animate-slide-in-right">
            {/* Side by side password inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-0.5">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#6C1B75] transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Buat password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className={inputClass('password')}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#6C1B75] transition-colors p-1 rounded-md">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 ml-0.5">Konfirmasi Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#6C1B75] transition-colors" />
                  <input
                    type="password" placeholder="Ulangi password"
                    value={form.password_confirm}
                    onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                    className={inputClass('password_confirm')}
                  />
                </div>
                {errors.password_confirm && <p className="text-xs text-red-500 animate-fade-in ml-0.5 font-medium">{errors.password_confirm}</p>}
              </div>
            </div>

            {/* Password strength */}
            <div className="bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-xl sm:rounded-2xl p-3 space-y-1.5">
              <p className="text-xs font-bold text-slate-700">Kekuatan Password</p>
              <div className="grid grid-cols-2 gap-1.5">
                <PasswordCheck label="Min 8 karakter" ok={passwordChecks.length} />
                <PasswordCheck label="1 huruf besar" ok={passwordChecks.upper} />
                <PasswordCheck label="1 angka" ok={passwordChecks.number} />
                <PasswordCheck label="Password cocok" ok={passwordChecks.match} />
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 sm:h-11.5 rounded-xl sm:rounded-2xl border-slate-200/80 hover:border-slate-300 hover:bg-white/80 font-bold text-xs sm:text-sm text-slate-600 bg-white/50 backdrop-blur-sm">
                <ArrowLeft size={16} className="mr-1" /> Kembali
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-11 sm:h-11.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#6C1B75] to-[#9333EA] hover:from-[#5a1663] hover:to-[#7C2D8C] transition-all duration-300 hover:shadow-xl hover:shadow-[#6C1B75]/25 active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mendaftar...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 justify-center">
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
      <div className="flex items-center gap-4 my-3 sm:my-3.5">
        <div className="flex-1 border-t border-slate-200/60" />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">atau</span>
        <div className="flex-1 border-t border-slate-200/60" />
      </div>

      <div className="text-center">
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-[#6C1B75] font-bold hover:text-[#9333EA] transition-colors">
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