import { useEffect, useRef, useState, useCallback } from 'react';
export function useTimer(running) {
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef(null);
    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setElapsed((prev) => prev + 1);
            }, 1000);
        }
        else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [running]);
    const reset = useCallback(() => {
        setElapsed(0);
    }, []);
    return { elapsed, reset };
}
/**
 * Format seconds as M:SS or H:MM:SS
 */
export function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(hours > 0 ? 2 : 1, '0');
    const ss = String(seconds).padStart(2, '0');
    if (hours > 0) {
        return `${hours}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
}
