import { getEasing } from './Easing';
export class AnimationScheduler {
    plan;
    spriteMap;
    currentGroupIndex;
    groupElapsed;
    _isAnimating;
    constructor() {
        this.plan = null;
        this.spriteMap = null;
        this.currentGroupIndex = 0;
        this.groupElapsed = 0;
        this._isAnimating = false;
    }
    get isAnimating() {
        return this._isAnimating;
    }
    getDebugSnapshot() {
        const currentGroup = this.plan?.groups[this.currentGroupIndex] ?? [];
        return {
            isAnimating: this._isAnimating,
            currentGroupIndex: this.currentGroupIndex,
            currentGroupSize: currentGroup.length,
            totalSteps: this.plan?.steps.length ?? 0,
            groupElapsedMs: this.groupElapsed,
        };
    }
    schedule(plan, spriteMap) {
        this.cancel();
        this.plan = plan;
        this.spriteMap = spriteMap;
        this.currentGroupIndex = 0;
        this.groupElapsed = 0;
        this._isAnimating = plan.groups.length > 0;
    }
    cancel() {
        if (!this.plan || !this.spriteMap)
            return;
        for (const step of this.plan.steps) {
            const sprite = this.spriteMap.get(step.spriteKey);
            if (sprite) {
                sprite.x = step.to.x;
                sprite.y = step.to.y;
                sprite.alpha = step.to.alpha;
            }
        }
        const onComplete = this.plan.onComplete;
        this.plan = null;
        this.spriteMap = null;
        this._isAnimating = false;
        this.currentGroupIndex = 0;
        this.groupElapsed = 0;
        onComplete?.();
    }
    update(deltaMs) {
        if (!this.plan || !this.spriteMap || !this._isAnimating)
            return;
        const group = this.plan.groups[this.currentGroupIndex];
        if (!group) {
            this._isAnimating = false;
            this.plan.onComplete?.();
            this.plan = null;
            this.spriteMap = null;
            return;
        }
        this.groupElapsed += deltaMs;
        let groupDone = true;
        for (const stepIndex of group) {
            const step = this.plan.steps[stepIndex];
            if (!step)
                continue;
            const sprite = this.spriteMap.get(step.spriteKey);
            if (!sprite)
                continue;
            const t = step.durationMs <= 0 ? 1 : Math.min(1, this.groupElapsed / step.durationMs);
            const easingFn = getEasing(step.easing);
            const eased = easingFn(t);
            sprite.x = step.from.x + (step.to.x - step.from.x) * eased;
            sprite.y = step.from.y + (step.to.y - step.from.y) * eased;
            sprite.alpha = step.from.alpha + (step.to.alpha - step.from.alpha) * eased;
            if (t < 1)
                groupDone = false;
        }
        if (groupDone) {
            for (const stepIndex of group) {
                const step = this.plan.steps[stepIndex];
                if (!step)
                    continue;
                const sprite = this.spriteMap.get(step.spriteKey);
                if (sprite) {
                    sprite.x = step.to.x;
                    sprite.y = step.to.y;
                    sprite.alpha = step.to.alpha;
                }
            }
            this.currentGroupIndex += 1;
            this.groupElapsed = 0;
            if (this.currentGroupIndex >= this.plan.groups.length) {
                this._isAnimating = false;
                this.plan.onComplete?.();
                this.plan = null;
                this.spriteMap = null;
            }
        }
    }
}
