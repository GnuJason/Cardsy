import { Application, Container } from 'pixi.js';
import 'pixi.js/unsafe-eval';
export interface PixiAppContext {
    app: Application;
    root: Container;
}
export declare function createPixiApp(container: HTMLDivElement, backgroundColor?: number): Promise<PixiAppContext>;
export declare function destroyPixiApp(ctx: PixiAppContext): void;
export declare function setAppBackground(ctx: PixiAppContext, color: number): void;
