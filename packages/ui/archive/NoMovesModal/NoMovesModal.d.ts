import React from 'react';
interface NoMovesModalProps {
    onUndo: () => void;
    onNewGame: () => void;
    canUndo: boolean;
}
export declare const NoMovesModal: React.FC<NoMovesModalProps>;
export {};
