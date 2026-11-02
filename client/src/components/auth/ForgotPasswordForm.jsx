import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, KeyRound, Clock } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { validateEmail } from '@/utils/validators';
import authService from '@/services/authService';

function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    setError('');
    setLoading(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim permintaan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center animate-fade-in py-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-bounce-in">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Permintaan Diterima</h2>
        <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">
          Jika email <span className="font-semibold text-slate-900">{email}</span> terdaftar di sistem, permintaan
          reset password kamu sudah masuk dan <b>menunggu verifikasi admin</b>.
        </p>
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 text-left text-xs text-slate-600 space-y-2 mb-5 max-w-sm mx-auto">
          <p className="flex items-start gap-2">
            <Clock size={14} className="text-[#6C1B75] shrink-0 mt-0.5" />
            Admin akan <b>mengirimkan kode verifikasi 6 digit ke email kamu</b>.
          </p>
          <p className="flex items-start gap-2">
            <KeyRound size={14} className="text-[#6C1B75] shrink-0 mt-0.5" />
            Setelah kode diterima, masukkan kode + password baru pada halaman berikutnya.
          </p>
        </div>
        <Button
          onClick={() => navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`)}
          className="w-full h-12 sm:h-13 rounded-xl sm:rounded-2xl font-bold text-sm bg-gradient-to-r from-[#6C1B75] to-[#9333EA] hover:from-[#5a1663] hover:to-[#7C2D8C] transition-all duration-300 hover:shadow-xl hover:shadow-[#6C1B75]/25"
        >
          <span className="flex items-center justify-center">
            Masukkan Kode Verifikasi
            <ArrowRight size={16} className="ml-2" />
          </span>
        </Button>
        <div className="text-center mt-4">
          <Link to="/login" className="text-xs sm:text-sm text-slate-500 hover:text-[#6C1B75] inline-flex items-center gap-1.5 font-bold transition-colors">
            <ArrowLeft size={14} />
            Kembali ke Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-5 text-center">
        <div className="inline-flex items-center gap-1.5 bg-[#6C1B75]/10 text-[#6C1B75] text-[11px] sm:text-xs font-semibold px-3 py-1 rounded-full mb-3">
          <ShieldCheck size={13} /> Keamanan Akun
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Lupa Password?</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Masukkan email yang terdaftar. Admin akan memverifikasi permintaan lalu mengirimkan kode verifikasi ke emailmu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs sm:text-sm font-bold text-slate-700 ml-1">Email Terdaftar</label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400 group-focus-within:text-[#6C1B75] transition-colors" />
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full h-12 sm:h-13 pl-11 pr-4 rounded-xl sm:rounded-2xl border text-sm transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#6C1B75]/10 focus:border-[#6C1B75] focus:bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] ${
                error ? 'border-red-300 bg-red-50 text-red-900' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50 text-slate-800'
              }`}
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-500 animate-fade-in ml-1 font-medium">{error}</p>}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 sm:h-13 mt-2 rounded-xl sm:rounded-2xl font-bold text-sm bg-gradient-to-r from-[#6C1B75] to-[#9333EA] hover:from-[#5a1663] hover:to-[#7C2D8C] transition-all duration-300 hover:shadow-xl hover:shadow-[#6C1B75]/25 active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Mengirim Permintaan...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              Ajukan Reset Password
              <ArrowRight size={16} className="ml-2" />
            </span>
          )}
        </Button>
      </form>

      <div className="relative my-5 sm:my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200/60" /></div>
      </div>

      <div className="text-center">
        <Link to="/login" className="text-xs sm:text-sm text-slate-500 hover:text-[#6C1B75] inline-flex items-center gap-1.5 font-bold transition-colors">
          <ArrowLeft size={14} />
          Kembali ke Login
        </Link>
      </div>
    </div>
  );
}

export { ForgotPasswordForm };
