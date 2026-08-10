export type InstallState = 'available' | 'ios-safari' | 'installed' | 'unavailable';
/**
 * Captures the `beforeinstallprompt` event and exposes install UX state.
 * On iOS Safari (no native prompt), returns 'ios-safari' so the UI can
 * show manual "Add to Home Screen" instructions.
 */
export declare function useInstallPrompt(): {
    installState: InstallState;
    promptInstall: () => Promise<void>;
};
