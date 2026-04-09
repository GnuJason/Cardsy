import { Application, Container } from 'pixi.js';
// CSP-safe polyfills: replaces new Function() with pre-built shader/UBO
// sync functions so Pixi works under script-src 'self' (no unsafe-eval).
import 'pixi.js/unsafe-eval';

export interface PixiAppContext {
  app: Application;
  root: Container;
}

export async function createPixiApp(
  container: HTMLDivElement,
  backgroundColor?: number,
): Promise<PixiAppContext> {
  const app = new Application();
  try {
    await app.init({
      resizeTo: container,
      backgroundColor: backgroundColor ?? 0x0b6b3a,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      preference: 'webgl',
    });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.error('[Pixi] Renderer failed to initialize. Check CSP and Pixi build configuration.', err);
    }
    throw err;
  }

  if (import.meta.env.DEV) {
    const type = app.renderer.type === 0x01 ? 'WebGL' : 'WebGPU';
    console.info(`[Pixi] Renderer initialized (${type})`);
  }

  const root = new Container();
  root.sortableChildren = true;
  app.stage.addChild(root);
  container.appendChild(app.canvas);

  return { app, root };
}

export function destroyPixiApp(ctx: PixiAppContext): void {
  const canvas = ctx.app.canvas;
  if (canvas.parentElement) {
    canvas.parentElement.removeChild(canvas);
  }
  ctx.app.destroy(true, { children: true, texture: true });
}

export function setAppBackground(ctx: PixiAppContext, color: number): void {
  ctx.app.renderer.background.color = color;
}
