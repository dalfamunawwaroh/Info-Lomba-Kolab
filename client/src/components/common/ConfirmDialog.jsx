import { Modal } from './Modal';
import { Button } from './Button';

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Konfirmasi', variant = 'destructive' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Konfirmasi'}>
      <p className="text-sm text-muted-foreground mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Batal</Button>
        <Button variant={variant} onClick={() => { onConfirm(); onClose(); }}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

export { ConfirmDialog };
