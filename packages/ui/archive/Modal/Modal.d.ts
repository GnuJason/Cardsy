import React from 'react';
interface ModalProps {
    children: React.ReactNode;
    onClose?: () => void;
    /** Extra className for the modal panel */
    className?: string;
    /** aria-label for the dialog */
    ariaLabel?: string;
}
/**
 * Shared modal wrapper with overlay, focus trap, and Escape key handling.
 * All modals should compose this component.
 */
export declare const Modal: React.FC<ModalProps>;
export {};
