/**
 * Input Manager for classic Diablo mouse & keyboard interactions.
 */

export interface MouseState {
  x: number;
  y: number;
  isLeftDown: boolean;
  isRightDown: boolean;
  leftClicked: boolean;
  rightClicked: boolean;
}

export class InputManager {
  public mouse: MouseState = {
    x: 0,
    y: 0,
    isLeftDown: false,
    isRightDown: false,
    leftClicked: false,
    rightClicked: false
  };

  public keysPressed: Set<string> = new Set();
  public keysJustPressed: Set<string> = new Set();

  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.setupListeners();
  }

  private setupListeners() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.isLeftDown = true;
        this.mouse.leftClicked = true;
      } else if (e.button === 2) {
        this.mouse.isRightDown = true;
        this.mouse.rightClicked = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isLeftDown = false;
      if (e.button === 2) this.mouse.isRightDown = false;
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (!this.keysPressed.has(key)) {
        this.keysJustPressed.add(key);
      }
      this.keysPressed.add(key);
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keysPressed.delete(key);
    });
  }

  public endFrame() {
    this.mouse.leftClicked = false;
    this.mouse.rightClicked = false;
    this.keysJustPressed.clear();
  }

  public isKeyJustPressed(key: string): boolean {
    return this.keysJustPressed.has(key.toLowerCase());
  }
}
