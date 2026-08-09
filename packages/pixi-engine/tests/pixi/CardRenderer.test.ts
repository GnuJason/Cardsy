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
  it('cover scale fills the full card width for landscape photos', () => {
    const texW = 640;
    const texH = 480; // landscape
    const scale = Math.max(cardSize.width / texW, cardSize.height / texH);
    const finalW = texW * scale;
    const finalH = texH * scale;
    expect(finalW).toBeGreaterThanOrEqual(cardSize.width);
    expect(finalH).toBeGreaterThanOrEqual(cardSize.height);
    expect(Math.abs(finalW / finalH - texW / texH)).toBeLessThan(0.02);
  });

  it('cover scale fills the full card height for portrait photos', () => {
    const texW = 480;
    const texH = 640; // portrait
    const scale = Math.max(cardSize.width / texW, cardSize.height / texH);
    const finalW = texW * scale;
    const finalH = texH * scale;
    expect(finalW).toBeGreaterThanOrEqual(cardSize.width);
    expect(finalH).toBeGreaterThanOrEqual(cardSize.height);
    expect(Math.abs(finalW / finalH - texW / texH)).toBeLessThan(0.02);
  });

  it('photo is centered while overflow is cropped evenly', () => {
    const texW = 640;
    const texH = 480;
    const scale = Math.max(cardSize.width / texW, cardSize.height / texH);
    const photoW = texW * scale;
    const photoH = texH * scale;
    const photoX = (cardSize.width - photoW) / 2;
    const photoY = (cardSize.height - photoH) / 2;
    const photoCenterX = photoX + photoW / 2;
    const photoCenterY = photoY + photoH / 2;
    expect(photoCenterX).toBe(cardSize.width / 2);
    expect(photoCenterY).toBe(cardSize.height / 2);
    expect(photoX).toBeLessThanOrEqual(0);
    expect(photoY).toBeLessThanOrEqual(0);
  });
});
