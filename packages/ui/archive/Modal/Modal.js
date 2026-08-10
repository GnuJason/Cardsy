import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useCallback, useState } from 'react';
import styles from './Modal.module.css';
/** Duration matching --duration-sm for exit animation (ms) */
const EXIT_MS = 120;
/**
 * Shared modal wrapper with overlay, focus trap, and Escape key handling.
 * All modals should compose this component.
 */
export const Modal = ({ children, onClose, className, ariaLabel, }) => {
    const modalRef = useRef(null);
    const previousFocusRef = useRef(null);
    const [exiting, setExiting] = useState(false);
    /** Play exit animation then call onClose */
    const requestClose = useCallback(() => {
        if (!onClose || exiting)
            return;
        setExiting(true);
        setTimeout(() => onClose(), EXIT_MS);
    }, [onClose, exiting]);
    // Trap focus inside modal
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            requestClose();
            return;
        }
        if (e.key !== 'Tab' || !modalRef.current)
            return;
        const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0)
            return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        }
        else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }, [requestClose]);
    useEffect(() => {
        previousFocusRef.current = document.activeElement;
        document.addEventListener('keydown', handleKeyDown);
        // Announce modal opening to screen readers
        const announcer = document.getElementById('game-announcer');
        if (announcer && ariaLabel) {
            announcer.textContent = ariaLabel;
        }
        // Focus the first focusable element inside the modal
        const timer = requestAnimationFrame(() => {
            if (modalRef.current) {
                const firstFocusable = modalRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                firstFocusable?.focus();
            }
        });
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            cancelAnimationFrame(timer);
            // Restore focus to previously focused element
            previousFocusRef.current?.focus();
        };
    }, [handleKeyDown]);
    const handleOverlayClick = useCallback((e) => {
        if (e.target === e.currentTarget) {
            requestClose();
        }
    }, [requestClose]);
    const overlayClass = exiting
        ? `${styles.overlay} ${styles.overlayExit}`
        : styles.overlay;
    const panelClass = className
        ? `${styles.modal} ${className}`
        : styles.modal;
    return (_jsx("div", { className: overlayClass, onClick: handleOverlayClick, role: "dialog", "aria-modal": "true", "aria-label": ariaLabel, children: _jsx("div", { ref: modalRef, className: panelClass, onClick: (e) => e.stopPropagation(), children: children }) }));
};
