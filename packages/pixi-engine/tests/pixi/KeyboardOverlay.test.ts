import React, { type ReactElement, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { KeyboardOverlay } from '../../src/pixi/KeyboardOverlay';
import type { LayoutResult } from '../../src/pixi/types';

function collectButtons(node: ReactNode, buttons: ReactElement[] = []): ReactElement[] {
  if (Array.isArray(node)) {
    for (const child of node) {
      collectButtons(child, buttons);
    }
    return buttons;
  }

  if (!React.isValidElement(node)) {
    return buttons;
  }

  if (node.type === 'button') {
    buttons.push(node);
  }

  collectButtons(node.props.children, buttons);
  return buttons;
}

const layout: LayoutResult = {
  piles: [
    {
      pileType: 'stock',
      pileIndex: 0,
      x: 10,
      y: 20,
      fanDirection: 'none',
      fanOffset: 0,
      dropWidth: 80,
      dropHeight: 120,
    },
    {
      pileType: 'tableau',
      pileIndex: 1,
      x: 120,
      y: 20,
      fanDirection: 'down',
      fanOffset: 18,
      dropWidth: 80,
      dropHeight: 120,
    },
  ],
  canvasWidth: 320,
  canvasHeight: 480,
  cardSize: {
    width: 80,
    height: 120,
    fontSize: 18,
    pipSize: 24,
    cornerRadius: 8,
  },
};

describe('KeyboardOverlay', () => {
  it('renders keyboard focus buttons for mapped piles', () => {
    const element = KeyboardOverlay({
      layout,
      mode: 'klondike',
      onGameEvent: vi.fn(),
    });

    const buttons = collectButtons(element);
    expect(buttons).toHaveLength(2);
  });

  it('does not capture pointer interactions', () => {
    const element = KeyboardOverlay({
      layout,
      mode: 'klondike',
      onGameEvent: vi.fn(),
    });

    const buttons = collectButtons(element);
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(button.props.style.pointerEvents).toBe('none');
    }
  });
});
