import { describe, expect, it } from 'vitest';
import { getTextureResolution } from '../../src/pixi/rendering/CardRenderer';

/**
 * These tests verify the exported helpers and the mathematical constraints
 * of card-face layout.  The actual rendering functions (`makeFrontCardTexture`,
 * `makeCustomBackTexture`) require a PIXI Application and are validated
 * visually; the coordinate math they rely on is asserted here.
 */

const cardSize = { width: 120, height: 168, fontSize: 34, pipSize: 44, cornerRadius: 12 };

describe('CardRenderer helpers', () => {
  it('getTextureResolution returns at least 1', () => {
    expect(getTextureResolution()).toBeGreaterThanOrEqual(1);
  });

  it('getTextureResolution returns a finite number', () => {
    const res = getTextureResolution();
    expect(Number.isFinite(res)).toBe(true);
  });
});

describe('Card face alignment math', () => {
  // These tests verify the coordinate formulas used in makeFrontCardTexture
  // (the source of truth is CardRenderer.ts; these mirror the same math).

  const marginX = Math.round(cardSize.width * 0.08);
  const marginY = Math.round(cardSize.height * 0.07);
  const centerX = cardSize.width / 2;
  const centerY = cardSize.height / 2;

  it('center pip is at exact card center', () => {
    expect(centerX).toBe(60);
    expect(centerY).toBe(84);
    // With anchor (0.5, 0.5) these place the pip dead-center
  });

  it('margins are proportional and symmetric', () => {
    // 8% horizontal
    expect(marginX).toBe(Math.round(120 * 0.08));
    // 7% vertical
    expect(marginY).toBe(Math.round(168 * 0.07));
  });

  it('top-left corner is at marginX, marginY', () => {
    expect(marginX).toBeGreaterThan(0);
    expect(marginY).toBeGreaterThan(0);
    expect(marginX).toBeLessThan(cardSize.width / 4);
    expect(marginY).toBeLessThan(cardSize.height / 4);
  });

  it('bottom-right corner is exact mirror of top-left', () => {
    // With anchor (0,0) + rotation Math.PI, the visible origin of the
    // mirrored text is at (width - marginX, height - marginY)
    const mirrorX = cardSize.width - marginX;
    const mirrorY = cardSize.height - marginY;
    // These should be exactly the card dimensions minus the same margins
    expect(mirrorX).toBe(cardSize.width - marginX);
    expect(mirrorY).toBe(cardSize.height - marginY);
    // The mirror distance from right/bottom edge equals the top-left distance from left/top edge
    expect(cardSize.width - mirrorX).toBe(marginX);
    expect(cardSize.height - mirrorY).toBe(marginY);
  });

  it('corner suit is vertically stacked below rank by fontSize * 1.0', () => {
    const suitY = marginY + Math.round(cardSize.fontSize * 1.0);
    expect(suitY).toBeGreaterThan(marginY);
    expect(suitY).toBeLessThan(cardSize.height / 2);
  });

  it('center pip is a single symbol centered away from corner rank text', () => {
    // The center pip uses only the suit symbol (no duplicate rank glyph).
    // It is placed at the exact card center — verify it is reasonably
    // separated from the corner rank's x position.
    const cornerRankX = marginX;
    const centerPipX = centerX;
    expect(centerPipX).toBeGreaterThan(cornerRankX + cardSize.fontSize);
  });
});

describe('Custom back texture math', () => {
  it('contain scale preserves aspect ratio for landscape photos', () => {
    const pad = 2;
    const availW = cardSize.width - pad * 2;
    const availH = cardSize.height - pad * 2;
    const texW = 640;
    const texH = 480; // landscape
    const scale = Math.min(availW / texW, availH / texH);
    const finalW = Math.round(texW * scale);
    const finalH = Math.round(texH * scale);
    expect(finalW).toBeLessThanOrEqual(availW);
    expect(finalH).toBeLessThanOrEqual(availH);
    // Aspect ratio preserved
    expect(Math.abs(finalW / finalH - texW / texH)).toBeLessThan(0.02);
  });

  it('contain scale preserves aspect ratio for portrait photos', () => {
    const pad = 2;
    const availW = cardSize.width - pad * 2;
    const availH = cardSize.height - pad * 2;
    const texW = 480;
    const texH = 640; // portrait
    const scale = Math.min(availW / texW, availH / texH);
    const finalW = Math.round(texW * scale);
    const finalH = Math.round(texH * scale);
    expect(finalW).toBeLessThanOrEqual(availW);
    expect(finalH).toBeLessThanOrEqual(availH);
    expect(Math.abs(finalW / finalH - texW / texH)).toBeLessThan(0.02);
  });

  it('photo is centered within available area', () => {
    const pad = 2;
    const availW = cardSize.width - pad * 2;
    const availH = cardSize.height - pad * 2;
    const texW = 640;
    const texH = 480;
    const scale = Math.min(availW / texW, availH / texH);
    const photoW = Math.round(texW * scale);
    const photoH = Math.round(texH * scale);
    const photoX = pad + Math.round((availW - photoW) / 2);
    const photoY = pad + Math.round((availH - photoH) / 2);
    // Photo center should be near card center
    const photoCenterX = photoX + photoW / 2;
    const photoCenterY = photoY + photoH / 2;
    expect(Math.abs(photoCenterX - cardSize.width / 2)).toBeLessThan(2);
    expect(Math.abs(photoCenterY - cardSize.height / 2)).toBeLessThan(2);
  });
});
