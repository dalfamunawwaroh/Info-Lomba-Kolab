import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { validateEmail, validateRequired } from '@/utils/validators';

function LoginForm() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const errs = {};
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    const passErr = validateRequired(form.password, 'Password');
    if (passErr) errs.password = passErr;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 423) setApiError(msg || 'Akun terkunci. Coba lagi dalam 15 menit.');
      else if (status === 403) setApiError(msg || 'Akun telah dinonaktifkan. Hubungi admin.');
      else setApiError(msg || 'Email atau password tidak valid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-[#6C1B75]/10 text-[#6C1B75] text-xs font-semibold px-4 py-1.5 rounded-full mb-5 border border-[#6C1B75]/20">
          <Sparkles size={14} /> Selamat Datang Kembali
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Masuk ke Akun</h2>
        <p className="text-[15px] text-slate-500 mt-2">
          Lanjutkan perjalanan kompetisimu di Ko+Lab
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {apiError && (
          <div className="p-4 rounded-2xl bg-red-50/80 border border-red-100 text-red-700 text-sm animate-fade-in flex items-start gap-3 shadow-sm backdrop-blur-sm">
            <span className="shrink-0 mt-0.5 text-red-500">&#9888;</span>
            <span className="font-medium">{apiError}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#6C1B75] transition-colors" />
            <input
              type="email"
              placeholder="nama@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full h-14 pl-12 pr-4 rounded-2xl border text-[15px] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#6C1B75]/10 focus:border-[#6C1B75] focus:bg-white/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] ${
                errors.email ? 'border-red-300 bg-red-50/50 text-red-900' : 'border-slate-200/60 bg-white/50 hover:bg-white/80 text-slate-800'
              }`}
            />
          </div>
          {errors.email && <p className="text-sm text-red-500 animate-fade-in ml-1 font-medium">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between ml-1">
            <label className="text-sm font-bold text-slate-700">Password</label>
            <Link to="/forgot-password" className="text-sm text-[#6C1B75] hover:text-[#9333EA] font-bold transition-colors">
              Lupa password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#6C1B75] transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`w-full h-14 pl-12 pr-12 rounded-2xl border text-[15px] transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#6C1B75]/10 focus:border-[#6C1B75] focus:bg-white/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] ${
                errors.password ? 'border-red-300 bg-red-50/50 text-red-900' : 'border-slate-200/60 bg-white/50 hover:bg-white/80 text-slate-800'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#6C1B75] transition-colors p-1 rounded-md hover:bg-slate-100/50"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-500 animate-fade-in ml-1 font-medium">{errors.password}</p>}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-14 mt-4 rounded-2xl font-bold text-[15px] bg-gradient-to-r from-[#6C1B75] to-[#9333EA] hover:from-[#5a1663] hover:to-[#7C2D8C] transition-all duration-300 hover:shadow-xl hover:shadow-[#6C1B75]/25 active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Masuk...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Masuk
              <ArrowRight size={18} />
            </span>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-4 my-8">
        <div className="flex-1 border-t border-slate-200/60" />
        <span className="text-[13px] font-medium text-slate-400 uppercase tracking-wider">atau</span>
        <div className="flex-1 border-t border-slate-200/60" />
      </div>

      {/* Register link */}
      <div className="text-center">
        <p className="text-[15px] text-slate-500 font-medium">
          Belum punya akun?{' '}
          <Link to="/register" className="text-[#6C1B75] font-bold hover:text-[#9333EA] transition-colors">
            Buat akun baru
          </Link>
        </p>
      </div>
    </div>
  );
}

export { LoginForm };