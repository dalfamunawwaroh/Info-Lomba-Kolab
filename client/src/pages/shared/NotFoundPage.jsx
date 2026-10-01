import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="text-center animate-fade-in-up">
        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500 mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()} className="rounded-xl">
            <ArrowLeft size={16} className="mr-1.5" />
            Kembali
          </Button>
          <Button asChild className="rounded-xl">
            <Link to="/">
              <Home size={16} className="mr-1.5" />
              Beranda
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
