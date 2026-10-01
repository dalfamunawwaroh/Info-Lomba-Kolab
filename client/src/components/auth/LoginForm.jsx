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
    <div className="p-8 sm:p-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-[#6C1B75]/10 text-[#6C1B75] text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <Sparkles size={12} /> Selamat Datang Kembali
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Masuk ke Akun</h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Lanjutkan perjalanan kompetisimu di Ko+Lab
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {apiError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm animate-fade-in flex items-start gap-2.5">
            <span className="shrink-0 mt-0.5 text-red-400">&#9888;</span>
            <span>{apiError}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Email</label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#6C1B75] transition-colors" />
            <input
              type="email"
              placeholder="nama@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full h-12 pl-11 pr-4 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6C1B75]/20 focus:border-[#6C1B75] ${
                errors.email ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
              }`}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500 animate-fade-in">{errors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">Password</label>
            <Link to="/forgot-password" className="text-xs text-[#6C1B75] hover:text-[#9333EA] font-medium transition-colors">
              Lupa password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#6C1B75] transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`w-full h-12 pl-11 pr-12 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6C1B75]/20 focus:border-[#6C1B75] ${
                errors.password ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#6C1B75] transition-colors p-0.5"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 animate-fade-in">{errors.password}</p>}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#6C1B75] to-[#9333EA] hover:from-[#5a1663] hover:to-[#7C2D8C] transition-all duration-300 hover:shadow-lg hover:shadow-[#6C1B75]/25 active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Masuk...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Masuk
              <ArrowRight size={16} />
            </span>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
        <div className="relative flex justify-center"><span className="bg-white px-4 text-xs text-muted-foreground">atau</span></div>
      </div>

      {/* Register link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Link to="/register" className="text-[#6C1B75] font-semibold hover:text-[#9333EA] transition-colors">
            Buat akun baru
          </Link>
        </p>
      </div>
    </div>
  );
}

export { LoginForm };