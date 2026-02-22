import { Application, Container } from 'pixi.js';

export interface PixiAppContext {
  app: Application;
  root: Container;
}

export async function createPixiApp(
  container: HTMLDivElement,
  backgroundColor?: number,
): Promise<PixiAppContext> {
  const app = new Application();
  await app.init({
    resizeTo: container,
    backgroundColor: backgroundColor ?? 0x0b6b3a,
    antialias: true,
    autoDensity: true,
    preference: 'webgl',
  });

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
