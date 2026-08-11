export declare function useTimer(running: boolean): {
    elapsed: number;
    reset: () => void;
};
/**
 * Format seconds as M:SS or H:MM:SS
 */
export declare function formatTime(totalSeconds: number): string;
