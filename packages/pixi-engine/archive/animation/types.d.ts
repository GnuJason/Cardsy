export interface AnimationStep {
    spriteKey: string;
    from: {
        x: number;
        y: number;
        alpha: number;
    };
    to: {
        x: number;
        y: number;
        alpha: number;
    };
    durationMs: number;
    easing: 'linear' | 'easeOut' | 'easeInOut';
}
export interface AnimationPlan {
    steps: AnimationStep[];
    groups: number[][];
    onComplete?: () => void;
}
