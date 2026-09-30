/**
 * Custom Diablo Cursors:
 * - Sword cursor for enemies
 * - Hand cursor for barrels, chests, and interactables
 * - Armored Gauntlet cursor for default navigation
 */

export type CursorType = 'default' | 'sword' | 'hand' | 'pointer';

function createSvgUri(svg: string, hx: number, hy: number, fallback: string): string {
  const encoded = encodeURIComponent(svg.trim());
  return `url("data:image/svg+xml,${encoded}") ${hx} ${hy}, ${fallback}`;
}

const SWORD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M2 2 L9 2 L26 19 L25 25 L19 24 L2 7 Z" fill="#000000" />
  <polygon points="3,3 8,3 24,19 22,23 18,21 3,6" fill="#e2ecf8" />
  <polygon points="4,4 7,4 23,20 21,22 19,20 4,5" fill="#ffffff" />
  <line x1="4" y1="4" x2="21" y2="21" stroke="#8fa0b5" stroke-width="1.5" />
  <rect x="18" y="20" width="8" height="3.5" transform="rotate(-45 22 21.75)" fill="#ffd700" stroke="#000000" stroke-width="0.8" />
  <rect x="23" y="23" width="7" height="3.5" transform="rotate(45 26.5 24.75)" fill="#8b4513" stroke="#000000" stroke-width="0.8" />
  <circle cx="28.5" cy="28.5" r="2.5" fill="#ffd700" stroke="#000000" stroke-width="0.8" />
</svg>
`;

const HAND_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M8 2 C8 1, 10 1, 10 2 L10 11 L12 11 L12 4 C12 3, 14 3, 14 4 L14 11 L16 11 L16 6 C16 5, 18 5, 18 6 L18 12 L20 12 C20 10, 22 10, 22 12 L22 18 C22 24, 18 28, 12 28 C7 28, 5 24, 5 19 L5 12 C5 10, 8 10, 8 12 Z" fill="#000000" />
  <path d="M9 3 L9 12 L11 12 L11 5 L13 5 L13 12 L15 12 L15 7 L17 7 L17 13 L19 13 L19 12 C19 11, 21 11, 21 13 L21 18 C21 23, 17 27, 12 27 C8 27, 6 23, 6 19 L6 13 C6 11.5, 8 11.5, 8 13 L8 3 Z" fill="#d4af37" />
  <path d="M10 5 L10 13 L14 13 L14 7" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.6" />
  <rect x="7" y="24" width="10" height="3.5" fill="#8c6d23" stroke="#000000" stroke-width="0.8" />
</svg>
`;

const DEFAULT_GAUNTLET_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <path d="M2 2 L12 12 L8 13 L13 23 L10 25 L5 15 L2 18 Z" fill="#000000" />
  <path d="M3 4 L11 12 L7.5 13 L12 22 L10.5 23 L6 14 L3 17 Z" fill="#d4af37" />
  <path d="M4 5 L10 11 L8 11.5 L4 5 Z" fill="#ffffff" opacity="0.5" />
  <polygon points="4,5 7,5 10,10 6,10" fill="#f7e189" />
</svg>
`;

export class CursorManager {
  private currentCursor: CursorType = 'default';
  private cursorCss: Record<CursorType, string>;

  constructor() {
    this.cursorCss = {
      sword: createSvgUri(SWORD_SVG, 2, 2, 'crosshair'),
      hand: createSvgUri(HAND_SVG, 9, 3, 'pointer'),
      default: createSvgUri(DEFAULT_GAUNTLET_SVG, 2, 2, 'default'),
      pointer: 'pointer'
    };
  }

  public setCursor(canvas: HTMLCanvasElement, type: CursorType) {
    if (this.currentCursor === type) return;
    this.currentCursor = type;
    canvas.style.cursor = this.cursorCss[type];
  }

  public getCurrentCursor(): CursorType {
    return this.currentCursor;
  }
}
