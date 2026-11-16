import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Modal generik.
 *
 * Dirender lewat portal ke <body> supaya `fixed inset-0` benar-benar mengacu ke
 * viewport. Tanpa portal, leluhur yang punya `transform`/`filter`/`backdrop-filter`
 * (mis. <main className="animate-fade-in-up"> memakai animation-fill-mode: forwards,
 * atau <header> dengan backdrop-blur) akan jadi containing block sehingga overlay
 * mengikuti kotak leluhur — bukan layar — dan modal tampak mengambang/terpotong.
 */
function Modal({ isOpen, onClose, title, children, className }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl bg-background p-6 shadow-2xl modal-content max-h-[85vh] overflow-y-auto",
          className
        )}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export { Modal };
