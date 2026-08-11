import React from 'react';
interface ConfirmModalProps {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}
export declare const ConfirmModal: React.FC<ConfirmModalProps>;
export {};
