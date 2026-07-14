import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';

export type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  onClose: () => void;
  size?: ModalSize;
  children: ReactNode;
}

const sizeMap: Record<ModalSize, string> = {
  sm: '400px',
  md: '520px',
  lg: '640px',
};

export default function Modal({ onClose, size = 'md', children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="modal-card"
        style={{ maxWidth: sizeMap[size] }}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

interface ModalHeaderProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
}

export function ModalHeader({ icon, title, subtitle }: ModalHeaderProps) {
  return (
    <div className="modal-header">
      {icon && <div className="modal-icon">{icon}</div>}
      <h2 className="modal-title">{title}</h2>
      {subtitle && <p className="modal-subtitle">{subtitle}</p>}
    </div>
  );
}

interface ModalCloseProps {
  onClick: () => void;
  disabled?: boolean;
}

export function ModalClose({ onClick, disabled }: ModalCloseProps) {
  return (
    <button className="modal-close" onClick={onClick} disabled={disabled}>
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
    </button>
  );
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return <div className={`modal-body ${className || ''}`}>{children}</div>;
}

interface ModalFooterProps {
  children: ReactNode;
}

export function ModalFooter({ children }: ModalFooterProps) {
  return <div className="modal-actions">{children}</div>;
}
