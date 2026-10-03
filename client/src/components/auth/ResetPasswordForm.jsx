import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { validatePassword } from '@/utils/validators';

function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ password: '', password_confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const passwordChecks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    match: form.password.length > 0 && form.password === form.password_confirm,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    const p = validatePassword(form.password);
    if (p) errs.password = p;
    if (form.password !== form.password_confirm) errs.password_confirm = 'Password tidak cocok';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
    }, 1500);
  };

  if (success) {
    return (
      <div className="text-center animate-fade-in py-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-bounce-in">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Password Berhasil Diubah!</h2>
        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
          Password kamu sudah diperbarui. Silakan login dengan password baru.
        </p>
        <Link to="/login">
          <Button className="w-full h-12 sm:h-13 rounded-xl sm:rounded-2xl font-bold text-sm bg-gradient-to-r from-[#6C1B75] to-[#9333EA] hover:from-[#5a1663] hover:to-[#7C2D8C] transition-all duration-300 hover:shadow-xl hover:shadow-[#6C1B75]/25">
            <span className="flex items-center gap-2 justify-center">
              Login Sekarang
              <ArrowRight size={16} />
            </span>
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-5 text-center">
        <div className="inline-flex items-center gap-1.5 bg-[#6C1B75]/10 text-[#6C1B75] text-[11px] sm:text-xs font-semibold px-3 py-1 rounded-full mb-3">
          <ShieldCheck size={13} /> Reset Password
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Password Baru</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Masukkan password baru untuk akun kamu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-bold text-slate-700 ml-1">Password Baru</label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-[#6C1B75] transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password baru"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`w-full h-12 sm:h-13 pl-11 pr-11 rounded-xl sm:rounded-2xl border text-sm transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#6C1B75]/10 focus:border-[#6C1B75] focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] ${errors.password ? 'border-red-300 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 text-slate-800'}`}
              autoFocus
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#6C1B75] transition-colors p-1 rounded-md hover:bg-slate-100">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 animate-fade-in ml-1 font-medium">{errors.password}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-bold text-slate-700 ml-1">Konfirmasi Password Baru</label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-[#6C1B75] transition-colors" />
            <input
              type="password" placeholder="Ulangi password baru"
              value={form.password_confirm}
              onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
              className={`w-full h-12 sm:h-13 pl-11 pr-4 rounded-xl sm:rounded-2xl border text-sm transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#6C1B75]/10 focus:border-[#6C1B75] focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] ${errors.password_confirm ? 'border-red-300 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 text-slate-800'}`}
            />
          </div>
          {errors.password_confirm && <p className="text-xs text-red-500 animate-fade-in ml-1 font-medium">{errors.password_confirm}</p>}
        </div>

        <div className="bg-slate-50 border border-slate-200/50 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-2">
          <p className="text-xs font-bold text-slate-700 mb-1.5">Kekuatan Password</p>
          <div className="grid grid-cols-2 gap-2">
            <PasswordCheck label="Min 8 karakter" ok={passwordChecks.length} />
            <PasswordCheck label="1 huruf besar" ok={passwordChecks.upper} />
            <PasswordCheck label="1 angka" ok={passwordChecks.number} />
            <PasswordCheck label="Password cocok" ok={passwordChecks.match} />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 sm:h-13 mt-2 rounded-xl sm:rounded-2xl font-bold text-sm bg-gradient-to-r from-[#6C1B75] to-[#9333EA] hover:from-[#5a1663] hover:to-[#7C2D8C] transition-all duration-300 hover:shadow-xl hover:shadow-[#6C1B75]/25 active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Menyimpan...
            </span>
          ) : (
            <span className="flex items-center gap-2 justify-center">
              Simpan Password Baru
              <ArrowRight size={16} />
            </span>
          )}
        </Button>
      </form>
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

export { ResetPasswordForm };