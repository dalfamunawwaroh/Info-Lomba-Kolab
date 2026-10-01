import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { validateEmail } from '@/utils/validators';

function ForgotPasswordForm() {
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
    setTimeout(() => {
      setSent(true);
      setLoading(false);
    }, 1500);
  };

  if (sent) {
    return (
      <div className="p-8 sm:p-10 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-5 animate-bounce-in">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2 tracking-tight">Email Terkirim</h2>
        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
          Jika email <span className="font-semibold text-foreground">{email}</span> terdaftar di sistem, kami akan mengirimkan link reset password.
        </p>
        <p className="text-xs text-muted-foreground/70 mb-8">
          Periksa folder inbox dan spam kamu. Link berlaku selama 1 jam.
        </p>
        <Link to="/login">
          <Button variant="outline" className="w-full h-12 rounded-xl border-gray-200 hover:border-[#6C1B75] hover:text-[#6C1B75] transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Kembali ke Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 sm:p-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-[#6C1B75]/10 text-[#6C1B75] text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <ShieldCheck size={12} /> Keamanan Akun
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Lupa Password?</h2>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          Masukkan email yang terdaftar dan kami akan mengirimkan link untuk reset password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground">Email</label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#6C1B75] transition-colors" />
            <input
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full h-12 pl-11 pr-4 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6C1B75]/20 focus:border-[#6C1B75] ${
                error ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
              }`}
              autoFocus
            />
          </div>
          {error && <p className="text-xs text-red-500 animate-fade-in">{error}</p>}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl font-semibold text-sm bg-gradient-to-r from-[#6C1B75] to-[#9333EA] hover:from-[#5a1663] hover:to-[#7C2D8C] transition-all duration-300 hover:shadow-lg hover:shadow-[#6C1B75]/25 active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Mengirim...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Kirim Link Reset
              <ArrowRight size={16} />
            </span>
          )}
        </Button>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
      </div>

      <div className="text-center">
        <Link to="/login" className="text-sm text-muted-foreground hover:text-[#6C1B75] inline-flex items-center gap-1.5 font-medium transition-colors">
          <ArrowLeft size={14} />
          Kembali ke Login
        </Link>
      </div>
    </div>
  );
}

export { ForgotPasswordForm };