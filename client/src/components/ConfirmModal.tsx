import React, { useRef } from 'react';
import { Button, Icon } from '../ui/primitives.js';
import { Modal } from '../ui/modal.js';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      description={message}
      size="sm"
      dismissible={!isLoading}
      initialFocusRef={confirmBtnRef}
      icon={
        <div
          className={`grid h-10 w-10 place-items-center rounded-xl border ${
            isDestructive ? 'border-rose-200 bg-rose-50 text-critical' : 'border-primary-100 bg-primary-50 text-primary-700'
          }`}
        >
          {isDestructive ? <Icon.Alert size={20} /> : <Icon.Shield size={20} />}
        </div>
      }
      footer={
        <>
          <Button variant="secondary" size="sm" disabled={isLoading} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmBtnRef}
            variant={isDestructive ? 'destructive' : 'primary'}
            size="sm"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
};

export default ConfirmModal;
