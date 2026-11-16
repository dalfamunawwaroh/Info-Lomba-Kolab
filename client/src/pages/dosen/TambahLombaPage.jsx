import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CompetitionForm } from '@/components/competition/CompetitionForm';
import competitionService from '@/services/competitionService';
import useUIStore from '@/store/uiStore';

export default function TambahLombaPage() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const basePath = isAdmin ? '/admin' : '/dosen';
  const [loading, setLoading] = useState(false);
  const addToast = useUIStore((s) => s.addToast);
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await competitionService.createCompetition(data);
      addToast({ type: 'success', message: 'Lomba berhasil ditambahkan' });
      // Dosen diarahkan ke detail lomba yang baru dibuat agar bisa langsung verifikasi
      if (!isAdmin && res?.data?.id) {
        navigate(`${basePath}/competitions/${res.data.id}`);
      } else {
        navigate(`${basePath}/competitions`);
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || 'Gagal menambah lomba' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl pb-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4"
      >
        <ArrowLeft size={14} /> Kembali
      </button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tambah Lomba Baru</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Informasi lomba yang Anda tambahkan akan tampil untuk seluruh mahasiswa dan dosen Ko+Lab.
          {!isAdmin && ' Anda dapat mengeditnya kembali kapan saja.'}
        </p>
      </div>
      <CompetitionForm onSubmit={handleSubmit} loading={loading} submitLabel="Simpan Lomba" />
    </div>
  );
}
