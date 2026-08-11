import { useState, useEffect, useCallback } from 'react';
/**
 * Captures the `beforeinstallprompt` event and exposes install UX state.
 * On iOS Safari (no native prompt), returns 'ios-safari' so the UI can
 * show manual "Add to Home Screen" instructions.
 */
export function useInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [installState, setInstallState] = useState('unavailable');
    useEffect(() => {
        // Already running as installed PWA
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setInstallState('installed');
            return;
        }
        const onBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setInstallState('available');
        };
        const onAppInstalled = () => {
            setInstallState('installed');
            setDeferredPrompt(null);
        };
        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        window.addEventListener('appinstalled', onAppInstalled);
        // Detect iOS Safari (no beforeinstallprompt support)
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);
        if (isIos && isSafari) {
            setInstallState('ios-safari');
        }
        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall);
            window.removeEventListener('appinstalled', onAppInstalled);
        };
    }, []);
    const promptInstall = useCallback(async () => {
        if (!deferredPrompt)
            return;
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
            setInstallState('installed');
        }
        setDeferredPrompt(null);
    }, [deferredPrompt]);
    return { installState, promptInstall };
}
